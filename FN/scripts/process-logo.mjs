import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../public/ondo-logo.png');

/** Page solid background — tokens.css --color-bg-page-solid */
const PAGE = { r: 248, g: 250, b: 252 };

const BG_TOLERANCE = 28;

const { data, info } = await sharp(logoPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const visited = new Uint8Array(width * height);
const queue = [];

function isBackground(r, g, b, a) {
  if (a < 16) return true;

  const dr = Math.abs(r - PAGE.r);
  const dg = Math.abs(g - PAGE.g);
  const db = Math.abs(b - PAGE.b);
  if (dr <= BG_TOLERANCE && dg <= BG_TOLERANCE && db <= BG_TOLERANCE) {
    return true;
  }

  // Legacy black-background logos
  if (r <= 64 && g <= 64 && b <= 64) {
    return true;
  }

  return false;
}

function enqueue(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = y * width + x;
  if (visited[i]) return;
  const p = i * 4;
  if (!isBackground(data[p], data[p + 1], data[p + 2], data[p + 3])) return;
  visited[i] = 1;
  queue.push(i);
}

for (let x = 0; x < width; x += 1) {
  enqueue(x, 0);
  enqueue(x, height - 1);
}
for (let y = 0; y < height; y += 1) {
  enqueue(0, y);
  enqueue(width - 1, y);
}

while (queue.length > 0) {
  const i = queue.pop();
  const p = i * 4;
  data[p + 3] = 0;

  const x = i % width;
  const y = (i - x) / width;
  enqueue(x - 1, y);
  enqueue(x + 1, y);
  enqueue(x, y - 1);
  enqueue(x, y + 1);
}

const tmpPath = logoPath + '.tmp';

await sharp(data, {
  raw: { width, height, channels: 4 },
})
  .png()
  .toFile(tmpPath);

await fs.promises.rename(tmpPath, logoPath);

console.log('Processed', logoPath, `${width}x${height}`, '(background → transparent)');
