# DartStream Web App - Fire OS / Silk Browser Edition

This is a standard web application version of DartStream, optimized for Fire OS Silk browser and other non-PWA environments. All PWA-specific features have been removed for maximum compatibility.

## What's Different from PWA Version?

### Removed Features:
- ❌ PWA manifest files
- ❌ Service workers
- ❌ Install prompts
- ❌ Apple touch icons
- ❌ `viewport-fit=cover` (causes issues on some devices)
- ❌ App-specific meta tags

### Standard Web Features:
- ✅ Pure HTML/CSS/JavaScript
- ✅ Works in any modern browser
- ✅ Fire OS Silk browser compatible
- ✅ No installation required
- ✅ Direct URL access
- ✅ Standard viewport settings

## Optimized For:

- 🔥 Amazon Fire Tablets (Fire OS)
- 🌐 Fire TV Silk Browser
- 📱 Any device without PWA support
- 💻 Standard desktop browsers
- 🖥️ Kiosk mode displays

## Files Included

### HTML Pages
- **index.html** - Landing page
- **scoring-app.html** - Scoring application
- **match-central.html** - Match management
- **scoreboard.html** - Broadcast display
- **controller.html** - Remote control
- **player-account.html** - User accounts

### JavaScript Files
- **app.js** - Core logic
- **scoring-app.js** - Scoring functionality
- **player-account.js** - Account management
- **player-library.js** - Player database
- **supabase-config.js** - Database connection
- **game-setup.js** - Game configuration
- **app-main.js** - Additional utilities

### Assets
- **styles.css** - Complete styling (2500+ lines)
- **dartstream-logo.png** - Main logo
- **logos/** - Partner logos (6 files)
- **flags/** - Country flags (14 files)
- **button images** - UI graphics

## Setup Instructions

### For Fire Tablet / Fire TV:

1. **Upload to Web Host:**
   - Upload entire `dartstream-webapp` folder to your web server
   - Note the URL (e.g., `https://yoursite.com/dartstream/`)

2. **Access on Fire Device:**
   - Open Silk Browser
   - Navigate to your URL
   - Bookmark for easy access

3. **Fullscreen Mode:**
   - Tap screen, select "Full Screen" from menu
   - Or use F11 on Fire TV remote

### For Standard Web Hosting:

```bash
# Option 1: Use a simple HTTP server
npx serve .

# Option 2: Python server
python -m http.server 8000

# Option 3: Upload to any web host via FTP/SFTP
```

## Browser Compatibility

### Tested & Working:
- ✅ Fire OS Silk Browser (Fire Tablet, Fire TV)
- ✅ Chrome / Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Samsung Internet

### Performance Notes:
- Fire Tablets: Use landscape orientation for scoring app
- Fire TV: Best with wireless mouse/keyboard or Fire remote
- Older devices: May need to reduce animation settings

## Configuration

### Database Connection
Edit `supabase-config.js` if using your own database:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Fire OS Optimizations
The following are already configured for Fire OS:
- Standard viewport (no safe-area-inset)
- Simplified touch events
- No app-install prompts
- Fallback fonts for Fire OS

## Fire Tablet Specific Tips

### Portrait Mode:
- Bottom padding added for keypad visibility
- Larger touch targets for finger use

### Landscape Mode (Recommended):
- Optimal layout for scoring app
- Better visibility for all controls

### Silk Browser Settings:
1. Enable JavaScript (required)
2. Enable cookies (for session management)
3. Disable "Request Desktop Site" (use mobile view)

## Deployment

### Option 1: Traditional Web Host
Upload via FTP to any web hosting service:
- GoDaddy, Bluehost, HostGator, etc.
- Upload to `public_html` or `www` folder

### Option 2: Cloud Hosting
Deploy to cloud services:
- **AWS S3**: Static website hosting
- **Netlify**: Drag & drop deployment
- **Vercel**: Git integration
- **GitHub Pages**: Free hosting

### Option 3: Local Network (Fire Devices)
Run on local network for event use:
```bash
# Start server on local IP
npx serve -l 8080

# Access from Fire devices on same WiFi
# http://192.168.x.x:8080
```

## Known Limitations

### Fire OS Specific:
- No offline mode (always requires internet)
- Cannot be "installed" like PWA
- Browser must remain open
- May sleep after inactivity (adjust Fire OS settings)

### Workarounds:
- Keep Fire device plugged in to prevent sleep
- Disable screen timeout in Fire OS settings
- Use "Stay Awake" developer option
- Bookmark main page for quick access

## Troubleshooting

### App Not Loading:
1. Check internet connection
2. Clear Silk browser cache
3. Disable browser ad-blockers
4. Enable JavaScript in settings

### Slow Performance:
1. Close other browser tabs
2. Clear Silk browser cache
3. Restart Fire device
4. Check WiFi signal strength

### Touch Issues:
1. Use landscape orientation
2. Zoom out if elements too small
3. Use stylus for precision
4. Enable "Touch Precision" in accessibility

## Features

All DartStream features work in this standard web version:
- ✅ Live scoring (all formats)
- ✅ Player library with stats
- ✅ Real-time database sync
- ✅ Scoreboard displays
- ✅ Remote control
- ✅ Player accounts
- ✅ Match central

## Support

This version is specifically maintained for Fire OS compatibility. For PWA features, use the main `dartstream-landing-page` version.

## License

© 2025 DartStream. Created by MDStudios for CGCDarts & Atlantic Amateur Darts Series.
