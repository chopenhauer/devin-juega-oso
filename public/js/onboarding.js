// Step-by-step setup screen. The intro (welcome + rules carousel) is shown only
// on the first visit; later visits start at "mode" with the last choices restored.
import { GAME } from './config.js';
import { t } from './i18n.js';
import { parseChallenge } from './challenge.js';
import * as Daily from './daily.js';
import { setupStep, startFunnel } from './funnel.js';
import { swallowed } from './report.js';

const STORAGE_KEY = 'oso.prefs.v1';
const STEPS = ['welcome', 'rules', 'mode', 'where', 'players', 'view', 'board'];
const NO_NEXT = new Set(['daily', 'welcome', 'board']);
const SWIPE_PX = GAME.screen.swipePx;

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
const isOnline = () => !isSolo() && !isFour() && $('whereOnline').getAttribute('aria-pressed') === 'true';
const modeNow = () => (isSolo() ? 'solo' : isFour() ? 'four' : isOnline() ? 'online' : 'two');
const setSetupMode = (mode) => {
  setup.classList.toggle('solo-setup', mode === 'solo');
  setup.classList.toggle('four-setup', mode === 'four');
  setup.classList.toggle('online-setup', mode === 'online');
};
const DIFFICULTIES = ['easy', 'hard', 'extreme'];
const difficultyId = (level) => `difficulty${level[0].toUpperCase()}${level.slice(1)}`;
const difficultyNow = () =>
  DIFFICULTIES.find((level) => $(difficultyId(level)).classList.contains('selected')) ?? 'easy';
const levelText = (level) =>
  ({ easy: t('summary.easy'), hard: t('summary.hard'), extreme: t('summary.extreme') })[level];
const viewButtons = [$('viewFacing'), $('viewSame')];
const VIEWS = viewButtons.map((b) => b.dataset.view);
// Facing (player 2's panel upside down) suits a phone or tablet flat on the table.
const defaultView = () => (matchMedia('(min-width: 1024px) and (pointer: fine)').matches ? 'same' : 'facing');
const currentView = () => viewButtons.find((b) => b.getAttribute('aria-pressed') === 'true').dataset.view;
// «Where» only asks two players; the orientation step is for one shared screen.
const isVisible = (step) =>
  step === 'where' ? !isSolo() && !isFour() : step !== 'view' || (!isSolo() && !isOnline());
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
  } catch (e) {
    // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
    swallowed('prefs.save', e);
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
  else if (prefs.mode === 'online') $('whereOnline').click();
  if (DIFFICULTIES.includes(prefs.difficulty)) $(difficultyId(prefs.difficulty)).click();
  if (VIEWS.includes(prefs.view)) setView(prefs.view);
  const size = $('sizeSelect');
  if ([...size.options].some((o) => o.value === String(prefs.size) && !o.disabled))
    size.value = String(prefs.size);
}

function currentPrefs() {
  const solo = isSolo();
  const count = solo || isOnline() ? 1 : isFour() ? 4 : 2;
  const selectedAvatar = (player) =>
    setup.querySelector(`.avatars[data-player="${player}"] .avatar-btn.selected`)?.dataset.avatar;
  return {
    seenIntro: true,
    mode: modeNow(),
    difficulty: difficultyNow(),
    avatars: Array.from({ length: count }, (_, i) => selectedAvatar(i)),
    names: nameInputs.slice(0, count).map((i) => i.value.trim()),
    size: Number($('sizeSelect').value),
    view: currentView(),
  };
}

function summary() {
  const name = (i) => nameInputs[i].value.trim() || nameInputs[i].placeholder;
  const players = isFour()
    ? t('summary.four', { first: [0, 1, 2].map(name).join(', '), last: name(3) })
    : t('summary.two', { a: name(0), b: name(1) });
  const versus = isOnline()
    ? t('summary.online')
    : isSolo()
      ? t('summary.solo', { name: name(0), level: levelText(difficultyNow()) })
      : t('summary.view', { players, view: t(currentView() === 'same' ? 'summary.same' : 'summary.facing') });
  return t('summary.board', { versus, board: $('sizeSelect').selectedOptions[0].textContent });
}

// Every step shares one grid cell, so the panel keeps the height of the tallest
// step. Measured in both modes.
function equalizeHeight() {
  if (!setup.offsetParent) return;
  const mode = modeNow();
  stepsEl.style.minHeight = '';
  const modes = fourLocked() ? ['two', 'solo', 'online'] : ['two', 'solo', 'four', 'online'];
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
  if (setup.dataset.step === 'rules') setupStep(`rules_${slide + 1}`, modeNow());
}

function show(step, slideIndex = 0) {
  steps.forEach((s) => s.classList.toggle('inactive', s.dataset.step !== step));
  setup.dataset.step = step;
  setSetupMode(modeNow());
  $('stepBack').classList.toggle('invisible', step === 'welcome' || step === 'daily');
  $('stepBack').textContent = step === 'mode' ? t('stepBack.rules') : '←';
  $('stepBack').setAttribute('aria-label', t(step === 'mode' ? 'ruleCarousel.label' : 'stepBack.label'));
  $('stepNext').classList.toggle('invisible', NO_NEXT.has(step));
  // The intro only explains, so its arrows are plain; setup steps keep a yellow «next».
  $('stepNext').classList.toggle('primary', step !== 'rules');
  $('stepNext').classList.toggle('secondary', step === 'rules');
  $('stepNext').textContent = step === 'mode' ? t('stepNext.text') : '→';
  if (step === 'rules') setSlide(slideIndex);
  if (step === 'board') $('setupSummary').textContent = summary();
  equalizeHeight();
  if (step !== 'rules') setupStep(step, modeNow());
  document.dispatchEvent(new CustomEvent('oso:step', { detail: step }));
}

function neighbour(step, dir) {
  let i = STEPS.indexOf(step) + dir;
  while (!isVisible(STEPS[i])) i += dir;
  return STEPS[Math.max(0, Math.min(STEPS.length - 1, i))];
}

// Online, the players step talks to the server first (app.js) and moves on by itself.
const onlineStep = (name) =>
  setup.dataset.step === 'players' &&
  isOnline() &&
  !document.dispatchEvent(new CustomEvent(name, { cancelable: true }));

function next() {
  if (onlineStep('oso:online-next')) return;
  const step = setup.dataset.step;
  if (step === 'rules' && slide < slides.length - 1) setSlide(slide + 1);
  else show(neighbour(step, 1));
}

function back() {
  if (onlineStep('oso:online-back')) return;
  const step = setup.dataset.step;
  if (step === 'rules' && slide > 0) setSlide(slide - 1);
  else if (step === 'mode') show('rules');
  else if (step === 'players' && daily) show('daily');
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
['whereTogether', 'whereOnline'].forEach((id) =>
  $(id).addEventListener('click', () => setSetupMode(modeNow())),
);
document.addEventListener('oso:show', (e) => show(e.detail));
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
  setupStep('start', modeNow());
});
$('newGame').addEventListener('click', () => show('mode'));
$('changePlayers').addEventListener('click', () => show('players'));
$('otherBoard').addEventListener('click', () => show('board'));
window.addEventListener('resize', equalizeHeight);

// On phones the keyboard covers the lower half without resizing the page, hiding the name being
// typed. Add that much room below and centre the field in the part still visible.
const KEYBOARD_MIN_PX = GAME.screen.keyboardMinPx;
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
// A challenge link and /reto (reto del día) come with the game already set: only the player's
// avatar and name are left.
const daily = Daily.isDailyPath(location.pathname) ? Daily.dailyChallenge() : null;
// On the reto's own landing, the 🗓️ next to 🌐 becomes the way back to the usual OSO.
if (daily) {
  const home = $('dailyToggle');
  home.removeAttribute('data-i18n-attr');
  home.href = '/';
  home.textContent = '🏠';
  home.setAttribute('aria-label', t('daily.home'));
}
const challenge = daily ?? parseChallenge(location.search);
startFunnel(daily ? 'daily' : challenge ? 'challenge' : prefs.seenIntro ? 'return' : 'first');
function presetChallenge() {
  $('modeSolo').click();
  $(difficultyId(challenge.difficulty)).click();
  $('sizeSelect').value = String(challenge.size);
}
function setChallenge() {
  presetChallenge();
  show('players');
}
// The reto starts straight from its landing with the saved name (or none): nothing to choose.
let editingName = false;
function syncDailyWho() {
  const name = nameInputs[0].value.trim();
  const typing = editingName || !name;
  $('dailyWho').classList.toggle('hidden', typing);
  $('dailyName').classList.toggle('hidden', !typing);
  $('dailyAs').textContent = name;
  $('dailyAvatar').textContent = $('preview1').textContent;
}
$('dailyChange').addEventListener('click', () => {
  editingName = true;
  $('dailyName').value = nameInputs[0].value;
  syncDailyWho();
  $('dailyName').focus();
  $('dailyName').select();
});
$('dailyName').addEventListener('input', () => (nameInputs[0].value = $('dailyName').value));
$('dailyName').addEventListener('keydown', (e) => e.key === 'Enter' && $('dailyPlay').click());
$('dailyPlay').addEventListener('click', () => {
  presetChallenge();
  $('startGame').click();
});
document.addEventListener('oso:step', (e) => e.detail === 'daily' && syncDailyWho());
if (daily) show('daily');
else if (challenge) setChallenge();
else show(prefs.seenIntro ? 'mode' : 'welcome');

// Reto del día: its own landing on /reto, and a discreet line to it on the usual one.
function dailyTexts() {
  const today = Daily.dailyChallenge();
  const state = Daily.readDaily();
  const done = state.results[today.key];
  const { h, m } = Daily.waitParts(Daily.msToNext());
  const wait = h ? t('daily.wait', { h, m }) : t('daily.wait_min', { m });
  const line = done
    ? t('daily.line_done', { number: today.number, mine: done.mine, theirs: done.theirs, wait })
    : t('daily.line_new', { number: today.number });
  document.querySelectorAll('.daily-link').forEach((a) => (a.textContent = line));
  if (!daily) return;
  // At the change of day a landing left open shows the new reto, unless a game is under way.
  if (today.key !== daily.key && !setup.classList.contains('hidden')) return location.reload();
  const streak = Daily.currentStreak(state, today.key);
  $('dailyLead').classList.toggle('hidden', !!done);
  $('dailyLead').textContent = streak ? t('daily.lead_streak', { count: streak }) : t('daily.lead');
  ['dailyDone', 'dailyNext', 'dailyPractice'].forEach((id) => $(id).classList.toggle('hidden', !done));
  if (done) {
    $('dailyDoneTitle').textContent = done.won
      ? t('daily.done_won')
      : done.mine === done.theirs
        ? t('daily.done_draw')
        : t('daily.done_lost');
    $('dailyDoneScore').textContent = t('daily.done_score', { mine: done.mine, theirs: done.theirs });
    $('dailyDoneStreak').textContent = t('daily.streak_title', { count: streak });
    $('dailyNext').textContent = t('daily.next', { wait });
  }
  $('dailyPlay').textContent = done ? t('daily.play_again') : t('daily.play');
}
if (daily) {
  $('dailyTitle').textContent = t('daily.title', { number: daily.number });
  $('dailyDate').textContent = Daily.dateLabel(daily.key);
  const level = { easy: 'difficultyEasy', hard: 'difficultyHard', extreme: 'difficultyExtreme' };
  $('dailyChips').replaceChildren(
    ...[
      t('daily.chip_size', { size: daily.size }),
      t('daily.chip_level', { level: t(level[daily.difficulty]) }),
      t('daily.chip_letters', { count: daily.preset.length }),
    ].map((text) => Object.assign(document.createElement('li'), { textContent: text })),
  );
  const board = $('dailyBoard');
  board.style.setProperty('--n', daily.size);
  const letters = Array(daily.size * daily.size).fill('');
  daily.preset.forEach(({ index, letter }) => (letters[index] = letter));
  board.replaceChildren(
    ...letters.map((letter) => Object.assign(document.createElement('span'), { textContent: letter })),
  );
}
dailyTexts();
setInterval(dailyTexts, 60000);
