# Graphics Checklist

| Asset | Size | Format | Status |
|---|---|---|---|
| App icon (Play Console) | 512×512 px | 32-bit PNG, ≤1 MB, opaque bg OK | Template exists at `public/icon.svg` — export a 512 PNG |
| Feature graphic | 1024×500 px | PNG/JPEG | Concept: dark navy bg, two mirrored glowing dots, tagline "The screen lies." |
| Phone screenshots (min 2, ideal 4–8) | 9:16, e.g. 1080×1920 | PNG/JPEG | Capture from real gameplay incl. mirror mode |
| 7-inch tablet (optional) | e.g. 1200×1920 | PNG/JPEG | Optional for phone-first game |
| 10-inch tablet (optional) | e.g. 1600×2560 | PNG/JPEG | Optional |

Capture steps:
1. Run `npm run dev` and open Chrome DevTools device preview, or install the
   debug APK on a device.
2. Play into a mirror-mode moment and a normal run.
3. Take 4 screenshots: title screen, normal run, mirror mode, game over.
4. Suggested captions:
   - "One-tap lane runner"
   - "Fast reflex gameplay"
   - "Mirror mode flips the screen — and your controls"
   - "Beat your best, no account needed"
