
# 🔒 Protected Files - DO NOT MODIFY WITHOUT CONFIRMATION

## Locked Files

The following files are **PROTECTED** and require explicit confirmation before any modifications:

### Critical Core Files
- **`app-folders/scoring-app/scoring-app.html`** - Main X01 scoring application
- **`dartstream-webapp/scoring-app.html`** - Fire OS compatible scoring app
- **`app-folders/dartstream-webapp/scoring-app.html`** - Backup scoring app version

### Scoreboard Files
- **`scoreboard.html`** - Main scoreboard display
- **`app-folders/scoreboard/scoreboard.html`** - App-folders version
- **`dartstream-webapp/scoreboard.html`** - Fire OS compatible scoreboard
- **`app-folders/dartstream-webapp/scoreboard.html`** - Backup scoreboard

### Play Online (Video Streaming)
- **`app-folders/play-online/play-online.html`** - Video call interface
- **`app-folders/play-online/play-online-combined.html`** - Split-screen mode
- **`dartstream-webapp/play-online-combined.html`** - Fire OS split-screen

### Player Account & Stats
- **`app-folders/player-account/player-account.html`** - Player stats page
- **`dartstream-webapp/player-account.html`** - Fire OS stats page
- **`app-folders/dartstream-webapp/player-account.html`** - Backup stats page

### Main Application Pages
- **`index.html`** - Main home page (TEMPORARY UNLOCK for webapp-online-scorer.html link update)
- **`dartstream-webapp/index.html`** - Fire OS home page
- **`controller.html`** - Game controller interface
- **`match-central.html`** - Match management center

## Why Are These Files Locked?

These files form the **core infrastructure** of DartStream and are in **perfect working condition**. Accidental modifications could:
- Break the video streaming system
- Corrupt scoring logic
- Cause authentication issues
- Break the UI/UX flow

## What This Means

- **Git Hook Protection**: A pre-commit hook will intercept any attempt to modify these files
- **Confirmation Required**: You must type `YES I UNDERSTAND` to override the protection
- **Safety Check**: This prevents accidental commits that could damage the application

## How to Override Protection (If Absolutely Necessary)

If you MUST modify one of these files:

1. Attempt to commit changes
2. You will see a warning:
   ```
   ⚠️  WARNING: You are about to modify a PROTECTED FILE: [filename]
   
   This file is locked to prevent accidental changes.
   These application files are in perfect working condition and should not be modified.
   
   Are you ABSOLUTELY SURE you want to modify this file? Type 'YES I UNDERSTAND' to proceed:
   ```

3. Type exactly: `YES I UNDERSTAND`
4. Press Enter to proceed with commit

## To Bypass Hook Entirely (Not Recommended)

If you absolutely must bypass this hook:
```bash
git commit --no-verify
```

**⚠️ WARNING**: This bypasses ALL safety checks. Use only as a last resort.

## Recovery

If any protected file gets corrupted, restore to the last known good version:
```bash
git checkout f288a71 -- [filename]
```

---

**Last Protected**: December 14, 2025  
**Protected Version**: f288a71 (Baseline)  
**Status**: 🟢 STABLE - DO NOT MODIFY  
**Total Files Protected**: 16
