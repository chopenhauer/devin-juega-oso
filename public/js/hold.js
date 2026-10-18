import { GAME } from './config.js';

// Long press: keep a button pressed `ms` (finger, mouse, or Space/Enter) to call `onHold`. From
// `ringMs` on the button gets `.holding` and a ring fills up for the rest of the time
// (`--hold-ms`), so a normal tap never shows it. The click that ends a long press is swallowed,
// so the button does not also do its normal thing.
const KEYS = [' ', 'Enter'];

export function onLongPress(el, { ms, ringMs, when = () => true, onHold }) {
  let timer,
    ringTimer,
    start,
    byKey = false,
    fired = false;
  const stop = () => {
    clearTimeout(timer);
    clearTimeout(ringTimer);
    start = null;
    el.classList.remove('holding');
  };
  const begin = (at) => {
    stop();
    fired = false;
    if (!when()) return false;
    start = at;
    ringTimer = setTimeout(() => {
      el.style.setProperty('--hold-ms', `${ms - ringMs}ms`);
      el.classList.add('holding');
    }, ringMs);
    timer = setTimeout(() => {
      stop();
      if (!when()) return;
      fired = true;
      onHold();
    }, ms);
    return true;
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.isPrimary && e.button === 0) begin({ x: e.clientX, y: e.clientY });
  });
  el.addEventListener('pointermove', (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > GAME.secrets.holdSlopPx) stop();
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'])
    el.addEventListener(type, () => byKey || stop());
  // Android and iOS open their own menu on a long press.
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener(
    'click',
    (e) => {
      if (!fired) return;
      fired = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );

  // Keyboard: the key's own click is held back and sent on release if the press was short.
  el.addEventListener('keydown', (e) => {
    if (!KEYS.includes(e.key)) return;
    if (!byKey && (e.repeat || !when())) return;
    e.preventDefault();
    if (!byKey) byKey = begin({ x: NaN, y: NaN });
  });
  el.addEventListener('keyup', (e) => {
    if (!byKey || !KEYS.includes(e.key)) return;
    e.preventDefault();
    byKey = false;
    const held = fired;
    fired = false;
    stop();
    if (!held) el.click();
  });
  el.addEventListener('blur', () => {
    if (byKey) stop();
    byKey = false;
  });
}
