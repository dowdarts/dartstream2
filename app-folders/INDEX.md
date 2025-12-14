# DartStream2 - App Folders Index

Welcome to the reorganized DartStream2 application suite!

## 🎯 Start Here

Choose what you want to do:

### 📖 Learn About the Organization
- **[README.md](README.md)** - Complete project documentation and feature overview
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick start guide and deployment instructions
- **[ORGANIZATION-SUMMARY.md](ORGANIZATION-SUMMARY.md)** - Overview of the reorganization

### 🚀 Deploy an App

Pick an app and open its folder:

1. **[scoring-app/](scoring-app/)** - Professional dart scoring application (ES6 modules)
   - Open: `scoring-app/scoring-app.html`
   - Features: X01 scoring, player tracking, live stats

2. **[videostreamscoringapp/](videostreamscoringapp/)** - Video stream scoring app (Legacy version)
   - Open: `videostreamscoringapp/videostreamscoringapp.html`
   - Features: X01 scoring, optimized for streaming

3. **[dartstream-webapp/](dartstream-webapp/)** - Complete app suite (Fire OS/Silk optimized)
   - Open: `dartstream-webapp/index.html`
   - Features: All apps in one, optimized for Fire devices & Silk browser

4. **[controller/](controller/)** - Remote match controller
   - Open: `scoring-app/scoring-app.html`
   - Features: X01 scoring, player tracking, live stats

2. **[controller/](controller/)** - Remote match controller
   - Open: `controller/controller.html`
   - Features: Control scoring, sync multiple devices

3. **[scoreboard/](scoreboard/)** - Live streaming display (OBS compatible)
   - Open: `scoreboard/scoreboard.html`
   - Features: Chroma key ready, live score display

4. **[match-central/](match-central/)** - Match management dashboard
   - Open: `match-central/match-central.html`
   - Features: Match history, status monitoring

5. **[player-account/](player-account/)** - Player statistics and profiles
   - Open: `player-account/player-account.html`
   - Features: Player stats, account management, auth

6. **[index/](index/)** - Landing page and navigation hub
   - Open: `index/index.html`
   - Features: App navigation, quick-start, user info

---

## 📁 What You Get

✅ **6 Standalone Apps** - Each is a complete, self-contained application

✅ **All Dependencies Included** - No external file fetching needed

✅ **Ready to Deploy** - Copy any folder to your hosting provider

✅ **Well Documented** - Comprehensive guides for setup and deployment

✅ **Optimized** - Each app only contains what it needs

---

## 🎨 Folder Contents

Each app folder contains:
- 📄 HTML file (main entry point)
- 📝 JavaScript files (functionality)
- 🎨 CSS stylesheets (styling)
- 📍 Logos & branding (dartstream-logo.png)
- 🌍 Flag images (40+ countries)
- 🏢 Partner logos (for broadcasting)

---

## ⚡ Quick Deploy

### Deploy Single App
```bash
# Copy scoring-app folder to your hosting
cp -r scoring-app/ /var/www/scoring-app/
# Access at: https://your-domain.com/scoring-app/scoring-app.html
```

### Deploy All Apps
```bash
# Copy entire app-folders to your hosting
cp -r app-folders/ /var/www/
# Access apps at:
# https://your-domain.com/app-folders/scoring-app/scoring-app.html
# https://your-domain.com/app-folders/controller/controller.html
# etc.
```

### Simple URL Setup (Recommended)
Rename each `[app].html` to `index.html`:
```bash
mv scoring-app/scoring-app.html scoring-app/index.html
mv controller/controller.html controller/index.html
# Access at:
# https://your-domain.com/scoring-app/
# https://your-domain.com/controller/
```

---

## 📊 App Overview

| App | Purpose | Technology | Deploy Time |
|-----|---------|-----------|------------|
| **scoring-app** | Dart scoring engine | Vanilla JS, HTML5, CSS3 | ~30 sec |
| **controller** | Remote control | Vanilla JS + Supabase | ~30 sec |
| **scoreboard** | OBS streaming | Vanilla JS, HTML5, CSS3 | ~30 sec |
| **match-central** | Dashboard | Vanilla JS, HTML5, CSS3 | ~30 sec |
| **player-account** | Player stats | Vanilla JS, HTML5, CSS3 | ~30 sec |
| **index** | Landing page | Vanilla JS, HTML5, CSS3 | ~30 sec |

---

## 🔧 Requirements

- **Browser**: Chrome, Firefox, Safari, Edge (all modern versions)
- **Server**: Any static file hosting (no backend needed)
- **Database**: Supabase (optional, used for stats & sync)
- **Build Tool**: None! (vanilla JavaScript, no bundler)

---

## 📚 Documentation Guide

### For Getting Started
→ **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)**
- Quick overview of all apps
- How to run each app locally
- Deployment checklist
- Troubleshooting tips

### For Complete Details
→ **[README.md](README.md)**
- Detailed app descriptions
- Feature explanations
- Database integration guide
- Development notes
- Security information

### For Understanding the Changes
→ **[ORGANIZATION-SUMMARY.md](ORGANIZATION-SUMMARY.md)**
- Overview of the reorganization
- Before/after structure
- Migration path
- FAQ

---

## ✅ Getting Started Steps

### Step 1: Choose an App
Pick which app you want to use (most common: `scoring-app`)

### Step 2: Open Locally (for testing)
```bash
# Navigate to app folder
cd scoring-app/

# Option A: Open in browser directly
# File → Open → scoring-app.html

# Option B: Use local server
python -m http.server 8000
# Visit http://localhost:8000/scoring-app.html
```

### Step 3: Deploy to Hosting
```bash
# Copy entire app folder to your hosting provider
# Most hosts have a "Upload Files" option
# Or use FTP/Git push

# Your app will be live at:
# https://your-domain.com/scoring-app/
```

### Step 4: Share & Use
- Share the URL with match participants
- Use scoreboard in OBS for streaming
- Access controller on separate device
- Monitor player stats in player-account

---

## 🌐 Hosting Options

### Recommended
- **Netlify** - Simple drag & drop, free tier
- **Vercel** - Fast, optimized for web apps
- **GitHub Pages** - Free, integrated with GitHub

### Also Works With
- **AWS S3** + CloudFront
- **Google Cloud Storage**
- **Microsoft Azure Static Web Apps**
- **Traditional hosting** (FTP/cPanel)
- **Your own server** (any OS)

---

## 🔗 Links & Resources

### Project Documentation
- [Complete README](README.md) - All features and setup
- [Quick Reference](QUICK-REFERENCE.md) - Fast deployment guide
- [Organization Summary](ORGANIZATION-SUMMARY.md) - What's new

### App Folders
- [Scoring App](scoring-app/) - Main scoring application
- [Controller](controller/) - Remote device control
- [Scoreboard](scoreboard/) - OBS streaming display
- [Match Central](match-central/) - Match management
- [Player Account](player-account/) - Stats & profiles
- [Index/Landing](index/) - Navigation hub

### In Root Directory
- `MODULAR-ARCHITECTURE.md` - Technical architecture
- `README.md` - Original project README
- All `.sql` files - Database schemas

---

## 💡 Tips & Tricks

### Customize Each App
- Change logos: Replace `dartstream-logo.png`
- Update colors: Edit `styles.css`
- Add flags: Drop PNG files in `/flags`
- Add partner logos: Drop PNG files in `/logos`

### Run Multiple Apps
- Host each on different subdomains
- Or different folders on same domain
- Share database for statistics

### Enhance with Features
- Add authentication (Supabase Auth already set up)
- Connect to streaming (Twitch, YouTube API)
- Add player rankings (Supabase data)
- Create tournament brackets

### Monitor Performance
- Check browser dev tools (F12)
- Monitor network tab for loading
- Check console for errors
- Test on multiple devices

---

## 🆘 Need Help?

### Common Issues

**"Page won't load"**
- Check that all files copied correctly
- Verify correct file paths
- Check browser console for errors
- Try different browser

**"Database not connecting"**
- Verify `supabase-config.js` exists
- Check Supabase project URL and key
- Ensure Supabase is online
- Check RLS policies

**"Images not showing"**
- Confirm `/flags` and `/logos` folders exist
- Check image file names
- Verify paths in HTML
- Try browser cache clear

**"JavaScript errors"**
- Check all `.js` files are copied
- Verify script tags in HTML
- Check browser console for details
- Try different browser

### Get More Help
- See **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** → Troubleshooting section
- See **[README.md](README.md)** → Troubleshooting section
- Check original **[MODULAR-ARCHITECTURE.md](../MODULAR-ARCHITECTURE.md)**

---

## 📈 What's Next?

After deployment:
1. ✅ Test all features work
2. ✅ Customize branding (logos, colors)
3. ✅ Set up streaming (if using scoreboard)
4. ✅ Share URLs with users
5. ✅ Monitor performance
6. ✅ Gather feedback
7. ✅ Plan enhancements

---

## 🎉 You're All Set!

Everything you need is organized and ready to deploy.

**Choose an app folder and get started!**

```
Pick one:
├── scoring-app/ ← Main app for scoring
├── controller/ ← For remote control
├── scoreboard/ ← For OBS streaming
├── match-central/ ← For match management
├── player-account/ ← For player stats
└── index/ ← Landing page
```

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Ready for Deployment  
**Total Apps:** 6  
**Total Files:** 169  
**Documentation:** 3 guides included
