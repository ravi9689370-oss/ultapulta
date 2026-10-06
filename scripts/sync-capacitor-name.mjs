// Reads APP_NAME from src/config.js and syncs it into capacitor.config.json.
// Keeps the app name in ONE place as required.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const cfgPath = join(root, 'src', 'config.js');
const cfgContent = readFileSync(cfgPath, 'utf8');
const match = cfgContent.match(/export\s+const\s+APP_NAME\s*=\s*["']([^"']+)["']/);

if (!match) {
  console.error('Could not find APP_NAME in src/config.js');
  process.exit(1);
}

const appName = match[1];
const capPath = join(root, 'capacitor.config.json');
let capJson = {};
try {
  capJson = JSON.parse(readFileSync(capPath, 'utf8'));
} catch (e) {
  capJson = { appId: 'studio.neuroseek.ai', webDir: 'dist' };
}

capJson.appName = appName;
writeFileSync(capPath, JSON.stringify(capJson, null, 2) + '\n', 'utf8');
console.log(`Synced Capacitor appName to: "${appName}"`);
