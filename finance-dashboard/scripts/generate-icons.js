/**
 * Generate PNG icons from the SVG master icon.
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * If `sharp` is not installed, install it first:
 *   npm install -D sharp
 *
 * This only needs to run once (or whenever the icon changes).
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const svgPath = resolve(publicDir, 'pwa-icon.svg');

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, name));
  console.log(`Created ${name}`);
}

console.log('Done!');
