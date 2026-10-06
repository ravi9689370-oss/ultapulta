# Play Console Checklist (click-by-click)

## One-time account setup
1. Create a developer account at https://play.google.com/console (one-time $25).
2. Verify identity + payment.
3. NEW: personal accounts created after Nov 2023 must run a **closed test**
   (≥12 testers opted in for 14 continuous days) before production access is
   granted. Numbers may change — re-verify on the official page:
   https://support.google.com/googleplay/android-developer/answer/14151465

## Create the app
1. Create app → App name: "UltaPulta: Mirror Runner"
2. Default language: English (US)
3. App or game: **Game**
4. Free or paid: **Free**
5. Declarations: Play policy compliance ✓

## Set up app — App content
1. Privacy policy → paste the hosted URL from `store/privacy_policy.md`
2. App access → "All functionality is available without special access"
3. Ads → No
4. Content rating → fill questionnaire from `store/declarations.md`
5. Target audience → 13–17 & 18+ (not children)
6. News app / COVID-19 / Government / Financial / Health → No/None
7. Data safety → answers from `store/data_safety_answers.md`

## Store listing
- Title / short / full description from `store/listing.md`
- Icon 512, feature graphic 1024×500, ≥2 phone screenshots
- Category: Games → Arcade; Tags from listing.md
- Contact email + website

## Release
1. Create new release → Production (or Closed testing first — required for new
   personal accounts)
2. Upload the **signed release AAB** (you must generate this — the CI artifact
   is a DEBUG apk; see README "Release build")
3. Release name: 1.0.0; paste release notes from listing.md
4. Review and roll out

## Post-launch
- Watch Android vitals: crash rate, ANR, cold-start time
- Reply to reviews weekly
- For updates: bump `version` in `package.json` and Android `versionCode`,
  build a new signed AAB, upload as a new release.
