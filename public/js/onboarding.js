// Step-by-step setup screen. The intro (welcome + rules) is shown only on the
// first visit; later visits start at "mode" with the last choices restored.
const STORAGE_KEY = 'oso.prefs.v1';
const STEPS = ['welcome', 'rules-1', 'rules-2', 'rules-3', 'rules-4', 'mode', 'players', 'board'];
const NO_NEXT = new Set(['welcome', 'board']);

const $ = (id) => document.getElementById(id);
const setup = $('setupScreen');
const steps = [...setup.querySelectorAll('.step')];
const nameInputs = [$('nickname1'), $('nickname2')];
const isSolo = () => $('modeSolo').classList.contains('selected');

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage may be unavailable (private mode); preferences are optional.
  }
}

const avatarButton = (player, avatar) =>
  [...setup.querySelectorAll(`.avatars[data-player="${player}"] .avatar-btn`)].find(
    (b) => b.dataset.avatar === avatar,
  );

function applyPrefs(prefs) {
  (prefs.avatars ?? []).forEach((avatar, player) => avatarButton(player, avatar)?.click());
  (prefs.names ?? []).forEach((name, player) => {
    if (typeof name === 'string') nameInputs[player].value = name.slice(0, 16);
  });
  if (prefs.mode === 'solo') $('modeSolo').click();
  if (prefs.difficulty === 'hard') $('difficultyHard').click();
  const size = $('sizeSelect');
  if ([...size.options].some((o) => o.value === String(prefs.size))) size.value = String(prefs.size);
}

function currentPrefs() {
  const solo = isSolo();
  const selectedAvatar = (player) =>
    setup.querySelector(`.avatars[data-player="${player}"] .avatar-btn.selected`)?.dataset.avatar;
  return {
    seenIntro: true,
    mode: solo ? 'solo' : 'two',
    difficulty: $('difficultyHard').classList.contains('selected') ? 'hard' : 'easy',
    avatars: solo ? [selectedAvatar(0)] : [selectedAvatar(0), selectedAvatar(1)],
    names: solo ? [nameInputs[0].value.trim()] : nameInputs.map((i) => i.value.trim()),
    size: Number($('sizeSelect').value),
  };
}

function summary() {
  const name = (i) => nameInputs[i].value.trim() || nameInputs[i].placeholder;
  const versus = isSolo()
    ? `${name(0)} contra la máquina (${$('difficultyHard').classList.contains('selected') ? 'difícil' : 'fácil'})`
    : `${name(0)} contra ${name(1)}`;
  return `${versus} · tablero ${$('sizeSelect').selectedOptions[0].textContent}`;
}

function show(step) {
  const index = STEPS.indexOf(step);
  steps.forEach((s) => s.classList.toggle('hidden', s.dataset.step !== step));
  setup.dataset.step = step;
  setup.classList.toggle('solo-setup', isSolo());
  $('stepBack').classList.toggle('invisible', index === 0);
  $('stepNext').classList.toggle('hidden', NO_NEXT.has(step));
  const percent = Math.round((index / (STEPS.length - 1)) * 100);
  $('stepProgress').style.width = `${percent}%`;
  $('stepProgress').parentElement.setAttribute('aria-valuenow', String(percent));
  if (step === 'board') $('setupSummary').textContent = summary();
}

const go = (delta) =>
  show(STEPS[Math.min(STEPS.length - 1, Math.max(0, STEPS.indexOf(setup.dataset.step) + delta))]);

$('stepNext').addEventListener('click', () => go(1));
$('stepBack').addEventListener('click', () => go(-1));
$('introStart').addEventListener('click', () => show('rules-1'));
$('introSkip').addEventListener('click', () => show('mode'));
$('replayIntro').addEventListener('click', () => show('rules-1'));
$('modeTwo').addEventListener('click', () => setup.classList.remove('solo-setup'));
$('modeSolo').addEventListener('click', () => setup.classList.add('solo-setup'));
$('sizeSelect').addEventListener('change', () => ($('setupSummary').textContent = summary()));
$('startGame').addEventListener('click', () => savePrefs(currentPrefs()));
$('newGame').addEventListener('click', () => show('mode'));
$('changePlayers').addEventListener('click', () => show('players'));

const prefs = loadPrefs();
applyPrefs(prefs);
show(prefs.seenIntro ? 'mode' : 'welcome');
