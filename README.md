# 🎯 DartStream - Professional Darts Streaming Platform

A comprehensive professional darts scoring, streaming, and statistics platform designed for live broadcasts, practice sessions, and competitive play. Built with modern web technologies and Supabase backend for real-time data management.

## 🌟 Overview

DartStream is a complete ecosystem for darts enthusiasts, broadcasters, and professional players. It combines real-time scoring, player statistics tracking, account management, and multi-device streaming capabilities into one seamless platform.

**Live Demo**: [Your deployment URL here]  
**Supabase Project**: `kswwbqumgsdissnwuiab`

---

## 🎮 Applications

### 1. **Scoring App** (`scoring-app.html`)
The main scoring interface for live matches with professional-grade features.

**Features:**
- ✅ X01 Games (301, 501, 701, etc.) with SIDO/DIDO formats
- ✅ Custom match settings (Best of X, First to X)
- ✅ Set-based or leg-based match formats
- ✅ Real-time 3-dart average calculation
- ✅ Achievement tracking (180s, 171s, 95s, 100+, 120+, 140+, 160+)
- ✅ Automatic bust detection and validation
- ✅ Checkout hints and suggestions
- ✅ Forfeit system with draw options
- ✅ Match statistics saving to database
- ✅ Player library integration with account linking
- ✅ Number pad + quick score buttons (100, 140, 180)
- ✅ Undo/edit functionality for score corrections
- ✅ Set Complete modal with continue or save options

### 2. **Scoreboard Display** (`scoreboard.html`)
Broadcast-ready overlay for OBS/streaming software.

**Features:**
- ✅ Clean, professional scoreboard layout
- ✅ Real-time score synchronization
- ✅ Player names and avatars
- ✅ Leg/set scores display
- ✅ Current visit tracking
- ✅ 3-dart averages (leg and match)
- ✅ Transparent background for overlays
- ✅ Responsive design for different resolutions

### 3. **Controller** (`controller.html`)
Mobile-friendly remote control for scoring app.

**Features:**
- ✅ Wireless score entry via connection code
- ✅ Touch-optimized number pad
- ✅ Quick score buttons
- ✅ Real-time sync with main app
- ✅ Works on phones and tablets
- ✅ No installation required

### 4. **Player Account System** (`player-account.html`)
User authentication and profile management.

**Features:**
- ✅ Email/password authentication via Supabase
- ✅ Account creation and login
- ✅ Link account to player library profile
- ✅ Profile management
- ✅ Green checkmark indicator on linked player cards
- ✅ Secure session management

### 5. **Match Central** (`match-central.html`)
Statistics dashboard and match history.

**Features:**
- ✅ Lifetime statistics aggregation
- ✅ Match history with detailed breakdowns
- ✅ Achievement totals (180s, 171s, etc.)
- ✅ Average tracking across all matches
- ✅ Wins/losses record
- ✅ Recent matches display
- ✅ Personal performance analytics

### 6. **Landing Page** (`index-landing.html`)
Public-facing homepage for the platform.

**Features:**
- ✅ App overview and feature highlights
- ✅ Navigation to all sections
- ✅ Professional branding
- ✅ Responsive design

---

## 🚀 Quick Start

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/dowdarts/dartstream2.git
   cd dartstream2
   ```

2. Open `index-landing.html` or any app directly in your browser
   - No build process required
   - Pure HTML/CSS/JavaScript

3. For database features, configure Supabase connection in `supabase-config.js`

### Database Setup (Required for Stats Tracking)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kswwbqumgsdissnwuiab)
2. Navigate to **SQL Editor** → **New Query**
3. Copy all contents from `create-match-stats-table.sql`
4. Run the query to create:
   - `match_stats` table
   - Indexes for performance
   - RLS policies for security
   - `update_player_lifetime_stats()` function

### Testing Database Connection
1. Open `test-match-stats.html` in browser
2. Click "1. Check if Table Exists" to verify setup
3. Click "2. Test Insert Match Stats" to test functionality
4. Click "3. View All Match Stats" to see saved data

---

## 📖 How to Use

### Scoring App Workflow

#### 1. **Game Setup**
1. Open `scoring-app.html`
2. Select game type (301 SIDO, 501 SIDO, or Custom X01)
3. Choose players from library (click "Select Players")
4. Configure match settings:
   - Best of X legs or First to X wins
   - Enable/disable sets
   - Set format options
5. Select starting player (or use coin toss/bull-up)

#### 2. **Scoring During Match**
- **Number Entry**: Click 1-9 to enter individual dart scores
- **Quick Scores**: Use 100, 140, 180 buttons for common scores
- **MISS**: Record a missed dart (0 points)
- **BACK**: Undo the last dart entry
- **Auto-submit**: After 3 darts, visit automatically submits
- **Edit Mode**: Click any previous score to edit it

#### 3. **Match Completion**
- **Set Complete**: Choose to continue to next set or end match
- **End Match**: Opens save stats modal
- **Forfeit/Exit**: Click "Back to Main Menu" for forfeit options:
  - 0-0 score: Choose forfeit winner
  - Tied score: Choose forfeit winner or declare draw
  - Uneven score: Award match to leader or forfeit current leg

#### 4. **Stats Saving**
- Click "End Match / Save Stats" button
- Stats saved only for players with linked accounts (green checkmark)
- Achievements tracked: 180s, 171s, 95s, 100+, 120+, 140+, 160+
- Averages, darts thrown, and match outcome recorded

### Player Account Management

#### Creating an Account
1. Open `player-account.html`
2. Click "Sign Up"
3. Enter email and password
4. Verify email (check inbox)
5. Log in with credentials

#### Linking Account to Player Card
1. Log in to your account
2. Find your name in the player library dropdown
3. Click "Link Account to Player"
4. Green checkmark appears on your player card
5. Stats now save automatically when you play

### Controller (Remote Scoring)

#### Setup
1. Open `scoring-app.html` on main computer
2. Note the 4-digit connection code displayed
3. Open `controller.html` on phone/tablet
4. Enter the connection code
5. Start scoring remotely!

#### Usage
- All number buttons mirror the main app
- Scores sync in real-time
- Perfect for when referee is away from computer
- Works over local network or internet

### Scoreboard for Streaming

#### OBS Setup
1. In OBS, add **Browser Source**
2. Set URL to `scoreboard.html` file path or hosted URL
3. Set dimensions (recommended: 1920x1080)
4. Check "Shutdown source when not visible" for performance
5. Adjust opacity/cropping as needed

#### Tips
- Scoreboard auto-updates from scoring app
- Transparent background for easy overlay
- Clean, professional design for broadcasts
- No manual intervention needed during match

---

## 🎯 Game Rules

### X01 Games (301, 501, 701, etc.)

**SIDO (Straight In, Double Out):**
- Any score can start the game
- Must finish on a double (outer ring) to win
- Used in 501 format

**DIDO (Double In, Double Out):**
- Must start with a double
- Must finish on a double
- Used in 301 format

### Scoring Mechanics

**Valid Scores:**
- Single: 1-20 (face value)
- Double: 2-40 (outer ring, 2× value)
- Triple: 3-60 (inner ring, 3× value)
- Bull: 25 points (outer bull)
- Double Bull: 50 points (inner bull)

**Bust Rules:**
- Going below 0 is a bust
- Landing on 1 in double-out games is a bust
- Busted turn: Score resets to start of turn, darts counted toward average
- Turn ends immediately on bust

**Checkout:**
- Must finish exactly on 0
- Last dart must be a double (in DIDO/SIDO)
- Checkout hints display possible finishes

### Averages Calculation

**3-Dart Average Formula:**
```
(Total Points Scored ÷ Total Darts Thrown) × 3
```

**Examples:**
- 501 points in 15 darts: (501 ÷ 15) × 3 = **100.2 average**
- 180 in 3 darts: (180 ÷ 3) × 3 = **180.0 average**
- 45 in 3 darts: (45 ÷ 3) × 3 = **45.0 average**

**Types:**
- **Leg Average**: Performance in current leg only (resets each leg)
- **Match Average**: Overall performance across entire match

### Achievements Tracked
- **180**: Maximum score (3× triple-20)
- **171**: Second highest (3× triple-19 or triple-20, triple-20, triple-17)
- **95**: Three single-19s (ton-minus-five)
- **100+**: Any visit scoring 100 or more
- **120+**: Any visit scoring 120 or more
- **140+**: Any visit scoring 140 or more
- **160+**: Any visit scoring 160 or more

---

## 🗂️ File Structure

```
Dartstream2/
├── 📄 Main Applications
│   ├── index-landing.html          # Landing page
│   ├── scoring-app.html            # Main scoring interface
│   ├── scoreboard.html             # Streaming overlay
│   ├── controller.html             # Remote controller
│   ├── player-account.html         # Authentication & profiles
│   ├── match-central.html          # Statistics dashboard
│   └── test-match-stats.html       # Database testing tool
│
├── 🎨 Assets & Styling
│   ├── styles.css                  # Global styles (2500+ lines)
│   ├── dartstream-logo.png         # App logo
│   └── manifest-*.json             # PWA manifests
│
├── ⚙️ Core JavaScript
│   ├── app.js                      # Main game logic (3600+ lines)
│   ├── scoring-app.js              # Scoring engine (750+ lines)
│   ├── supabase-config.js          # Database operations (630+ lines)
│   ├── player-library.js           # Player management module
│   ├── game-setup.js               # Match configuration module
│   └── browser-detect.js           # Browser compatibility
│
├── 💾 Database
│   └── create-match-stats-table.sql  # Database migration (142 lines)
│
├── 📱 Web App Version
│   └── dartstream-webapp/          # Deployed version (mirrors main)
│
└── 📚 Documentation
    ├── README.md                   # This file
 
```

---

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time Sync**: LocalStorage + Polling
- **Deployment**: Static hosting (GitHub Pages, Netlify, etc.)

### Database Schema

#### `players` table
- Player library profiles
- Name, avatar, stats
- UUID-based identification

#### `player_accounts` table
- User authentication records
- Email, password hash (via Supabase Auth)
- `account_linked_player_id`: Links to players table
- `lifetime_stats`: JSONB with aggregated statistics

#### `match_stats` table
- Individual match records
- Player performance data
- Achievement counts
- Match outcome and scores
- Timestamps and metadata

### Key Features Implementation

**Achievement Tracking:**
- Counted during `completeTurn()` in `scoring-app.js`
- Stored in `player.achievements` object
- Saved to `match_stats.count_180s` through `count_160_plus`
- Aggregated into `lifetime_stats` via PostgreSQL function

**Account Linking:**
- Player card shows green checkmark when linked
- `getAllPlayers()` joins `players` and `player_accounts`
- Stats only save for linked accounts
- Real-time verification of account status

**Forfeit System:**
- Smart winner determination based on score
- Draw option for tied matches
- Incomplete leg handling
- Stats saved after forfeit completion

**Real-time Sync:**
- Controller uses 4-digit connection codes
- Polling-based state updates
- LocalStorage for state sharing
- Scoreboard auto-refreshes from gameState

---

## 🎥 Usage for Live Streaming

### OBS Studio Setup

#### Scoreboard Overlay
```
Source Type: Browser
URL: file:///C:/path/to/scoreboard.html
Width: 1920
Height: 1080
CSS: (optional custom styles)
Shutdown when not visible: ✓
Refresh browser when scene active: ✓
```

#### Full Scoring App Capture
```
Source Type: Browser
URL: file:///C:/path/to/scoring-app.html
Width: 1920
Height: 1080
FPS: 30
```

### Streaming Tips
- Use scoreboard as transparent overlay over camera feed
- Position scoring app on secondary monitor for referee
- Controller allows mobile scoring away from desk
- Match stats auto-save for post-match analysis
- Green checkmark confirms stats will be recorded

### Production Workflow
1. Start OBS and add scoreboard browser source
2. Open scoring app on computer
3. Connect controller on mobile device
4. Start match and score normally
5. Scoreboard updates automatically
6. End match and save stats
7. Review stats in Match Central

---

## 🌐 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Android

### Requirements
- Modern JavaScript (ES6+)
- LocalStorage support
- CSS Grid and Flexbox
- Fetch API
- No build tools required

### Known Issues
- Older IE versions not supported
- Some CSS animations may vary by browser
- Mobile landscape recommended for controller

---

## 🔐 Security & Privacy

### Data Storage
- Player accounts stored securely in Supabase
- Passwords hashed via Supabase Auth
- Match stats linked by UUID only
- No personal data required beyond email

### RLS Policies
- Public read access to player library
- Insert/update restricted to authenticated users
- Row-level security on all tables
- Anonymous stats saving for unlinked players

### Local Data
- Game state in LocalStorage only
- No cookies used
- Connection codes temporary (session-based)
- Browser cache can be cleared anytime

---

## 🚧 Troubleshooting

### Stats Not Saving
1. Check table exists: Open `test-match-stats.html` → "Check if Table Exists"
2. Verify player has green checkmark (account linked)
3. Check browser console (F12) for errors
4. Ensure Supabase project URL is correct in `supabase-config.js`
5. Run SQL migration if table doesn't exist

### Controller Not Connecting
1. Verify both devices on same network (or internet)
2. Check connection code matches exactly
3. Refresh controller page and try again
4. Clear browser cache if persistent issues

### Scoreboard Not Updating
1. Ensure scoring app is running
2. Check LocalStorage permissions
3. Verify both pages from same domain/file path
4. Hard refresh scoreboard (Ctrl+F5)

### Account Linking Issues
1. Verify email confirmed in Supabase Auth
2. Check player exists in player library
3. Ensure logged in before linking
4. Try logout/login if problems persist

---

## 📈 Future Enhancements

### Planned Features
- [ ] Cricket game mode
- [ ] Around the Clock game
- [ ] Tournament bracket management
- [ ] Multi-match statistics
- [ ] Player vs Player head-to-head records
- [ ] Achievement badges and rewards
- [ ] Social sharing of match results
- [ ] PDF score sheets export
- [ ] Mobile app versions (PWA)
- [ ] Live streaming integration (YouTube, Twitch)

### Community Requests
- Custom color themes
- Multi-language support
- Accessibility improvements
- Offline mode enhancements

---

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome!

### Reporting Issues
- Check existing issues first
- Provide browser and OS details
- Include console errors if applicable
- Describe steps to reproduce

### Development
- Fork the repository
- Create feature branch
- Test thoroughly before submitting
- Follow existing code style

---

## 📄 License

For streaming production use.

---

## 📞 Support & Contact

**Repository**: [github.com/dowdarts/dartstream2](https://github.com/dowdarts/dartstream2)  
**Supabase Project**: `kswwbqumgsdissnwuiab`  
**Version**: 2.0  
**Last Updated**: December 2025

---

## 🙏 Acknowledgments

- Inspired by professional darts broadcasts
- Built with Supabase for backend infrastructure
- Community feedback and testing

---

**Made with ❤️ for the darts community**
