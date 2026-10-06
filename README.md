# UltaPulta

A one-tap arcade runner where the screen suddenly mirrors itself — controls
invert, your score doubles, and your reflexes get fried. Offline, no ads,
no account.

## Play now
https://ravi9689370-oss.github.io/ultapulta/

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
```

## Build the web app
```bash
npm run build      # outputs ./dist with relative base './'
```

## Android (Capacitor)
```bash
npm run build:android          # build web + sync into android/
# Requires a local Android SDK to build an APK:
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Without an Android SDK you can still get a debug APK from GitHub Actions:
push to `main` → the **Build Android Debug APK** workflow uploads
`app-debug-apk` as a downloadable artifact.

## Release build (Play Store AAB)
You need the Android SDK + a keystore:
```bash
keytool -genkey -v -keystore ultapulta-upload.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias upload
# create android/key.properties:
storePassword=...
keyPassword=...
keyAlias=upload
storeFile=../ultapulta-upload.jks
cd android && ./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```
Back up the keystore and passwords — losing them blocks future updates.
Never commit `ultapulta-upload.jks` or `key.properties`.

## Project layout
- `src/config.js` — single source of truth for app name/version
- `src/game.js` — game engine (Canvas 2D, no assets, WebAudio SFX)
- `src/main.js` — bootstrap + service worker registration
- `public/` — icon, manifest, offline service worker
- `android/` — Capacitor Android project
- `.github/workflows/pages.yml` — GitHub Pages deploy
- `.github/workflows/android.yml` — debug APK artifact
- `store/` — Play Console copy & checklists
