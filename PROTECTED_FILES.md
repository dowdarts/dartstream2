
# 🔒 Protected Files - DO NOT MODIFY WITHOUT CONFIRMATION

## Locked Files

The following files are **PROTECTED** and require explicit confirmation before any modifications:

1. **`app-folders/scoring-app/scoring-app.html`** - Main scoring application
2. **`dartstream-webapp/scoring-app.html`** - Fire OS compatible version
3. **`app-folders/dartstream-webapp/scoring-app.html`** - Backup webapp version

## Why Are These Files Locked?

These scoring-app.html files are in **perfect working condition** and should NOT be touched. They form the core of the X01 scoring system and any accidental modifications could break the application.

## What This Means

- **Git Hook Protection**: A pre-commit hook will intercept any attempt to modify these files
- **Confirmation Required**: You must type `YES I UNDERSTAND` to override the protection
- **Safety Check**: This prevents accidental commits that could corrupt the working app

## How to Override Protection (If Absolutely Necessary)

If you MUST modify one of these files:

1. Attempt to commit changes
2. You will see a warning:
   ```
   ⚠️  WARNING: You are about to modify a PROTECTED FILE: app-folders/scoring-app/scoring-app.html
   
   This file is locked to prevent accidental changes.
   The scoring-app.html is in perfect working condition and should not be modified.
   
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

If the file gets corrupted, restore to the last known good version:
```bash
git checkout f288a71 -- app-folders/scoring-app/scoring-app.html
```

---

**Last Protected**: December 14, 2025  
**Protected Version**: f288a71  
**Status**: 🟢 STABLE - DO NOT MODIFY
