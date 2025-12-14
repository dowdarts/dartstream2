# DartStream2 - Organized App Folders

This directory contains the DartStream2 application separated into individual, self-contained folders. Each folder represents a standalone web application with all of its dependencies included.

## Folder Structure

Each app folder contains all the necessary files to run independently. The organization allows for:
- **Modular deployment** - Deploy only the apps you need
- **Easy maintenance** - All dependencies for an app are in one place
- **Simplified development** - Work on individual apps without clutter
- **Version control** - Track changes per app

---

## Folder Descriptions

### 📊 `/scoring-app`
**The main dart scoring application for live match scoring (ES6 Modules)**

**Contents:**
- `scoring-app.html` - Main HTML file
- `scoring-app.js` - Scoring engine & game logic
- `app-main.js` - Module orchestrator
- `game-setup.js` - Game configuration & player selection
- `player-library.js` - Player database CRUD operations
- `app.js` - Legacy support file
- `browser-detect.js` - Browser compatibility detection
- `supabase-config.js` - Database configuration
- `styles.css` - Shared stylesheet
- `manifest-scoring.json` - PWA manifest
- `dartstream-logo.png` - Branding logo
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- X01 scoring (301/501 SIDO/DIDO modes)
- Real-time scoring with auto-submit after 3 darts
- Bust detection & double-out validation
- Achievement tracking (180s, 171s, etc.)
- Player statistics recording to Supabase
- PWA support for offline use
- Modern ES6 module architecture

**How to use:**
Open `scoring-app.html` in a web browser or serve from a local development server.

---

### 🎬 `/videostreamscoringapp`
**Video stream scoring application (Legacy optimized version + WebRTC video calling)**

**Contents:**
- `videostreamscoringapp.html` - Main HTML file
- `app.js` - Legacy scoring engine
- `VideoStreamscoringapp.js` - **NEW:** Enhanced version with WebRTC peer-to-peer video calling, online multiplayer support, real-time sync
- `browser-detect.js` - Browser compatibility detection
- `styles.css` - Shared stylesheet
- `manifest-scoring.json` - PWA manifest
- `dartstream-logo.png` - Branding logo
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- X01 scoring (301/501/Custom modes)
- **WebRTC peer-to-peer video calling between players** ⭐
- Real-time multiplayer online sync via Supabase Realtime
- Audio/video toggle controls
- Game room management for online play
- Match settings customization
- Set/leg tracking system
- Optimized for video streaming

**How to use:**
Open `videostreamscoringapp.html` in a web browser. For video calling features, use the enhanced `VideoStreamscoringapp.js` engine.

---

### 🔥 `/dartstream-webapp` (Fire OS/Silk Browser Optimized)
**Complete app suite optimized for Fire OS and Silk Browser compatibility**

**Main HTML Files (6 app variants in single folder):**
- `index.html` - Navigation hub and landing page
- `scoring-app.html` - Modern dart scoring engine
- `controller.html` - Remote match controller
- `scoreboard.html` - OBS streaming display
- `match-central.html` - Match management dashboard
- `player-account.html` - Player statistics & account management

**JavaScript Files (Modern & Legacy):**
- `app-main.js` - Module orchestrator
- `game-setup.js` - Game configuration
- `player-library.js` - Player database CRUD
- `scoring-app.js` - Modern scoring engine
- `player-account.js` - Account management logic
- `app.js` - Legacy support
- `play-online.js` - Online game features
- `online-scoring-app.js` - Online scoring

**Configuration & Database:**
- `supabase-config.js` - Supabase integration
- `create-game-rooms-table.sql` - Database schema for online rooms
- `package.json` - Project dependencies

**Assets & Styling:**
- `styles.css` - Complete stylesheet
- `dartstream-logo.png` - Branding logo
- `button 1.png`, `button 2.png`, `button 3.png` - UI elements
- `/flags` - 40+ country flag assets
- `/logos` - Organization logos
- `README.md` - Project documentation

**Features:**
- All 6 app variants in single folder (no juggling multiple apps)
- Online multiplayer support with real-time sync
- Complete player account system with lifetime stats
- Supabase integration for persistent data
- ES6 modern modules + legacy code support
- Fire OS and Silk Browser optimized
- Full game room management for online play
- Multi-device synchronization

**Status:** 
- ✅ Complete, tested, and production-ready
- ✅ All 35 files included with dependencies
- ✅ Ready for immediate Fire Stick/Fire TV deployment

**How to use:**
Upload entire folder to any static web host (GitHub Pages, Netlify, AWS S3, etc.) and access via:
- `your-host/dartstream-webapp/` - Full app suite
- `your-host/dartstream-webapp/index.html` - Landing page
- `your-host/dartstream-webapp/scoring-app.html` - Scoring app
- Works perfectly on Fire TV with Silk Browser—no special setup needed!

---

### 🎮 `/controller`
**Remote match controller for managing game state across devices**

**Contents:**
- `controller.html` - Main controller interface
- `browser-detect.js` - Browser compatibility detection
- `supabase-config.js` - Database configuration
- `manifest.json` - PWA manifest
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- Connect to scoreboard via 4-digit code
- Remote scoring bug connection
- Match status monitoring
- Multi-device synchronization

**How to use:**
Open `controller.html` in a web browser on a device you want to use as a controller.

---

### 📺 `/scoreboard`
**Live streaming scoreboard display for broadcasting**

**Contents:**
- `scoreboard.html` - Main scoreboard display
- `browser-detect.js` - Browser compatibility detection
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- Chroma key green screen background (#00ff00)
- OBS-compatible streaming display
- Score, player names, leg information
- Statistics display (averages, 180s, etc.)
- Ad banner support
- Real-time updates

**How to use:**
Open `scoreboard.html` as a window source in OBS (Open Broadcaster Software) or other streaming software.

---

### 🏆 `/match-central`
**Central match management dashboard**

**Contents:**
- `match-central.html` - Main dashboard interface
- `browser-detect.js` - Browser compatibility detection
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- Match history display
- Status monitoring
- Match list with connection codes
- Game room management

**How to use:**
Open `match-central.html` in a web browser to view and manage active matches.

---

### 👤 `/player-account`
**Player statistics and account management**

**Contents:**
- `player-account.html` - Main account interface
- `player-account.js` - Account logic & API interactions
- `browser-detect.js` - Browser compatibility detection
- `styles.css` - Shared stylesheet
- `dartstream-logo.png` - Branding logo
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- Player profile management
- Lifetime statistics display
- Account linking
- Authentication
- Stats history

**How to use:**
Open `player-account.html` in a web browser to access player statistics and account settings.

---

### 🏠 `/index`
**Main landing page and navigation hub**

**Contents:**
- `index.html` - Main landing page
- `browser-detect.js` - Browser compatibility detection
- `supabase-config.js` - Database configuration
- `manifest.json` - PWA manifest
- `dartstream-logo.png` - Branding logo
- `/flags` - Country flag assets
- `/logos` - Partner/team logo assets

**Features:**
- Landing page with app navigation
- Game mode quick selection
- Authentication status display
- Links to all DartStream2 apps
- User account information

**How to use:**
Open `index.html` in a web browser to access the main landing page and navigate to other apps.

---

## 📁 Shared Assets

---

## 📋 JavaScript File Mapping by App

### Complete Reference - Which .js file belongs to each app:

| App Folder | HTML File | Primary .js Files | Purpose |
|-----------|-----------|-------------------|---------|
| **scoring-app** | scoring-app.html | `scoring-app.js`, `app-main.js`, `game-setup.js`, `player-library.js` | ES6 modular scoring engine |
| **videostreamscoringapp** | videostreamscoringapp.html | `VideoStreamscoringapp.js` (new) or `app.js` (legacy) | Video streaming scoring + WebRTC calling |
| **dartstream-webapp** | index.html (6 variants) | `scoring-app.js`, `app-main.js`, `player-account.js`, `play-online.js`, `online-scoring-app.js` | Complete app suite (Fire OS optimized) |
| **controller** | controller.html | `game-setup.js`, `player-library.js` | Remote match control |
| **scoreboard** | scoreboard.html | `game-setup.js` | OBS streaming display |
| **match-central** | match-central.html | `game-setup.js`, `player-library.js` | Match management dashboard |
| **player-account** | player-account.html | `player-account.js` | Player stats & authentication |
| **index** | index.html | `app-main.js` | Landing page & navigation |

### Shared Dependencies (all apps have these)
- `browser-detect.js` - Browser compatibility detection
- `supabase-config.js` - Database configuration (apps that use it)
- `styles.css` - Shared styling (apps that use it)
- `/flags` and `/logos` - Asset directories

---

## 🚀 Deployment Guide

### Option 1: Deploy Individual App
1. Navigate to the desired app folder (e.g., `/scoring-app`)
2. Upload all contents to your static hosting (GitHub Pages, Netlify, Vercel)
3. The HTML file will be your entry point

### Option 2: Deploy Multiple Apps
1. Upload all `/app-folders` content to your hosting
2. Create navigation links between the HTML files
3. Users can access each app via its folder path

### Option 3: Rename and Deploy
For simplified URLs, rename the main HTML files to `index.html`:
```
/scoring-app/index.html  → Access as /scoring-app/
/controller/index.html   → Access as /controller/
/scoreboard/index.html   → Access as /scoreboard/
```

---

## 🔧 Development Notes

### Adding New Dependencies
If you add a new file to any app:
1. Copy it to the specific app's folder
2. Update the HTML file's import statements if needed
3. Test the app in isolation

### Shared Styles
The `styles.css` file is duplicated in each app that needs it:
- `/scoring-app/styles.css`
- `/player-account/styles.css`

To make global style changes, update the file in the main directory and copy to all folders.

### Database Configuration
The `supabase-config.js` file contains:
- Supabase project URL
- Supabase anonymous key (safe for client-side use)

This is duplicated in each folder that needs database connectivity.

---

## 📋 File Dependencies Reference

| File | Used By |
|------|---------|
| `browser-detect.js` | All apps |
| `styles.css` | scoring-app, player-account |
| `supabase-config.js` | scoring-app, controller, index, player-account |
| `dartstream-logo.png` | scoring-app, index, player-account |
| `manifest.json` | controller, index |
| `manifest-scoring.json` | scoring-app |
| `/flags` | All apps |
| `/logos` | All apps |

---

## 🌐 Browser Compatibility

All apps include `browser-detect.js` which:
- Detects Fire OS and Silk browsers
- Auto-redirects to optimized versions when needed
- Ensures compatibility across desktop and tablet devices

---

## 🔐 Security Notes

- **Supabase Key**: The anonymous key in `supabase-config.js` is safe for client-side use
- **RLS Policies**: Database security is managed through Supabase Row Level Security (RLS)
- **No Secrets**: No API secrets or private keys are included in these folders

---

## 📞 Support

For issues or questions about:
- **Scoring logic**: Check `scoring-app.js`
- **Database operations**: Check `supabase-config.js` and database schema
- **UI/Styling**: Check `styles.css`
- **Player data**: Check `player-library.js`

---

## 📦 Archive Files

The main DartStream2 directory also contains:
- `dartstream-webapp/` - Fire OS/Silk Browser optimized version
- `bring over/` - Legacy files from previous versions
- `.sql` files - Database migration scripts
- Original HTML and JS files (kept for reference)

**Recommendation**: Use the `/app-folders` structure for new deployments.

---

**Version**: v1.0  
**Last Updated**: December 14, 2025  
**Status**: Organized and ready for deployment
