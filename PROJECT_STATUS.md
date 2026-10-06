# PROJECT_STATUS

## Done
- Game implemented: 3-lane endless runner, mirror-flip mechanic, glitch walls,
  pause, game over, local best score, mute, haptics, difficulty ramp.
- Web build verified locally (`vite build` passes, 9.3 kB JS).
- GitHub repo created: https://github.com/ravi9689370-oss/ultapulta
- GitHub Pages live: https://ravi9689370-oss.github.io/ultapulta/ (HTTP 200 verified)
- Android via Capacitor: `android/` created, debug APK built in CI ✓
  (workflow artifact `app-debug-apk`).
- Store pack: listing, privacy policy (md + html), data safety, declarations,
  graphics checklist, Play Console checklist.

## Manual steps for you
1. Host `store/privacy_policy.html` on a free site → paste URL in Play Console.
2. Replace placeholder email `dev@neuroseek.ai` everywhere.
3. Export icon 512×512 PNG + feature graphic 1024×500; take 4–8 screenshots.
4. Create Play Console account ($25), verify, closed-test rule may apply.
5. Generate upload keystore (see README) and build the SIGNED release AAB
   locally or in CI — the artifact we ship is a DEBUG APK, not Play-ready.
6. Answer in-console declarations from `store/declarations.md` and
   `store/data_safety_answers.md`.

## Known limits (honesty box)
- No Android SDK in this environment → APK not built locally; CI artifact used.
- Pages APK/web not playtested on a real device here; QA on a phone recommended.
