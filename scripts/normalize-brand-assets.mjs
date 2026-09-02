// Build browser/search icons from the existing logo, with a 20% closer framing.
// Keep logo.png as the unzoomed source so rerunning never compounds the zoom.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = await readFile(new URL('../public/logo.png', import.meta.url));
const iconScale = 1.2;
const canvasSize = 512;
const scaledSize = Math.round(canvasSize * iconScale);
const inset = Math.floor((scaledSize - canvasSize) / 2);
const iconSource = await sharp(source)
  .resize(scaledSize, scaledSize)
  .extract({ left: inset, top: inset, width: canvasSize, height: canvasSize })
  .ensureAlpha()
  .png()
  .toBuffer();

for (const size of [16, 32, 48, 96, 192, 512]) {
  await sharp(iconSource).resize(size, size).png()
    .toFile(fileURLToPath(new URL(`../public/icon-${size}.png`, import.meta.url)));
}
await sharp(iconSource).resize(180, 180).png()
  .toFile(fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url)));

// ICO container with PNG frames; do not rename JPEG bytes to .ico.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(size => sharp(iconSource).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, i) => {
  const entry = 6 + 16 * i;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
const ico = Buffer.concat([header, ...frames]);
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), ico);
await writeFile(new URL('../public/favicon.ico', import.meta.url), ico);
console.log('Generated icons at 120% artwork scale; original logo unchanged.');
