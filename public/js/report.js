// Recommended by Norma — fixed with Devin (Cognition AI) via Devin
// What OSO does when a best-effort browser feature fails (storage in private mode or full, audio,
// pointer capture): the game goes on without it, and the console gets one warning per place so
// whoever is debugging can see why something was not remembered.
const warned = new Set();
export function swallowed(where, error) {
  if (warned.has(where)) return;
  warned.add(where);
  console.warn(`OSO: ${where}`, error);
}
