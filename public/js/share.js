// Word of mouth: texts and links to invite someone to play OSO. No SDKs or social widgets:
// the native share sheet when the device has one, otherwise plain WhatsApp, email and copy links.
// A blank line between the result, the question and the link, so the message breathes.
export const SITE_URL = 'https://juegaoso.com/';
export const SHARE_SUBJECT = '¿Jugamos a OSO? 🐻';

// `source` tells GA where the visit came from (whatsapp, email, copy, native).
export const shareUrl = (source) =>
  `${SITE_URL}?utm_source=${encodeURIComponent(source)}&utm_medium=share&utm_campaign=boca_oreja`;

export const withLink = (text, url) => `${text}\n\n${url}`;

// Text to share. With a finished game it brags about the result, never with player names.
export function shareText(result = null) {
  if (!result) return 'Juega conmigo a OSO 🐻: coloca O y S y forma OSO más veces que tu rival.';
  const { mode, winner, scores } = result;
  const [a, b] = scores;
  if (mode === 'solo') {
    if (winner === 0) return `¡He ganado a la máquina ${a} a ${b} en OSO 🐻!\n\n¿Te atreves?`;
    if (winner === 1) return `La máquina me ha ganado ${b} a ${a} en OSO 🐻.\n\n¿Tú puedes con ella?`;
    return `¡Empate ${a} a ${b} contra la máquina en OSO 🐻!\n\n¿Te atreves?`;
  }
  if (mode === 'four')
    return `¡Partida de OSO 🐻 a cuatro: ${scores.join(' – ')}!\n\n¿Te apuntas a la próxima?`;
  if (winner === null) return `¡Empate ${a} a ${b} en OSO 🐻!\n\n¿Juegas conmigo?`;
  const [hi, lo] = [Math.max(a, b), Math.min(a, b)];
  return `¡Partidazo de OSO 🐻: ${hi} a ${lo}!\n\n¿Juegas conmigo?`;
}

export const whatsappHref = (text, url = shareUrl('whatsapp')) =>
  `https://wa.me/?text=${encodeURIComponent(withLink(text, url))}`;

export const emailHref = (text) =>
  `mailto:?subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(withLink(text, shareUrl('email')))}`;
