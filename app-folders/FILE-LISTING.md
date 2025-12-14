# 📦 DartStream2 App Folders - Complete File Listing

## Overview
All 6 apps with their complete file structures and dependencies.

---

## 📂 scoring-app/ (33 files)
**Professional Dart Scoring Application**

### Entry Point
- `scoring-app.html` - Main application

### JavaScript Files (9)
- `scoring-app.js` - Core scoring engine
- `app-main.js` - Module orchestrator
- `app.js` - Legacy support
- `game-setup.js` - Game configuration
- `player-library.js` - Player database
- `supabase-config.js` - Database config
- `browser-detect.js` - Browser detection

### Styling
- `styles.css` - Complete stylesheet

### Configuration
- `manifest-scoring.json` - PWA manifest

### Branding
- `dartstream-logo.png` - Application logo

### Assets
- `/flags/` - 40+ country flags
  - Flag_of_*.png
- `/logos/` - Organization/partner logos
  - AADS OFFIAL LOGO.png
  - AADSDarts.com Logo.png
  - CGC-TV Logo.png
  - cgcdarts.com logo.png
  - (and others)

---

## 🎮 controller/ (26 files)
**Remote Match Controller**

### Entry Point
- `controller.html` - Main application

### JavaScript Files
- `supabase-config.js` - Database config
- `browser-detect.js` - Browser detection

### Configuration
- `manifest.json` - PWA manifest

### Assets
- `/flags/` - 40+ country flags
- `/logos/` - Organization/partner logos

---

## 📺 scoreboard/ (24 files)
**OBS Streaming Display**

### Entry Point
- `scoreboard.html` - Main application

### JavaScript Files
- `browser-detect.js` - Browser detection

### Assets
- `/flags/` - 40+ country flags
- `/logos/` - Organization/partner logos

---

## 🏆 match-central/ (24 files)
**Match Management Dashboard**

### Entry Point
- `match-central.html` - Main application

### JavaScript Files
- `browser-detect.js` - Browser detection

### Assets
- `/flags/` - 40+ country flags
- `/logos/` - Organization/partner logos

---

## 👤 player-account/ (27 files)
**Player Statistics & Account Management**

### Entry Point
- `player-account.html` - Main application

### JavaScript Files
- `player-account.js` - Account logic
- `browser-detect.js` - Browser detection

### Styling
- `styles.css` - Complete stylesheet

### Branding
- `dartstream-logo.png` - Application logo

### Assets
- `/flags/` - 40+ country flags
- `/logos/` - Organization/partner logos

---

## 🏠 index/ (27 files)
**Landing Page & Navigation Hub**

### Entry Point
- `index.html` - Main application

### JavaScript Files
- `supabase-config.js` - Database config
- `browser-detect.js` - Browser detection

### Configuration
- `manifest.json` - PWA manifest

### Branding
- `dartstream-logo.png` - Application logo

### Assets
- `/flags/` - 40+ country flags
- `/logos/` - Organization/partner logos

---

## 📚 Documentation Files

Located in root of app-folders/:

### INDEX.md
Your entry point! Start here.
- Quick overview of all apps
- Links to all folders
- Getting started steps

### README.md
Complete project documentation
- Detailed folder descriptions
- Feature explanations
- Deployment options
- Development notes
- Troubleshooting guide

### QUICK-REFERENCE.md
Fast deployment guide
- App overview table
- How to run each app
- Game modes supported
- Customization guide
- Deployment checklist

### ORGANIZATION-SUMMARY.md
Overview of the reorganization
- What changed
- Benefits of new structure
- Migration path
- FAQ

### DEPLOYMENT-CHECKLIST.md
Complete deployment guide
- Pre-deployment testing
- App-specific checklists
- Deployment steps
- Post-deployment verification
- Ongoing maintenance

---

## 🗂️ Asset Folder Structure

Every app includes:

### /flags/ (40+ images)
Country flag images (~512x256 to ~512x371 px)
```
Flag_of_Canada-512x256.png
Flag_of_England-512x307.png
Flag_of_France-512x341.png
Flag_of_Germany-512x307.png
Flag_of_Norway-512x371.png
Flag_of_Philippines-512x256.png
Flag_of_Russia-512x341.png
Flag_of_Scotland-512x307.png
Flag_of_South_Korea-512x341.png
Flag_of_Sweden-512x318.png
Flag_of_United_Kingdom-512x256.png
Flag_of_United_States-512x269.png
Flag_of_Wales-512x307.png
(and more...)
```

### /logos/ (Organization/Partner Logos)
Broadcast and partner logos
```
AADS OFFIAL LOGO - Copy.png
AADSDarts.com Logo.png
CGC-TV Logo - Copy.png
cgcdarts.com logo - Copy.png
(and others as available)
```

---

## 📊 Statistics

### File Count by App
| App | Files | Size |
|-----|-------|------|
| scoring-app | 33 | ~2MB |
| controller | 26 | ~1.5MB |
| scoreboard | 24 | ~1.5MB |
| match-central | 24 | ~1.5MB |
| player-account | 27 | ~1.5MB |
| index | 27 | ~1.5MB |
| **Total** | **169** | **~9MB** |

### File Type Breakdown
- HTML files: 6
- JavaScript files: 20+
- CSS files: 6
- PNG images: 50+
- JSON manifests: 6
- Markdown docs: 5

---

## 🔗 Dependencies

### Used by All Apps
- `browser-detect.js` - Browser compatibility detection
- `/flags/` - Country flag assets
- `/logos/` - Organization logos

### Used by Multiple Apps
- `styles.css` - scoring-app, player-account
- `supabase-config.js` - scoring-app, controller, index
- `dartstream-logo.png` - scoring-app, index, player-account
- `manifest.json` - controller, index

### App-Specific
- `scoring-app.js` - scoring-app only
- `app-main.js` - scoring-app only
- `game-setup.js` - scoring-app only
- `player-library.js` - scoring-app only
- `player-account.js` - player-account only
- `manifest-scoring.json` - scoring-app only

---

## 📋 Complete File Manifest

### scoring-app/
```
📁 scoring-app/
├─ 📄 scoring-app.html
├─ 📄 scoring-app.js
├─ 📄 app-main.js
├─ 📄 app.js
├─ 📄 game-setup.js
├─ 📄 player-library.js
├─ 📄 supabase-config.js
├─ 📄 browser-detect.js
├─ 📄 styles.css
├─ 📄 manifest-scoring.json
├─ 🖼️ dartstream-logo.png
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

### controller/
```
📁 controller/
├─ 📄 controller.html
├─ 📄 supabase-config.js
├─ 📄 browser-detect.js
├─ 📄 manifest.json
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

### scoreboard/
```
📁 scoreboard/
├─ 📄 scoreboard.html
├─ 📄 browser-detect.js
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

### match-central/
```
📁 match-central/
├─ 📄 match-central.html
├─ 📄 browser-detect.js
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

### player-account/
```
📁 player-account/
├─ 📄 player-account.html
├─ 📄 player-account.js
├─ 📄 browser-detect.js
├─ 📄 styles.css
├─ 🖼️ dartstream-logo.png
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

### index/
```
📁 index/
├─ 📄 index.html
├─ 📄 supabase-config.js
├─ 📄 browser-detect.js
├─ 📄 manifest.json
├─ 🖼️ dartstream-logo.png
├─ 📁 flags/
│  └─ 40+ flag images
└─ 📁 logos/
   └─ Organization logos
```

---

## ✨ Key Features

### scoring-app/
- Full X01 scoring engine
- Game mode selection (301/501 SIDO/DIDO)
- Player library management
- Real-time statistics
- Database integration
- PWA support

### controller/
- Remote match control
- Device synchronization
- Connection code system
- Real-time updates

### scoreboard/
- OBS streaming display
- Chroma key green screen
- Live score broadcast
- Full-screen mode
- Statistics display

### match-central/
- Match history
- Status monitoring
- Game room management
- Connection codes

### player-account/
- Player authentication
- Lifetime statistics
- Account management
- Profile customization

### index/
- Landing page
- App navigation
- Quick start links
- User information

---

## 🚀 Getting Started

1. Choose an app folder
2. Open the HTML file in your browser
3. All dependencies are included!
4. No build process needed
5. No external files needed
6. Ready to deploy

---

## 📞 Support

- See **INDEX.md** for quick overview
- See **README.md** for complete details
- See **QUICK-REFERENCE.md** for deployment
- See **DEPLOYMENT-CHECKLIST.md** for launching

---

**Total Organization:** 169 files in 6 standalone apps  
**Status:** ✅ Complete and ready for deployment  
**Date:** December 14, 2025
