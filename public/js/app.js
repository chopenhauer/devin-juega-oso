import * as Engine from './engine.js';
import { sessionKey, recordGame, standings } from './leaderboard.js';
import { THEMES, themeOf, mapAvatars } from './themes.js';
const { timeFor } = Engine;
(() => {
  const BONUS = 10;
  const MACHINE_DELAY = 650;
  const q = (id) => document.getElementById(id);

  const setup = q('setupScreen'),
    game = q('gameScreen'),
    boardEl = q('board'),
    msg = q('message'),
    turnBarTop = q('turnBarTop');
  const namesIn = [q('nickname1'), q('nickname2')],
    previews = [q('preview1'), q('preview2')];
  const namesEl = [q('name1'), q('name2')],
    avatarsEl = [q('avatar1'), q('avatar2')];
  const timers = [q('timer1'), q('timer2')],
    scoresEl = [q('score1'), q('score2')],
    sides = [q('side1'), q('side2')];
  const hintBtns = [q('hint1'), q('hint2')],
    lastBtns = [q('last1'), q('last2')],
    swapBtns = [q('swap1'), q('swap2')],
    sosBtns = [q('sos1'), q('sos2')];

  let avatars = ['🐻', '🐼'],
    names = ['Jugador 1', 'Jugador 2'],
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
    lastTick = 0,
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
    helpPaused = false;

  const avatarGrids = [...document.querySelectorAll('.avatars')];
  let avatarChoices = [...avatarGrids[0].querySelectorAll('.avatar-btn')].map((b) => b.dataset.avatar);
  const press = (el, on) => {
    el.classList.toggle('selected', on);
    el.setAttribute('aria-pressed', String(on));
  };
  const extraLabel = (b) => {
    const left = b.querySelector('.count')?.textContent;
    return `${b.title}${left ? `, quedan ${left}` : ''}${b.classList.contains('used') ? ' (ya usado)' : ''}`;
  };
  const firstFreeAvatar = (taken) => avatarChoices.find((a) => a !== taken);

  // Each player must have a different avatar: the other player's pick is disabled.
  function syncAvatars() {
    avatarGrids.forEach((grid) => {
      const p = +grid.dataset.player;
      grid.querySelectorAll('.avatar-btn').forEach((b) => {
        const taken = b.dataset.avatar === avatars[1 - p];
        b.classList.toggle('selected', b.dataset.avatar === avatars[p]);
        b.setAttribute('aria-pressed', String(b.dataset.avatar === avatars[p]));
        b.disabled = taken;
        b.title = taken ? 'Ya lo ha elegido el otro jugador' : '';
      });
      previews[p].textContent = avatars[p];
    });
  }

  avatarGrids.forEach((grid) => {
    const p = +grid.dataset.player;
    grid.querySelectorAll('.avatar-btn').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.avatar === avatars[1 - p]) return;
        avatars[p] = b.dataset.avatar;
        syncAvatars();
      }),
    );
  });

  // Restores saved avatars (dispatched by onboarding.js) without a temporary clash.
  document.addEventListener('oso:avatars', (e) => {
    const [first, second] = e.detail;
    if (avatarChoices.includes(first)) avatars[0] = first;
    if (avatarChoices.includes(second)) avatars[1] = second;
    if (avatars[1] === avatars[0]) avatars[1] = firstFreeAvatar(avatars[0]);
    syncAvatars();
  });
  syncAvatars();

  // THEMES: chosen from the 🎨 button on the setup screens and remembered.
  const THEME_KEY = 'oso.theme.v1';
  const themeToggle = q('themeToggle'),
    themeMenu = q('themeMenu'),
    themeOptions = [...themeMenu.querySelectorAll('.theme-option')];
  let theme = 'classic';
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
    q('brandIcon').textContent = t.icon;
    renderDecor(t.decor);
    themeOptions.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
    syncAvatars();
    if (!save) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }
  const THEME_HINT_KEY = 'oso.themeHint.v1';
  function toggleThemeMenu(open) {
    themeMenu.classList.toggle('hidden', !open);
    themeToggle.setAttribute('aria-expanded', String(open));
    if (!open) return;
    themeOptions.find((b) => b.dataset.theme === theme)?.focus();
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
  // The 🎨 button only lives on the first setup screen of each visit.
  setTimeout(() => {
    const firstStep = setup.dataset.step;
    const observer = new MutationObserver(() => {
      if (setup.dataset.step === firstStep) return;
      toggleThemeMenu(false);
      themeToggle.classList.add('hidden');
      observer.disconnect();
    });
    observer.observe(setup, { attributes: true, attributeFilter: ['data-step'] });
  });
  themeToggle.addEventListener('click', () => toggleThemeMenu(themeMenu.classList.contains('hidden')));
  themeOptions.forEach((b) =>
    b.addEventListener('click', () => {
      applyTheme(b.dataset.theme);
      toggleThemeMenu(false);
      themeToggle.focus();
    }),
  );
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
  try {
    applyTheme(localStorage.getItem(THEME_KEY) ?? 'classic', false);
  } catch {
    applyTheme('classic', false);
  }

  function setGameMode(mode) {
    gameMode = mode;
    press(q('modeTwo'), mode === 'two');
    press(q('modeSolo'), mode === 'solo');
    q('difficultyWrap').classList.toggle('hidden', mode !== 'solo');

    const p2Config = namesIn[1].closest('.pconfig');
    const p2Avatars = p2Config.querySelector('.avatars');

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
  q('modeTwo').addEventListener('click', () => setGameMode('two'));
  q('modeSolo').addEventListener('click', () => setGameMode('solo'));
  q('difficultyEasy').addEventListener('click', () => {
    difficulty = 'easy';
    press(q('difficultyEasy'), true);
    press(q('difficultyHard'), false);
  });
  q('difficultyHard').addEventListener('click', () => {
    difficulty = 'hard';
    press(q('difficultyHard'), true);
    press(q('difficultyEasy'), false);
  });
  function openHelp() {
    closeMenu(false);
    q('helpModal').classList.remove('hidden');
    if (game.classList.contains('hidden') || over || replaying || helpPaused) return;
    if (settle()) return;
    helpPaused = true;
    clearInterval(timer);
    clearTimeout(machineTimeout);
    machineThinking = false;
    updateControls();
  }
  function closeHelp() {
    q('helpModal').classList.add('hidden');
    if (!helpPaused) return;
    helpPaused = false;
    lastTick = performance.now();
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
      b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove', (e) => {
      if (!drag || drag.button !== b) return;
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
    b.addEventListener('pointerup', () => drag?.button === b && endDrag(true));
    b.addEventListener('pointercancel', () => drag?.button === b && endDrag(false));
  });

  function fmt(v) {
    v = Math.max(0, Math.ceil(v));
    return Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
  }
  function updateTimers() {
    timers.forEach((e, i) => {
      e.textContent = fmt(times[i]);
      e.classList.toggle('low', times[i] <= 20 && !over);
    });
  }
  function updateControls() {
    sides.forEach((s, i) => {
      const isTurn = i === current && !over && !replaying;
      s.classList.toggle('active', isTurn);
      s.classList.toggle('machine', gameMode === 'solo' && i === 1);
      s.classList.toggle('thinking', machineThinking && i === 1);
    });

    document.querySelectorAll('.letter').forEach((b) => {
      const p = +b.dataset.player;
      const machineSide = gameMode === 'solo' && p === 1;
      const canUse = p === current && !over && !replaying && !machineSide && !machineThinking;
      b.classList.toggle('selected', b.dataset.letter === selected[p]);
      b.setAttribute('aria-pressed', String(b.dataset.letter === selected[p]));
      b.disabled = !canUse;
    });

    [0, 1].forEach((i) => {
      const machineSide = gameMode === 'solo' && i === 1;
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

    turnBarTop.textContent = over
      ? 'Partida terminada'
      : helpPaused
        ? '⏸ Pausa: ayuda abierta'
        : replaying
          ? '🛟 Recalculando SOS…'
          : machineThinking
            ? '🤖 La máquina está pensando…'
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

  function reset() {
    stopGame();
    board = Array(size * size).fill('');
    current = 0;
    scores = [0, 0];
    times = [timeFor(size), timeFor(size)];
    selected = ['O', 'O'];
    scored = new Map();
    history = [];
    extras = [
      { hint: 1, last: 1, swap: 1 },
      { hint: 1, last: 1, swap: 1 },
    ];
    over = false;
    targetWord = 'OSO';
    sosUsed = false;
    replaying = false;
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
    lastTick = performance.now();
    timer = setInterval(tick, 100);
  }
  // Charges the active player for the time elapsed since the last settlement.
  // Returns true if that player ran out of time (the game is then finished).
  function settle() {
    if (over) return true;
    if (replaying || helpPaused) return false;
    const now = performance.now();
    times[current] = Math.max(0, times[current] - (now - lastTick) / 1000);
    lastTick = now;
    updateTimers();
    if (times[current] <= 0) {
      finish(1 - current, 'tiempo');
      return true;
    }
    return false;
  }
  function tick() {
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
      if (own[i].size === 2) c.classList.add('both');
      else if (own[i].has(0)) c.classList.add('p1');
      else if (own[i].has(1)) c.classList.add('p2');
    });
  }
  function cellClick(i, byMachine = false) {
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
      extras[p].swap = 0;
      updateControls();
      board[i] = board[i] === 'O' ? 'S' : 'O';
      justPlaced = i;
      history.push({ player: p, index: i, letter: board[i], power: 'swap' });
      swapMode = null;
      rebuildScores();
      hintCell = null;
      lastCell = null;
      msg.textContent = `🔄 ${names[p]} cambia la letra a ${board[i]}.`;
      current = 1 - current;
      render();
      updateControls();

      if (board.every(Boolean)) endByScore();
      else maybeMachineTurn();
      return;
    }

    if (board[i]) return;

    const p = current;
    board[i] = selected[p];
    history.push({ player: p, index: i, letter: selected[p] });

    const made = findNew(i);
    made.forEach((k) => scored.set(k, p));
    justPlaced = i;
    made.forEach((k) => k.split('-').forEach((n) => justScored.add(+n)));

    if (made.length) {
      scores[p] += made.length;
      times[p] += BONUS * made.length;
      scoresEl[p].textContent = scores[p];
      scoresEl[p].classList.remove('bump');
      void scoresEl[p].offsetWidth;
      scoresEl[p].classList.add('bump');
      updateTimers();
      msg.textContent = `¡${avatars[p]} ${names[p]} consigue ${made.length === 1 ? 'un ' + targetWord : made.length + ' ' + targetWord}! +${BONUS * made.length}s`;
    } else {
      current = 1 - current;
      msg.textContent = `Turno de ${avatars[current]} ${names[current]}`;
    }

    hintCell = null;
    lastCell = null;
    render();
    updateControls();

    if (board.every(Boolean)) {
      endByScore();
    } else {
      maybeMachineTurn();
    }
  }
  function findNew(idx, word = targetWord) {
    return Engine.findNew(board, size, scored, idx, word);
  }
  function rebuildScores(author = current) {
    ({ scored, scores } = Engine.rebuildScores(board, size, targetWord, scored, author));
    scoresEl.forEach((e, i) => (e.textContent = scores[i]));
  }
  function bestHint() {
    return Engine.bestHint(board, size, scored, targetWord, selected[current]);
  }

  hintBtns.forEach((b, p) =>
    b.addEventListener('click', () => {
      if (b.disabled || p !== current || !extras[p].hint || over || replaying || settle()) return;

      const h = bestHint();
      if (!h) return;

      extras[p].hint = 0;
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
    b.addEventListener('click', () => {
      if (b.disabled || p !== current || !extras[p].last || over || replaying || settle()) return;

      const m = [...history].reverse().find((x) => x.player !== p);
      if (!m) return;

      extras[p].last = 0;
      updateControls();
      lastCell = m.index;
      hintCell = null;
      swapMode = null;
      render();
      updateControls();
      msg.textContent = `👁️ Última jugada rival: ${m.letter}.`;
    }),
  );

  swapBtns.forEach((b, p) =>
    b.addEventListener('click', () => {
      if (b.disabled || p !== current || !extras[p].swap || over || replaying || settle()) return;

      swapMode = swapMode === p ? null : p;
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
    sosUsed = true;
    replaying = true;
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

    const savedHistory = history.map((m) => ({ ...m }));
    const savedTimes = [...times];

    setSeaTheme(true);
    q('modeFlash').classList.remove('hidden');
    updateControls();
    await sleep(900);
    if (id !== gameId) return;
    q('modeFlash').classList.add('hidden');

    targetWord = 'SOS';
    board = Array(size * size).fill('');
    scores = [0, 0];
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

    times = savedTimes;
    updateTimers();
    replaying = false;
    render();
    updateControls();
    msg.textContent = `🛟 Ahora se puntúa SOS. Marcador recalculado: ${scores[0]} – ${scores[1]}.`;

    lastTick = performance.now();
    timer = setInterval(tick, 100);
    if (gameMode === 'solo' && current === 1) maybeMachineTurn();
  }

  sosBtns.forEach((btn, p) =>
    btn.addEventListener('click', () => {
      if (btn.disabled || sosUsed || over || replaying || p !== current) return;
      activateSOS(p);
    }),
  );

  function endByScore() {
    if (scores[0] === scores[1]) finish(null, 'empate');
    else finish(scores[0] > scores[1] ? 0 : 1, 'puntos');
  }
  function finish(w, reason) {
    over = true;
    clearInterval(timer);
    updateControls();
    q('winnerOverlay').classList.remove('hidden');
    q('rematch').focus({ preventScroll: true });

    if (w === null) {
      q('winnerAvatar').textContent = '🤝';
      q('winnerTitle').textContent = '¡Empate!';
      q('winnerSub').textContent = `${scores[0]} – ${scores[1]}`;
    } else {
      q('winnerAvatar').textContent = avatars[w];
      q('winnerTitle').textContent = `¡Gana ${names[w]}!`;
      q('winnerSub').textContent =
        reason === 'tiempo'
          ? `El rival se quedó sin tiempo · ${scores[0]} – ${scores[1]}`
          : `Resultado final: ${scores[0]} – ${scores[1]}`;
      confetti();
    }
    showSession(recordSession(w));
  }

  const SESSION_KEY = 'oso.session.v1';
  function recordSession(winner) {
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      /* unreadable or unavailable: start a new session */
    }
    const key = sessionKey({ mode: gameMode, difficulty, names, avatars });
    session = recordGame(session, key, { scores, winner, size });
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
    return standings(session);
  }
  function showSession(st) {
    q('sessionBoard').classList.toggle('hidden', st.games < 2);
    if (st.games < 2) return;
    const order = [0, 1].sort((a, b) => st.wins[b] - st.wins[a] || st.points[b] - st.points[a]);
    const leader = st.wins[0] !== st.wins[1] ? order[0] : null;
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
    q('sessionMeta').textContent = `${st.games} partidas seguidas${draws}`;
  }
  function confetti() {
    const h = q('confetti');
    h.innerHTML = '';
    const cs = themeOf(theme).confetti;

    for (let i = 0; i < 90; i++) {
      const x = document.createElement('i');
      x.style.left = Math.random() * 100 + '%';
      x.style.background = cs[i % cs.length];
      x.style.animationDelay = Math.random() + 's';
      h.appendChild(x);
    }
  }

  q('startGame').addEventListener('click', () => {
    names = [
      namesIn[0].value.trim() || 'Jugador 1',
      gameMode === 'solo' ? 'Máquina' : namesIn[1].value.trim() || 'Jugador 2',
    ];

    if (gameMode === 'solo') avatars[1] = '🤖';

    size = +q('sizeSelect').value;

    namesEl.forEach((e, i) => (e.textContent = names[i]));
    avatarsEl.forEach((e, i) => (e.textContent = avatars[i]));
    q('machineBadge').classList.toggle('hidden', gameMode !== 'solo');

    setup.classList.add('hidden');
    game.classList.remove('hidden');
    reset();
  });

  const sidebar = q('sidebar'),
    menuScrim = q('menuScrim'),
    menuBtns = [q('menu1'), q('menu2')];
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
    const items = [...sidebar.querySelectorAll('button')];
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
    stopGame();
    over = true;
    closeMenu(false);
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  });

  q('rematch').addEventListener('click', reset);

  function backToSetup() {
    stopGame();
    q('winnerOverlay').classList.add('hidden');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  }
  q('otherBoard').addEventListener('click', backToSetup);
  q('changePlayers').addEventListener('click', backToSetup);
})();
