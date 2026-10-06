import { APP_NAME, APP_TAGLINE } from './config.js';

const BEST_KEY = 'ultapulta_best';
const MUTE_KEY = 'ultapulta_muted';

// ---------- tiny audio ----------
let audioCtx = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';
function ac() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { audioCtx = null; }
  }
  // Android WebView often leaves the context "suspended": force-resume on every call.
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
// Mobile browsers only unlock audio inside a real user gesture — unlock early.
window.addEventListener('pointerdown', () => ac(), { once: false, passive: true });

// simple background music loop
let musicTimer = null;
let noteIdx = 0;
const MUSIC = [262, 330, 392, 330, 440, 392, 330, 262, 294, 349, 440, 349, 523, 440, 349, 294];
function startMusic() {
  stopMusic();
  musicTimer = setInterval(() => {
    if (!muted && !document.hidden) beep(MUSIC[noteIdx++ % MUSIC.length], 0.22, 'sine', 0.05);
  }, 240);
}
function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

function beep(freq, dur = 0.08, type = 'square', vol = 0.15) {
  if (muted) return;
  const ctx = ac(); if (!ctx) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}

// ---------- game constants ----------
const LANES = 3;
const ROW_H = 54;
const PLAYER_Y_RATIO = 0.78;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'title'; // title | playing | paused | over
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.rows = [];        // {y, gap, fakeGaps:Set, passed}
    this.score = 0;
    this.speed = 180;      // px/s base
    this.spawnY = -ROW_H;
    this.dist = 0;
    this.playerLane = 1;   // logical lane 0..2
    this.playerX = 0;      // eased pixel x (screen space)
    this.mirror = false;
    this.mirrorTimer = 6;
    this.warnTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    this.touchStart = null;
    this.ui = document.getElementById('ui');
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.setPaused(true);
    });
    this.bindInput();
    requestAnimationFrame((t) => this.loop(t));
  }

  onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.laneW = Math.min(this.W * 0.86, 420) / LANES;
    this.fieldX = (this.W - this.laneW * LANES) / 2;
  }

  laneCenterLogical(lane) { return this.fieldX + lane * this.laneW + this.laneW / 2; }
  // logical lane -> screen x (mirrored when mirror mode)
  laneX(lane) {
    const x = this.laneCenterLogical(lane);
    return this.mirror ? this.W - x : x;
  }

  reset() {
    this.rows = [];
    this.score = 0;
    this.speed = 180;
    this.dist = 0;
    this.playerLane = 1;
    this.mirror = false;
    this.mirrorTimer = 6 + Math.random() * 3;
    this.warnTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    // pre-fill some rows
    for (let i = 0; i < 3; i++) this.spawnRow(-i * ROW_H * 3 - 200);
  }

  spawnRow(y) {
    const gap = Math.floor(Math.random() * LANES);
    const fakeGaps = new Set();
    if (this.mirror && this.score > 8 && Math.random() < 0.35) {
      // a wall that looks real but is passable (glitchy) in one non-gap lane
      let f = Math.floor(Math.random() * LANES);
      while (f === gap) f = Math.floor(Math.random() * LANES);
      fakeGaps.add(f);
    }
    this.rows.push({ y, gap, fakeGaps, passed: false });
  }

  start() {
    ac(); this.reset(); this.state = 'playing'; this.renderUI();
    startMusic();
    beep(440, 0.1, 'sine', 0.2);
  }
  setPaused(p) {
    if (p && this.state === 'playing') { this.state = 'paused'; this.renderUI(); stopMusic(); }
    else if (!p && this.state === 'paused') { this.state = 'playing'; this.renderUI(); startMusic(); }
  }
  gameOver() {
    this.state = 'over';
    this.shake = 14;
    stopMusic();
    if (navigator.vibrate) navigator.vibrate(120);
    beep(160, 0.3, 'sawtooth', 0.2);
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem(BEST_KEY, String(this.best));
    }
    this.renderUI();
  }

  // ---------- input ----------
  bindInput() {
    const cvs = this.canvas;
    cvs.addEventListener('pointerdown', (e) => {
      this.touchStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    cvs.addEventListener('pointerup', (e) => {
      if (this.state !== 'playing') return;
      const dx = e.clientX - this.touchStart.x;
      const dy = e.clientY - this.touchStart.y;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        this.moveBy(dx > 0 ? 1 : -1);
      } else {
        // tap: go toward tapped side relative to screen
        const targetLogical = this.screenXToLane(e.clientX);
        this.moveTo(targetLogical);
      }
      this.touchStart = null;
    });
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') {
        if (e.key === ' ' || e.key === 'Enter') {
          if (this.state === 'title' || this.state === 'over') this.start();
          else if (this.state === 'paused') this.setPaused(false);
        }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a') this.moveBy(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') this.moveBy(1);
      if (e.key === 'p' || e.key === 'Escape') this.setPaused(true);
    });
    this.ui.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const a = t.dataset.action;
      if (a === 'start') this.start();
      else if (a === 'resume') this.setPaused(false);
      else if (a === 'pause') this.setPaused(true);
      else if (a === 'mute') {
        muted = !muted;
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
        this.renderUI();
      }
    });
  }

  screenXToLane(x) {
    // which lane the tap is over, in SCREEN space
    let laneIdx = Math.floor((x - this.fieldX) / this.laneW);
    laneIdx = Math.max(0, Math.min(LANES - 1, laneIdx));
    // convert screen lane to logical lane
    return this.mirror ? (LANES - 1 - laneIdx) : laneIdx;
  }

  moveBy(dirScreen) {
    // dirScreen: +1 means "toward right of screen"
    const dirLogical = this.mirror ? -dirScreen : dirScreen;
    this.moveTo(this.playerLane + dirLogical);
  }

  moveTo(logical) {
    logical = Math.max(0, Math.min(LANES - 1, logical));
    if (logical !== this.playerLane) {
      this.playerLane = logical;
      beep(520, 0.05, 'triangle', 0.12);
    }
  }

  // ---------- update ----------
  update(dt) {
    const k = Math.min(dt, 0.05);
    this.time += k;
    this.speed = Math.min(420, 180 + this.score * 4);
    const v = this.speed * k;
    this.dist += v;

    // mirror toggle timer
    this.mirrorTimer -= k;
    if (!this.mirror && this.mirrorTimer <= 1.2 && this.mirrorTimer > 0 && this.warnTimer <= 0) {
      this.warnTimer = 1.2;
      beep(300, 0.15, 'square', 0.15);
    }
    if (this.warnTimer > 0) this.warnTimer -= k;
    if (this.mirrorTimer <= 0) {
      this.mirror = !this.mirror;
      this.mirrorTimer = this.mirror
        ? 3.5 + Math.random() * 2.5
        : 5 + Math.random() * 4;
      this.flash = 0.5;
      if (navigator.vibrate) navigator.vibrate(30);
      beep(this.mirror ? 220 : 660, 0.15, 'sine', 0.2);
    }

    // move rows
    for (const r of this.rows) r.y += v;
    // spawn / cull
    for (let i = this.rows.length - 1; i >= 0; i--) {
      if (this.rows[i].y > this.H + ROW_H) this.rows.splice(i, 1);
    }
    let topY = Math.min(...this.rows.map(r => r.y), Infinity);
    while (topY > -ROW_H * 4) {
      const gapRows = this.rows.length ? Math.min(...this.rows.map(r => r.y)) : 200;
      const y = gapRows - ROW_H * (1 + Math.random() * 1.4);
      this.spawnRow(y);
      topY = y;
    }

    // scoring + collision
    const playerY = this.H * PLAYER_Y_RATIO;
    for (const r of this.rows) {
      if (!r.passed && r.y - ROW_H / 2 > playerY - 14) {
        r.passed = true;
        this.score += this.mirror ? 2 : 1;
        beep(880, 0.05, 'sine', 0.08);
      }
      // collision when row overlaps player band
      if (Math.abs(r.y - playerY) < ROW_H / 2 - 10) {
        const passable = (this.playerLane === r.gap) || r.fakeGaps.has(this.playerLane);
        if (!passable) {
          this.gameOver();
          return;
        }
      }
    }

    // ease player toward lane
    const targetX = this.laneX(this.playerLane);
    this.playerX += (targetX - this.playerX) * Math.min(1, k * 14);

    this.shake = Math.max(0, this.shake - k * 30);
    this.flash = Math.max(0, this.flash - k);
  }

  // ---------- render ----------
  draw() {
    const ctx = this.ctx;
    const { W, H } = this;
    // shake
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    // background
    ctx.fillStyle = this.mirror ? '#1a0b2e' : '#0a0e1a';
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // grid lines
    ctx.strokeStyle = this.mirror ? 'rgba(190,120,255,0.18)' : 'rgba(80,140,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= LANES; i++) {
      const x = this.fieldX + i * this.laneW;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // rows
    for (const r of this.rows) {
      for (let lane = 0; lane < LANES; lane++) {
        if (lane === r.gap) continue;
        const isFake = r.fakeGaps.has(lane);
        const x = this.laneX(lane) - this.laneW / 2;
        if (isFake) {
          ctx.strokeStyle = 'rgba(255,120,120,0.5)';
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(x + 6, r.y - ROW_H / 2 + 6, this.laneW - 12, ROW_H - 12);
          ctx.setLineDash([]);
        } else {
          const grad = ctx.createLinearGradient(0, r.y - ROW_H / 2, 0, r.y + ROW_H / 2);
          grad.addColorStop(0, this.mirror ? '#7b2ff7' : '#2f6df7');
          grad.addColorStop(1, this.mirror ? '#4a12a8' : '#173a8a');
          ctx.fillStyle = grad;
          ctx.fillRect(x + 4, r.y - ROW_H / 2 + 4, this.laneW - 8, ROW_H - 8);
        }
      }
    }

    // player
    const py = H * PLAYER_Y_RATIO;
    ctx.fillStyle = this.mirror ? '#ff5cf4' : '#4ef0ff';
    ctx.beginPath();
    ctx.arc(this.playerX, py, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(this.playerX, py - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // mirror line indicator
    if (this.mirror) {
      ctx.strokeStyle = 'rgba(255,92,244,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    }

    // flip flash
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.4})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    // warning banner
    if (this.warnTimer > 0 && !this.mirror) {
      ctx.fillStyle = 'rgba(255,80,80,0.9)';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ MIRROR INCOMING — CONTROLS WILL FLIP ⚠', W / 2, 60);
    }
    if (this.mirror && this.state === 'playing') {
      ctx.fillStyle = 'rgba(255,92,244,0.9)';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('MIRROR MODE ×2 — SCREEN IS LYING', W / 2, 28);
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(String(this.score), 20, 44);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px system-ui';
    ctx.fillText('BEST ' + this.best, W - 20, 44);

    ctx.restore();
  }

  renderUI() {
    const overlay = document.getElementById('overlay');
    let html = '';
    if (this.state === 'title') {
      html = `
        <h1>${APP_NAME}</h1>
        <p class="tag">${APP_TAGLINE}</p>
        <p class="hint">Tap a lane to move there. When the mirror flips,<br>the screen lies — tap the lane that matches the <b>true</b> gap.</p>
        <button data-action="start" class="big">▶ Play</button>
        <p class="best">Best: ${this.best}</p>
        <button data-action="mute" class="ghost">${muted ? '🔇 Unmute' : '🔊 Mute'}</button>`;
    } else if (this.state === 'paused') {
      html = `
        <h2>Paused</h2>
        <button data-action="resume" class="big">▶ Resume</button>
        <button data-action="mute" class="ghost">${muted ? '🔇 Unmute' : '🔊 Mute'}</button>`;
    } else if (this.state === 'over') {
      html = `
        <h2>Game Over</h2>
        <p class="score">Score: ${this.score}</p>
        <p class="best">Best: ${this.best}</p>
        <button data-action="start" class="big">↻ Retry</button>`;
    } else if (this.state === 'playing') {
      html = `<button data-action="pause" class="pause">II</button>`;
    }
    overlay.innerHTML = html;
    overlay.className = this.state === 'playing' ? 'overlay playing' : 'overlay';
  }

  loop(t) {
    if (!this.lastT) this.lastT = t;
    const dt = (t - this.lastT) / 1000;
    this.lastT = t;
    if (this.state === 'playing') this.update(dt);
    this.draw();
    requestAnimationFrame((nt) => this.loop(nt));
  }
}
