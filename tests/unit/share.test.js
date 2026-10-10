import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailHref, shareText, shareUrl, whatsappHref } from '../../public/js/share.js';

test('shared links say where the visit came from', () => {
  assert.equal(
    shareUrl('whatsapp'),
    'https://juegaoso.com/?utm_source=whatsapp&utm_medium=share&utm_campaign=boca_oreja',
  );
});

test('the share text tells the result without names', () => {
  assert.match(shareText(), /^Juega conmigo a OSO 🐻/);
  assert.equal(
    shareText({ mode: 'solo', winner: 0, scores: [7, 5] }),
    '¡He ganado a la máquina 7 a 5 en OSO 🐻! ¿Te atreves?',
  );
  assert.equal(
    shareText({ mode: 'solo', winner: 1, scores: [2, 4] }),
    'La máquina me ha ganado 4 a 2 en OSO 🐻. ¿Tú puedes con ella?',
  );
  assert.match(shareText({ mode: 'solo', winner: null, scores: [3, 3] }), /^¡Empate 3 a 3 contra la máquina/);
  assert.equal(
    shareText({ mode: 'two', winner: 1, scores: [5, 8] }),
    '¡Partidazo de OSO 🐻: 8 a 5! ¿Juegas conmigo?',
  );
  assert.match(shareText({ mode: 'two', winner: null, scores: [4, 4] }), /^¡Empate 4 a 4 en OSO/);
  assert.match(shareText({ mode: 'four', winner: 2, scores: [1, 2, 6, 0] }), /a cuatro: 1 – 2 – 6 – 0/);
});

test('WhatsApp and email links carry the text and their own utm_source', () => {
  const wa = new URL(whatsappHref('Hola'));
  assert.equal(wa.origin, 'https://wa.me');
  assert.equal(wa.searchParams.get('text'), `Hola ${shareUrl('whatsapp')}`);
  const mail = new URL(emailHref('Hola'));
  assert.equal(mail.protocol, 'mailto:');
  assert.equal(mail.searchParams.get('subject'), '¿Jugamos a OSO? 🐻');
  assert.equal(mail.searchParams.get('body'), `Hola\n\n${shareUrl('email')}`);
});
