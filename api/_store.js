// Where rooms and counters live: Upstash Redis through its REST API (no SDK,
// so the site still needs no npm install), or memory for tests and local dev.

// Writes `value` only if the stored revision is `expected` (0: key must not exist).
// Values are stored as "<rev>|<json>" so Lua can compare without parsing JSON.
const CAS = `local cur = redis.call('GET', KEYS[1])
if ARGV[1] == '0' then
  if cur then return 0 end
elseif not cur or string.match(cur, '^(%d+)|') ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1`;

const pack = (rev, value) => `${rev}|${JSON.stringify(value)}`;
const unpack = (raw) => (raw ? JSON.parse(raw.slice(raw.indexOf('|') + 1)) : null);

// `prefix` keeps production, previews and development apart in the same database.
export function redisStore(url, token, prefix = '') {
  let commands = 0;
  async function call(path, body) {
    commands += path === '/pipeline' ? body.length : 1;
    const res = await fetch(url + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(`redis ${res.status} ${data.error ?? ''}`);
    return path === '/pipeline' ? data.map((r) => r.result) : data.result;
  }
  return {
    commands: () => commands,
    get: async (key) => unpack(await call('', ['GET', prefix + key])),
    cas: async (key, expected, value, ttl) =>
      (await call('', [
        'EVAL',
        CAS,
        '1',
        prefix + key,
        String(expected),
        pack(value.rev, value),
        String(ttl),
      ])) === 1,
    hit: async (key, ttl) =>
      (
        await call('/pipeline', [
          ['INCR', prefix + key],
          ['EXPIRE', prefix + key, String(ttl)],
        ])
      )[0],
    count: async (key, fields, ttl) => {
      const entries = Object.entries(fields).filter(([, n]) => n);
      if (!entries.length) return;
      await call('/pipeline', [
        ...entries.map(([f, n]) => ['HINCRBY', prefix + key, f, String(n)]),
        ['EXPIRE', prefix + key, String(ttl)],
      ]);
    },
    counters: async (key) => {
      const flat = (await call('', ['HGETALL', prefix + key])) ?? [];
      const out = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = Number(flat[i + 1]);
      return out;
    },
  };
}

export function memoryStore() {
  const data = new Map();
  const live = (key) => {
    const e = data.get(key);
    if (e && e.until < Date.now()) data.delete(key);
    return data.get(key)?.value;
  };
  const put = (key, value, ttl) => data.set(key, { value, until: Date.now() + ttl * 1000 });
  return {
    data,
    commands: () => 0,
    get: async (key) => unpack(live(key) ?? null),
    cas: async (key, expected, value, ttl) => {
      const cur = live(key);
      if (expected === 0 ? cur : !cur || cur.split('|')[0] !== String(expected)) return false;
      put(key, pack(value.rev, value), ttl);
      return true;
    },
    hit: async (key, ttl) => {
      const n = (live(key) ?? 0) + 1;
      put(key, n, ttl);
      return n;
    },
    count: async (key, fields, ttl) => {
      const c = live(key) ?? {};
      for (const [f, n] of Object.entries(fields)) if (n) c[f] = (c[f] ?? 0) + n;
      put(key, c, ttl);
    },
    counters: async (key) => ({ ...(live(key) ?? {}) }),
  };
}
