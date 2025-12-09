# DartStream Complete Application

This is a standalone, fully functional version of the complete DartStream application suite. All files and dependencies are included for independent deployment.

## Files Included

### HTML Pages
- **index.html** - Landing page with app navigation
- **scoring-app.html** - Main scoring application for tablets/desktop
- **match-central.html** - View and manage all active matches
- **scoreboard.html** - Broadcast overlay for OBS/TV displays
- **controller.html** - Remote control for scoreboard settings
- **player-account.html** - User account management and stats

### JavaScript Files
- **app.js** - Core application logic
- **scoring-app.js** - Scoring app functionality
- **player-account.js** - Account authentication and management
- **player-library.js** - Player database management
- **supabase-config.js** - Database configuration and API calls
- **game-setup.js** - Game mode configuration

### Styles & Assets
- **styles.css** - Complete application styling (2500+ lines)
- **dartstream-logo.png** - Main DartStream logo
- **logos/** - Partner company logos (6 files)
- **flags/** - Country flag images for player nationalities
- **manifest.json** - PWA manifest for landing page
- **manifest-scoring.json** - PWA manifest for scoring app

### Configuration
- **package.json** - Project metadata and npm scripts
- **README.md** - This documentation file

## Features

✅ Complete DartStream application suite  
✅ Fully responsive design (mobile, tablet, desktop)  
✅ PWA-ready for installable app experience  
✅ Real-time Supabase database integration  
✅ Player account system with authentication  
✅ Live scoring with multiple game formats  
✅ Broadcast-ready scoreboard overlays  
✅ Remote scoreboard control  
✅ Player library with stats tracking  
✅ Match central for event management  

## Setup & Installation

### Quick Start
```bash
# Run locally with npx (no installation needed)
npm start

# Or install a static server globally
npm install -g serve
serve .
```

### Database Configuration
This application uses Supabase for backend services. The connection is already configured in `supabase-config.js`:
- Project URL: `https://kswwbqumgsdissnwuiab.supabase.co`
- Tables: `players`, `game_states`, `player_accounts`

**Note:** If deploying to your own Supabase project, update the credentials in `supabase-config.js`.

## Application Structure

### Landing Page (index.html)
Entry point with navigation to all apps and feature showcase.

### Scoring App (scoring-app.html)
- Live scoring for 301, 501, and custom formats
- Real-time stats calculation
- Player library integration
- Sync to scoreboard displays

### Match Central (match-central.html)
- View all active matches
- Select which match to display on scoreboard
- Manage tournament flow

### Scoreboard Display (scoreboard.html)
- Professional broadcast overlay
- OBS browser source compatible
- Customizable ads and branding
- Remote control enabled

### Controller (controller.html)
- Remote control scoreboard settings
- Switch between matches
- Control ad displays
- Mobile-optimized interface

### Player Account (player-account.html)
- User registration and login
- Personal stats dashboard
- Link account to player library
- View match history (future feature)

## Deployment

This folder can be deployed to any static hosting service:

### GitHub Pages
```bash
# Push to gh-pages branch
git subtree push --prefix dartstream-landing-page origin gh-pages
```

### Netlify
1. Drag and drop this folder to Netlify
2. Or connect your Git repository
3. Set build command: (none needed)
4. Set publish directory: `/`

### Vercel
```bash
vercel deploy
```

### Traditional Web Hosting
Upload all files via FTP/SFTP to your web server's public directory.

## Customization

### Changing Brand Colors
Edit `styles.css` and `index.html` (inline styles):
- Primary Gold: `#facc15`
- Dark Blue: `#1a1a2e`
- Mid Blue: `#16213e`
- Border Gray: `#334155`

### Updating Partner Logos
Replace files in the `logos/` folder:
- Keep filenames the same, or
- Update references in `index.html`

### Modifying Game Formats
Edit `game-setup.js` to customize:
- Starting scores (301, 501, etc.)
- Legs to win
- In/Out rules (DIDO, SIDO)

### Database Connection
Update `supabase-config.js` if using your own database:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for Supabase database)
- For OBS: Browser source plugin

## Support & Documentation

For detailed game rules, scoring logic, and feature documentation, see:
- `Scoring-app-basic-dart-logic.txt` (in parent directory)
- `MODULAR-ARCHITECTURE.md` (in parent directory)

## License

© 2025 DartStream. Created by MDStudios for CGCDarts & Atlantic Amateur Darts Series.

All rights reserved.
