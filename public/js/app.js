import * as Engine from './engine.js';
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
  const avatarChoices = [...avatarGrids[0].querySelectorAll('.avatar-btn')].map((b) => b.dataset.avatar);
  const firstFreeAvatar = (taken) => avatarChoices.find((a) => a !== taken);

  // Each player must have a different avatar: the other player's pick is disabled.
  function syncAvatars() {
    avatarGrids.forEach((grid) => {
      const p = +grid.dataset.player;
      grid.querySelectorAll('.avatar-btn').forEach((b) => {
        const taken = b.dataset.avatar === avatars[1 - p];
        b.classList.toggle('selected', b.dataset.avatar === avatars[p]);
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

  function setGameMode(mode) {
    gameMode = mode;
    q('modeTwo').classList.toggle('selected', mode === 'two');
    q('modeSolo').classList.toggle('selected', mode === 'solo');
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
      if (avatars[1] === '🤖') avatars[1] = avatars[0] === '🐼' ? firstFreeAvatar('🐼') : '🐼';
      previews[1].textContent = avatars[1];
    }
    syncAvatars();
  }
  q('modeTwo').addEventListener('click', () => setGameMode('two'));
  q('modeSolo').addEventListener('click', () => setGameMode('solo'));
  q('difficultyEasy').addEventListener('click', () => {
    difficulty = 'easy';
    q('difficultyEasy').classList.add('selected');
    q('difficultyHard').classList.remove('selected');
  });
  q('difficultyHard').addEventListener('click', () => {
    difficulty = 'hard';
    q('difficultyHard').classList.add('selected');
    q('difficultyEasy').classList.remove('selected');
  });
  function openHelp() {
    q('sidebar').classList.remove('open');
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

  document.querySelectorAll('.letter').forEach((b) =>
    b.addEventListener('click', () => {
      const p = +b.dataset.player;
      if (
        over ||
        replaying ||
        helpPaused ||
        p !== current ||
        machineThinking ||
        (gameMode === 'solo' && p === 1)
      )
        return;
      selected[p] = b.dataset.letter;
      swapMode = null;
      updateControls();
      render();
      msg.textContent = `${avatars[p]} ${names[p]} jugará ${selected[p]}.`;
    }),
  );

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
  }
  function confetti() {
    const h = q('confetti');
    h.innerHTML = '';
    const cs = ['#38b6ff', '#ff5d8f', '#ffd23f', '#7dffb2', '#b388ff', '#ff9f1c'];

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

  q('menuTab').addEventListener('click', () => q('sidebar').classList.toggle('open'));
  q('closeMenu').addEventListener('click', () => q('sidebar').classList.remove('open'));

  q('restartMatch').addEventListener('click', () => {
    q('sidebar').classList.remove('open');
    reset();
  });

  q('newGame').addEventListener('click', () => {
    stopGame();
    over = true;
    q('sidebar').classList.remove('open');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  });

  q('rematch').addEventListener('click', reset);

  q('changePlayers').addEventListener('click', () => {
    stopGame();
    q('winnerOverlay').classList.add('hidden');
    game.classList.add('hidden');
    setup.classList.remove('hidden');
    setSeaTheme(false);
  });
})();
