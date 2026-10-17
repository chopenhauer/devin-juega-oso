// Word of mouth: texts and links to invite someone to play OSO. No SDKs or social widgets:
// the native share sheet when the device has one, otherwise plain WhatsApp, email and copy links.
// A blank line between the result, the question and the link, so the message breathes.
import { t } from './i18n.js';

export const SITE_URL = 'https://juegaoso.com/';
export const SHARE_SUBJECT = t('share.subject');

// `source` tells GA where the visit came from (whatsapp, email, copy, native).
// `challenge` is the query of a challenge link (challenge.js), which gets its own campaign.
export const shareUrl = (source, challenge = null) =>
  `${SITE_URL}?${challenge ? `${challenge}&` : ''}utm_source=${encodeURIComponent(source)}&utm_medium=share&utm_campaign=${challenge ? 'reto' : 'boca_oreja'}`;

export const withLink = (text, url) => `${text}\n\n${url}`;

// Text to share. With a finished game it brags about the result, never with player names.
export function shareText(result = null) {
  if (!result) return t('share.invite');
  const { mode, winner, scores } = result;
  const [a, b] = scores;
  if (mode === 'solo' && result.size) {
    const params = { size: result.size, level: t(`summary.${result.difficulty}`), mine: a, theirs: b };
    if (winner === 0) return t('share.challenge.won', params);
    if (winner === 1) return t('share.challenge.lost', params);
    return t('share.challenge.draw', params);
  }
  if (mode === 'solo') {
    if (winner === 0) return t('share.solo.won', { mine: a, theirs: b });
    if (winner === 1) return t('share.solo.lost', { mine: a, theirs: b });
    return t('share.solo.draw', { mine: a, theirs: b });
  }
  if (mode === 'four') return t('share.four', { scores: scores.join(' – ') });
  if (winner === null) return t('share.draw', { a, b });
  const [hi, lo] = [Math.max(a, b), Math.min(a, b)];
  return t('share.won', { hi, lo });
}

export const whatsappHref = (text, url = shareUrl('whatsapp')) =>
  `https://wa.me/?text=${encodeURIComponent(withLink(text, url))}`;

export const emailHref = (text, url = shareUrl('email')) =>
  `mailto:?subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(withLink(text, url))}`;
