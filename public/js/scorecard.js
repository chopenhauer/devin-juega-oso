// Picture of the end screen (result + session scoreboard) to send along with «Compartir resultado».
// Drawn on a canvas with the colours of the current theme, so it looks like what is on screen.
const W = 1080;
const PAD = 72;
const ROW = 92;

function cssColor(name) {
  const probe = document.createElement('i');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

function fitText(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// card: { brand, avatar, title, subtitle, heading, columns: [player, wins, points],
//         rows: [{ who, wins, points, leader }], meta, site }
export async function drawScorecard(card) {
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const font = (weight, px) => `${weight} ${px}px ${family}`;
  await Promise.all([document.fonts.load(font(700, 40)), document.fonts.load(font(600, 40))]).catch(() => {});
  const tableTop = 560;
  const H = tableTop + 150 + card.rows.length * ROW + 90 + 130;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const ink = cssColor('--ink');
  const muted = cssColor('--muted');
  const accent = cssColor('--accent');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, cssColor('--color-bg-1'));
  bg.addColorStop(1, cssColor('--color-bg-3'));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = muted;
  ctx.font = font(600, 34);
  ctx.fillText(card.brand, W / 2, 96);

  ctx.font = font(400, 150);
  ctx.fillText(card.avatar, W / 2, 280);

  const title = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  title.addColorStop(0, cssColor('--sol-400'));
  title.addColorStop(0.5, cssColor('--naranja-500'));
  title.addColorStop(1, cssColor('--rosa-400'));
  ctx.fillStyle = title;
  ctx.font = font(700, 96);
  ctx.fillText(fitText(ctx, card.title, W - 2 * PAD), W / 2, 410);

  ctx.fillStyle = muted;
  ctx.font = font(600, 44);
  ctx.fillText(fitText(ctx, card.subtitle, W - 2 * PAD), W / 2, 488);

  const boxH = 150 + card.rows.length * ROW + 70;
  roundRect(ctx, PAD, tableTop, W - 2 * PAD, boxH, 36);
  ctx.fillStyle = cssColor('--color-surface');
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = cssColor('--line');
  ctx.stroke();

  const left = PAD + 48;
  const crownX = left + 22;
  const nameX = left + 64;
  const winsX = W - PAD - 260;
  const pointsX = W - PAD - 48;
  ctx.fillStyle = muted;
  ctx.font = font(700, 38);
  ctx.fillText(card.heading, W / 2, tableTop + 66);
  ctx.font = font(600, 32);
  ctx.textAlign = 'left';
  ctx.fillText(card.columns[0], nameX, tableTop + 130);
  ctx.textAlign = 'right';
  ctx.fillText(card.columns[1], winsX, tableTop + 130);
  ctx.fillText(card.columns[2], pointsX, tableTop + 130);

  card.rows.forEach((row, i) => {
    const y = tableTop + 150 + (i + 1) * ROW - 28;
    ctx.fillStyle = row.leader ? accent : ink;
    ctx.font = font(700, 46);
    if (row.leader) {
      ctx.textAlign = 'center';
      ctx.fillText('👑', crownX, y);
    }
    ctx.textAlign = 'left';
    ctx.fillText(fitText(ctx, row.who, winsX - nameX - 120), nameX, y);
    ctx.textAlign = 'right';
    ctx.fillText(String(row.wins), winsX, y);
    ctx.fillText(String(row.points), pointsX, y);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = muted;
  ctx.font = font(600, 32);
  ctx.fillText(card.meta, W / 2, tableTop + boxH - 32);

  ctx.fillStyle = accent;
  ctx.font = font(700, 48);
  ctx.fillText(card.site, W / 2, H - 70);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob && new File([blob], 'oso-marcador.png', { type: 'image/png' });
}
