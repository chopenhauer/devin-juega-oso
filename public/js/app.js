import * as Engine from './engine.js';
import * as Match from './match.js';
import { sessionKey, recordGame, standings } from './leaderboard.js';
import { THEMES, themeOf, themeTokens, mapAvatars, festivalOn, themeMenuFor, isoDay } from './themes.js';
import { VERSION } from './version.js';
import { play, isMuted, setMuted } from './sound.js';
import { track, gameParams, gameEndParams, nextFeedback, answerFeedback } from './telemetry.js';
import { shareText, shareUrl, whatsappHref, emailHref } from './share.js';
import * as Online from './online.js';
const { timeFor } = Engine;
(() => {
  const { BONUS } = Match;
  const MACHINE_DELAY = 650;
  const q = (id) => document.getElementById(id);
  q('appVersion').textContent = `v${VERSION}`;

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
    names = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'],
    size = 5,
    board = [],
    current = 0,
    scores = [0, 0],
    times = [120, 120],
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
    replaying = false,
    gameId = 0,
    helpPaused = false,
    playing = false;

  // The match (match.js) owns the game state; these locals mirror it for the UI.
  let m = null;
  // Online 1 vs 1: { code, token, seat, rev, game, seats, quality, busy, offline } or null.
  let online = null;
  function sync() {
    ({ board, current, scores, times, scored, history, extras, over, word: targetWord, sosUsed } = m);
  }

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
    return `${b.title}${left ? `, quedan ${left}` : ''}${b.classList.contains('used') ? ' (ya usado)' : ''}`;
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
        b.title = taken ? 'Ya lo ha elegido otro jugador' : '';
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
  let allThemes = false;
  let lowWarned = new Set();
  const themeTaps = [];
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
  function renderDecor(list) {
    q('themeDecor').replaceChildren(
      ...Array.from({ length: list.length ? 16 : 0 }, (_, i) => {
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
  function applyTheme(id, save = true) {
    const next = THEMES[id] ? id : 'classic';
    avatars = mapAvatars(avatars, themeOf(theme), themeOf(next));
    theme = next;
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
    renderDecor(t.decor);
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
      more.textContent = 'Ver otros temas';
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
    if (!open) {
      themeTaps.length = 0;
      return;
    }
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
    soundMenu.textContent = m ? '🔇 Sonido: silenciado' : '🔊 Sonido: activado';
  }
  [soundToggle, soundMenu].forEach((b) =>
    b.addEventListener('click', () => {
      setMuted(!isMuted());
      syncSound();
    }),
  );
  syncSound();
  // The 🎨 and 🔊 buttons live on the intro screens, up to choosing the number of players.
  const THEME_STEPS = ['welcome', 'rules', 'mode'];
  const syncThemeToggle = () => {
    const show = THEME_STEPS.includes(setup.dataset.step);
    if (!show) toggleThemeMenu(false);
    themeToggle.classList.toggle('hidden', !show);
    soundToggle.classList.toggle('hidden', !show);
    shareToggle.classList.toggle('hidden', !show);
    q('onlineToggle').classList.toggle('hidden', !show);
  };
  new MutationObserver(syncThemeToggle).observe(setup, {
    attributes: true,
    attributeFilter: ['data-step'],
  });
  syncThemeToggle();
  // Easter egg: more than 5 taps on 🎨 in a row (less than 0.7 s apart) shows every theme until a reload.
  // Quick repeated taps keep the menu as it is instead of opening and closing it.
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
    msg.textContent = '🥚 ¡Tienes más temas disponibles!';
    eggParty.replaceChildren(...drops, msg);
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => eggParty.replaceChildren(), 3600);
    play('egg');
  }
  themeToggle.addEventListener('click', (e) => {
    const now = e.timeStamp;
    const repeat = themeTaps.length > 0 && now - themeTaps[themeTaps.length - 1] < 700;
    if (!repeat) themeTaps.length = 0;
    themeTaps.push(now);
    if (!allThemes && themeTaps.length > 5 && now - themeTaps[0] < 3000) {
      allThemes = true;
      themeTaps.length = 0;
      toggleThemeMenu(true);
      celebrateEgg();
      return;
    }
    if (!repeat) toggleThemeMenu(themeMenu.classList.contains('hidden'));
  });
  themeMenu.addEventListener('click', (e) => {
    const b = e.target.closest('.theme-option');
    if (!b) return;
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
    let saved = 'classic',
      choseToday = false;
    try {
      saved = localStorage.getItem(THEME_KEY) ?? 'classic';
      choseToday = localStorage.getItem(THEME_DAY_KEY) === isoDay(today);
    } catch {
      /* ignore */
    }
    applyTheme((!choseToday && festivalOn(today)) || saved, false);
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
    [...sizeSelect.options].forEach((o) => (o.disabled = mode === 'four' && +o.value < 6));
    if (mode === 'four' && +sizeSelect.value < 6) sizeSelect.value = '6';
    if (mode === 'four') dedupeAvatars();
    const p2Config = namesIn[1].closest('.pconfig');
    const p2Avatars = p2Config.querySelector('.avatars');
    p2Config.querySelector('.small-label').textContent = mode === 'solo' ? 'Máquina' : 'Jugador 2';
    previews[1].classList.toggle('robot', mode === 'solo');

    if (mode === 'solo') {
      namesIn[1].value = 'Máquina';
      namesIn[1].disabled = true;
      p2Avatars.style.opacity = '.35';
      p2Avatars.style.pointerEvents = 'none';
      avatars[1] = '🤖';
      previews[1].textContent = '🤖';
    } else {
      if (namesIn[1].value === 'Máquina') namesIn[1].value = '';
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
  const roomForFour = matchMedia('(min-width: 700px) and (min-height: 600px)');
  function syncFourAvailability() {
    const ok = roomForFour.matches;
    if (ok) q('modeFour').removeAttribute('data-locked');
    else q('modeFour').setAttribute('data-locked', 'true');
    q('modeFour').classList.toggle('soon', !ok);
    if (!ok && gameMode === 'four' && game.classList.contains('hidden')) q('modeTwo').click();
  }
  roomForFour.addEventListener('change', syncFourAvailability);
  syncFourAvailability();
  // The robot looks grumpier or furious depending on the difficulty.
  function setDifficulty(level) {
    difficulty = level;
    press(q('difficultyEasy'), level === 'easy');
    press(q('difficultyHard'), level === 'hard');
    previews[1].dataset.mood = level;
  }
  q('difficultyEasy').addEventListener('click', () => setDifficulty('easy'));
  q('difficultyHard').addEventListener('click', () => setDifficulty('hard'));
  setDifficulty(difficulty);
  function openHelp() {
    closeMenu(false);
    q('helpModal').classList.remove('hidden');
    if (game.classList.contains('hidden') || over || replaying || helpPaused) return;
    if (settle()) return;
    helpPaused = true;
    Match.pause(m, performance.now());
    clearInterval(timer);
    clearTimeout(machineTimeout);
    machineThinking = false;
    updateControls();
  }
  function closeHelp() {
    q('helpModal').classList.add('hidden');
    if (!helpPaused) return;
    helpPaused = false;
    Match.resume(m, performance.now());
    timer = setInterval(tick, 100);
    updateControls();
    maybeMachineTurn();
  }
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
      helpPaused ||
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
    msg.textContent = `${avatars[p]} ${names[p]} jugará ${selected[p]}.`;
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

  function fmt(v) {
    v = Math.max(0, Math.ceil(v));
    return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
  }
  function updateTimers() {
    timers.forEach((e, i) => {
      e.textContent = fmt(times[i]);
      e.classList.toggle('low', times[i] <= 20 && !over);
      if (times[i] <= 20 && times[i] > 0 && !over && !replaying && !lowWarned.has(i)) {
        lowWarned.add(i);
        play('low');
      }
    });
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

      hintBtns[i].disabled = !humanCanAct || hintUsed;
      hintBtns[i].classList.toggle('used', hintUsed);

      const hasOpponentMove = history.some((m) => m.player !== i);
      lastBtns[i].disabled = !humanCanAct || lastUsed || !hasOpponentMove;
      lastBtns[i].classList.toggle('used', lastUsed);

      const hasPlacedLetters = board.some(Boolean);
      swapBtns[i].disabled = !humanCanAct || swapUsed || !hasPlacedLetters;
      swapBtns[i].classList.toggle('used', swapUsed);
      swapBtns[i].classList.toggle('mode', swapMode === i && !swapUsed);

      // SOS is global: once either player uses it, both buttons become consumed.
      sosBtns[i].disabled = !humanCanAct || sosUsed;
      sosBtns[i].classList.toggle('used', sosUsed);
      [hintBtns[i], lastBtns[i], swapBtns[i], sosBtns[i]].forEach((b) =>
        b.setAttribute('aria-label', extraLabel(b)),
      );

      [
        [hintBtns[i], hintUsed],
        [lastBtns[i], lastUsed],
        [swapBtns[i], swapUsed],
        [sosBtns[i], sosUsed],
      ].forEach(([btn, used]) => {
        btn.querySelector('.count').textContent = used ? '0' : '1';
      });
    });
    document
      .querySelectorAll('.score-label')
      .forEach((e) => (e.textContent = targetWord === 'SOS' ? 'puntos SOS' : 'puntos OSO'));
    game.classList.toggle('solo', gameMode === 'solo');
    game.classList.toggle('four', gameMode === 'four');
    game.classList.toggle('online', !!online);

    turnBarTop.textContent = over
      ? 'Partida terminada'
      : helpPaused
        ? '⏸ Pausa: ayuda abierta'
        : replaying
          ? '🛟 Recalculando SOS…'
          : machineThinking
            ? '🤖 La máquina está pensando…'
            : remote(current)
              ? `${avatars[current]} Esperando a ${names[current]} · ${targetWord}`
              : `${avatars[current]} Turno de ${names[current]} · ${targetWord}`;
  }

  function stopGame() {
    gameId++;
    clearInterval(timer);
    clearTimeout(machineTimeout);
    machineThinking = false;
    replaying = false;
    helpPaused = false;
    q('modeFlash').classList.add('hidden');
  }
  // OSO→SOS switches the whole page to a calmer sea theme until the game ends.
  function setSeaTheme(on) {
    game.closest('.panel').classList.toggle('sos-mode', on);
    document.body.classList.toggle('sea-theme', on);
  }

  const filledCells = () => board.filter(Boolean).length;
  const modeParams = () => gameParams({ size, mode: gameMode, difficulty });
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
    m = Match.newMatch({ size, players: playerCount(), now: performance.now() });
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
    timer = setInterval(tick, 100);
    playing = true;
    track('game_start', modeParams());
  }
  // Charges the active player for the time elapsed since the last settlement.
  // Returns true if that player ran out of time (the game is then finished).
  function settle() {
    if (over) return true;
    if (online) return false;
    if (replaying || helpPaused) return false;
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
    msg.textContent = `⏱️ ${names[p]} se queda sin tiempo. Turno de ${avatars[current]} ${names[current]}`;
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
        `Fila ${Math.floor(i / size) + 1}, columna ${(i % size) + 1}: ${v || 'vacía'}`,
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
    if (over || replaying || helpPaused) return;
    const machineTurn = gameMode === 'solo' && current === 1;
    if (machineTurn !== byMachine || (machineThinking && !byMachine)) return;
    if (swapMode !== current && board[i]) return;
    if (settle()) return;

    if (swapMode === current) {
      if (!board[i]) {
        msg.textContent = '🔄 Elige una casilla ocupada.';
        return;
      }

      const p = current;
      const r = Match.swap(m, p, i, performance.now());
      sync();
      if (!r.ok) return handleEnd(r.events);
      play('place');
      justPlaced = i;
      swapMode = null;
      scoresEl.forEach((e, k) => (e.textContent = scores[k]));
      hintCell = null;
      lastCell = null;
      msg.textContent = `🔄 ${names[p]} cambia la letra a ${board[i]}.`;
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
      msg.textContent = `¡${avatars[p]} ${names[p]} consigue ${made.length === 1 ? 'un ' + targetWord : made.length + ' ' + targetWord}! +${BONUS * made.length}s`;
    } else {
      msg.textContent = `Turno de ${avatars[current]} ${names[current]}`;
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
      if (b.disabled || p !== current || !extras[p].hint || over || replaying || settle()) return;

      const h = bestHint();
      if (!h) return;

      if (online) {
        if (!(await onlineMove({ type: 'power', power: 'hint' }))) return;
      } else {
        Match.usePower(m, p, 'hint', performance.now());
        sync();
      }
      play('hint');
      updateControls();
      selected[p] = h.letter;
      hintCell = h.index;
      lastCell = null;
      swapMode = null;
      render();
      updateControls();
      msg.textContent = `💡 Prueba ${h.letter} en la casilla marcada.`;
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
      updateControls();
      lastCell = move.index;
      hintCell = null;
      swapMode = null;
      render();
      updateControls();
      msg.textContent = `👁️ Última jugada rival: ${move.letter}.`;
    }),
  );

  swapBtns.forEach((b, p) =>
    b.addEventListener('click', () => {
      if (b.disabled || p !== current || !extras[p].swap || over || replaying || settle()) return;

      swapMode = swapMode === p ? null : p;
      if (swapMode === p) play('swap');
      hintCell = null;
      lastCell = null;
      render();
      updateControls();
      msg.textContent =
        swapMode === p ? '🔄 Elige una letra del tablero para cambiar O ↔ S.' : 'Cambio cancelado.';
    }),
  );

  function chooseMachineMove() {
    return Engine.chooseMachineMove(board, size, scored, targetWord, difficulty);
  }

  function maybeMachineTurn() {
    if (gameMode !== 'solo' || current !== 1 || over || replaying || helpPaused) return;

    clearTimeout(machineTimeout);
    machineThinking = true;
    updateControls();
    const id = gameId;

    machineTimeout = setTimeout(() => {
      machineThinking = false;
      if (id !== gameId || over || replaying || helpPaused || current !== 1 || gameMode !== 'solo') {
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

  async function activateSOS(player) {
    if (over || sosUsed || replaying || helpPaused || player !== current) return;
    if (settle()) return;
    const id = gameId;

    // Global, one-time power-up: consume it for both players immediately.
    const { replay: savedHistory } = Match.sos(m, player, performance.now()).events[0];
    sosUsed = true;
    replaying = true;
    play('sos');
    sosBtns.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add('used');
    });
    updateControls();
    clearTimeout(machineTimeout);
    clearInterval(timer);
    machineThinking = false;
    swapMode = null;
    hintCell = null;
    lastCell = null;

    setSeaTheme(true);
    q('modeFlash').classList.remove('hidden');
    updateControls();
    await sleep(900);
    if (id !== gameId) return;
    q('modeFlash').classList.add('hidden');

    targetWord = 'SOS';
    board = Array(size * size).fill('');
    scores = Array(scores.length).fill(0);
    scored = new Map();
    scoresEl.forEach((e) => (e.textContent = '0'));
    render();
    msg.textContent = '🛟 Reproduciendo la partida con criterio SOS…';
    await sleep(220);
    if (id !== gameId) return;

    for (const move of savedHistory) {
      ({ board, scored, scores } = Engine.replayMove({ size, board, scored, scores }, move, 'SOS'));
      scoresEl.forEach((e, i) => (e.textContent = scores[i]));

      render();
      const cell = boardEl.children[move.index];
      if (cell) cell.classList.add('replay-mark');
      msg.textContent = `${avatars[move.player]} ${names[move.player]} → ${board[move.index] || move.letter}`;
      await sleep(260);
      if (id !== gameId) return;
    }

    sync();
    updateTimers();
    replaying = false;
    render();
    updateControls();
    msg.textContent = `🛟 Ahora se puntúa SOS. Marcador recalculado: ${scores.join(' – ')}.`;

    Match.resume(m, performance.now());
    timer = setInterval(tick, 100);
    if (gameMode === 'solo' && current === 1) maybeMachineTurn();
  }

  sosBtns.forEach((btn, p) =>
    btn.addEventListener('click', () => {
      if (btn.disabled || sosUsed || over || replaying || p !== current) return;
      if (online) return void onlineMove({ type: 'sos' });
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
    over = true;
    playing = false;
    track(
      'game_end',
      gameEndParams({
        size,
        mode: gameMode,
        difficulty,
        reason: timedOut ? 'tiempo' : reason,
        winner: w,
        scores,
        available: timeFor(size),
        times,
        filled: filledCells(),
      }),
    );
    if (online)
      track('online_quality', { board_size: `${size}x${size}`, ...Online.qualityParams(online.quality) });
    clearInterval(timer);
    updateControls();
    q('winnerOverlay').classList.remove('hidden');
    q('rematch').disabled = false;
    q('otherBoard').classList.toggle('hidden', !!online);
    q('changePlayers').textContent = online ? 'Salir' : 'Cambiar jugadores';
    q('rematch').focus({ preventScroll: true });

    const result = scores.join(' – ');
    const timeout =
      gameMode === 'four' ? `${names[current]} se quedó sin tiempo` : 'El rival se quedó sin tiempo';
    if (Array.isArray(w)) {
      q('winnerAvatar').textContent = w.map((i) => avatars[i]).join('');
      q('winnerTitle').textContent = `¡Ganan ${joinNames(w.map((i) => names[i]))}!`;
      q('winnerSub').textContent = `${reason === 'tiempo' ? timeout : 'Victoria compartida'} · ${result}`;
      confetti();
    } else if (w === null) {
      q('winnerAvatar').textContent = '🤝';
      q('winnerTitle').textContent = '¡Empate!';
      q('winnerSub').textContent = `${scores.join(' – ')}`;
    } else {
      q('winnerAvatar').textContent = avatars[w];
      q('winnerTitle').textContent = `¡Gana ${names[w]}!`;
      q('winnerSub').textContent =
        reason === 'tiempo' ? `${timeout} · ${result}` : `Resultado final: ${scores.join(' – ')}`;
      confetti();
    }
    if (reason === 'abandono') q('winnerSub').textContent = `${names[1 - w]} ha salido de la partida`;
    play(w === null ? 'draw' : (gameMode === 'solo' && w === 1) || remote(w) ? 'lose' : 'win');
    lastResult = { mode: gameMode, winner: w, scores: [...scores] };
    const st = recordSession(w);
    showSession(st);
    showFeedback(nextFeedback({ mode: gameMode, winner: w, sessionGames: st.games }));
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

  // Word of mouth: the phone's own share sheet when there is one, otherwise WhatsApp, email or copy.
  let lastResult = null,
    sharePlace = null;
  async function share(place) {
    const text = shareText(place === 'end' ? lastResult : null);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'OSO · el juego de Julia', text, url: shareUrl('native') });
        track('share', { channel: 'native', place });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    sharePlace = place;
    q('shareMessage').textContent = text;
    q('shareWhatsapp').href = whatsappHref(text);
    q('shareEmail').href = emailHref(text);
    q('shareStatus').textContent = '';
    q('shareDialog').showModal();
  }
  q('shareWhatsapp').addEventListener('click', () =>
    track('share', { channel: 'whatsapp', place: sharePlace }),
  );
  q('shareEmail').addEventListener('click', () => track('share', { channel: 'email', place: sharePlace }));
  q('shareCopy').addEventListener('click', async () => {
    const url = shareUrl('copy');
    try {
      await navigator.clipboard.writeText(url);
      q('shareStatus').textContent = '✅ ¡Enlace copiado!';
      track('share', { channel: 'copy', place: sharePlace });
    } catch {
      q('shareStatus').textContent = `Copia este enlace: ${url}`;
    }
  });
  shareToggle.addEventListener('click', () => share('start'));
  q('shareResult').addEventListener('click', () => share('end'));
  q('shareMenu').addEventListener('click', () => {
    closeMenu();
    share('menu');
  });

  const SESSION_KEY = 'oso.session.v1';
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
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    return standings(session);
  }
  function showSession(st) {
    // Against the machine it shows from the first game; between people, from the second one.
    const hidden = st.games < (gameMode === 'solo' ? 1 : 2);
    q('sessionBoard').classList.toggle('hidden', hidden);
    if (hidden) return;
    const order = st.wins
      .map((_, i) => i)
      .sort((a, b) => st.wins[b] - st.wins[a] || st.points[b] - st.points[a]);
    const leader = st.wins[order[0]] > st.wins[order[1]] ? order[0] : null;
    q('sessionRows').replaceChildren(
      ...order.map((p) => {
        const row = document.createElement('tr');
        row.classList.toggle('leader', p === leader);
        const who = document.createElement('th');
        who.scope = 'row';
        who.textContent = `${p === leader ? '👑 ' : ''}${avatars[p]} ${names[p]}`;
        const wins = document.createElement('td');
        wins.textContent = st.wins[p];
        const points = document.createElement('td');
        points.textContent = st.points[p];
        row.append(who, wins, points);
        return row;
      }),
    );
    const draws = st.draws ? ` · ${st.draws} ${st.draws === 1 ? 'empate' : 'empates'}` : '';
    const games = st.games === 1 ? '1 partida' : `${st.games} partidas seguidas`;
    q('sessionMeta').textContent = `${games}${draws}`;
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
    no_room: 'Esta sala ya no existe. Pide a tu amigo un enlace nuevo.',
    code: 'Ese código no es válido.',
    full: 'Esta sala ya está completa.',
    avatar_taken: 'Ese avatar ya lo tiene tu amigo. Elige otro.',
    rate: 'Demasiados intentos. Espera unos minutos.',
    network: 'No hay conexión. Revisa internet y vuelve a probar.',
  };
  const onlineError = (e) => ONLINE_ERRORS[e] ?? 'Algo ha fallado. Vuelve a probar.';
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
    if (Online.codeFromUrl()) window.history.replaceState(null, '', location.pathname);
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
        msg.textContent = '📡 Conectado de nuevo.';
      }
      if (!v.same) applyView(v);
    } else if (v.http === 404) {
      return roomGone();
    } else if (!o.offline) {
      o.offline = true;
      msg.textContent = '📡 Sin conexión, reintentando…';
    }
    // Poll faster while waiting for the rival; on our own turn only clocks and leaving can change.
    const waiting = over || remote(current) || !setup.classList.contains('hidden');
    schedulePoll(waiting ? Online.POLL_MS : Online.POLL_MS * 2);
  }
  function roomGone() {
    clearTimeout(pollTimeout);
    Online.clearSeat();
    online = null;
    if (game.classList.contains('hidden')) {
      renderLobby();
      onlineFail('no_room');
    } else msg.textContent = '⌛ La sala ha caducado.';
  }

  // Shows the server state: board, scores, clocks, names and the end of the game.
  function applyView(v) {
    const o = online;
    o.rev = v.rev;
    o.seats = v.seats;
    o.status = v.status;
    if (v.status === 'closed') return roomGone();
    if (!v.match) return renderLobby();
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
      msg.textContent = `🤔 ${rivalSeat.name} sigue ahí, está pensando.`;
    o.rivalHere = rivalSeat?.here ?? 0;
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
    if (targetWord !== oldWord) {
      play('sos');
      setSeaTheme(true);
      msg.textContent = `🛟 Ahora se puntúa SOS. Marcador recalculado: ${scores.join(' – ')}.`;
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
        msg.textContent = made.length
          ? `¡${avatars[current]} ${names[current]} consigue ${made.length === 1 ? 'un ' + targetWord : made.length + ' ' + targetWord}! +${BONUS * made.length}s`
          : remote(current)
            ? `Turno de ${avatars[current]} ${names[current]}`
            : `${avatars[current]} ¡Te toca, ${names[current]}!`;
      }
    }
    scoresEl.forEach((e, k) => (e.textContent = scores[k] ?? 0));
    render();
    updateTimers();
    updateControls();
    if (over && !wasOver) finish(m.winner, m.reason, m.timedOut);
    if (over) showRematchState(v);
  }

  function showRematchState(v) {
    const mine = v.seats[online.seat],
      theirs = v.seats[1 - online.seat];
    const rival = theirs?.name ?? 'tu amigo';
    q('rematch').disabled = !!mine?.rematch || !!theirs?.left;
    if (theirs?.left) q('winnerSub').textContent = `${rival} ha salido de la sala`;
    else if (mine?.rematch) q('winnerSub').textContent = `Esperando a que ${rival} acepte la revancha…`;
    else if (theirs?.rematch) q('winnerSub').textContent = `${rival} quiere la revancha`;
  }

  function startOnlineGame(v) {
    stopGame();
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
    setup.classList.add('hidden');
    game.classList.remove('hidden');
    game.classList.add('same-view');
    applyView(v);
    online.goAt = 0;
    if (!over && !v.match.history.length && v.match.holdMs > 0) countdown(v.match.holdMs);
    if (!over) {
      msg.textContent = remote(current)
        ? `Empieza ${avatars[current]} ${names[current]}.`
        : `${avatars[current]} ¡Empiezas tú, ${names[current]}!`;
      playing = true;
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
    else msg.textContent = '📡 No se ha podido enviar. Vuelve a probar.';
    return r.ok;
  }

  function onlineCell(i) {
    if (over || remote(current) || online.busy || performance.now() < online.goAt) return;
    if (swapMode === current) {
      if (!board[i]) msg.textContent = '🔄 Elige una casilla ocupada.';
      else onlineMove({ type: 'swap', index: i });
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
    if (!online) return renderLobby();
    closeNudge(false);
    const { code, token } = online;
    Online.send({ action: 'leave', code, token });
    clearTimeout(pollTimeout);
    Online.clearSeat();
    online = null;
    q('restartMatch').classList.remove('hidden');
    q('otherBoard').classList.remove('hidden');
    game.classList.remove('online');
    renderLobby();
  }

  const showStep = (step) => document.dispatchEvent(new CustomEvent('oso:show', { detail: step }));
  function onlineFail(error) {
    setOnlineStatus(onlineError(error));
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
    cards[1].classList.toggle('inviting', on && host && !ready);
    q('openRoom').classList.toggle('hidden', !!online);
    q('roomShare').classList.toggle('hidden', !online);
    if (online) {
      q('onlineCode').textContent = online.code;
      const url = Online.inviteUrl(online.code);
      q('onlineWhatsapp').href = whatsappHref(`¿Jugamos a OSO? 🐻 Entra en mi sala: ${url}`);
    }
    const rival = seats[1 - me]?.name;
    const seatNews = !on
      ? ''
      : host
        ? online
          ? ready
            ? `✅ ¡${rival} ya está aquí!`
            : '⏳ Esperando a tu amigo…'
          : ''
        : online
          ? '✅ ¡Ya estás dentro!'
          : `${seats[0]?.name ?? 'Tu amigo'} te invita. Pon tu nombre y pulsa →`;
    q('sizeSelect').disabled = on && !host;
    q('startGame').classList.toggle('hidden', on && !host);
    q('startGame').disabled = on && host && online?.status !== 'lobby';
    const boardNews = !on
      ? ''
      : !host
        ? `⏳ ${seats[0]?.name ?? 'Tu amigo'} está eligiendo el tablero…`
        : ready
          ? `✅ ${rival} está listo. ¡Elige el tablero!`
          : online
            ? '⏳ Esperando a tu amigo…'
            : 'Vuelve atrás y abre la sala para invitar a tu amigo.';
    toast(setupStep === 'players' ? seatNews : setupStep === 'board' ? boardNews : '');
  }
  function toast(text) {
    const el = q('onlineToast');
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle('hidden', !text);
  }
  let setupStep = null;
  document.addEventListener('oso:step', (e) => {
    setupStep = e.detail;
    renderLobby();
  });

  // Host: «Abrir sala» creates the room; the invite stays on the players step.
  async function hostRoom() {
    const btn = q('openRoom');
    btn.disabled = true;
    const r = await Online.send({
      action: 'create',
      name: namesIn[0].value.trim() || 'Jugador 1',
      avatar: avatars[0],
    });
    btn.disabled = false;
    if (!r.ok) return onlineFail(r.error);
    connect(r, 0);
    track('online_create');
    renderLobby();
    schedulePoll();
  }
  q('openRoom').addEventListener('click', hostRoom);

  // → on the players step: the guest joins, the host opens the room or updates their card.
  document.addEventListener('oso:online-next', async (e) => {
    e.preventDefault();
    const me = online ? online.seat : invite ? 1 : 0;
    const body = { name: namesIn[me].value.trim() || `Jugador ${me + 1}`, avatar: avatars[me] };
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
    window.history.replaceState(null, '', location.pathname);
    const room = await Online.fetchRoom(code);
    const error = !room.ok ? room.error : room.status !== 'waiting' ? 'full' : null;
    if (error) {
      track('online_join_fail', { reason: error });
      return onlineFail(error);
    }
    setGameMode('online');
    invite = { code, room };
    seatAsGuest(room);
    if (!namesIn[1].value.trim()) namesIn[1].value = namesIn[0].value.trim();
    renderLobby();
    showStep('players');
  }
  // The guest's own card is the second one; the host's avatar is taken.
  function seatAsGuest(room) {
    avatars[0] = room.seats[0].avatar;
    if (avatars[1] === avatars[0]) avatars[1] = firstFreeAvatar(avatars[0]);
    previews[1].textContent = avatars[1];
    syncAvatars();
  }

  q('onlineCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(Online.inviteUrl(online.code));
      toast('🔗 Enlace copiado. ⏳ Esperando a tu amigo…');
    } catch {
      toast(Online.inviteUrl(online.code));
    }
  });
  q('onlineCancel').addEventListener('click', () => onlineDialog.close());
  q('onlineToggle').addEventListener('click', () => q('onlineIntro').showModal());
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
    }
    if (code) offerJoin(code);
  }
  bootOnline();

  q('startGame').addEventListener('click', () => {
    if (gameMode === 'online') return void startOnline();
    names = namesIn.map((input, i) => input.value.trim() || `Jugador ${i + 1}`);
    if (gameMode === 'solo') names[1] = 'Máquina';

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
  });

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
    stopGame();
    over = true;
    closeMenu(false);
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  });

  q('rematch').addEventListener('click', () => (online ? onlineRematch() : reset()));

  function backToSetup() {
    abandon();
    leaveOnline();
    stopGame();
    q('winnerOverlay').classList.add('hidden');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  }
  q('otherBoard').addEventListener('click', backToSetup);
  q('changePlayers').addEventListener('click', backToSetup);
})();
