// Step-by-step setup screen. The intro (welcome + rules carousel) is shown only
// on the first visit; later visits start at "mode" with the last choices restored.
const STORAGE_KEY = 'oso.prefs.v1';
const STEPS = ['welcome', 'rules', 'mode', 'players', 'board'];
const NO_NEXT = new Set(['welcome', 'board']);
const SWIPE_PX = 40;

const $ = (id) => document.getElementById(id);
const setup = $('setupScreen');
const stepsEl = $('setupSteps');
const steps = [...stepsEl.querySelectorAll('.step')];
const slides = [...$('ruleSlides').children];
const dots = [...setup.querySelectorAll('.carousel-dots .dot')];
const nameInputs = [$('nickname1'), $('nickname2')];
const isSolo = () => $('modeSolo').classList.contains('selected');
const LAST_POSITION = STEPS.length - 2 + slides.length;
let slide = 0;

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

function applyPrefs(prefs) {
  if (Array.isArray(prefs.avatars)) {
    document.dispatchEvent(new CustomEvent('oso:avatars', { detail: prefs.avatars }));
  }
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

// Every step shares one grid cell, so the panel keeps the height of the tallest
// step. Measured in both modes with the difficulty picker visible.
function equalizeHeight() {
  if (!setup.offsetParent) return;
  const solo = setup.classList.contains('solo-setup');
  const difficulty = $('difficultyWrap');
  const difficultyHidden = difficulty.classList.contains('hidden');
  difficulty.classList.remove('hidden');
  stepsEl.style.minHeight = '';
  const height = Math.max(
    ...[false, true].map((asSolo) => {
      setup.classList.toggle('solo-setup', asSolo);
      return stepsEl.offsetHeight;
    }),
  );
  setup.classList.toggle('solo-setup', solo);
  difficulty.classList.toggle('hidden', difficultyHidden);
  stepsEl.style.minHeight = `${height}px`;
}

function position() {
  const index = STEPS.indexOf(setup.dataset.step);
  return index <= 1 ? index + (index === 1 ? slide : 0) : index - 1 + slides.length;
}

function updateProgress() {
  const percent = Math.round((position() / LAST_POSITION) * 100);
  $('stepProgress').style.width = `${percent}%`;
  $('stepProgress').parentElement.setAttribute('aria-valuenow', String(percent));
}

function setSlide(index) {
  slide = Math.max(0, Math.min(slides.length - 1, index));
  $('ruleSlides').style.transform = `translateX(-${slide * 100}%)`;
  slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== slide)));
  dots.forEach((d, i) => d.setAttribute('aria-current', String(i === slide)));
  setup.dataset.slide = String(slide);
  updateProgress();
}

function show(step, slideIndex = 0) {
  steps.forEach((s) => s.classList.toggle('inactive', s.dataset.step !== step));
  setup.dataset.step = step;
  setup.classList.toggle('solo-setup', isSolo());
  $('stepBack').classList.toggle('invisible', step === 'welcome');
  $('stepNext').classList.toggle('hidden', NO_NEXT.has(step));
  if (step === 'rules') setSlide(slideIndex);
  if (step === 'board') $('setupSummary').textContent = summary();
  updateProgress();
  equalizeHeight();
}

function next() {
  const step = setup.dataset.step;
  if (step === 'rules' && slide < slides.length - 1) setSlide(slide + 1);
  else show(STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(step) + 1)]);
}

function back() {
  const step = setup.dataset.step;
  if (step === 'rules' && slide > 0) setSlide(slide - 1);
  else if (step === 'mode') show('rules', slides.length - 1);
  else show(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
}

let swipeStart = null;
$('ruleCarousel').addEventListener('pointerdown', (e) => (swipeStart = e.clientX));
$('ruleCarousel').addEventListener('pointerup', (e) => {
  if (swipeStart === null) return;
  const dx = e.clientX - swipeStart;
  swipeStart = null;
  if (dx <= -SWIPE_PX) next();
  else if (dx >= SWIPE_PX && slide > 0) setSlide(slide - 1);
});
dots.forEach((d, i) => d.addEventListener('click', () => setSlide(i)));

$('stepNext').addEventListener('click', next);
$('stepBack').addEventListener('click', back);
$('introStart').addEventListener('click', () => show('rules'));
$('introSkip').addEventListener('click', () => show('mode'));
$('replayIntro').addEventListener('click', () => show('rules'));
$('modeTwo').addEventListener('click', () => setup.classList.remove('solo-setup'));
$('modeSolo').addEventListener('click', () => setup.classList.add('solo-setup'));
$('sizeSelect').addEventListener('change', () => ($('setupSummary').textContent = summary()));
$('startGame').addEventListener('click', () => savePrefs(currentPrefs()));
$('newGame').addEventListener('click', () => show('mode'));
$('changePlayers').addEventListener('click', () => show('players'));
window.addEventListener('resize', equalizeHeight);
document.fonts?.ready.then(equalizeHeight);

const prefs = loadPrefs();
applyPrefs(prefs);
show(prefs.seenIntro ? 'mode' : 'welcome');
