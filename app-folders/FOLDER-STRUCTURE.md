# 📂 DartStream2 Folder Structure - Visual Guide

## Complete Project Organization

```
DartStream2/
│
├─ 📁 app-folders/                           ⭐ START HERE
│  │
│  ├─ 📁 scoring-app/                        (Professional Scoring App)
│  │  ├─ 📄 scoring-app.html                 ← OPEN THIS FILE
│  │  ├─ 📄 app-main.js
│  │  ├─ 📄 game-setup.js
│  │  ├─ 📄 player-library.js
│  │  ├─ 📄 scoring-app.js
│  │  ├─ 📄 app.js
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 supabase-config.js
│  │  ├─ 📄 styles.css
│  │  ├─ 📄 manifest-scoring.json
│  │  ├─ 🖼️ dartstream-logo.png
│  │  ├─ 📁 flags/                          (40+ country flags)
│  │  │  ├─ Flag_of_Canada-512x256.png
│  │  │  ├─ Flag_of_England-512x307.png
│  │  │  ├─ Flag_of_France-512x341.png
│  │  │  └─ ... (40+ more)
│  │  └─ 📁 logos/                          (Organization logos)
│  │     ├─ AADS OFFIAL LOGO.png
│  │     ├─ AADSDarts.com Logo.png
│  │     ├─ CGC-TV Logo.png
│  │     └─ ... (more logos)
│  │
│  ├─ 📁 videostreamscoringapp/              (Video Stream Scoring App)
│  │  ├─ 📄 videostreamscoringapp.html       ← OPEN THIS FILE
│  │  ├─ 📄 app.js
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 styles.css
│  │  ├─ 📄 manifest-scoring.json
│  │  ├─ 🖼️ dartstream-logo.png
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  ├─ 📁 dartstream-webapp/                  ⭐ (FIRE OS/SILK BROWSER - ALL APPS IN ONE)
│  │  ├─ 📄 index.html                       ← OPEN THIS FILE (Landing page)
│  │  ├─ 📄 scoring-app.html                 (Dart scoring variant)
│  │  ├─ 📄 controller.html                  (Remote controller variant)
│  │  ├─ 📄 scoreboard.html                  (Streaming display variant)
│  │  ├─ 📄 match-central.html               (Match management variant)
│  │  ├─ 📄 player-account.html              (Player stats variant)
│  │  ├─ 📄 app-main.js
│  │  ├─ 📄 app.js
│  │  ├─ 📄 game-setup.js
│  │  ├─ 📄 player-library.js
│  │  ├─ 📄 scoring-app.js
│  │  ├─ 📄 player-account.js
│  │  ├─ 📄 play-online.js
│  │  ├─ 📄 online-scoring-app.js
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 supabase-config.js
│  │  ├─ 📄 styles.css
│  │  ├─ 📄 create-game-rooms-table.sql
│  │  ├─ 📄 package.json
│  │  ├─ 📄 README.md
│  │  ├─ 🖼️ dartstream-logo.png
│  │  ├─ 🖼️ button 1.png
│  │  ├─ 🖼️ button 2.png
│  │  ├─ 🖼️ button 3.png
│  │  ├─ 📁 flags/                          (40+ country flags)
│  │  └─ 📁 logos/                          (Organization logos)
│  │
│  ├─ 📁 controller/                         (Remote Match Controller)
│  │  ├─ 📄 controller.html                  ← OPEN THIS FILE
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 supabase-config.js
│  │  ├─ 📄 manifest.json
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  ├─ 📁 scoreboard/                         (OBS Streaming Display)
│  │  ├─ 📄 scoreboard.html                  ← OPEN THIS FILE
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  ├─ 📁 match-central/                      (Match Management)
│  │  ├─ 📄 match-central.html               ← OPEN THIS FILE
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  ├─ 📁 player-account/                     (Player Stats & Profiles)
│  │  ├─ 📄 player-account.html              ← OPEN THIS FILE
│  │  ├─ 📄 player-account.js
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 styles.css
│  │  ├─ 🖼️ dartstream-logo.png
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  ├─ 📁 index/                              (Landing Page)
│  │  ├─ 📄 index.html                       ← OPEN THIS FILE
│  │  ├─ 📄 browser-detect.js
│  │  ├─ 📄 supabase-config.js
│  │  ├─ 📄 manifest.json
│  │  ├─ 🖼️ dartstream-logo.png
│  │  ├─ 📁 flags/
│  │  └─ 📁 logos/
│  │
│  └─ 📚 DOCUMENTATION FILES
│     ├─ 📖 INDEX.md                         ⭐ START HERE - Quick Overview
│     ├─ 📖 00-START-HERE.md                 Complete quick start guide
│     ├─ 📖 README.md                        Complete Documentation
│     ├─ 📖 QUICK-REFERENCE.md               Fast Deployment Guide
│     ├─ 📖 ORGANIZATION-SUMMARY.md          Overview of Changes
│     ├─ 📖 DEPLOYMENT-CHECKLIST.md          Complete Launch Guide
│     ├─ 📖 FILE-LISTING.md                  Detailed File Manifest
│     ├─ 📖 FINAL-SUMMARY.md                 Project completion summary
│     └─ 📖 FOLDER-STRUCTURE.md              This file
│
├─ 📁 bring over/                            (Legacy Backup - Unchanged)
│  └─ [Old version files]
│
├─ 📁 flags/                                 (Original - Reference)
├─ 📁 logos/                                 (Original - Reference)
├─ 📁 .git/                                  (Version Control)
├─ 📁 .github/                               (GitHub Config)
├─ 📄 Original Root Files (Unchanged)
│  ├─ index.html
│  ├─ scoring-app.html
│  ├─ controller.html
│  ├─ match-central.html
│  ├─ player-account.html
│  ├─ scoreboard.html
│  ├─ app.js
│  ├─ scoring-app.js
│  ├─ app-main.js
│  ├─ game-setup.js
│  ├─ player-library.js
│  ├─ player-account.js
│  ├─ supabase-config.js
│  ├─ browser-detect.js
│  ├─ styles.css
│  ├─ dartstream-logo.png
│  ├─ manifest.json
│  ├─ manifest-scoring.json
│  ├─ README.md
│  ├─ MODULAR-ARCHITECTURE.md
│  ├─ LICENSE
│  └─ [Database migration .sql files]
│
└─ 📄 Config Files
   ├─ .htmlhintrc
   ├─ .stylelintrc.json
   ├─ .nojekyll
   └─ [Git config files]
```

---

## 🎯 Quick Navigation

### 📍 For Deployment
```
cd app-folders/[app-name]/
→ Open [app-name].html in browser
→ All dependencies are included!
```

### 📍 For Documentation
```
app-folders/
├─ INDEX.md                 ⭐ Quick overview (start here)
├─ README.md                Complete details
├─ QUICK-REFERENCE.md       Deployment guide
├─ DEPLOYMENT-CHECKLIST.md  Launch checklist
└─ FILE-LISTING.md          File inventory
```

### 📍 For Asset Customization
```
app-folders/[app-name]/
├─ dartstream-logo.png      ← Replace with your logo
├─ styles.css               ← Customize colors/fonts
├─ flags/                   ← Add/modify country flags
└─ logos/                   ← Add/modify partner logos
```

---

## 📊 Size Overview

| Folder | Files | Size | Purpose |
|--------|-------|------|---------|
| **scoring-app** | 33 | ~2MB | Main scoring app (ES6) |
| **videostreamscoringapp** | 25 | ~1.5MB | Video stream scoring (Legacy) |
| **dartstream-webapp** | 35 | ~2.2MB | Complete app suite (Fire OS/Silk) |
| **controller** | 26 | ~1.5MB | Remote control |
| **scoreboard** | 24 | ~1.5MB | OBS display |
| **match-central** | 24 | ~1.5MB | Dashboard |
| **player-account** | 27 | ~1.5MB | Stats/profiles |
| **index** | 27 | ~1.5MB | Landing page |
| **Docs** | 9 | ~600KB | Documentation |
| **Total** | 217 | ~13MB | Everything |

---

## 🚀 Deployment Paths

### Path 1: Deploy Single App (Recommended)
```
Copy: app-folders/scoring-app/
↓
Upload to: https://your-domain.com/scoring-app/
↓
Access: https://your-domain.com/scoring-app/scoring-app.html
```

### Path 2: Deploy All Apps
```
Copy: app-folders/
↓
Upload to: https://your-domain.com/
↓
Access: https://your-domain.com/scoring-app/scoring-app.html
        https://your-domain.com/controller/controller.html
        etc.
```

### Path 3: Simplified URLs (Rename to index.html)
```
Copy: app-folders/
↓
Rename: scoring-app/scoring-app.html → scoring-app/index.html
↓
Upload to: https://your-domain.com/
↓
Access: https://your-domain.com/scoring-app/
        https://your-domain.com/controller/
        etc.
```

---

## 📋 File Dependency Map

### Used by ALL Apps
```
browser-detect.js      ← All 6 apps use this
flags/                 ← All 6 apps include this
logos/                 ← All 6 apps include this
```

### Used by MULTIPLE Apps
```
styles.css            ← scoring-app, player-account
supabase-config.js    ← scoring-app, controller, index
dartstream-logo.png   ← scoring-app, index, player-account
manifest.json         ← controller, index
```

### App-SPECIFIC Files
```
scoring-app/
  ├─ scoring-app.js (unique)
  ├─ app-main.js (unique)
  ├─ game-setup.js (unique)
  ├─ player-library.js (unique)
  ├─ manifest-scoring.json (unique)
  └─ app.js (legacy, scoring-app only)

player-account/
  └─ player-account.js (unique)

All others:
  └─ No unique files (just browser-detect.js)
```

---

## ✨ Feature Access

### Scoring
```
→ Open app-folders/scoring-app/scoring-app.html
→ Select game mode (301/501/Custom)
→ Select players
→ Start scoring
```

### Streaming
```
→ Open app-folders/scoreboard/scoreboard.html
→ Add as browser source in OBS
→ Use #00ff00 for chroma key
→ Go live!
```

### Player Stats
```
→ Open app-folders/player-account/player-account.html
→ Login with Supabase
→ View lifetime statistics
```

### Match Management
```
→ Open app-folders/match-central/match-central.html
→ View active matches
→ Get connection codes
→ Monitor progress
```

### Remote Control
```
→ Open app-folders/controller/controller.html
→ Enter connection code
→ Control scoring remotely
```

### Navigation Hub
```
→ Open app-folders/index/index.html
→ See all available apps
→ Quick access to all features
```

---

## 🔐 Security & Configuration

### Database Configuration
All database-connected apps have:
```
supabase-config.js
├─ SUPABASE_URL
├─ SUPABASE_ANON_KEY (safe for client-side)
└─ Already configured (no setup needed!)
```

### No Secrets Exposed
✓ Anonymous key only (safe)
✓ No private API keys
✓ No passwords in code
✓ All RLS policies enforced at Supabase

---

## 📱 Browser Compatibility

All apps include `browser-detect.js` which:
- ✓ Detects Fire OS & Silk browsers
- ✓ Auto-redirects to optimized version
- ✓ Works on desktop, tablet, mobile
- ✓ Supports Chrome, Firefox, Safari, Edge

---

## 🎯 Recommended Workflow

### For New Users
1. Read: `app-folders/INDEX.md`
2. Explore: Open any HTML file in browser
3. Test: Use all features locally
4. Deploy: Follow `QUICK-REFERENCE.md`
5. Launch: Use `DEPLOYMENT-CHECKLIST.md`

### For Developers
1. Choose app to work on
2. Edit files in specific folder
3. Test in browser (no build needed)
4. Commit changes to git
5. Deploy updated folder

### For Deployment
1. Choose hosting platform
2. Select app folder(s) to deploy
3. Upload to hosting
4. Test deployed version
5. Share URL with users

---

## 💾 Backup & Version Control

### Original Files Preserved
✓ All root files unchanged
✓ Git history intact
✓ `dartstream-webapp/` preserved
✓ `bring over/` backup kept
✓ Can switch back anytime

### Easy to Update
- Edit files in app folders
- Commit to git
- Deploy specific app
- Keep others running

---

## 📞 Quick Help

**Can't find a file?** → See `FILE-LISTING.md`

**How to deploy?** → See `QUICK-REFERENCE.md`

**Need complete info?** → See `README.md`

**Getting started?** → See `INDEX.md`

**Ready to launch?** → Use `DEPLOYMENT-CHECKLIST.md`

---

**Everything is organized, documented, and ready to go!**

✅ Start with: `app-folders/INDEX.md`

✨ Happy deploying! 🚀
