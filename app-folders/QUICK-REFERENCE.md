# DartStream2 Apps - Quick Reference

## 🎯 Quick Start

### For Developers
1. Each folder in `/app-folders` is a **standalone web application**
2. No build process needed - open HTML files directly in browser
3. All dependencies are included in each folder

### For Deployment
1. Choose which app(s) you need
2. Copy entire folder to your hosting provider
3. Access via the folder path or rename `index.html`

---

## 📱 Apps Overview

| App | Purpose | Main File | Key Dependencies |
|-----|---------|-----------|------------------|
| **scoring-app** | Dart scoring engine (ES6) | `scoring-app.html` | JS: game-setup, scoring-app, player-library, app-main<br/>CSS: styles.css<br/>Data: supabase-config.js |
| **videostreamscoringapp** | Video stream scoring (Legacy + WebRTC) | `videostreamscoringapp.html` | JS: `VideoStreamscoringapp.js` (WebRTC video) or `app.js` (legacy)<br/>CSS: styles.css |
| **dartstream-webapp** | Complete app suite (Fire OS/Silk) | `index.html` (6 HTML variants) | All JS modules, styles.css, supabase-config, online features<br/>Database: create-game-rooms-table.sql |
| **controller** | Remote match control | `controller.html` | browser-detect, supabase-config, manifest |
| **scoreboard** | OBS streaming display | `scoreboard.html` | browser-detect only |
| **match-central** | Match dashboard | `match-central.html` | browser-detect only |
| **player-account** | Player stats & profile | `player-account.html` | JS: player-account.js<br/>CSS: styles.css |
| **index** | Landing page & nav | `index.html` | browser-detect, supabase-config, manifest |

---

## 🔗 File Locations

All apps have access to:
```
app-folders/
├── scoring-app/
│   ├── scoring-app.html (MAIN FILE - OPEN THIS)
│   ├── *.js (JavaScript files)
│   ├── *.css (Stylesheets)
│   ├── *.json (PWA manifests)
│   ├── *.png (Logos/images)
│   ├── flags/ (Country flags)
│   └── logos/ (Organization logos)
│
├── dartstream-webapp/ (Fire OS/Silk Browser Optimized - ALL APPS IN ONE)
│   ├── index.html (LANDING PAGE - OPEN THIS)
│   ├── scoring-app.html, controller.html, scoreboard.html, etc. (6 app variants)
│   ├── *.js (All supporting modules)
│   ├── styles.css (Shared stylesheet)
│   ├── *.sql (Database schemas)
│   ├── *.png (All UI elements & logos)
│   ├── flags/ (Country flags)
│   └── logos/ (Organization logos)
│
├── controller/
│   ├── controller.html (MAIN FILE - OPEN THIS)
│   ├── (dependencies...)
│   ├── flags/
│   └── logos/
│
├── ... (similar structure for other apps)
```

---

## 🎮 How to Run Each App

### Complete App Suite (Fire OS/Silk Browser Recommended!)
```
1. Navigate to: app-folders/dartstream-webapp/
2. Open: index.html in browser (or any of the 6 HTML variants)
3. Choose your app (landing page) or jump directly to specific app
4. All features available: scoring, controller, scoreboard, stats, match management
5. Perfect for Fire Stick - just add to bookmarks!
```

### Scoring App
```
1. Navigate to: app-folders/scoring-app/
2. Open: scoring-app.html in browser
3. Select game mode and start scoring
```

### Video Stream Scoring (Legacy)
```
1. Navigate to: app-folders/videostreamscoringapp/
2. Open: videostreamscoringapp.html in browser
3. Optimized for video streaming displays
```

### Controller
```
1. Navigate to: app-folders/controller/
2. Open: controller.html in browser
3. Enter match connection code
```

### Scoreboard (OBS)
```
1. Navigate to: app-folders/scoreboard/
2. Open: scoreboard.html
3. Add as browser source in OBS
4. Use #00ff00 green for chroma key
```

### Player Account
```
1. Navigate to: app-folders/player-account/
2. Open: player-account.html in browser
3. View stats and manage profile
```

### Match Central
```
1. Navigate to: app-folders/match-central/
2. Open: match-central.html in browser
3. View active matches
```

### Landing Page
```
1. Navigate to: app-folders/index/
2. Open: index.html in browser
3. Click links to access apps
```

---

## 📊 Game Modes Supported

### Scoring App
- **Quick 501** - SIDO (Single In Double Out), Best of 3 legs
- **Extended 501** - SIDO, Best of 9 legs
- **Quick 301** - DIDO (Double In Double Out), Best of 3 legs
- **Extended 301** - DIDO, Best of 5 legs
- **Custom** - Create your own rules

---

## 🗄️ Database Integration

Apps using Supabase:
- `scoring-app` - Records match stats, player data
- `controller` - Remote synchronization
- `index` - User authentication, account linking
- `player-account` - Fetch/display player stats

**Configuration File**: `supabase-config.js` (in each folder that needs it)

---

## 🎨 Customization Guide

### Change Logos
Replace `dartstream-logo.png` in folders that use it:
- `scoring-app/dartstream-logo.png`
- `index/dartstream-logo.png`
- `player-account/dartstream-logo.png`

### Change Colors/Styling
Edit `styles.css` in:
- `scoring-app/styles.css`
- `player-account/styles.css`

### Update Partner Logos
Add PNG files to `/logos` folder in each app:
```
app-folders/[app-name]/logos/
  ├── your-logo-1.png
  ├── your-logo-2.png
  └── ...
```

### Add Country Flags
Add PNG files to `/flags` folder in each app

---

## 📋 Files Not Duplicated (In Main Directory)

These are kept in root for reference:
- `app.js` - Legacy scoring engine (deprecated)
- `*.sql` - Database migration scripts
- `dartstream/` - Git repository
- `dartstream-webapp/` - Fire OS version
- `bring over/` - Old version backup
- `.git/`, `.github/` - Version control

**Do NOT upload these to hosting** - use the `app-folders` instead

---

## ✅ Verification Checklist

After organization, verify each folder has:

- [ ] Main HTML file (`.html`)
- [ ] `browser-detect.js`
- [ ] Required JS files (see table above)
- [ ] `styles.css` (if needed)
- [ ] `manifest.json` or `manifest-scoring.json`
- [ ] `dartstream-logo.png` (if needed)
- [ ] `/flags` folder with country images
- [ ] `/logos` folder with logo images

---

## 🚀 Deployment Checklist

Before uploading to hosting:

1. **Test locally** - Open HTML file in browser
2. **Check paths** - Verify all assets load correctly
3. **Test features** - Try main functionality
4. **Verify database** - If using Supabase, check connection
5. **Mobile test** - Test on tablet/mobile devices
6. **Browser test** - Test on Chrome, Firefox, Safari
7. **Fire OS test** - Test on Fire Stick/Fire TV with Silk Browser (dartstream-webapp folder is optimized for this!)

---

## 📞 Troubleshooting

### Images not loading
- Check that `/flags` and `/logos` folders are copied
- Verify image file names match HTML references

### Database errors
- Ensure `supabase-config.js` is in the folder
- Check Supabase project is accessible
- Verify RLS policies allow your operations

### Styling broken
- Check `styles.css` is in the folder
- Verify paths in HTML are correct
- Check browser console for CSS errors

### JavaScript errors
- Check all `.js` files are in the folder
- Verify `<script>` src attributes match file names
- Check browser console for specific errors

---

**Ready to deploy!** Pick the apps you need and upload to your hosting.
