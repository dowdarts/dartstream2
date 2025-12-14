# DartStream Project - Complete App Inventory

## Overview

DartStream is now fully organized into **9 self-contained, production-ready applications**. Each app is completely independent with all its dependencies bundled, allowing for modular deployment and maintenance.

## App Inventory

### 1. **scoring-app/** - Professional Dart Scoring
- **Purpose**: Main X01 (301/501) dart game scoring engine
- **Type**: Competitive scoring with match statistics
- **Key Files**: 
  - scoring-app.html (main interface)
  - scoring-app.js (X01 scoring engine)
  - app-main.js (orchestrator)
  - game-setup.js (game configuration)
  - player-library.js (player management)
- **Database**: Supabase (players, match_stats, player_accounts)
- **Features**: 
  - 301/501 SIDO/DIDO game modes
  - Multi-leg matches
  - Achievement tracking (180s, 171s, etc.)
  - Player library management
  - Real-time scoring
  - Bust detection and validation
- **Status**: ✅ Production-ready
- **Files**: 33 total

### 2. **videostreamscoringapp/** - Video Stream Scoring
- **Purpose**: Scoring with embedded WebRTC video capability
- **Type**: Hybrid scoring + video streaming
- **Key Files**:
  - videostreamscoringapp.html (UI)
  - VideoStreamscoringapp.js (WebRTC video module)
  - app.js (legacy scoring logic)
  - browser-detect.js (platform detection)
- **Features**:
  - Dart scoring + video stream display
  - WebRTC peer-to-peer video
  - Real-time score sync
  - Embedded video window
- **Status**: ✅ Production-ready
- **Files**: 26 total

### 3. **dartstream-webapp/** - Fire OS/Silk Browser Suite
- **Purpose**: Complete DartStream suite optimized for Amazon Fire devices
- **Type**: Full-featured mobile app suite
- **Key Files** (6 HTML applications):
  - index.html (landing/navigation)
  - scoring-app.html (dart scoring)
  - controller.html (remote control)
  - match-central.html (match management)
  - scoreboard.html (display/streaming)
  - player-account.html (player profiles)
- **Special**: Optimized for Silk Browser (no PWA manifest by default)
- **Features**: All DartStream apps in one deployable package
- **Status**: ✅ Production-ready
- **Files**: 43 total

### 4. **controller/** - Match Remote Control
- **Purpose**: Remote wireless controller for match management
- **Type**: Companion app (controls scoring-app)
- **Key Files**:
  - controller.html (UI)
  - controller.js (control logic)
  - styles.css (controller styling)
- **Features**:
  - Wireless control of main scoring display
  - Start/pause/resume match
  - Quick score adjustments
  - Player selection
  - Realtime sync with main display
- **Status**: ✅ Production-ready
- **Files**: 26 total

### 5. **index/** - Landing Page & Navigation Hub
- **Purpose**: Central navigation and information hub
- **Type**: Static with navigation
- **Key Files**:
  - index.html (main landing page)
  - navigation logic
  - link aggregation
- **Features**:
  - Quick access to all DartStream apps
  - App descriptions
  - Getting started guide
  - Links to scoring-app, controller, player-account, etc.
- **Status**: ✅ Production-ready
- **Files**: 27 total

### 6. **player-account/** - Player Profiles & Statistics
- **Purpose**: Player account management and lifetime statistics
- **Type**: Data management & analytics
- **Key Files**:
  - player-account.html (player UI)
  - player-account.js (account logic)
- **Database**: Supabase (players, player_accounts, match_stats)
- **Features**:
  - Player profile viewing/editing
  - Lifetime statistics (average, legs won, 180s count)
  - Match history
  - Nationality/flag display
  - Player library access
  - Account linking
- **Status**: ✅ Production-ready
- **Files**: 27 total

### 7. **match-central/** - Match Management Dashboard
- **Purpose**: Central hub for match scheduling and coordination
- **Type**: Dashboard/management
- **Key Files**:
  - match-central.html (dashboard)
  - match-central.js (logic)
- **Database**: Supabase (game_rooms, match data)
- **Features**:
  - View all active matches
  - Create new matches
  - Player pairing
  - Match results tracking
  - Statistics aggregation
  - Tournament bracket support (future)
- **Status**: ✅ Production-ready
- **Files**: 24 total

### 8. **scoreboard/** - Display/Streaming Output
- **Purpose**: Display-only scoreboard for OBS/streaming
- **Type**: Output/display (no input)
- **Key Files**:
  - scoreboard.html (scoreboard UI)
  - scoreboard.js (display logic)
- **Features**:
  - Real-time score display
  - Large, readable fonts for streaming
  - OBS integration friendly
  - Broadcast-quality styling
  - Player name and statistics display
  - Leg progress indicator
- **Status**: ✅ Production-ready
- **Files**: 24 total

### 9. **play-online/** - Peer-to-Peer Video Calling
- **Purpose**: Standalone video call room for remote player connection
- **Type**: Pure WebRTC peer-to-peer (completely independent)
- **Key Files**:
  - play-online.html (main entry point)
  - play-online.js (UI controller)
  - play-online-app.js (orchestrator)
  - video-room.js (WebRTC engine)
  - room-manager.js (room lifecycle)
  - styles.css (responsive styling)
  - manifest.json (PWA config)
- **Database**: Supabase (game_rooms table for signaling)
- **Features**:
  - 🎥 Peer-to-peer WebRTC video calling
  - 🔗 Room-based architecture (4-digit room codes)
  - 👥 Multiple participant support (2+)
  - 🎤 Audio/video toggle controls
  - ⏱️ Call duration tracking
  - 🌍 Country selection
  - 📱 Mobile responsive
  - ✅ PWA capable
- **Special**: **COMPLETELY ISOLATED** from scoring apps (no data sharing, no game logic)
- **Status**: ✅ Just completed! Production-ready
- **Files**: 31 total (including flags/ and logos/)

## Technology Stack

### Core Technologies
- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Real-time**: Supabase Realtime (WebSocket channels)
- **Database**: Supabase PostgreSQL
- **Video**: WebRTC (RTCPeerConnection, getUserMedia)
- **PWA**: Web Manifest, Service Worker ready
- **Deployment**: Static hosting (GitHub Pages, Netlify, Vercel)

### Browser Support
- Chrome/Chromium v90+
- Firefox v88+
- Safari v14.1+
- Edge v90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### No External Dependencies
- ✅ No npm packages
- ✅ No bundlers (Webpack, Vite, etc.)
- ✅ No frameworks (React, Vue, etc.)
- ✅ Pure web standards (ES6, WebRTC, Fetch API)
- ✅ Supabase via CDN only

## File Organization

```
DartStream2/
├── app-folders/                    # Main app directory
│   ├── scoring-app/               # (33 files) X01 scoring engine
│   ├── videostreamscoringapp/     # (26 files) Scoring + video
│   ├── dartstream-webapp/         # (43 files) Fire OS suite
│   ├── controller/                # (26 files) Remote controller
│   ├── index/                     # (27 files) Landing page
│   ├── player-account/            # (27 files) Player profiles
│   ├── match-central/             # (24 files) Match dashboard
│   ├── scoreboard/                # (24 files) Display output
│   └── play-online/               # (31 files) Video calling ⭐ NEW
├── dartstream-webapp/             # (43 files) Fire OS backup copy
├── Database Scripts/              # .sql setup files
│   ├── setup-database.sql
│   ├── create-match-stats-table.sql
│   ├── create-game-rooms-table.sql
│   └── ... (other migrations)
├── Documentation/
│   ├── README.md
│   ├── MODULAR-ARCHITECTURE.md
│   ├── QUICK-REFERENCE.md
│   └── ... (more docs)
└── License & Config/
    ├── LICENSE
    ├── .gitignore (git metadata)
    └── manifest files
```

## Statistics

| Metric | Value |
|--------|-------|
| **Total Apps** | 9 |
| **Total Files** | 230+ |
| **Total Size** | ~14 MB |
| **Documentation Files** | 10+ |
| **Database Tables** | 5+ (players, match_stats, game_rooms, etc.) |
| **HTML Entry Points** | 15+ (6 in dartstream-webapp, 1 per app folder) |
| **JavaScript Modules** | 25+ (all ES6) |
| **CSS Files** | 2 main (styles.css per app) |
| **Asset Files** | 50+ (flags, logos, images) |

## Deployment Options

### Option 1: Static Hosting (Recommended)
- **GitHub Pages**: Free, built-in CI/CD
- **Netlify**: Easy drag-drop, auto-HTTPS
- **Vercel**: Optimized for web apps
- **AWS S3 + CloudFront**: Scalable

**Process**:
1. Upload entire `app-folders/` directory
2. Update Supabase credentials in `supabase-config.js`
3. Done! No server needed

### Option 2: Self-Hosted
- VPS + Nginx/Apache
- Docker container (single container for all apps)
- Your own server infrastructure

### Option 3: Fire Device Deployment
- Use `dartstream-webapp/` folder
- Copy all files to Fire device USB
- Access via Silk Browser
- Or deploy to S3 accessible from Fire OS

## Integration Map

```
play-online/          (ISOLATED VIDEO)
  - No connection to scoring-app
  - No game logic
  - Pure WebRTC communication
  
scoring-app/          ←→ player-library.js
  - Player management
  - Match statistics
  - Game state

videostreamscoringapp/ (HYBRID)
  - Scoring + embedded video
  - Legacy system
  
dartstream-webapp/    (COMPLETE SUITE)
  - All apps in one package
  - Fire OS optimized
  
controller/           ←→ scoring-app (Realtime sync)
  - Remote control

scoreboard/          ←→ scoring-app (Realtime sync)
  - Display output

player-account/      ←→ Supabase
  - Profile viewing
  - Statistics

match-central/       ←→ Supabase
  - Match management

index/               → All other apps
  - Navigation hub
```

## Quick Start

### For Users
1. Open `index.html` in any browser
2. Select an app (scoring, controller, player-account, etc.)
3. Each app is self-contained with full functionality

### For Developers
1. Each app in its own folder with all dependencies
2. Edit files directly (no build step needed)
3. Changes visible on refresh
4. Deploy entire folder structure to static host

### For Supabase Setup
Run database setup scripts in order:
```sql
1. setup-database.sql          -- Initial tables
2. create-match-stats-table.sql
3. create-game-rooms-table.sql
4. ... (other migrations)
```

## Key Features by App

| App | Scoring | Video | Real-time | Multi-player | Database |
|-----|---------|-------|-----------|--------------|----------|
| scoring-app | ✅ | ❌ | ✅ | ✅ | ✅ |
| videostreamscoringapp | ✅ | ✅ | ✅ | ❌ | ❌ |
| dartstream-webapp | ✅ | ❌ | ✅ | ✅ | ✅ |
| controller | ❌ | ❌ | ✅ | ✅ | ❌ |
| index | ❌ | ❌ | ❌ | ❌ | ❌ |
| player-account | ❌ | ❌ | ❌ | ❌ | ✅ |
| match-central | ❌ | ❌ | ✅ | ✅ | ✅ |
| scoreboard | ❌ | ❌ | ✅ | ✅ | ✅ |
| **play-online** | **❌** | **✅** | **✅** | **✅** | **✅** |

## Important Notes

### Play-Online Isolation
The new `play-online/` app is **100% independent**:
- No scoring functionality
- No game logic
- Pure WebRTC peer-to-peer
- Separate Supabase table (game_rooms)
- No data sharing with other apps
- Can be deployed standalone
- Can be disabled without affecting other apps

### Database Considerations
- `players` table: Shared by scoring-app, player-account
- `match_stats` table: Shared by scoring-app, player-account
- `game_rooms` table: **Only used by play-online**
- `player_accounts` table: User authentication

### Performance
- Zero server-side processing (all client-side)
- Real-time sync via WebSocket (Supabase Realtime)
- Minimal database calls
- Optimized for mobile devices
- Progressive enhancement (works offline for local scoring)

## Documentation

Comprehensive documentation included:
- `README.md` - Project overview
- `MODULAR-ARCHITECTURE.md` - Design patterns
- `QUICK-REFERENCE.md` - Common tasks
- `ORGANIZATION-SUMMARY.md` - Setup guide
- `FOLDER-STRUCTURE.md` - Directory layout
- `play-online/README.md` - Video calling guide
- Each app folder has its own README (some)

## Support & Troubleshooting

### Common Issues
1. **Supabase connection failing** → Check credentials in `supabase-config.js`
2. **Video not working** → Check camera/mic permissions + browser console
3. **Scores not syncing** → Verify Supabase connection + RLS policies
4. **App not loading** → Check for JavaScript errors (F12 → Console)

### Testing
1. Open `test-match-stats.html` to verify DB connection
2. Use browser DevTools to inspect network requests
3. Check Supabase dashboard for data insertion
4. Verify RLS policies allow desired operations

## Future Enhancements

- Cricket game mode
- Tournament bracket system
- Advanced statistics/analytics
- Mobile app (PWA)
- Offline-first support
- Screen sharing in video calls
- Call recording
- Chat integration
- Spectator mode

## License

DartStream is licensed under [See LICENSE file]

## Version History

- **Latest**: 9 apps, 230+ files, play-online added
- **Previous**: 8 apps, 217 files
- **Original**: Monolithic app.js structure

---

**Project Status**: ✅ Production-Ready
**Last Updated**: 2024
**Maintenance**: Active
**Support**: Community-driven
