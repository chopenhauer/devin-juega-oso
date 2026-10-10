// Step-by-step setup screen. The intro (welcome + rules carousel) is shown only
// on the first visit; later visits start at "mode" with the last choices restored.
const STORAGE_KEY = 'oso.prefs.v1';
const STEPS = ['welcome', 'rules', 'mode', 'players', 'view', 'board'];
const NO_NEXT = new Set(['welcome', 'board']);
const SWIPE_PX = 40;

const $ = (id) => document.getElementById(id);
const setup = $('setupScreen');
const stepsEl = $('setupSteps');
const steps = [...stepsEl.querySelectorAll('.step')];
const slides = [...$('ruleSlides').children];
const dots = [...setup.querySelectorAll('.carousel-dots .dot')];
const nameInputs = [1, 2, 3, 4].map((n) => $(`nickname${n}`));
const isSolo = () => $('modeSolo').classList.contains('selected');
const fourLocked = () => $('modeFour').hasAttribute('data-locked');
const isFour = () => $('modeFour').classList.contains('selected');
const setSetupMode = (mode) => {
  setup.classList.toggle('solo-setup', mode === 'solo');
  setup.classList.toggle('four-setup', mode === 'four');
};
const viewButtons = [$('viewFacing'), $('viewSame')];
const VIEWS = viewButtons.map((b) => b.dataset.view);
// Facing (player 2's panel upside down) suits a phone or tablet flat on the table.
const defaultView = () => (matchMedia('(min-width: 1024px) and (pointer: fine)').matches ? 'same' : 'facing');
const currentView = () => viewButtons.find((b) => b.getAttribute('aria-pressed') === 'true').dataset.view;
// The orientation step only applies to two players.
const isVisible = (step) => step !== 'view' || !isSolo();
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

function setView(view) {
  viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}

function applyPrefs(prefs) {
  if (Array.isArray(prefs.avatars)) {
    document.dispatchEvent(new CustomEvent('oso:avatars', { detail: prefs.avatars }));
  }
  (prefs.names ?? []).forEach((name, player) => {
    if (typeof name === 'string') nameInputs[player].value = name.slice(0, 16);
  });
  if (prefs.mode === 'solo') $('modeSolo').click();
  else if (prefs.mode === 'four' && !fourLocked()) $('modeFour').click();
  if (prefs.difficulty === 'hard') $('difficultyHard').click();
  if (VIEWS.includes(prefs.view)) setView(prefs.view);
  const size = $('sizeSelect');
  if ([...size.options].some((o) => o.value === String(prefs.size) && !o.disabled))
    size.value = String(prefs.size);
}

function currentPrefs() {
  const solo = isSolo();
  const count = solo ? 1 : isFour() ? 4 : 2;
  const selectedAvatar = (player) =>
    setup.querySelector(`.avatars[data-player="${player}"] .avatar-btn.selected`)?.dataset.avatar;
  return {
    seenIntro: true,
    mode: solo ? 'solo' : isFour() ? 'four' : 'two',
    difficulty: $('difficultyHard').classList.contains('selected') ? 'hard' : 'easy',
    avatars: Array.from({ length: count }, (_, i) => selectedAvatar(i)),
    names: nameInputs.slice(0, count).map((i) => i.value.trim()),
    size: Number($('sizeSelect').value),
    view: currentView(),
  };
}

function summary() {
  const name = (i) => nameInputs[i].value.trim() || nameInputs[i].placeholder;
  const versus = isSolo()
    ? `${name(0)} contra la máquina (${$('difficultyHard').classList.contains('selected') ? 'difícil' : 'fácil'})`
    : `${isFour() ? `${[0, 1, 2].map(name).join(', ')} y ${name(3)}` : `${name(0)} contra ${name(1)}`} (${currentView() === 'same' ? 'misma vista' : 'enfrentados'})`;
  return `${versus} · tablero ${$('sizeSelect').selectedOptions[0].textContent}`;
}

// Every step shares one grid cell, so the panel keeps the height of the tallest
// step. Measured in both modes.
function equalizeHeight() {
  if (!setup.offsetParent) return;
  const mode = isSolo() ? 'solo' : isFour() ? 'four' : 'two';
  stepsEl.style.minHeight = '';
  const modes = fourLocked() ? ['two', 'solo'] : ['two', 'solo', 'four'];
  const height = Math.max(
    ...modes.map((m) => {
      setSetupMode(m);
      return stepsEl.offsetHeight;
    }),
  );
  setSetupMode(mode);
  stepsEl.style.minHeight = `${height}px`;
}

function setSlide(index) {
  slide = Math.max(0, Math.min(slides.length - 1, index));
  $('ruleSlides').style.transform = `translateX(-${slide * 100}%)`;
  slides.forEach((s, i) => {
    s.setAttribute('aria-hidden', String(i !== slide));
    s.classList.remove('playing');
  });
  // Restart the active card's demo from the beginning.
  void slides[slide].offsetWidth;
  slides[slide].classList.add('playing');
  dots.forEach((d, i) => d.setAttribute('aria-current', String(i === slide)));
  setup.dataset.slide = String(slide);
}

function show(step, slideIndex = 0) {
  steps.forEach((s) => s.classList.toggle('inactive', s.dataset.step !== step));
  setup.dataset.step = step;
  setSetupMode(isSolo() ? 'solo' : isFour() ? 'four' : 'two');
  $('stepBack').classList.toggle('invisible', step === 'welcome');
  $('stepBack').textContent = step === 'mode' ? '👀 Cómo se juega' : '←';
  $('stepBack').setAttribute('aria-label', step === 'mode' ? 'Cómo se juega' : 'Atrás');
  $('stepNext').classList.toggle('invisible', NO_NEXT.has(step));
  // The intro only explains, so its arrows are plain; setup steps keep a yellow «next».
  $('stepNext').classList.toggle('primary', step !== 'rules');
  $('stepNext').classList.toggle('secondary', step === 'rules');
  $('stepNext').textContent = step === 'mode' ? 'Siguiente →' : '→';
  if (step === 'rules') setSlide(slideIndex);
  if (step === 'board') $('setupSummary').textContent = summary();
  equalizeHeight();
}

function neighbour(step, dir) {
  let i = STEPS.indexOf(step) + dir;
  while (!isVisible(STEPS[i])) i += dir;
  return STEPS[Math.max(0, Math.min(STEPS.length - 1, i))];
}

function next() {
  const step = setup.dataset.step;
  if (step === 'rules' && slide < slides.length - 1) setSlide(slide + 1);
  else show(neighbour(step, 1));
}

function back() {
  const step = setup.dataset.step;
  if (step === 'rules' && slide > 0) setSlide(slide - 1);
  else if (step === 'mode') show('rules');
  else show(neighbour(step, -1));
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
$('modeTwo').addEventListener('click', () => setSetupMode('two'));
$('modeSolo').addEventListener('click', () => setSetupMode('solo'));
$('modeFour').addEventListener('click', () => {
  if (fourLocked()) return;
  setSetupMode('four');
  equalizeHeight();
});
$('sizeSelect').addEventListener('change', () => ($('setupSummary').textContent = summary()));
viewButtons.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('startGame').addEventListener('click', () => {
  $('gameScreen').classList.toggle('same-view', currentView() === 'same');
  savePrefs(currentPrefs());
});
$('newGame').addEventListener('click', () => show('mode'));
$('changePlayers').addEventListener('click', () => show('players'));
$('otherBoard').addEventListener('click', () => show('board'));
window.addEventListener('resize', equalizeHeight);

// On phones the keyboard covers the lower half without resizing the page, hiding the name being
// typed. Add that much room below and centre the field in the part still visible.
const KEYBOARD_MIN_PX = 100;
function keepNameVisible() {
  const vv = window.visualViewport;
  if (!vv) return;
  const covered = document.documentElement.clientHeight - vv.height;
  const input = document.activeElement;
  const typing = nameInputs.includes(input) && covered > KEYBOARD_MIN_PX;
  document.body.style.setProperty('--keyboard', typing ? `${Math.round(covered)}px` : '0px');
  if (!typing) return;
  const r = input.getBoundingClientRect();
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollBy({
    top: r.top + r.height / 2 - vv.offsetTop - vv.height / 2,
    behavior: smooth ? 'smooth' : 'auto',
  });
}
window.visualViewport?.addEventListener('resize', keepNameVisible);
nameInputs.forEach((input) => {
  input.addEventListener('focus', keepNameVisible);
  input.addEventListener('blur', (e) => nameInputs.includes(e.relatedTarget) || keepNameVisible());
});
document.fonts?.ready.then(equalizeHeight);

setView(defaultView());
const prefs = loadPrefs();
applyPrefs(prefs);
show(prefs.seenIntro ? 'mode' : 'welcome');
