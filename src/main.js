import { Game } from './game.js';
import { APP_NAME } from './config.js';

document.title = APP_NAME;
const canvas = document.getElementById('game');
const game = new Game(canvas);
game.renderUI();

// PWA service worker (web only, not inside Capacitor)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
