// Online 1 vs 1 client: talks to /api/sala and measures how well option A works
// (docs/ONLINE.md). The server decides everything; this only sends intentions.
const KEY = 'oso.online.v1';
const ENDPOINT = '/api/sala';
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/;
export const POLL_MS = 1000;

export function saveSeat(seat) {
  try {
    localStorage.setItem(KEY, JSON.stringify(seat));
  } catch {
    // Without storage the game still works, it just can't be resumed after a reload.
  }
}
export function loadSeat() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}
export function clearSeat() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

export const inviteUrl = (code) => `${location.origin}/?sala=${code}`;
export function codeFromUrl(search = location.search) {
  const code = new URLSearchParams(search).get('sala')?.toUpperCase() ?? '';
  return CODE_RE.test(code) ? code : null;
}

// Connection quality of one game, sent as `online_quality` when it ends.
export const newQuality = () => ({
  rtt: [],
  sync: [],
  polls: 0,
  poll_errors: 0,
  reconnects: 0,
  conflicts: 0,
});
const pct = (xs, p) =>
  xs.length
    ? Math.round([...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))])
    : 0;
export function qualityParams(q) {
  return {
    move_rtt_p50_ms: pct(q.rtt, 0.5),
    move_rtt_p95_ms: pct(q.rtt, 0.95),
    sync_p50_ms: pct(q.sync, 0.5),
    sync_p95_ms: pct(q.sync, 0.95),
    polls: q.polls,
    poll_errors: q.poll_errors,
    reconnects: q.reconnects,
    conflicts: q.conflicts,
  };
}

async function parse(res) {
  const data = await res.json().catch(() => ({ error: 'server' }));
  return { ok: res.ok, http: res.status, ...data };
}

export async function send(body, quality) {
  const start = performance.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await parse(res);
    if (quality && body.action === 'move') {
      quality.rtt.push(performance.now() - start);
      if (data.error === 'stale') quality.conflicts++;
    }
    return data;
  } catch {
    return { ok: false, http: 0, error: 'network' };
  }
}

// Latest room state; `{ same: true }` when nothing changed since `rev`.
export async function fetchRoom(code, rev = 0, quality = null) {
  if (quality) quality.polls++;
  try {
    const data = await parse(await fetch(`${ENDPOINT}?code=${code}&rev=${rev}`, { cache: 'no-store' }));
    if (quality && !data.ok) quality.poll_errors++;
    // How long the rival's change waited on the server before reaching us.
    if (quality && data.ok && !data.same && data.updated)
      quality.sync.push(Math.max(0, data.now - data.updated));
    return data;
  } catch {
    if (quality) quality.poll_errors++;
    return { ok: false, http: 0, error: 'network' };
  }
}

// After this long without a move, the player on turn is asked «¿Sigues ahí?» and the
// one waiting gets a word of encouragement about the game.
export const NUDGE_MS = 20000;
export function cheer({ mine, theirs, free, rivalName, rivalTime }) {
  if (rivalTime <= 20) return `⏳ El reloj de ${rivalName} corre: le quedan ${Math.ceil(rivalTime)} s.`;
  if (mine > theirs) return `💪 Vas ${mine}–${theirs}. ¡Aguanta!`;
  if (mine < theirs) return `🔥 Aún quedan ${free} casillas. ¡Hay remontada!`;
  return mine ? `🤝 Empate a ${mine}. ¡La próxima es tuya!` : '🤞 Todo por decidir. ¡Tú puedes!';
}
