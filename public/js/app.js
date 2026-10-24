import * as Engine from './engine.js';
import * as Match from './match.js';
import { sessionKey, recordGame, standings, endPhrase, sessionNudge } from './leaderboard.js';
import { THEMES, themeOf, themeTokens, mapAvatars, festivalOn, themeMenuFor, isoDay } from './themes.js';
import { VERSION } from './version.js';
import { t, translateDom } from './i18n.js';
import { play, isMuted, setMuted } from './sound.js';
import { track, gameParams, gameEndParams, nextFeedback, answerFeedback } from './telemetry.js';
import { nextSecret, knownSecrets, readSecrets, initSecrets, countGame, tellSecret } from './secrets.js';
import { shareText, shareUrl, whatsappHref, emailHref, withLink, SITE_URL } from './share.js';
import { parseChallenge, challengeParam, challengeTarget, challengeOutcome } from './challenge.js';
import * as Daily from './daily.js';
import { drawScorecard } from './scorecard.js';
import { replaySteps } from './replay.js';
import { showInstall } from './install.js';
import * as Online from './online.js';
import { GAME, BOARD_SIZES, configValue } from './config.js';
import { onLongPress } from './hold.js';
const { timeFor } = Engine;
(() => {
  const { BONUS } = Match;
  const MACHINE_DELAY = GAME.machine.delayMs;
  const q = (id) => document.getElementById(id);
  translateDom();
  q('appVersion').textContent = `v${VERSION}`;
  // Texts and options that depend on the game parameters (config.js).
  document.querySelectorAll('[data-config]').forEach((e) => (e.textContent = configValue(e.dataset.config)));
  const clockText = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  q('sizeSelect').replaceChildren(
    ...BOARD_SIZES.map(
      (n) => new Option(`${n} × ${n} · ${clockText(timeFor(n))}`, n, false, n === GAME.board.defaultSize),
    ),
  );

  const setup = q('setupScreen'),
    game = q('gameScreen'),
    boardEl = q('board'),
    msg = q('message'),
    turnBarTop = q('turnBarTop');
  const byPlayer = (prefix) => [1, 2, 3, 4].map((n) => q(prefix + n));
  const namesIn = byPlayer('nickname'),
    previews = byPlayer('preview');
  const namesEl = byPlayer('name'),
    avatarsEl = byPlayer('avatar');
  const timers = byPlayer('timer'),
    scoresEl = byPlayer('score'),
    sides = byPlayer('side');
  const hintBtns = byPlayer('hint'),
    lastBtns = byPlayer('last'),
    swapBtns = byPlayer('swap'),
    sosBtns = byPlayer('sos');

  let avatars = ['🐻', '🐼'],
    names = [t('common.jugador_1'), t('common.jugador_2'), t('common.jugador_3'), t('common.jugador_4')],
    size = GAME.board.defaultSize,
    board = [],
    current = 0,
    scores = [0, 0],
    times = Array(2).fill(timeFor(GAME.board.defaultSize)),
    gameMode = 'two',
    difficulty = 'easy';
  let justPlaced = null,
    justScored = new Set();
  let selected = ['O', 'O'],
    scored = new Map(),
    history = [],
    extras = [],
    timer = null,
    over = false,
    hintCell = null,
    lastCell = null,
    swapMode = null,
    machineTimeout = null,
    machineThinking = false,
    targetWord = 'OSO',
    sosUsed = false,
    sosCredits = [],
    replaying = false,
    gameId = 0,
    clockPaused = false,
    playing = false;

  // The match (match.js) owns the game state; these locals mirror it for the UI.
  let m = null;
  // Online 1 vs 1: { code, token, seat, rev, game, seats, quality, busy, offline } or null.
  let online = null;
  const baseTitle = document.title;
  function sync() {
    ({
      board,
      current,
      scores,
      times,
      scored,
      history,
      extras,
      over,
      word: targetWord,
      sosUsed,
      sosCredits = [],
    } = m);
  }

  const sosReady = (p) => !sosUsed || sosCredits[p] > 0;

  const avatarGrids = [...document.querySelectorAll('.avatars')];
  let avatarChoices = [...avatarGrids[0].querySelectorAll('.avatar-btn')].map((b) => b.dataset.avatar);
  avatars = [...avatars, ...avatarChoices.filter((a) => !avatars.includes(a)).slice(0, 2)];
  const playerCount = () => (gameMode === 'four' ? 4 : 2);
  // Online, the other seat is played from another device.
  const remote = (p) => !!online && p !== online.seat;
  const rivalsOf = (p) => [...Array(playerCount()).keys()].filter((o) => o !== p);
  // Later players give way when their avatar is already taken by an earlier one.
  function dedupeAvatars() {
    avatars.forEach((a, i) => {
      const before = avatars.slice(0, i);
      if (before.includes(a)) avatars[i] = avatarChoices.find((c) => !avatars.includes(c));
    });
  }
  const press = (el, on) => {
    el.classList.toggle('selected', on);
    el.setAttribute('aria-pressed', String(on));
  };
  const extraLabel = (b) => {
    const left = b.querySelector('.count')?.textContent;
    return `${b.title}${left ? t('extras.left', { left }) : ''}${b.classList.contains('used') ? t('extras.used') : ''}`;
  };
  const firstFreeAvatar = (taken) => avatarChoices.find((a) => a !== taken);

  // Each player must have a different avatar: the other players' picks are disabled.
  function syncAvatars() {
    avatarGrids.forEach((grid) => {
      const p = +grid.dataset.player;
      grid.querySelectorAll('.avatar-btn').forEach((b) => {
        const taken = rivalsOf(p).some((o) => avatars[o] === b.dataset.avatar);
        b.classList.toggle('selected', b.dataset.avatar === avatars[p]);
        b.setAttribute('aria-pressed', String(b.dataset.avatar === avatars[p]));
        b.disabled = taken;
        b.title = taken ? t('avatar.taken') : '';
      });
      previews[p].textContent = avatars[p];
    });
  }

  avatarGrids.forEach((grid) => {
    const p = +grid.dataset.player;
    grid.querySelectorAll('.avatar-btn').forEach((b) =>
      b.addEventListener('click', () => {
        if (rivalsOf(p).some((o) => avatars[o] === b.dataset.avatar)) return;
        avatars[p] = b.dataset.avatar;
        syncAvatars();
      }),
    );
  });

  // Restores saved avatars (dispatched by onboarding.js) without a temporary clash.
  document.addEventListener('oso:avatars', (e) => {
    e.detail.slice(0, 4).forEach((a, i) => {
      if (avatarChoices.includes(a)) avatars[i] = a;
    });
    dedupeAvatars();
    syncAvatars();
  });
  syncAvatars();

  // THEMES: chosen from the 🎨 button on the setup screens and remembered.
  const THEME_KEY = 'oso.theme.v1';
  // On a festival's day its theme shows by itself, unless someone already chose one that day.
  const THEME_DAY_KEY = 'oso.themeDay.v1';
  const themeToggle = q('themeToggle'),
    themeMenu = q('themeMenu'),
    themeOptions = () => [...themeMenu.querySelectorAll('.theme-option')];
  let theme = 'classic';
  // Why this theme is on, for GA: chosen in 🎨, festival of the day, the online host's, or default.
  let themeSource = 'default';
  // A guest wears the host's theme while in the room; their own comes back on leaving.
  let ownTheme = null;
  let allThemes = false;
  let lowWarned = new Set();
  let skinTokens = [];
  function paintSkin(t) {
    const tokens = themeTokens(t);
    skinTokens.forEach((k) => document.body.style.removeProperty(k));
    skinTokens = Object.keys(tokens);
    skinTokens.forEach((k) => document.body.style.setProperty(k, tokens[k]));
    document.body.classList.toggle('skin', !!t.bg);
    if (t.motion) document.body.dataset.motion = t.motion;
    else delete document.body.dataset.motion;
  }
  function renderDecor(list, count = 16) {
    q('themeDecor').replaceChildren(
      ...Array.from({ length: list.length ? count : 0 }, (_, i) => {
        const s = document.createElement('span');
        s.textContent = list[i % list.length];
        s.style.left = `${(i * 61) % 100}%`;
        s.style.setProperty('--y', `${5 + ((i * 37) % 85)}%`);
        s.style.fontSize = `${18 + ((i * 11) % 22)}px`;
        s.style.animationDuration = `${16 + ((i * 5) % 12)}s`;
        s.style.animationDelay = `${-((i * 7) % 24)}s`;
        return s;
      }),
    );
  }
  function applyTheme(id, save = true, source = 'chosen') {
    const next = THEMES[id] ? id : 'classic';
    avatars = mapAvatars(avatars, themeOf(theme), themeOf(next));
    theme = next;
    themeSource = source;
    const t = themeOf(theme);
    avatarChoices = t.avatars;
    avatarGrids.forEach((g) =>
      g.querySelectorAll('.avatar-btn').forEach((b, i) => {
        b.dataset.avatar = t.avatars[i];
        b.textContent = t.avatars[i];
      }),
    );
    document.body.dataset.theme = theme;
    document.querySelectorAll('.brand-bear').forEach((e) => (e.textContent = t.icon));
    paintSkin(t);
    renderDecor(t.decor, t.decorCount);
    themeOptions().forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
    syncAvatars();
    if (!save) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(THEME_DAY_KEY, isoDay(new Date()));
    } catch {
      /* ignore */
    }
  }
  function themeGroup(ids) {
    const g = document.createElement('div');
    g.className = 'theme-group';
    g.append(
      ...ids.map((id) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'theme-option';
        b.dataset.theme = id;
        b.textContent = `${THEMES[id].icon} ${THEMES[id].label}`;
        b.setAttribute('aria-pressed', String(id === theme));
        return b;
      }),
    );
    return g;
  }
  function renderThemeMenu() {
    const { menu, others, hidden } = themeMenuFor(new Date(), theme);
    const parts = [themeGroup(menu)];
    if (others.length) {
      const list = themeGroup(allThemes ? [...others, ...hidden] : others);
      list.id = 'themeOthers';
      const open = allThemes || others.includes(theme);
      list.hidden = !open;
      const more = document.createElement('button');
      more.type = 'button';
      more.id = 'themeMore';
      more.className = 'theme-more';
      more.textContent = t('themeMenu.more');
      more.setAttribute('aria-controls', 'themeOthers');
      more.setAttribute('aria-expanded', String(open));
      more.addEventListener('click', () => {
        list.hidden = !list.hidden;
        more.setAttribute('aria-expanded', String(!list.hidden));
      });
      parts.push(more, list);
    }
    themeMenu.replaceChildren(...parts);
  }
  const THEME_HINT_KEY = 'oso.themeHint.v1';
  function toggleThemeMenu(open) {
    themeMenu.classList.toggle('hidden', !open);
    themeToggle.setAttribute('aria-expanded', String(open));
    if (!open) return;
    renderThemeMenu();
    themeOptions()
      .find((b) => b.dataset.theme === theme)
      ?.focus();
    themeToggle.classList.remove('hint');
    try {
      localStorage.setItem(THEME_HINT_KEY, '1');
    } catch {
      /* ignore */
    }
  }
  try {
    themeToggle.classList.toggle('hint', !localStorage.getItem(THEME_HINT_KEY));
  } catch {
    /* ignore */
  }
  const soundToggle = q('soundToggle'),
    soundMenu = q('soundMenu'),
    shareToggle = q('shareToggle');
  function syncSound() {
    const m = isMuted();
    soundToggle.textContent = m ? '🔇' : '🔊';
    soundToggle.setAttribute('aria-pressed', String(m));
    soundMenu.textContent = m ? t('sound.off') : t('soundMenu');
  }
  [soundToggle, soundMenu].forEach((b) =>
    b.addEventListener('click', () => {
      setMuted(!isMuted());
      syncSound();
    }),
  );
  syncSound();
  // The 🎨 and 🔊 buttons live on the intro screens, up to choosing the number of players.
  const THEME_STEPS = ['daily', 'welcome', 'rules', 'mode'];
  const syncThemeToggle = () => {
    const show = THEME_STEPS.includes(setup.dataset.step);
    if (!show) toggleThemeMenu(false);
    themeToggle.classList.toggle('hidden', !show);
    soundToggle.classList.toggle('hidden', !show);
    shareToggle.classList.toggle('hidden', !show);
    q('onlineToggle').classList.toggle('hidden', !show);
    q('dailyToggle').classList.toggle('hidden', !show);
    syncSecretGift();
  };
  // Secrets: a 🎁 on the first screens (for coming back) or at the end of a game (for playing on)
  // tells the next hidden feature, see secrets.js.
  initSecrets();
  const secretToast = q('secretToast'),
    secretDialog = q('secretDialog');
  let secretPlace = null,
    secretGo = null,
    spotExtras = false;
  // Draws the eye to where a secret is used for a few seconds (just a ring with reduced motion).
  function spotlight(els) {
    for (const el of els) {
      el.classList.remove('spotlight', 'hint');
      void el.offsetWidth;
      el.classList.add('spotlight');
      setTimeout(() => el.classList.remove('spotlight'), GAME.secrets.spotlightMs);
    }
  }
  const dueSecret = () => nextSecret(readSecrets(), isoDay(new Date()));
  const resultShown = () => !q('winnerOverlay').classList.contains('hidden');
  function syncSecretGift() {
    const here = resultShown() || THEME_STEPS.includes(setup.dataset.step);
    secretToast.classList.toggle('hidden', !here || !dueSecret());
  }
  function openSecret(place) {
    const secret = dueSecret();
    if (!secret) return;
    const before = knownSecrets(readSecrets(), secret.id);
    tellSecret(secret.id, isoDay(new Date()));
    track('secret_shown', { secret: secret.id, place });
    q('secretHow').textContent = secret.how;
    q('secretList').replaceChildren(
      ...before.map((s) => {
        const more = document.createElement('details');
        const hint = document.createElement('summary');
        hint.textContent = s.hint;
        const how = document.createElement('p');
        how.textContent = s.how;
        more.append(hint, how);
        const li = document.createElement('li');
        li.append(more);
        return li;
      }),
    );
    q('secretKnown').classList.toggle('hidden', !before.length);
    secretPlace = place;
    // Online, leaving for the 🎨 or a new game would drop the room and the rematch.
    secretGo = online ? null : (secret.cta?.go ?? null);
    q('secretGo').textContent = (secretGo && secret.cta.label) || t('secretGo');
    secretDialog.returnValue = '';
    secretToast.classList.add('hidden');
    secretDialog.showModal();
  }
  q('secretOpen').addEventListener('click', () => openSecret(resultShown() ? 'end' : 'start'));
  secretDialog.addEventListener('close', () => {
    const go = secretDialog.returnValue === 'go' ? secretGo : null;
    if (go === 'home') {
      if (secretPlace === 'end') {
        backToSetup();
        showStep('mode');
        syncThemeToggle();
      }
      // The 🎨 egg only fires once per page load: re-arm it so it can be seen again now.
      allThemes = false;
      toggleThemeMenu(false);
      spotlight([themeToggle]);
      return themeToggle.focus({ preventScroll: true });
    }
    if (go === 'play') {
      spotExtras = true;
      if (secretPlace === 'end') return q('rematch').click();
      showStep('board');
      spotlight([q('startGame')]);
      return q('startGame').focus({ preventScroll: true });
    }
    (secretPlace === 'end' ? q('rematch') : themeToggle).focus({ preventScroll: true });
  });
  new MutationObserver(syncThemeToggle).observe(setup, {
    attributes: true,
    attributeFilter: ['data-step'],
  });
  syncThemeToggle();
  // Easter egg: holding 🎨 for GAME.secrets.holdMs shows every theme until a reload.
  const eggParty = q('eggParty');
  let eggTimer;
  function celebrateEgg() {
    const eggs = ['🥚', '🐣', '🐰', '🌷', '🥚', '🐥'];
    const drops = Array.from({ length: 36 }, (_, i) => {
      const s = document.createElement('span');
      s.textContent = eggs[i % eggs.length];
      s.setAttribute('aria-hidden', 'true');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.8 + 's';
      return s;
    });
    const msg = document.createElement('p');
    msg.textContent = t('themes.unlocked');
    eggParty.replaceChildren(...drops, msg);
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => eggParty.replaceChildren(), GAME.themes.eggPartyMs);
    play('egg');
  }
  themeToggle.addEventListener('click', () => toggleThemeMenu(themeMenu.classList.contains('hidden')));
  onLongPress(themeToggle, {
    ms: GAME.secrets.holdMs,
    ringMs: GAME.secrets.holdRingMs,
    when: () => !allThemes,
    onHold: () => {
      allThemes = true;
      toggleThemeMenu(true);
      celebrateEgg();
      track('secret_found', { secret: 'temas', told: readSecrets().told.includes('temas') });
    },
  });
  themeMenu.addEventListener('click', (e) => {
    const b = e.target.closest('.theme-option');
    if (!b) return;
    if (online || invite) {
      toggleThemeMenu(false);
      return toast(online?.seat === 0 ? t('themes.host_locked') : t('themes.guest_locked'));
    }
    if (b.dataset.theme !== theme) track('theme_change', { theme: b.dataset.theme, theme_from: theme });
    applyTheme(b.dataset.theme);
    toggleThemeMenu(false);
    themeToggle.focus();
  });
  document.addEventListener('click', (e) => {
    if (
      !themeMenu.classList.contains('hidden') &&
      !themeMenu.contains(e.target) &&
      !themeToggle.contains(e.target)
    )
      toggleThemeMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || themeMenu.classList.contains('hidden')) return;
    toggleThemeMenu(false);
    themeToggle.focus();
  });
  {
    const today = new Date();
    let saved = null,
      choseToday = false;
    try {
      saved = localStorage.getItem(THEME_KEY);
      choseToday = localStorage.getItem(THEME_DAY_KEY) === isoDay(today);
    } catch {
      /* ignore */
    }
    const festival = !choseToday && festivalOn(today);
    applyTheme(festival || saved || 'classic', false, festival ? 'festival' : saved ? 'chosen' : 'default');
  }

  function setGameMode(mode) {
    gameMode = mode;
    press(q('modeTwo'), mode === 'two' || mode === 'online');
    q('whereOnline').setAttribute('aria-pressed', String(mode === 'online'));
    q('whereTogether').setAttribute('aria-pressed', String(mode !== 'online'));
    if (mode !== 'online' && (online || invite) && game.classList.contains('hidden')) leaveOnline();
    press(q('modeSolo'), mode === 'solo');
    press(q('modeFour'), mode === 'four');
    const sizeSelect = q('sizeSelect');
    [...sizeSelect.options].forEach(
      (o) => (o.disabled = mode === 'four' && +o.value < GAME.board.fourPlayersMinSize),
    );
    if (mode === 'four' && +sizeSelect.value < GAME.board.fourPlayersMinSize)
      sizeSelect.value = String(GAME.board.fourPlayersMinSize);
    if (mode === 'four') dedupeAvatars();
    const p2Config = namesIn[1].closest('.pconfig');
    const p2Avatars = p2Config.querySelector('.avatars');
    p2Config.querySelector('.small-label').textContent =
      mode === 'solo' ? t('machineBadge') : t('common.jugador_2');
    previews[1].classList.toggle('robot', mode === 'solo');

    if (mode === 'solo') {
      namesIn[1].value = t('machineBadge');
      namesIn[1].disabled = true;
      p2Avatars.style.opacity = '.35';
      p2Avatars.style.pointerEvents = 'none';
      avatars[1] = '🤖';
      previews[1].textContent = '🤖';
    } else {
      if (namesIn[1].value === t('machineBadge')) namesIn[1].value = '';
      namesIn[1].disabled = false;
      p2Avatars.style.opacity = '';
      p2Avatars.style.pointerEvents = '';
      if (avatars[1] === '🤖')
        avatars[1] = avatars[0] === avatarChoices[1] ? firstFreeAvatar(avatarChoices[1]) : avatarChoices[1];
      previews[1].textContent = avatars[1];
    }
    syncAvatars();
  }
  const whereOnline = () => q('whereOnline').getAttribute('aria-pressed') === 'true';
  q('modeTwo').addEventListener('click', () => setGameMode(whereOnline() ? 'online' : 'two'));
  q('whereTogether').addEventListener('click', () => setGameMode('two'));
  q('whereOnline').addEventListener('click', () => setGameMode('online'));
  q('modeSolo').addEventListener('click', () => setGameMode('solo'));
  q('modeFour').addEventListener('click', () => {
    if (roomForFour.matches) setGameMode('four');
    else q('fourDialog').showModal();
  });
  // 4 players need a tablet or a computer: on phones the option stays disabled.
  const roomForFour = matchMedia(
    `(min-width: ${GAME.screen.fourMinWidth}px) and (min-height: ${GAME.screen.fourMinHeight}px)`,
  );
  function syncFourAvailability() {
    const ok = roomForFour.matches;
    if (ok) q('modeFour').removeAttribute('data-locked');
    else q('modeFour').setAttribute('data-locked', 'true');
    q('modeFour').classList.toggle('soon', !ok);
    if (!ok && gameMode === 'four' && game.classList.contains('hidden')) q('modeTwo').click();
  }
  roomForFour.addEventListener('change', syncFourAvailability);
  syncFourAvailability();
  // The robot looks grumpier, furious or on fire depending on the difficulty.
  function setDifficulty(level) {
    difficulty = level;
    press(q('difficultyEasy'), level === 'easy');
    press(q('difficultyHard'), level === 'hard');
    press(q('difficultyExtreme'), level === 'extreme');
    previews[1].dataset.mood = level;
  }
  q('difficultyEasy').addEventListener('click', () => setDifficulty('easy'));
  q('difficultyHard').addEventListener('click', () => setDifficulty('hard'));
  q('difficultyExtreme').addEventListener('click', () => setDifficulty('extreme'));
  setDifficulty(difficulty);
  // Stops the clocks (and the machine) while the help or the pause screen is open.
  function freeze() {
    if (game.classList.contains('hidden') || over || replaying || clockPaused) return false;
    if (settle()) return false;
    clockPaused = true;
    Match.pause(m, performance.now());
    clearInterval(timer);
    clearTimeout(machineTimeout);
    machineThinking = false;
    updateControls();
    return true;
  }
  function thaw() {
    if (!clockPaused) return;
    clockPaused = false;
    Match.resume(m, performance.now());
    timer = setInterval(tick, 100);
    updateControls();
    maybeMachineTurn();
  }
  function openHelp() {
    closeMenu(false);
    q('helpModal').classList.remove('hidden');
    freeze();
  }
  function closeHelp() {
    q('helpModal').classList.add('hidden');
    if (!q('pauseDialog').open) thaw();
  }
  // Pause: the clocks stop and an opaque screen hides the board until someone resumes.
  q('pauseGame').addEventListener('click', () => {
    closeMenu(false);
    if (online || !freeze()) return;
    q('pauseDialog').showModal();
    pausedAt = performance.now();
    track('game_pause', { ...modeParams(), action: 'pause' });
  });
  let pausedAt = 0;
  q('pauseResume').addEventListener('click', () => q('pauseDialog').close());
  q('pauseDialog').addEventListener('close', () => {
    thaw();
    const paused_s = Math.round((performance.now() - pausedAt) / 1000);
    track('game_pause', { ...modeParams(), action: 'resume', paused_s });
  });
  q('helpToggle').addEventListener('click', openHelp);
  q('gameHelp').addEventListener('click', openHelp);
  q('helpClose').addEventListener('click', closeHelp);
  q('helpModal').addEventListener('click', (e) => {
    if (e.target === q('helpModal')) closeHelp();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !q('helpModal').classList.contains('hidden')) closeHelp();
  });

  function chooseLetter(b) {
    const p = +b.dataset.player;
    if (
      over ||
      replaying ||
      clockPaused ||
      p !== current ||
      machineThinking ||
      (gameMode === 'solo' && p === 1)
    )
      return false;
    if (selected[p] !== b.dataset.letter || swapMode !== null) {
      selected[p] = b.dataset.letter;
      swapMode = null;
      updateControls();
      render();
    }
    msg.textContent = t('game.plays_letter', { avatar: avatars[p], name: names[p], letter: selected[p] });
    return true;
  }

  const DRAG_KEY = 'oso.dragKnown.v1';
  const DRAG_THRESHOLD = 6;
  let drag = null;
  let suppressClick = false;
  try {
    if (localStorage.getItem(DRAG_KEY)) game.classList.add('drag-known');
  } catch {
    /* storage unavailable: keep showing the hint */
  }

  const cellAt = (x, y) => {
    const c = document.elementFromPoint(x, y)?.closest('.cell');
    return c && boardEl.contains(c) && !c.classList.contains('filled') ? c : null;
  };
  function moveDrag(e) {
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
    const c = cellAt(e.clientX, e.clientY);
    if (c !== drag.target) {
      drag.target?.classList.remove('drop-target');
      c?.classList.add('drop-target');
      drag.target = c;
    }
  }
  function endDrag(drop) {
    const { ghost, target, button } = drag;
    drag = null;
    button.classList.remove('dragging');
    target?.classList.remove('drop-target');
    ghost?.remove();
    if (!ghost) return;
    suppressClick = true;
    if (!drop || !target) return;
    game.classList.add('drag-known');
    try {
      localStorage.setItem(DRAG_KEY, '1');
    } catch {
      /* ignore */
    }
    cellClick([...boardEl.children].indexOf(target));
  }

  document.querySelectorAll('.letter').forEach((b) => {
    b.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      chooseLetter(b);
    });
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || drag || !chooseLetter(b)) return;
      suppressClick = false;
      drag = { button: b, x: e.clientX, y: e.clientY, ghost: null, target: null };
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        /* window listeners below still track the drag */
      }
    });
    b.addEventListener('dragstart', (e) => e.preventDefault());
  });

  // Tracked on window so a lost pointer capture never leaves a tile hanging.
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) return endDrag(false);
    const b = drag.button;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_THRESHOLD) return;
      const cell = boardEl.querySelector('.cell').getBoundingClientRect();
      const ghost = document.createElement('div');
      ghost.className = 'drag-tile';
      ghost.textContent = b.dataset.letter;
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.width = ghost.style.height = `${cell.width}px`;
      ghost.style.fontSize = `${cell.width * 0.56}px`;
      document.body.appendChild(ghost);
      drag.ghost = ghost;
      b.classList.add('dragging');
    }
    moveDrag(e);
  });
  window.addEventListener('pointerup', () => drag && endDrag(true));
  window.addEventListener('pointercancel', () => drag && endDrag(false));
  window.addEventListener('blur', () => drag && endDrag(false));

  // Tension: with GAME.clock.lowSeconds or less for whoever is on turn, the background turns red
  // more and more (0 → 1) and beats.
  function setTension(level) {
    let el = document.querySelector('.tension');
    if (!el)
      el = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'tension' }));
    el.style.setProperty('--tension', level.toFixed(3));
    el.classList.toggle('on', level > 0);
  }
  function fmt(v) {
    v = Math.max(0, Math.ceil(v));
    return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
  }
  function updateTimers() {
    timers.forEach((e, i) => {
      e.textContent = fmt(times[i]);
      e.classList.toggle('low', times[i] <= GAME.clock.lowSeconds && !over);
      if (times[i] <= GAME.clock.lowSeconds && times[i] > 0 && !over && !replaying && !lowWarned.has(i)) {
        lowWarned.add(i);
        play('low');
      }
    });
    const left = times[current] ?? Infinity;
    setTension(
      over || replaying || left > GAME.clock.lowSeconds ? 0 : 1 - Math.max(0, left) / GAME.clock.lowSeconds,
    );
  }
  function updateControls() {
    sides.forEach((s, i) => {
      s.classList.toggle('hidden', i >= scores.length);
      const isTurn = i === current && !over && !replaying;
      s.classList.toggle('active', isTurn);
      s.classList.toggle('out', gameMode === 'four' && times[i] <= 0);
      s.classList.toggle('machine', gameMode === 'solo' && i === 1);
      s.classList.toggle('thinking', machineThinking && i === 1);
    });

    document.querySelectorAll('.letter').forEach((b) => {
      const p = +b.dataset.player;
      const machineSide = (gameMode === 'solo' && p === 1) || remote(p);
      const canUse = p === current && !over && !replaying && !machineSide && !machineThinking;
      b.classList.toggle('selected', b.dataset.letter === selected[p]);
      b.setAttribute('aria-pressed', String(b.dataset.letter === selected[p]));
      b.disabled = !canUse;
    });

    scores.forEach((_, i) => {
      const machineSide = (gameMode === 'solo' && i === 1) || remote(i);
      const isTurn = i === current && !over && !replaying && !machineThinking;
      const humanCanAct = isTurn && !machineSide;

      const hintUsed = !extras[i].hint;
      const lastUsed = !extras[i].last;
      const swapUsed = !extras[i].swap;
      // Spent 💡, 🔄 and 🛟 stay pressable on one's turn: holding them opens the secret shop (GAME.shop).
      hintBtns[i].disabled = !humanCanAct;
      hintBtns[i].classList.toggle('used', hintUsed);

      const hasOpponentMove = history.some((m) => m.player !== i);
      lastBtns[i].disabled = !humanCanAct || lastUsed || !hasOpponentMove;
      lastBtns[i].classList.toggle('used', lastUsed);

      const hasPlacedLetters = board.some(Boolean);
      swapBtns[i].disabled = !humanCanAct || !hasPlacedLetters;
      swapBtns[i].classList.toggle('used', swapUsed);
      swapBtns[i].classList.toggle('mode', swapMode === i && !swapUsed);

      // SOS is global: once anybody uses it, it is spent for everybody unless bought back.
      sosBtns[i].disabled = !humanCanAct;
      sosBtns[i].classList.toggle('used', !sosReady(i));
      [
        [hintBtns[i], extras[i].hint],
        [lastBtns[i], extras[i].last],
        [swapBtns[i], extras[i].swap],
        [sosBtns[i], sosUsed ? (sosCredits[i] ?? 0) : 1],
      ].forEach(([btn, left]) => {
        btn.querySelector('.count').textContent = String(left);
        btn.setAttribute('aria-label', extraLabel(btn));
      });
    });
    document
      .querySelectorAll('.score-label')
      .forEach((e) => (e.textContent = targetWord === 'SOS' ? t('score.sos') : t('common.puntos_oso')));
    game.classList.toggle('solo', gameMode === 'solo');
    game.classList.toggle('four', gameMode === 'four');
    game.classList.toggle('online', !!online);
    game.classList.toggle('guest', online?.seat === 1);

    turnBarTop.textContent = over
      ? t('status.over')
      : clockPaused
        ? t('status.paused')
        : replaying
          ? t('status.sos')
          : machineThinking
            ? t('status.machine')
            : remote(current)
              ? t('game.waiting', { avatar: avatars[current], name: names[current], word: targetWord })
              : t('game.turn_word', { avatar: avatars[current], name: names[current], word: targetWord });
  }

  function stopGame() {
    setTension(0);
    closeShop();
    gameId++;
    clearInterval(timer);
    clearTimeout(machineTimeout);
    machineThinking = false;
    replaying = false;
    clockPaused = false;
    q('modeFlash').classList.add('hidden');
  }
  // OSO→SOS switches the whole page to a calmer sea theme until the game ends.
  function setSeaTheme(on) {
    game.closest('.panel').classList.toggle('sos-mode', on);
    document.body.classList.toggle('sea-theme', on);
  }

  const filledCells = () => board.filter(Boolean).length;
  const modeParams = () => gameParams({ size, mode: gameMode, difficulty, theme, themeSource });
  // Extras used on this device in the current game (never the machine's or the online rival's).
  let extrasUsed = {};
  function usedExtra(extra, p = current) {
    if (gameMode === 'solo' && p === 1) return;
    extrasUsed[extra] = (extrasUsed[extra] ?? 0) + 1;
    track('extra_used', { ...modeParams(), extra });
  }
  // A game left before it ends (new game, other board, closing the page).
  function abandon() {
    if (!playing) return;
    playing = false;
    track('game_abandon', { ...modeParams(), cells_filled: filledCells(), cells_total: size * size });
  }
  // Online a reload resumes the game, so leaving the page is not an abandon.
  addEventListener('pagehide', () => online || abandon());

  function reset() {
    abandon();
    if (drag) endDrag(false);
    stopGame();
    const today = dailyOn();
    m = Match.newMatch({
      size,
      players: playerCount(),
      now: performance.now(),
      preset: today ? daily.preset : [],
    });
    dailyRng = today ? Daily.dailyRandom(daily.key) : null;
    sync();
    selected = Array(m.players).fill('O');
    replaying = false;
    lowWarned = new Set();
    [...hintBtns, ...lastBtns, ...swapBtns, ...sosBtns].forEach((btn) => btn.classList.remove('used'));
    q('modeFlash').classList.add('hidden');
    setSeaTheme(false);
    hintCell = null;
    lastCell = null;
    swapMode = null;
    scoresEl.forEach((e) => (e.textContent = '0'));
    q('winnerOverlay').classList.add('hidden');
    render();
    updateTimers();
    updateControls();
    msg.textContent = `${avatars[0]} ${names[0]} empieza.`;
    if (spotExtras) {
      spotExtras = false;
      spotlight([...hintBtns, ...swapBtns, ...sosBtns].filter((b) => b.offsetParent));
    }
    timer = setInterval(tick, 100);
    playing = true;
    extrasUsed = {};
    track('game_start', modeParams());
    if (today)
      track('daily_start', {
        ...modeParams(),
        ...dailyParams(),
        daily_first: !Daily.readDaily().results[daily.key],
      });
  }
  // Charges the active player for the time elapsed since the last settlement.
  // Returns true if that player ran out of time (the game is then finished).
  function settle() {
    if (over) return true;
    if (online) return false;
    if (replaying || clockPaused) return false;
    const events = Match.settle(m, performance.now());
    sync();
    updateTimers();
    handleEnd(events);
    events.filter((e) => e.type === 'out').forEach((e) => knockOut(e.player));
    return events.length > 0;
  }
  function handleEnd(events) {
    const end = events.find((e) => e.type === 'end');
    if (end) finish(end.winner, end.reason, end.timedOut);
    return !!end;
  }
  // 4 players: the player keeps their points, the others carry on until only one has time left.
  function knockOut(p) {
    if (over) return;
    if (drag) endDrag(false);
    swapMode = null;
    hintCell = null;
    lastCell = null;
    render();
    updateControls();
    msg.textContent = t('game.timeout_turn', {
      name: names[p],
      avatar: avatars[current],
      next: names[current],
    });
    play('timeout');
  }
  function tick() {
    if (online) return onlineTick();
    settle();
  }
  function render() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${size},minmax(0,1fr))`;
    boardEl.style.setProperty('--n', size);

    board.forEach((v, i) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'cell';
      c.setAttribute(
        'aria-label',
        t('board.cell', { row: Math.floor(i / size) + 1, col: (i % size) + 1, value: v || t('board.empty') }),
      );

      if (v) c.classList.add('filled');
      if (i === justPlaced) c.classList.add('placed');
      if (justScored.has(i)) c.classList.add('scored-now');
      if (i === hintCell) c.classList.add('hint');
      if (i === lastCell) c.classList.add('last');
      if (swapMode === current && v) c.classList.add('swap-target');

      const s = document.createElement('span');
      s.textContent = v;
      c.appendChild(s);
      c.addEventListener('click', () => cellClick(i));
      boardEl.appendChild(c);
    });

    paint();
    justPlaced = null;
    justScored = new Set();
  }
  function paint() {
    const own = Array.from({ length: size * size }, () => new Set());

    for (const [k, p] of scored.entries()) {
      k.split('-')
        .map(Number)
        .forEach((i) => own[i].add(p));
    }

    [...boardEl.children].forEach((c, i) => {
      if (own[i].size > 1) c.classList.add('both');
      else if (own[i].size) c.classList.add(`p${[...own[i]][0] + 1}`);
    });
  }
  function cellClick(i, byMachine = false) {
    if (drag) endDrag(false);
    if (online) return onlineCell(i);
    if (over || replaying || clockPaused) return;
    const machineTurn = gameMode === 'solo' && current === 1;
    if (machineTurn !== byMachine || (machineThinking && !byMachine)) return;
    if (swapMode !== current && board[i]) return;
    if (settle()) return;

    if (swapMode === current) {
      if (!board[i]) {
        msg.textContent = t('extras.swap_pick_full');
        return;
      }

      const p = current;
      const r = Match.swap(m, p, i, performance.now());
      sync();
      if (!r.ok) return handleEnd(r.events);
      play('place');
      usedExtra('swap', p);
      justPlaced = i;
      swapMode = null;
      scoresEl.forEach((e, k) => (e.textContent = scores[k]));
      hintCell = null;
      lastCell = null;
      msg.textContent = t('game.swapped', { name: names[p], letter: board[i] });
      render();
      updateControls();

      if (!handleEnd(r.events)) maybeMachineTurn();
      return;
    }

    if (board[i]) return;

    const p = current;
    const r = Match.place(m, p, i, selected[p], performance.now());
    sync();
    if (!r.ok) return handleEnd(r.events);
    const { made } = r.events[0];
    justPlaced = i;
    made.forEach((k) => k.split('-').forEach((n) => justScored.add(+n)));

    play(made.length ? 'score' : 'place');
    if (made.length) {
      scoresEl[p].textContent = scores[p];
      scoresEl[p].classList.remove('bump');
      void scoresEl[p].offsetWidth;
      scoresEl[p].classList.add('bump');
      updateTimers();
      msg.textContent = t('game.scored', {
        count: made.length,
        avatar: avatars[p],
        name: names[p],
        word: targetWord,
        bonus: BONUS * made.length,
      });
    } else {
      msg.textContent = t('game.turn', { avatar: avatars[current], name: names[current] });
    }

    hintCell = null;
    lastCell = null;
    render();
    updateControls();

    if (!handleEnd(r.events)) maybeMachineTurn();
  }
  function bestHint() {
    return Engine.bestHint(board, size, scored, targetWord, selected[current]);
  }

  hintBtns.forEach((b, p) =>
    b.addEventListener('click', async () => {
      if (b.disabled || p !== current || over || replaying || settle()) return;
      if (!extras[p].hint) return;

      const h = bestHint();
      if (!h) return;

      if (online) {
        if (!(await onlineMove({ type: 'power', power: 'hint' }))) return;
      } else {
        Match.usePower(m, p, 'hint', performance.now());
        sync();
      }
      play('hint');
      usedExtra('hint', p);
      updateControls();
      selected[p] = h.letter;
      hintCell = h.index;
      lastCell = null;
      swapMode = null;
      render();
      updateControls();
      msg.textContent = t('extras.hint_try', { letter: h.letter });
    }),
  );

  lastBtns.forEach((b, p) =>
    b.addEventListener('click', async () => {
      if (b.disabled || p !== current || !extras[p].last || over || replaying || settle()) return;

      const move = [...history].reverse().find((x) => x.player !== p);
      if (!move) return;

      if (online) {
        if (!(await onlineMove({ type: 'power', power: 'last' }))) return;
      } else {
        Match.usePower(m, p, 'last', performance.now());
        sync();
      }
      play('last');
      usedExtra('last', p);
      updateControls();
      lastCell = move.index;
      hintCell = null;
      swapMode = null;
      render();
      updateControls();
      msg.textContent = t('extras.last_move', { letter: move.letter });
    }),
  );

  swapBtns.forEach((b, p) =>
    b.addEventListener('click', () => {
      if (b.disabled || p !== current || over || replaying || settle()) return;
      if (!extras[p].swap) return;

      swapMode = swapMode === p ? null : p;
      if (swapMode === p) play('swap');
      hintCell = null;
      lastCell = null;
      render();
      updateControls();
      msg.textContent = swapMode === p ? t('extras.swap_pick') : t('extras.swap_cancel');
    }),
  );

  // 🛒 Secret shop: holding a spent 💡, 🔄 or 🛟 offers to buy it back with seconds (GAME.shop).
  const SHOP_ITEMS = {
    hint: { name: t('shop.hint.name'), icon: '💡', bought: t('shop.hint.bought') },
    swap: { name: t('shop.swap.name'), icon: '🔄', bought: t('shop.swap.bought') },
    sos: { name: t('shop.sos.name'), icon: '🛟', bought: t('shop.sos.bought') },
  };
  let shopOffer = null;
  const shopHold = (btns, power, spent) =>
    btns.forEach((b, p) =>
      onLongPress(b, {
        ms: GAME.secrets.holdMs,
        ringMs: GAME.secrets.holdRingMs,
        when: () => !b.disabled && p === current && !over && !replaying && spent(p),
        onHold: () => settle() || openShop(p, power),
      }),
    );
  shopHold(hintBtns, 'hint', (p) => !extras[p].hint);
  shopHold(swapBtns, 'swap', (p) => !extras[p].swap);
  shopHold(sosBtns, 'sos', (p) => !sosReady(p));
  function openShop(p, power) {
    const cost = Match.price(power);
    const item = SHOP_ITEMS[power];
    const enough = times[p] > cost;
    shopOffer = enough ? { p, power, cost, game: gameId } : null;
    q('shopText').textContent = enough
      ? t('shop.ask', { item: item.name, cost })
      : t('shop.need', { item: item.name, cost });
    q('shopNote').textContent =
      power === 'sos' && enough ? t('shop.sos_warn', { word: targetWord === 'SOS' ? 'OSO' : 'SOS' }) : '';
    q('shopBuy').classList.toggle('hidden', !enough);
    q('shopDialog').showModal();
    track('secret_found', { secret: 'tienda', told: readSecrets().told.includes('tienda') });
  }
  function closeShop() {
    shopOffer = null;
    if (q('shopDialog').open) q('shopDialog').close();
  }
  async function buyExtra() {
    const o = shopOffer;
    shopOffer = null;
    if (!o || o.game !== gameId || o.p !== current || over || replaying || settle()) return;
    if (online) {
      if (!(await onlineMove({ type: 'buy', power: o.power }))) return;
    } else {
      if (!Match.buy(m, o.p, o.power, performance.now()).ok) return;
      sync();
    }
    play('hint');
    updateTimers();
    updateControls();
    msg.textContent = t('shop.bought', { cost: o.cost, icon: SHOP_ITEMS[o.power].icon });
    track('extra_bought', { extra: o.power });
  }
  q('shopBuy').addEventListener('click', buyExtra);

  function chooseMachineMove() {
    return Engine.chooseMachineMove(board, size, scored, targetWord, difficulty, dailyRng ?? Math.random);
  }

  function maybeMachineTurn() {
    if (gameMode !== 'solo' || current !== 1 || over || replaying || clockPaused) return;

    clearTimeout(machineTimeout);
    machineThinking = true;
    updateControls();
    const id = gameId;

    machineTimeout = setTimeout(() => {
      machineThinking = false;
      if (id !== gameId || over || replaying || clockPaused || current !== 1 || gameMode !== 'solo') {
        updateControls();
        return;
      }

      const move = chooseMachineMove();

      if (!move) {
        endByScore();
        return;
      }

      selected[1] = move.letter;
      updateControls();
      cellClick(move.index, true);

      if (!over && current === 1) {
        maybeMachineTurn();
      }
    }, MACHINE_DELAY);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Full screen «S🛟S» in the sea, or the welcome «OSO» tiles in the game's theme when going
  // back to OSO: the game stops and the rules change. No button.
  let introTimeout;
  function sosIntro(word, ms) {
    const box = q('modeFlash');
    box.classList.toggle('oso', word === 'OSO');
    box.querySelector('.mode-flash-title').textContent = t('sos.now', { word });
    box.querySelector('.mode-flash-sub').textContent = t('sos.change', { word });
    box.classList.remove('hidden');
    clearTimeout(introTimeout);
    if (ms) introTimeout = setTimeout(() => box.classList.add('hidden'), ms);
  }

  async function activateSOS(player) {
    if (over || !sosReady(player) || replaying || clockPaused || player !== current) return;
    if (settle()) return;
    const id = gameId;

    // Global power-up: spent for everybody at once; a bought-back one switches OSO ↔ SOS again.
    const { replay: savedHistory } = Match.sos(m, player, performance.now()).events[0];
    usedExtra('sos', player);
    const word = m.word;
    ({ sosUsed, sosCredits = [] } = m);
    replaying = true;
    play('sos');
    updateControls();
    clearTimeout(machineTimeout);
    clearInterval(timer);
    machineThinking = false;
    swapMode = null;
    hintCell = null;
    lastCell = null;

    setSeaTheme(word === 'SOS');
    sosIntro(word);
    updateControls();
    await sleep(GAME.sos.flashMs);
    if (id !== gameId) return;
    q('modeFlash').classList.add('hidden');

    targetWord = word;
    board = Array(size * size).fill('');
    scores = Array(scores.length).fill(0);
    scored = new Map();
    // The letters of the reto del día were already there: they come back at once.
    for (const move of savedHistory.filter((x) => x.preset))
      ({ board, scored, scores } = Engine.replayMove({ size, board, scored, scores }, move, word));
    scoresEl.forEach((e) => (e.textContent = '0'));
    render();
    msg.textContent = t('sos.replaying', { word });
    await sleep(GAME.sos.pauseMs);
    if (id !== gameId) return;

    for (const move of savedHistory.filter((x) => !x.preset)) {
      ({ board, scored, scores } = Engine.replayMove({ size, board, scored, scores }, move, word));
      scoresEl.forEach((e, i) => (e.textContent = scores[i]));

      render();
      const cell = boardEl.children[move.index];
      if (cell) cell.classList.add('replay-mark');
      msg.textContent = `${avatars[move.player]} ${names[move.player]} → ${board[move.index] || move.letter}`;
      await sleep(GAME.sos.moveMs);
      if (id !== gameId) return;
    }

    sync();
    updateTimers();
    replaying = false;
    render();
    updateControls();
    msg.textContent = t('sos.recalculated', { word: targetWord, scores: scores.join(' – ') });

    Match.resume(m, performance.now());
    timer = setInterval(tick, 100);
    if (gameMode === 'solo' && current === 1) maybeMachineTurn();
  }

  sosBtns.forEach((btn, p) =>
    btn.addEventListener('click', () => {
      if (btn.disabled || over || replaying || p !== current) return;
      if (!sosReady(p)) return;
      if (online) return void onlineMove({ type: 'sos' }).then((ok) => ok && usedExtra('sos'));
      activateSOS(p);
    }),
  );

  const joinNames = (list) =>
    list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} y ${list.at(-1)}`;
  function endByScore() {
    const e = Match.endByScore(m);
    sync();
    finish(e.winner, e.reason, e.timedOut);
  }
  function finish(w, reason, timedOut = reason === 'tiempo') {
    closeShop();
    over = true;
    playing = false;
    track(
      'game_end',
      gameEndParams({
        size,
        mode: gameMode,
        difficulty,
        theme,
        themeSource,
        reason: timedOut ? 'tiempo' : reason,
        winner: w,
        tiebreak: reason === 'puntos' ? m.tiebreak : null,
        scores,
        available: timeFor(size),
        times,
        filled: filledCells(),
        extras: extrasUsed,
      }),
    );
    if (online)
      track('online_quality', { board_size: `${size}x${size}`, ...Online.qualityParams(online.quality) });
    clearInterval(timer);
    updateControls();
    q('winnerOverlay').classList.remove('hidden');
    q('rematch').disabled = false;
    q('rematch').innerHTML = t('rematch.sized', { size });
    q('rematch').setAttribute('aria-label', t('rematch.sized_label', { size }));
    q('otherBoard').classList.toggle('hidden', !!online);
    q('changePlayers').textContent = online ? 'Salir' : t('changePlayers');
    q('rematch').focus({ preventScroll: true });

    // Two players see the score face to face (#endScore); with four it stays in the subtitle.
    const duel = scores.length === 2;
    const result = duel ? '' : scores.join(' – ');
    const sub = (...parts) => parts.filter(Boolean).join(' · ');
    const tiebreak = reason === 'puntos' ? m.tiebreak : null;
    const timeout = gameMode === 'four' ? t('end.timeout', { name: names[current] }) : t('end.rival_timeout');
    if (Array.isArray(w)) {
      q('winnerAvatar').textContent = w.map((i) => avatars[i]).join('');
      q('winnerTitle').textContent = t('end.winners', { names: joinNames(w.map((i) => names[i])) });
      q('winnerSub').textContent = sub(reason === 'tiempo' ? timeout : t('end.shared'), result);
      confetti();
    } else if (w === null) {
      q('winnerAvatar').textContent = '🤝';
      q('winnerTitle').textContent = t('end.draw');
      q('winnerSub').textContent = sub(result, tiebreak === 'draw' && t('end.same_streaks'));
    } else {
      q('winnerAvatar').textContent = avatars[w];
      q('winnerTitle').textContent = t('end.winner', { name: names[w] });
      const decided = { streak: t('end.tiebreak_streak'), streaks: t('end.tiebreak_streaks') }[tiebreak];
      q('winnerSub').textContent =
        reason === 'tiempo'
          ? sub(timeout, result)
          : sub(result && t('end.final', { scores: result }), decided);
      confetti();
    }
    if (reason === 'abandono') q('winnerSub').textContent = t('end.left_game', { name: names[1 - w] });
    play(w === null ? 'draw' : (gameMode === 'solo' && w === 1) || remote(w) ? 'lose' : 'win');
    showEndScore(w);
    showEndStats(w, !duel || (!!tiebreak && tiebreak !== 'none'));
    lastResult = {
      mode: gameMode,
      winner: w,
      scores: [...scores],
      size,
      difficulty,
      daily: dailyOn() && daily.number,
      dailyDate: dailyOn() && Daily.dateLabel(daily.key, false),
    };
    q('replayOpen').classList.toggle('hidden', !history.length);
    fitEndLabels();
    showChallenge(w);
    const st = recordSession(w);
    showEndPhrase();
    prepareScorecard(st, showSession(st));
    countGame();
    const secret = dueSecret();
    syncSecretGift();
    showFeedback(nextFeedback({ mode: gameMode, winner: w, sessionGames: st.games, quiet: !!secret }));
    showInstall(!!secret || !!feedbackMomentNow);
  }

  // Points, longest streak and number of streaks of each player: what breaks a tie.
  function showEndScore(w) {
    const box = q('endScore');
    box.classList.toggle('hidden', scores.length !== 2);
    if (scores.length !== 2) return;
    const won = [w].flat();
    const el = (tag, className, text) => {
      const e = document.createElement(tag);
      e.className = className;
      e.textContent = text;
      return e;
    };
    const side = (p) => {
      const s = el('span', 'end-side', '');
      s.classList.toggle('winner', won.includes(p));
      const avatar = el('span', 'end-side-avatar', avatars[p]);
      avatar.setAttribute('aria-hidden', 'true');
      s.append(avatar, el('span', 'end-side-name', names[p]));
      return s;
    };
    const points = el('span', 'end-points', '');
    const n = (p) => {
      const b = el('b', '', scores[p]);
      b.classList.toggle('winner', won.includes(p));
      return b;
    };
    points.append(n(0), ' – ', n(1));
    box.replaceChildren(side(0), points, side(1));
  }
  // The key of the phrase shown, sent with end_action to see which moments bring a rematch.
  let lastPhrase = 'none';
  const machineSeat = () => (gameMode === 'solo' ? 1 : null);
  function showEndPhrase() {
    const p = endPhrase(sessionGames, { machine: machineSeat() });
    const name = names[p?.player];
    const text =
      p &&
      {
        rout: t('end.phrase.rout', { name }),
        close: t('end.phrase.close'),
        first_win: t('end.phrase.first_win', { name }),
        unstoppable: t('end.phrase.unstoppable', { name, count: p.count }),
        lead_back: t('end.phrase.lead_back', { name }),
        comeback: t('end.phrase.comeback', { name }),
        machine_close: t('end.phrase.machine_close'),
        machine: t('end.phrase.machine'),
      }[p.key];
    lastPhrase = p?.key ?? 'none';
    q('endPhrase').textContent = text ?? '';
    q('endPhrase').classList.toggle('hidden', !text);
  }
  const endAction = (action) => track('end_action', { ...modeParams(), action, end_phrase: lastPhrase });
  // Streaks only matter when they decide the game: otherwise they wait folded in «Ver detalles».
  function showEndStats(w, open) {
    const stats = Match.streaks(m);
    const won = [w].flat();
    const rank = (p) => [won.includes(p) ? 1 : 0, scores[p], stats[p].longest, stats[p].count];
    const order = stats
      .map((_, p) => p)
      .sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        const k = ra.findIndex((v, i) => v !== rb[i]);
        return k < 0 ? 0 : rb[k] - ra[k];
      });
    q('endDetails').classList.toggle('hidden', !history.length);
    q('endDetails').open = open;
    q('endStatsRows').replaceChildren(
      ...order.map((p) => {
        const s = stats[p];
        const row = document.createElement('tr');
        row.classList.toggle('leader', won.includes(p));
        const who = document.createElement('th');
        who.scope = 'row';
        who.className = 'session-player';
        who.textContent = `${avatars[p]} ${names[p]}`;
        const cells = [scores[p], s.longest, s.count].map((n) => {
          const td = document.createElement('td');
          td.textContent = n;
          return td;
        });
        row.append(who, ...cells);
        return row;
      }),
    );
  }

  let feedbackMomentNow = null;
  function showFeedback(moment) {
    feedbackMomentNow = moment;
    q('feedbackAsk').classList.toggle('hidden', !moment);
  }
  for (const [id, rating] of [
    ['feedbackUp', 'up'],
    ['feedbackDown', 'down'],
  ]) {
    q(id).addEventListener('click', () => {
      track('feedback', { ...modeParams(), rating, moment: feedbackMomentNow });
      answerFeedback();
      q('feedbackAsk').classList.add('hidden');
      q('thanksDialog').showModal();
    });
  }
  q('thanksDialog').addEventListener('close', () => q('rematch').focus({ preventScroll: true }));

  // «Ver la partida»: the last game again, move by move, with each OSO made and each one left ready.
  let replay = null;
  function replayShow(n) {
    const r = replay;
    r.at = Math.max(0, Math.min(n, r.steps.length));
    r.seen = Math.max(r.seen, r.at);
    const step = r.steps[r.at - 1];
    const cells = step?.board ?? r.start;
    const own = cells.map(() => new Set());
    for (const [k, p] of step?.scored ?? []) k.split('-').forEach((i) => own[i].add(p));
    const made = new Set(step?.made.flatMap((k) => k.split('-').map(Number)));
    const el = q('replayBoard');
    el.style.gridTemplateColumns = `repeat(${r.size},minmax(0,1fr))`;
    el.style.setProperty('--n', r.size);
    el.replaceChildren(
      ...cells.map((v, i) => {
        const c = document.createElement('div');
        c.className = 'cell';
        if (v) c.classList.add('filled');
        if (own[i].size > 1) c.classList.add('both');
        else if (own[i].size) c.classList.add(`p${[...own[i]][0] + 1}`);
        if (made.has(i)) c.classList.add('replay-made');
        if (step && i === step.move.index) c.classList.add(step.gift ? 'replay-gift' : 'last');
        const s = document.createElement('span');
        s.textContent = v;
        c.append(s);
        return c;
      }),
    );
    const points = step?.scores ?? Array(r.players).fill(0);
    q('replayScore').textContent = points.map((p, i) => `${avatars[i]} ${p}`).join(' – ');
    const total = r.steps.length;
    let caption = t('replay.start', { total });
    if (step) {
      const { player, index, power } = step.move;
      const who = `${avatars[player]} ${names[player]}`;
      const parts = [
        t(power === 'swap' ? 'replay.swap' : 'replay.move', {
          n: r.at,
          total,
          who,
          letter: step.board[index],
        }),
      ];
      if (step.made.length) parts.push(t('replay.made', { count: step.made.length, word: r.word }));
      if (step.gift) parts.push(t('replay.gift', { word: r.word }));
      caption = parts.join(' · ');
    }
    q('replayCaption').textContent = caption;
    q('replayFirst').disabled = q('replayPrev').disabled = r.at === 0;
    q('replayNext').disabled = q('replayLast').disabled = r.at === total;
  }
  function replayPlay(on) {
    clearInterval(replay.timer);
    replay.timer = on
      ? setInterval(() => {
          if (replay.at >= replay.steps.length) replayPlay(false);
          else replayShow(replay.at + 1);
        }, GAME.replay.stepMs)
      : null;
    q('replayPlay').textContent = on ? '⏸' : '▶️';
    q('replayPlay').setAttribute('aria-label', t(on ? 'replay.pause' : 'replay.play'));
  }
  q('replayOpen').addEventListener('click', () => {
    endAction('replay');
    const players = playerCount();
    const steps = replaySteps(size, history, targetWord, players);
    // Letters already on the board (reto del día) are the starting board, not moves.
    const presets = steps.filter((s) => s.move.preset).length;
    replay = {
      steps: steps.slice(presets),
      start: presets ? steps[presets - 1].board : Array(size * size).fill(''),
      size,
      players,
      word: targetWord,
      at: 0,
      seen: 0,
    };
    replayShow(0);
    q('replayDialog').showModal();
    replayPlay(true);
  });
  for (const [id, to] of [
    ['replayFirst', () => 0],
    ['replayPrev', () => replay.at - 1],
    ['replayNext', () => replay.at + 1],
    ['replayLast', () => replay.steps.length],
  ]) {
    q(id).addEventListener('click', () => {
      replayPlay(false);
      replayShow(to());
    });
  }
  q('replayPlay').addEventListener('click', () => {
    if (replay.timer) return replayPlay(false);
    if (replay.at >= replay.steps.length) replayShow(0);
    replayPlay(true);
  });
  q('replayDialog').addEventListener('close', () => {
    replayPlay(false);
    track('replay_view', { ...modeParams(), replay_seen: replay.seen, replay_moves: replay.steps.length });
    q('replayOpen').focus({ preventScroll: true });
  });

  // Word of mouth: the phone's own share sheet when there is one, otherwise WhatsApp, email or copy.
  let shareChallenge = null,
    shareDaily = false;
  let lastResult = null,
    sharePlace = null;
  async function share(place) {
    const result = place === 'end' ? lastResult : null;
    shareDaily = !!result?.daily;
    shareChallenge =
      result?.mode === 'solo' && !shareDaily
        ? `reto=${challengeParam({ ...result, mine: result.scores[0], theirs: result.scores[1] })}${theme === 'classic' ? '' : `&tema=${theme}`}`
        : null;
    const text = shareText(result);
    const card = place === 'end' ? await shareCard : null;
    if (navigator.share) {
      try {
        // The link goes inside the text, after a blank line: with `url` apart, Android glues it on with a space.
        const data = {
          title: t('common.oso_el_juego_de'),
          text: withLink(text, shareUrl('native', shareChallenge, shareDaily)),
        };
        if (card && navigator.canShare?.({ files: [card] })) data.files = [card];
        await navigator.share(data);
        track('share', { channel: 'native', place });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    sharePlace = place;
    q('shareMessage').textContent = text;
    q('shareWhatsapp').href = whatsappHref(text, shareUrl('whatsapp', shareChallenge, shareDaily));
    q('shareEmail').href = emailHref(text, shareUrl('email', shareChallenge, shareDaily));
    q('shareStatus').textContent = '';
    const image = q('shareImage');
    if (image.href.startsWith('blob:')) URL.revokeObjectURL(image.href);
    image.href = card ? URL.createObjectURL(card) : '#';
    image.classList.toggle('hidden', !card);
    q('shareDialog').showModal();
  }
  q('shareImage').addEventListener('click', () => track('share', { channel: 'image', place: sharePlace }));
  q('shareWhatsapp').addEventListener('click', () =>
    track('share', { channel: 'whatsapp', place: sharePlace }),
  );
  q('shareEmail').addEventListener('click', () => track('share', { channel: 'email', place: sharePlace }));
  q('shareCopy').addEventListener('click', async () => {
    const url = shareUrl('copy', shareChallenge, shareDaily);
    try {
      await navigator.clipboard.writeText(url);
      q('shareStatus').textContent = t('share.copied');
      track('share', { channel: 'copy', place: sharePlace });
    } catch {
      q('shareStatus').textContent = t('share.copy_this', { url: url });
    }
  });
  shareToggle.addEventListener('click', () => share('start'));
  q('shareResult').addEventListener('click', () => {
    endAction('share');
    share('end');
  });
  // «Compartir resultado» and «Ver la partida» go long → short → emoji above the text, so they
  // never wrap mid-label. If one needs the emoji above, both get it, so they look the same.
  const SHORT_LABELS = {
    shareResult: () => t('shareResult.short'),
    replayOpen: () => t('replayOpen.short'),
  };
  const wraps = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return new Set([...range.getClientRects()].map((r) => Math.round(r.bottom))).size > 1;
  };
  function fitEndLabels() {
    const ids = Object.keys(SHORT_LABELS);
    let stack = false;
    for (const id of ids) {
      const btn = q(id);
      btn.textContent = t(id);
      if (!wraps(btn)) continue;
      btn.textContent = SHORT_LABELS[id]();
      if (wraps(btn)) stack = true;
    }
    q('shareResult').parentElement.classList.toggle('stack-labels', stack);
    if (!stack) return;
    for (const id of ids) {
      const [emoji, ...words] = SHORT_LABELS[id]().split(' ');
      const icon = document.createElement('span');
      icon.className = 'btn-emoji';
      icon.textContent = emoji;
      q(id).replaceChildren(icon, ` ${words.join(' ')}`);
    }
  }
  // Their width comes from the grid, not from the text, so changing the text can't loop.
  for (const id of Object.keys(SHORT_LABELS)) {
    let width = 0;
    new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (!w || w === width) return;
      width = w;
      fitEndLabels();
    }).observe(q(id));
  }
  q('shareMenu').addEventListener('click', () => {
    closeMenu();
    share('menu');
  });

  const SESSION_KEY = 'oso.session.v1';
  let sessionGames = [];
  function recordSession(winner) {
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      /* unreadable or unavailable: start a new session */
    }
    const n = scores.length;
    const key = sessionKey({
      mode: gameMode,
      difficulty,
      names: names.slice(0, n),
      avatars: avatars.slice(0, n),
    });
    session = recordGame(session, key, { scores, winner, size });
    sessionGames = session.games;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    return standings(session);
  }
  const sessionMetaText = (st) =>
    `${t('session.games', { count: st.games })}${st.draws ? t('session.draws', { count: st.draws }) : ''}`;
  function showSession(st) {
    const order = st.wins
      .map((_, i) => i)
      .sort((a, b) => st.wins[b] - st.wins[a] || st.points[b] - st.points[a]);
    const leader = st.wins[order[0]] > st.wins[order[1]] ? order[0] : null;
    // Against the machine it shows from the first game; between people, from the second one.
    const hidden = st.games < (gameMode === 'solo' ? 1 : 2);
    q('sessionBoard').classList.toggle('hidden', hidden);
    if (hidden) return { order, leader };
    q('sessionRows').replaceChildren(
      ...order.map((p) => {
        const row = document.createElement('tr');
        row.classList.toggle('leader', p === leader);
        const crown = document.createElement('td');
        crown.className = 'session-crown';
        if (p === leader) {
          const icon = document.createElement('span');
          icon.setAttribute('role', 'img');
          icon.setAttribute('aria-label', t('session.leader'));
          icon.textContent = '👑';
          crown.append(icon);
        }
        const who = document.createElement('th');
        who.scope = 'row';
        who.className = 'session-player';
        who.textContent = `${avatars[p]} ${names[p]}`;
        const wins = document.createElement('td');
        wins.textContent = st.wins[p];
        const points = document.createElement('td');
        points.textContent = st.points[p];
        row.append(crown, who, wins, points);
        return row;
      }),
    );
    q('sessionMeta').textContent = sessionMetaText(st);
    const nudge = sessionNudge(st, { machine: machineSeat() });
    const name = names[nudge?.player];
    const text =
      nudge &&
      {
        tied: t('session.nudge.tied'),
        can_tie: t('session.nudge.can_tie', { name }),
        machine_ahead: t('session.nudge.machine_ahead', { name }),
        ahead: t('session.nudge.ahead', { name, count: nudge.count }),
      }[nudge.key];
    q('sessionNudge').textContent = text ?? '';
    q('sessionNudge').classList.toggle('hidden', !text);
    return { order, leader };
  }
  // The picture is drawn as the game ends: the share sheet must open right on the tap.
  let shareCard = Promise.resolve(null);
  function prepareScorecard(st, { order, leader }) {
    shareCard = drawScorecard({
      brand: dailyOn() ? t('daily.brand', { number: daily.number }) : t('common.oso_el_juego_de'),
      avatar: q('winnerAvatar').textContent,
      title: q('winnerTitle').textContent,
      subtitle: [
        scores.length === 2 && `${avatars[0]} ${scores[0]} – ${scores[1]} ${avatars[1]}`,
        q('winnerSub').textContent,
        t('scorecard.board', { size }),
      ]
        .filter(Boolean)
        .join(' · '),
      heading: t('sessionTitle'),
      columns: [t('sessionBoard.jugador'), t('sessionBoard.victorias'), t('sessionBoard.puntos')],
      rows: order.map((p) => ({
        who: `${avatars[p]} ${names[p]}`,
        wins: st.wins[p],
        points: st.points[p],
        leader: p === leader,
      })),
      meta: sessionMetaText(st),
      site: new URL(SITE_URL).host,
    }).catch(() => null);
  }
  function confetti() {
    const h = q('confetti');
    h.innerHTML = '';
    const cs =
      themeOf(theme).confetti ??
      getComputedStyle(document.body)
        .getPropertyValue('--confetti')
        .split(',')
        .map((c) => c.trim());

    for (let i = 0; i < 90; i++) {
      const x = document.createElement('i');
      x.style.left = Math.random() * 100 + '%';
      x.style.background = cs[i % cs.length];
      x.style.animationDelay = Math.random() + 's';
      h.appendChild(x);
    }
  }

  // ---- Online 1 vs 1 (docs/ONLINE.md): the server referees; this mirrors its state. ----
  const onlineDialog = q('onlineDialog');
  let pollTimeout = null;
  const ONLINE_ERRORS = {
    no_room: t('online.err.gone'),
    expired: t('online.err.closed', { min: GAME.online.closeAfterMinutes }),
    code: t('online.err.code'),
    full: t('online.err.full'),
    avatar_taken: t('online.err.avatar'),
    rate: t('online.err.rate'),
    network: t('online.err.offline'),
  };
  const onlineError = (e) => ONLINE_ERRORS[e] ?? t('online.err.generic');
  const setOnlineStatus = (text) => (q('onlineStatus').textContent = text);

  function connect(r, seat) {
    online = {
      code: r.code,
      token: r.token,
      seat,
      rev: r.rev,
      game: 0,
      seats: r.seats,
      quality: Online.newQuality(),
      busy: false,
      offline: false,
    };
    Online.saveSeat({ code: r.code, token: r.token, seat });
    if (Online.codeFromUrl()) window.history.replaceState(null, '', Online.urlWithoutRoom());
  }

  function schedulePoll(delay = Online.POLL_MS) {
    clearTimeout(pollTimeout);
    if (online) pollTimeout = setTimeout(pollOnce, delay);
  }
  async function pollOnce() {
    const o = online;
    if (!o) return;
    const v = await Online.fetchRoom(o.code, o.rev, o.quality);
    if (o !== online) return;
    if (v.ok) {
      if (o.offline) {
        o.offline = false;
        o.quality.reconnects++;
        msg.textContent = t('online.reconnected');
      }
      if (!v.same) applyView(v);
    } else if (v.http === 404) {
      return roomGone();
    } else if (!o.offline) {
      o.offline = true;
      msg.textContent = t('online.retrying');
    }
    // Poll faster while waiting for the rival; on our own turn only clocks and leaving can change.
    const waiting = over || remote(current) || !setup.classList.contains('hidden');
    schedulePoll(waiting ? Online.POLL_MS : Online.POLL_MS * 2);
  }
  function roomGone(reason) {
    clearTimeout(pollTimeout);
    Online.clearSeat();
    const seat = online?.seat;
    online = null;
    restoreOwnTheme();
    if (reason === 'expired' && game.classList.contains('hidden')) return roomExpired(seat);
    if (game.classList.contains('hidden')) {
      renderLobby();
      onlineFail('no_room');
    } else msg.textContent = t('online.expired');
  }
  // No game started in time (GAME.online.closeAfterMinutes): the host opens another room right
  // there; the guest goes back to the start and needs a new link.
  let closedNews = null;
  function roomExpired(seat) {
    const host = seat === 0;
    track('online_expired', { role: host ? 'host' : 'guest' });
    invite = null;
    closedNews = host
      ? {
          step: 'players',
          text: t('online.closed_host', { min: GAME.online.closeAfterMinutes }),
        }
      : {
          step: 'mode',
          text: t('online.closed_guest', { min: GAME.online.closeAfterMinutes }),
        };
    setGameMode(host ? 'online' : 'two');
    renderLobby();
    showStep(closedNews.step);
  }

  // Shows the server state: board, scores, clocks, names and the end of the game.
  function applyView(v) {
    const o = online;
    const arrived = o.seat === 0 && o.seats?.length === 1 && v.seats.length === 2;
    o.rev = v.rev;
    o.seats = v.seats;
    o.status = v.status;
    if (o.seat === 1) wearHostTheme(v.theme);
    if (v.status === 'closed') return roomGone(v.closed);
    if (!v.match) {
      renderLobby();
      if (arrived) rivalArrived();
      return;
    }
    if (v.game !== o.game || game.classList.contains('hidden')) return startOnlineGame(v);
    const wasOver = over,
      oldBoard = board,
      oldKeys = new Set(scored.keys()),
      oldWord = targetWord;
    const turnKey = `${v.game}:${v.match.current}:${v.match.history.length}:${v.match.word}`;
    if (turnKey !== o.turnKey) {
      o.turnKey = turnKey;
      o.turnStart = performance.now() + v.match.holdMs;
      closeNudge(false);
    }
    const rivalSeat = v.seats[1 - o.seat];
    if (rivalSeat?.here > (o.rivalHere ?? 0) && o.rivalHere !== undefined && !v.match.over)
      msg.textContent = t('online.thinking', { name: rivalSeat.name });
    o.rivalHere = rivalSeat?.here ?? 0;
    const before = m && {
      extras: m.extras.map((e) => ({ ...e })),
      credits: [...(m.sosCredits ?? [])],
      history: m.history.length,
      current: m.current,
    };
    m = Match.fromJSON(v.match);
    m.times = v.match.clocks;
    m.since = performance.now() + v.match.holdMs;
    sync();
    v.seats.forEach((s, i) => {
      names[i] = s.name;
      avatars[i] = s.avatar;
      namesEl[i].textContent = s.name;
      avatarsEl[i].textContent = s.avatar;
    });
    const rival = 1 - o.seat;
    const news = before ? rivalNews(before, rival) : [];
    let text = '';
    if (targetWord !== oldWord) {
      play('sos');
      setSeaTheme(targetWord === 'SOS');
      const intro = Math.min(GAME.sos.flashMs, v.match.holdMs);
      if (intro > 0) sosIntro(targetWord, intro);
      text = t('online.recalculated', {
        msg:
          before?.current === rival
            ? t('online.sos_by', { name: who(rival), word: targetWord })
            : t('online.sos_now', { word: targetWord }),
        scores: scores.join(' – '),
      });
    } else if (oldBoard.length === board.length) {
      const changed = board.findIndex((x, i) => x !== oldBoard[i]);
      const made = [...scored.keys()].filter((k) => !oldKeys.has(k));
      if (changed >= 0) {
        justPlaced = changed;
        made.forEach((k) => k.split('-').forEach((n) => justScored.add(+n)));
        play(made.length ? 'score' : 'place');
        hintCell = null;
        lastCell = null;
        swapMode = null;
        text = made.length
          ? t('game.scored', {
              count: made.length,
              avatar: avatars[current],
              name: names[current],
              word: targetWord,
              bonus: BONUS * made.length,
            })
          : remote(current)
            ? t('game.turn', { avatar: avatars[current], name: names[current] })
            : t('online.your_turn', { avatar: avatars[current], name: names[current] });
      }
    }
    if (news.length || text) msg.textContent = [...news, text].filter(Boolean).join(' ');
    scoresEl.forEach((e, k) => (e.textContent = scores[k] ?? 0));
    render();
    updateTimers();
    updateControls();
    if (over && !wasOver) finish(m.winner, m.reason, m.timedOut);
    if (over) showRematchState(v);
  }

  const who = (p) => `${avatars[p]} ${names[p]}`;
  // What the online rival did since the last update that the board doesn't show by itself.
  function rivalNews(before, r) {
    const news = [];
    const was = before.extras[r] ?? {},
      now = extras[r] ?? {};
    const bought = (power) =>
      news.push(
        t('online.bought', { name: who(r), item: SHOP_ITEMS[power].bought, cost: Match.price(power) }),
      );
    const swaps = history.slice(before.history).filter((x) => x.player === r && x.power === 'swap').length;
    if (now.hint > was.hint) bought('hint');
    if (now.swap + swaps > was.swap) bought('swap');
    if ((sosCredits[r] ?? 0) > (before.credits[r] ?? 0)) bought('sos');
    if (now.hint < was.hint) news.push(t('online.used_hint', { name: who(r) }));
    if (now.last < was.last) news.push(t('online.used_last', { name: who(r) }));
    if (swaps) news.push(t('online.used_swap', { name: who(r) }));
    return news;
  }

  function showRematchState(v) {
    const mine = v.seats[online.seat],
      theirs = v.seats[1 - online.seat];
    const rival = theirs?.name ?? t('online.rival');
    q('rematch').disabled = !!mine?.rematch || !!theirs?.left;
    if (theirs?.left) q('winnerSub').textContent = t('online.left_room', { name: rival });
    else if (mine?.rematch) q('winnerSub').textContent = t('online.rematch_wait', { name: rival });
    else if (theirs?.rematch) q('winnerSub').textContent = t('online.rematch_asked', { name: rival });
  }

  function startOnlineGame(v) {
    stopGame();
    m = null;
    document.title = baseTitle;
    gameMode = 'online';
    online.game = v.game;
    size = v.size;
    board = [];
    scored = new Map();
    targetWord = 'OSO';
    selected = ['O', 'O'];
    lowWarned = new Set();
    hintCell = null;
    lastCell = null;
    swapMode = null;
    [...hintBtns, ...lastBtns, ...swapBtns, ...sosBtns].forEach((btn) => btn.classList.remove('used'));
    setSeaTheme(false);
    q('winnerOverlay').classList.add('hidden');
    q('machineBadge').classList.add('hidden');
    avatarsEl[1].classList.remove('robot');
    q('restartMatch').classList.add('hidden');
    q('pauseGame').classList.add('hidden');
    setup.classList.add('hidden');
    game.classList.remove('hidden');
    game.classList.add('same-view');
    applyView(v);
    online.goAt = 0;
    if (!over && !v.match.history.length && v.match.holdMs > 0) countdown(v.match.holdMs);
    if (!over) {
      msg.textContent = remote(current)
        ? t('online.starts', { avatar: avatars[current], name: names[current] })
        : t('online.you_start', { avatar: avatars[current], name: names[current] });
      playing = true;
      extrasUsed = {};
      track('game_start', modeParams());
    }
    timer = setInterval(tick, 100);
    schedulePoll();
  }

  // «3, 2, 1» on both screens: the server holds the first clock meanwhile.
  function countdown(ms) {
    const o = online,
      box = q('countdown'),
      num = q('countdownNum');
    o.goAt = performance.now() + ms;
    box.classList.remove('hidden');
    const step = () => {
      const left = Math.ceil((o.goAt - performance.now()) / 1000);
      if (o !== online || left <= 0) return box.classList.add('hidden');
      if (num.textContent !== String(left)) {
        num.textContent = left;
        num.animate(
          [
            { transform: 'scale(1.6)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 },
          ],
          300,
        );
      }
      setTimeout(step, 50);
    };
    num.textContent = '';
    step();
  }

  // Clocks run locally between polls; the server has the last word on time-outs.
  function onlineTick() {
    if (over) return closeNudge(false);
    times = Match.clocks(m, performance.now());
    updateTimers();
    if (times[current] <= 0) schedulePoll(0);
    if (online.nudgedKey !== online.turnKey && performance.now() - online.turnStart > Online.NUDGE_MS) {
      online.nudgedKey = online.turnKey;
      if (remote(current)) {
        const me = online.seat;
        msg.textContent = Online.cheer({
          mine: scores[me],
          theirs: scores[1 - me],
          free: board.filter((x) => !x).length,
          rivalName: names[current],
          rivalTime: times[current],
        });
        track('online_nudge', { role: 'waiting' });
      } else {
        nudgeShownAt = performance.now();
        q('nudgeDialog').showModal();
      }
    }
  }

  // «¿Sigues ahí?»: answering lets the rival know; the clock never stops.
  let nudgeShownAt = null;
  function closeNudge(answered) {
    if (nudgeShownAt === null) return;
    track('online_nudge', {
      role: 'mover',
      answered,
      answer_ms: answered ? Math.round(performance.now() - nudgeShownAt) : 0,
    });
    nudgeShownAt = null;
    if (q('nudgeDialog').open) q('nudgeDialog').close();
  }
  q('nudgeHere').addEventListener('click', () => {
    closeNudge(true);
    const o = online;
    if (o)
      Online.send({ action: 'ping', code: o.code, token: o.token }).then(
        (r) => r.ok && o === online && !o.busy && applyView(r),
      );
  });
  q('nudgeDialog').addEventListener('cancel', (e) => {
    e.preventDefault();
    q('nudgeHere').click();
  });

  async function onlineMove(move, retry = true) {
    const o = online;
    if (!o || o.busy || over || remote(current)) return false;
    o.busy = true;
    const r = await Online.send(
      { action: 'move', code: o.code, token: o.token, rev: o.rev, move },
      o.quality,
    );
    o.busy = false;
    if (o !== online) return false;
    if (r.ok) applyView(r);
    else if (r.room) {
      applyView(r.room);
      // A «¡Sigo aquí!» or rematch flag moved the revision on; the turn is still ours.
      if (r.error === 'stale' && retry && !over && !remote(current)) return onlineMove(move, false);
    } else if (r.http === 404) roomGone();
    else msg.textContent = t('online.send_failed');
    return r.ok;
  }

  function onlineCell(i) {
    if (over || remote(current) || online.busy || performance.now() < online.goAt) return;
    if (swapMode === current) {
      if (!board[i]) msg.textContent = t('extras.swap_pick_full');
      else onlineMove({ type: 'swap', index: i }).then((ok) => ok && usedExtra('swap'));
      return;
    }
    if (!board[i]) onlineMove({ type: 'place', index: i, letter: selected[current] });
  }

  async function onlineRematch() {
    q('rematch').disabled = true;
    const r = await Online.send({ action: 'rematch', code: online.code, token: online.token });
    if (r.ok || r.room) applyView(r.ok ? r : r.room);
    else q('rematch').disabled = false;
  }

  function leaveOnline() {
    invite = null;
    restoreOwnTheme();
    if (!online) return renderLobby();
    closeNudge(false);
    const { code, token } = online;
    Online.send({ action: 'leave', code, token });
    clearTimeout(pollTimeout);
    Online.clearSeat();
    online = null;
    q('restartMatch').classList.remove('hidden');
    q('pauseGame').classList.remove('hidden');
    q('otherBoard').classList.remove('hidden');
    game.classList.remove('online');
    renderLobby();
  }

  const showStep = (step) => document.dispatchEvent(new CustomEvent('oso:show', { detail: step }));
  function onlineFail(error) {
    setOnlineStatus(onlineError(error));
    q('onlineMachine').classList.toggle('hidden', error !== 'network');
    if (!onlineDialog.open) onlineDialog.showModal();
  }
  // A guest who opened an invite link but hasn't joined yet: { code, room }.
  let invite = null;

  // Online, the players step is the room: the rival's card is the invite, then shows who joined.
  function renderLobby() {
    const on = gameMode === 'online';
    const seats = online?.seats ?? invite?.room.seats ?? [];
    const me = online ? online.seat : invite ? 1 : 0;
    const cards = [0, 1].map((i) => namesIn[i].closest('.pconfig'));
    cards.forEach((card, i) => {
      const other = on && i !== me && seats[i];
      card.classList.toggle('remote', !!other);
      card.querySelector('.avatars').inert = !!other;
      if (other) {
        card.querySelector('.online-seat-avatar').textContent = other.avatar;
        card.querySelector('.online-seat-name').textContent = other.name;
        avatars[i] = other.avatar;
      }
    });
    syncAvatars();
    const host = me === 0,
      ready = seats.length === 2;
    cards.forEach((card, i) => {
      card.querySelector('.small-label').textContent = !on
        ? t('player.n', { n: i + 1 })
        : i === me
          ? t('online.you')
          : host
            ? t('online.rival_cap')
            : t('online.invites');
    });
    cards[1].classList.toggle('inviting', on && host && !ready);
    q('openRoom').classList.toggle('hidden', !!online);
    q('roomShare').classList.toggle('hidden', !online);
    q('roomCodeLine').classList.toggle('hidden', !online);
    if (online) {
      q('onlineCode').textContent = online.code;
      q('onlineWhatsapp').href = whatsappHref(t('share.room'), Online.inviteUrl(online.code, 'whatsapp'));
    }
    const offer = on && host && !!online?.offerReady && !ready;
    q('waitMachine').classList.toggle('hidden', !offer);
    if (offer && !online.offerTracked) {
      online.offerTracked = true;
      track('online_machine', { action: 'offered' });
    }
    const rival = seats[1 - me]?.name;
    document.title = on && host && online && ready ? t('online.arrived_title', { name: rival }) : baseTitle;
    const seatNews = !on
      ? ''
      : host
        ? online
          ? ready
            ? t('online.arrived', { name: rival })
            : t('online.waiting')
          : ''
        : online
          ? t('online.in')
          : t('online.guest_lead', { name: seats[0]?.name ?? t('online.someone') });
    q('sizeSelect').disabled = on && !host;
    q('startGame').classList.toggle('hidden', on && !host);
    q('startGame').disabled = on && host && online?.status !== 'lobby';
    const boardNews = !on
      ? ''
      : !host
        ? t('online.host_choosing', { name: seats[0]?.name ?? t('online.rival_cap') })
        : ready
          ? t('online.arrived_pick', { name: rival })
          : online
            ? t('online.waiting')
            : t('online.open_first');
    toast(
      closedNews?.step === setupStep
        ? closedNews.text
        : setupStep === 'players'
          ? seatNews
          : setupStep === 'board'
            ? boardNews
            : '',
    );
  }
  // Host: the rival came in, maybe while the host was in WhatsApp. A sound, the tab title and
  // straight on to the board.
  function rivalArrived() {
    play('join');
    if (setupStep === 'players' && !setup.classList.contains('hidden')) q('stepNext').click();
  }

  // Host alone in the room: plays the machine while the room stays open, and is told when the
  // rival comes in, with a button to leave that game and go and play them.
  let parked = null;
  let parkTimeout;
  q('waitMachine').addEventListener('click', () => {
    track('online_machine', { action: 'accepted' });
    parked = online;
    online = null;
    clearTimeout(pollTimeout);
    setGameMode('solo');
    startLocalGame();
    game.classList.remove('same-view');
    parkPoll();
  });
  function parkPoll() {
    clearTimeout(parkTimeout);
    if (parked) parkTimeout = setTimeout(pollParked, Online.POLL_MS * 2);
  }
  async function pollParked() {
    const o = parked;
    if (!o) return;
    const v = await Online.fetchRoom(o.code, o.rev, o.quality);
    if (o !== parked) return;
    if (v.http === 404 || (v.ok && v.status === 'closed')) return dropParked(true);
    if (v.ok && !v.same) {
      o.rev = v.rev;
      o.seats = v.seats;
      o.status = v.status;
      if (v.seats.length === 2 && !o.rivalShown) {
        o.rivalShown = true;
        const name = v.seats[1].name;
        rivalBanner(t('online.machine_arrived', { name }), t('online.machine_go', { name }));
        play('join');
        track('online_machine', { action: 'rival_arrived' });
      }
    }
    parkPoll();
  }
  function rivalBanner(text, go = '') {
    q('rivalBannerText').textContent = text;
    q('rivalGo').textContent = go;
    q('rivalGo').classList.toggle('hidden', !go);
    q('rivalBanner').classList.toggle('hidden', !text);
  }
  // Leaving the machine game closes the room; if the room closed by itself, says so.
  function dropParked(closed = false) {
    if (!closed) rivalBanner('');
    if (!parked) return;
    const { code, token } = parked;
    parked = null;
    clearTimeout(parkTimeout);
    if (closed) rivalBanner(t('online.machine_closed', { min: GAME.online.closeAfterMinutes }));
    else Online.send({ action: 'leave', code, token });
    Online.clearSeat();
  }
  q('rivalGo').addEventListener('click', () => {
    const o = parked;
    if (!o) return;
    track('online_machine', { action: 'switched' });
    parked = null;
    clearTimeout(parkTimeout);
    rivalBanner('');
    abandon();
    stopGame();
    q('winnerOverlay').classList.add('hidden');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
    online = o;
    setGameMode('online');
    showStep('board');
    schedulePoll(0);
  });
  function toast(text) {
    const el = q('onlineToast');
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle('hidden', !text);
    placeToast();
  }
  function placeToast() {
    // Layout position (offsetTop) rather than getBoundingClientRect, so an entry animation moving
    // the card doesn't leave the toast off-centre.
    let top = 0;
    for (let el = document.querySelector('.panel'); el; el = el.offsetParent) top += el.offsetTop;
    document.documentElement.style.setProperty('--toast-mid', `${Math.round(top / 2)}px`);
  }
  new ResizeObserver(placeToast).observe(document.querySelector('.panel'));
  // The end screen always fits one screen: with big text or a small phone everything is scaled down.
  const fitEndScreen = () => {
    const box = q('winnerOverlay');
    const card = q('winnerCard');
    card.style.zoom = '';
    if (box.classList.contains('hidden')) return;
    const pad = getComputedStyle(box);
    const h = box.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom);
    const w = box.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
    let k = Math.min(1, h / card.offsetHeight, w / Math.max(card.offsetWidth, card.scrollWidth));
    if (k >= 1) return;
    k = Math.max(0.5, k);
    card.style.zoom = k.toFixed(3);
    while (k > 0.5 && box.scrollHeight > box.clientHeight + 1) card.style.zoom = (k -= 0.02).toFixed(3);
  };
  const fitObserver = new ResizeObserver(() => fitEndScreen());
  fitObserver.observe(q('winnerOverlay'));
  fitObserver.observe(q('winnerCard'));
  window.addEventListener('resize', placeToast);
  let setupStep = null;
  document.addEventListener('oso:step', (e) => {
    setupStep = e.detail;
    if (closedNews?.step !== setupStep) closedNews = null;
    renderLobby();
  });

  // Host: «Abrir sala» creates the room; the invite stays on the players step.
  async function hostRoom() {
    const btn = q('openRoom');
    btn.disabled = true;
    const r = await Online.send({
      action: 'create',
      name: namesIn[0].value.trim() || t('common.jugador_1'),
      avatar: avatars[0],
      theme,
    });
    btn.disabled = false;
    if (!r.ok) return onlineFail(r.error);
    closedNews = null;
    connect(r, 0);
    const room = online;
    setTimeout(() => {
      room.offerReady = true;
      if (room === online) renderLobby();
    }, GAME.online.machineOfferSeconds * 1000);
    track('online_create');
    renderLobby();
    schedulePoll();
  }
  q('openRoom').addEventListener('click', hostRoom);

  // → on the players step: the guest joins, the host opens the room or updates their card.
  document.addEventListener('oso:online-next', async (e) => {
    e.preventDefault();
    const me = online ? online.seat : invite ? 1 : 0;
    const body = { name: namesIn[me].value.trim() || t('player.n', { n: me + 1 }), avatar: avatars[me] };
    if (invite) {
      const r = await Online.send({ action: 'join', code: invite.code, ...body });
      if (!r.ok) {
        track('online_join_fail', { reason: r.error });
        if (r.error === 'avatar_taken') return toast(onlineError(r.error));
        leaveOnline();
        return onlineFail(r.error);
      }
      invite = null;
      connect(r, 1);
      track('online_join');
      schedulePoll();
    } else if (!online) return hostRoom();
    else {
      const r = await Online.send({ action: 'profile', code: online.code, token: online.token, ...body });
      if (r.error === 'avatar_taken') return toast(onlineError(r.error));
      if (r.error === 'expired') return applyView(r.room);
      if (r.ok && online) applyView(r);
    }
    renderLobby();
    showStep('board');
  });
  // ← on the players step: a guest leaves the invite; the host keeps the room open.
  document.addEventListener('oso:online-back', (e) => {
    if (!invite && online?.seat !== 1) return;
    e.preventDefault();
    leaveOnline();
    setGameMode('two');
    showStep('mode');
  });

  // Host: «¡A jugar!» with the chosen board, once the friend is in.
  async function startOnline() {
    const btn = q('startGame');
    btn.disabled = true;
    const r = await Online.send({
      action: 'start',
      code: online.code,
      token: online.token,
      size: +q('sizeSelect').value,
    });
    if (r.ok) return startOnlineGame(r);
    if (r.room) applyView(r.room);
    renderLobby();
    if (r.error !== 'started' && r.error !== 'alone') toast(onlineError(r.error));
  }

  // Guest: the invite link opens the players step with the host's card.
  async function offerJoin(code) {
    window.history.replaceState(null, '', Online.urlWithoutRoom());
    const room = await Online.fetchRoom(code, 0, null, true);
    const error = !room.ok
      ? room.error
      : room.closed === 'expired'
        ? 'expired'
        : room.status !== 'waiting'
          ? 'full'
          : null;
    if (error) {
      track('online_join_fail', { reason: error });
      return onlineFail(error);
    }
    track('online_invite_open');
    setGameMode('online');
    invite = { code, room };
    wearHostTheme(room.theme);
    seatAsGuest(room);
    if (!namesIn[1].value.trim()) namesIn[1].value = namesIn[0].value.trim();
    renderLobby();
    showStep('players');
  }
  function wearHostTheme(id) {
    if (!id || (id === theme && themeSource === 'host')) return;
    ownTheme ??= { id: theme, source: themeSource };
    applyTheme(id, false, 'host');
  }
  function restoreOwnTheme() {
    if (!ownTheme) return;
    const { id, source } = ownTheme;
    ownTheme = null;
    applyTheme(id, false, source);
  }
  // The guest's own card is the second one; the host's avatar is taken.
  function seatAsGuest(room) {
    avatars[0] = room.seats[0].avatar;
    if (avatars[1] === avatars[0]) avatars[1] = firstFreeAvatar(avatars[0]);
    previews[1].textContent = avatars[1];
    syncAvatars();
  }

  // Counted by the server (invite funnel, docs/ONLINE.md) and in GA if allowed.
  function inviteSent(channel) {
    track('online_invite', { channel });
    if (online) Online.send({ action: 'invite', code: online.code, token: online.token, channel });
  }
  q('onlineWhatsapp').addEventListener('click', () => inviteSent('whatsapp'));
  q('onlineCopy').addEventListener('click', async () => {
    inviteSent('copy');
    try {
      await navigator.clipboard.writeText(Online.inviteUrl(online.code, 'copy'));
      toast(t('online.copied_waiting'));
    } catch {
      toast(Online.inviteUrl(online.code, 'copy'));
    }
  });
  q('onlineCancel').addEventListener('click', () => onlineDialog.close());
  // Without connection, the machine still plays (the game works offline).
  q('onlineMachine').addEventListener('click', () => {
    onlineDialog.close();
    q('modeSolo').click();
    showStep('players');
  });
  q('onlineToggle').addEventListener('click', () => q('onlineIntro').showModal());
  q('storyOpen').addEventListener('click', () => {
    q('storyDialog').showModal();
    track('story', { action: 'open' });
  });
  q('storyRepo').addEventListener('click', () => track('story', { action: 'repo' }));
  q('storyDialog').addEventListener('click', (e) => {
    if (e.target.closest('a[href$="CHANGELOG.md"]')) track('story', { action: 'changelog' });
    else if (e.target.closest('a[href*="wikipedia.org"]')) track('story', { action: 'wikipedia' });
  });
  q('onlineIntroClose').addEventListener('click', () => q('onlineIntro').close());
  q('onlineIntroGo').addEventListener('click', () => {
    q('onlineIntro').close();
    setGameMode('online');
    showStep('players');
  });

  // A saved seat resumes the room or the game after a reload; an invite link joins.
  async function bootOnline() {
    const code = Online.codeFromUrl();
    const saved = Online.loadSeat();
    if (saved && (!code || code === saved.code)) {
      const v = await Online.fetchRoom(saved.code);
      if (v.ok && v.status !== 'closed' && !(v.status === 'over' && v.seats[saved.seat]?.left)) {
        connect({ ...saved, ...v, token: saved.token }, saved.seat);
        online.status = v.status;
        online.quality.reconnects++;
        if (v.match) startOnlineGame(v);
        else {
          setGameMode('online');
          if (saved.seat === 1) seatAsGuest(v);
          renderLobby();
          showStep(v.status === 'lobby' ? 'board' : 'players');
          schedulePoll();
        }
        return;
      }
      Online.clearSeat();
      if (v.closed === 'expired' && !code) return roomExpired(saved.seat);
    }
    if (code) offerJoin(code);
  }
  bootOnline();

  // A challenge link (challenge.js): onboarding.js sets the game up; here go its theme, note and result.
  const challenge = parseChallenge(location.search);
  const challenged = () =>
    !!challenge && gameMode === 'solo' && size === challenge.size && difficulty === challenge.difficulty;
  if (challenge) {
    if (challenge.theme) applyTheme(challenge.theme, false, 'challenge');
    const level = t(`summary.${challenge.difficulty}`);
    q('challengeNote').textContent =
      challenge.mine > challenge.theirs
        ? t('challenge.note', { size: challenge.size, level, target: challengeTarget(challenge) })
        : t('challenge.note_win', { size: challenge.size, level });
    track('challenge_open', {
      board_size: `${challenge.size}x${challenge.size}`,
      difficulty: challenge.difficulty,
    });
  }
  // Reto del día (daily.js): /reto opens today's; onboarding.js sets the game up. It is a game against
  // the machine on its board and level, with its letters already placed and the machine's luck fixed.
  const daily = Daily.isDailyPath(location.pathname) ? Daily.dailyChallenge() : null;
  let dailyRng = null;
  const dailyOn = () =>
    !!daily && gameMode === 'solo' && size === daily.size && difficulty === daily.difficulty;
  const dailyParams = () => ({ daily_number: daily.number });
  if (daily) {
    const done = Daily.readDaily().results[daily.key];
    const level = t(`summary.${daily.difficulty}`);
    q('challengeNote').textContent = done
      ? t('daily.note_done', { number: daily.number, mine: done.mine, theirs: done.theirs })
      : t('daily.note', { number: daily.number, size: daily.size, level, letters: daily.preset.length });
  }
  const target = challenge ?? daily;
  const syncChallengeNote = () =>
    q('challengeNote').classList.toggle(
      'hidden',
      !target ||
        setup.dataset.step === 'daily' ||
        gameMode !== 'solo' ||
        +q('sizeSelect').value !== target.size ||
        difficulty !== target.difficulty,
    );
  document.addEventListener('oso:step', syncChallengeNote);
  q('sizeSelect').addEventListener('change', syncChallengeNote);
  ['modeTwo', 'modeSolo', 'modeFour', 'difficultyEasy', 'difficultyHard', 'difficultyExtreme'].forEach((id) =>
    q(id).addEventListener('click', syncChallengeNote),
  );
  syncChallengeNote();
  function showDaily(w) {
    const { state, first } = Daily.recordDaily(Daily.readDaily(), daily.key, {
      mine: scores[0],
      theirs: scores[1],
      won: w === 0,
    });
    if (first) Daily.saveDaily(state);
    const streak = Daily.currentStreak(state, daily.key);
    const n = { number: daily.number };
    const text = !first
      ? t('daily.again', n)
      : w === 0
        ? t('daily.won', n)
        : w === 1
          ? t('daily.lost', n)
          : t('daily.draw', n);
    q('challengeResult').textContent =
      text + (streak > 1 ? ` · ${t('daily.streak', { count: streak })}` : '');
    track('daily_end', {
      ...modeParams(),
      ...dailyParams(),
      daily_first: first,
      daily_streak: streak,
      daily_result: w === 0 ? 'won' : w === 1 ? 'lost' : 'draw',
    });
  }
  function showChallenge(w) {
    const on = challenged();
    q('challengeResult').classList.toggle('hidden', !on && !dailyOn());
    if (dailyOn()) return showDaily(w);
    if (!on) return;
    const { beaten, missing } = challengeOutcome(challenge, scores);
    const diff = scores[0] - scores[1];
    q('challengeResult').textContent = beaten
      ? t('challenge.beaten')
      : diff > 0
        ? t('challenge.short', { target: challengeTarget(challenge), diff })
        : t('challenge.lost');
    track('challenge_end', { ...modeParams(), beaten, missing });
  }

  q('startGame').addEventListener('click', () => {
    if (gameMode === 'online') return void startOnline();
    startLocalGame();
  });
  function startLocalGame() {
    names = namesIn.map((input, i) => input.value.trim() || t('player.n', { n: i + 1 }));
    if (gameMode === 'solo') names[1] = t('machineBadge');

    if (gameMode === 'solo') avatars[1] = '🤖';

    size = +q('sizeSelect').value;

    namesEl.forEach((e, i) => (e.textContent = names[i]));
    avatarsEl.forEach((e, i) => (e.textContent = avatars[i]));
    avatarsEl[1].classList.toggle('robot', gameMode === 'solo');
    avatarsEl[1].dataset.mood = difficulty;
    q('machineBadge').classList.toggle('hidden', gameMode !== 'solo');

    setup.classList.add('hidden');
    game.classList.remove('hidden');
    reset();
  }

  const sidebar = q('sidebar'),
    menuScrim = q('menuScrim'),
    menuBtns = byPlayer('menu');
  let menuOpener = null;
  const panelAngle = (panel) => {
    const t = getComputedStyle(panel).transform;
    if (!t || t === 'none') return 0;
    const m = new DOMMatrixReadOnly(t);
    return Math.round(Math.atan2(m.b, m.a) / (Math.PI / 2)) * 90;
  };
  function openMenu(btn) {
    menuOpener = btn;
    sidebar.style.setProperty('--menu-rot', `${panelAngle(btn.closest('.player-panel'))}deg`);
    sidebar.classList.add('open');
    menuScrim.classList.add('open');
    menuBtns.forEach((b) => b.setAttribute('aria-expanded', String(b === btn)));
    requestAnimationFrame(() => q('gameHelp').focus());
  }
  function closeMenu(restoreFocus = true) {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    menuScrim.classList.remove('open');
    menuBtns.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (restoreFocus) menuOpener?.focus();
    menuOpener = null;
  }
  menuBtns.forEach((b) => b.addEventListener('click', () => openMenu(b)));
  menuScrim.addEventListener('click', () => closeMenu());
  q('closeMenu').addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (e.key === 'Escape') closeMenu();
    if (e.key !== 'Tab') return;
    const items = [...sidebar.querySelectorAll('button, a[href]')];
    const i = items.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
    e.preventDefault();
    items[next].focus();
  });

  q('restartMatch').addEventListener('click', () => {
    closeMenu(false);
    reset();
  });

  q('newGame').addEventListener('click', () => {
    abandon();
    leaveOnline();
    dropParked();
    stopGame();
    over = true;
    closeMenu(false);
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  });

  q('rematch').addEventListener('click', () => {
    endAction('rematch');
    if (online) onlineRematch();
    else reset();
  });

  function backToSetup() {
    abandon();
    leaveOnline();
    dropParked();
    stopGame();
    q('winnerOverlay').classList.add('hidden');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  }
  q('otherBoard').addEventListener('click', () => {
    endAction('other_board');
    backToSetup();
  });
  q('changePlayers').addEventListener('click', () => {
    endAction(online ? 'leave' : 'change_players');
    backToSetup();
  });
  q('endDetails')
    .querySelector('summary')
    .addEventListener('click', () => {
      if (!q('endDetails').open) endAction('details');
    });
  q('winnerHome').addEventListener('click', () => {
    endAction('home');
    backToSetup();
    showStep('mode');
    syncThemeToggle();
  });
})();
