// Short game sounds generated with Web Audio: no audio files and nothing extra in the CSP.
// Muting is remembered on the device.
const KEY = 'oso.sound.v1';
const VOLUME = 0.16;

// Each note is [frequency in Hz, start in s, duration in s].
const SOUNDS = {
  place: { type: 'sine', gain: 0.5, notes: [[660, 0, 0.06]] },
  score: {
    notes: [
      [784, 0, 0.1],
      [1046.5, 0.08, 0.2],
    ],
  },
  low: {
    type: 'square',
    gain: 0.3,
    notes: [
      [880, 0, 0.08],
      [880, 0.16, 0.08],
    ],
  },
  timeout: {
    type: 'sawtooth',
    gain: 0.35,
    notes: [
      [392, 0, 0.16],
      [330, 0.15, 0.16],
      [262, 0.3, 0.34],
    ],
  },
  win: {
    notes: [
      [523.25, 0, 0.14],
      [659.25, 0.12, 0.14],
      [783.99, 0.24, 0.14],
      [1046.5, 0.36, 0.55],
      [783.99, 0.36, 0.55],
    ],
  },
  draw: {
    notes: [
      [523.25, 0, 0.2],
      [659.25, 0.2, 0.2],
      [523.25, 0.4, 0.36],
    ],
  },
  lose: {
    notes: [
      [523.25, 0, 0.2],
      [493.88, 0.2, 0.2],
      [466.16, 0.4, 0.2],
      [440, 0.6, 0.5],
    ],
  },
  egg: {
    notes: [
      [523.25, 0, 0.16],
      [659.25, 0.11, 0.16],
      [783.99, 0.22, 0.16],
      [1046.5, 0.33, 0.16],
      [783.99, 0.44, 0.16],
      [1046.5, 0.55, 0.5],
    ],
  },
};

let muted = false;
try {
  muted = localStorage.getItem(KEY) === 'off';
} catch {
  /* ignore */
}
let ctx = null;

export const isMuted = () => muted;
export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? 'off' : 'on');
  } catch {
    /* ignore */
  }
}

export function play(name) {
  const sound = SOUNDS[name];
  if (muted || !sound) return;
  document.dispatchEvent(new CustomEvent('oso:sound', { detail: name }));
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ctx ??= new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + 0.02;
    const peak = VOLUME * (sound.gain ?? 1);
    for (const [f, at, d] of sound.notes) {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        t = t0 + at;
      o.type = sound.type ?? 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    }
  } catch {
    /* no sound */
  }
}
