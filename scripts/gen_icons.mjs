// Renders the app icon SVG to all required PNGs:
// - Android mipmap launcher icons (all densities)
// - Adaptive-icon foreground (1024, transparent, safe-zone padded)
// - Round launcher icons
// - Splash screens (all orientations/densities)
// - Store icon 512 + PWA icons
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconSvg = readFileSync(join(root, 'public', 'icon.svg'), 'utf8');

// foreground: same glyph, smaller (safe zone) on transparent background
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${iconSvg.match(/<defs>[\s\S]*?<\/defs>/)[0]}
  <g transform="translate(106,106) scale(0.586)">
    <circle cx="176" cy="256" r="92" fill="url(#a)"/>
    <circle cx="336" cy="256" r="92" fill="url(#b)"/>
    <rect x="250" y="56" width="12" height="400" rx="6" fill="#e8f6ff"/>
  </g>
</svg>`;

// splash: dark bg with centered logo
function splashSvg(w, h) {
  const s = Math.min(w, h) * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="#0a0e1a"/>
    <g transform="translate(${(w - s) / 2},${(h - s) / 2}) scale(${s / 512})">
      ${iconSvg.match(/<defs>[\s\S]*?<\/defs>/)[0]}
      <rect width="512" height="512" rx="96" fill="#0a0e1a"/>
      <circle cx="176" cy="256" r="92" fill="url(#a)"/>
      <circle cx="336" cy="256" r="92" fill="url(#b)"/>
      <rect x="250" y="56" width="12" height="400" rx="6" fill="#e8f6ff"/>
    </g>
  </svg>`;
}

function render(svg, size, outPath, w, h) {
  const r = new Resvg(svg, { fitTo: w ? { mode: 'width', value: w } : { mode: 'width', value: size } });
  writeFileSync(outPath, r.render().asPng());
  console.log('wrote', outPath);
}

const res = join(root, 'android', 'app', 'src', 'main', 'res');
const density = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, size] of Object.entries(density)) {
  const dir = join(res, `mipmap-${d}`);
  mkdirSync(dir, { recursive: true });
  render(iconSvg, size, join(dir, 'ic_launcher.png'), size);
  render(iconSvg, size, join(dir, 'ic_launcher_round.png'), size);
  render(fgSvg, Math.round(size * 2.67), join(dir, 'ic_launcher_foreground.png'), Math.round(size * 2.67));
}
// splash
render(splashSvg(320, 320), 320, join(res, 'drawable', 'splash.png'), 320);
const splashSize = { 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280], 'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280] };
for (const [dir, [w, h]] of Object.entries(splashSize)) {
  mkdirSync(join(res, dir), { recursive: true });
  render(splashSvg(w, h), w, join(res, dir, 'splash.png'), w);
}
// PWA + store
render(iconSvg, 512, join(root, 'public', 'icon-512.png'), 512);
render(iconSvg, 192, join(root, 'public', 'icon-192.png'), 192);
console.log('done');
