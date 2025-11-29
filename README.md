# DartStream Scorer - Part 1

A professional dart scoring application with real-time TV scoreboard display for OBS streaming.

## Features

- **Dual Interface System**
  - Control Panel: Full-featured scoring interface for match operator
  - TV Viewer: Clean scoreboard display optimized for OBS capture

- **Real-time Updates**
  - WebSocket-based instant score synchronization
  - Automatic reconnection on connection loss
  - Live score updates across all connected viewers

- **Professional Scoring**
  - Support for 301, 501, and 701 game formats
  - Track sets, legs, and throws
  - Calculate player averages
  - Quick score buttons for common values
  - Bust detection and handling
  - Undo functionality

- **OBS-Ready Viewer**
  - Clean, professional scoreboard design
  - Responsive layout for different stream resolutions
  - Smooth animations for score changes
  - No watermarks or distractions

## Installation

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Version 14 or higher required

2. **Install Dependencies**
   ```powershell
   cd c:\Users\cgcda\Dartstream2
   npm install
   ```

## Usage

### Starting the Server

```powershell
npm start
```

The server will start on `http://localhost:3000`

For development with auto-restart:
```powershell
npm run dev
```

### Accessing the Interfaces

1. **Scorer Control Panel**
   - URL: `http://localhost:3000`
   - Use this interface to input scores and control the match
   - Features full scoring controls, player name editing, and game management

2. **TV Viewer (for OBS)**
   - URL: `http://localhost:3000/viewer`
   - Add as Browser Source in OBS Studio
   - Recommended resolution: 1920x1080 or 1280x720

## OBS Studio Setup

1. Open OBS Studio
2. Add a new source → Browser
3. Configure:
   - URL: `http://localhost:3000/viewer`
   - Width: 1920 (or your stream width)
   - Height: 1080 (or your stream height)
   - FPS: 30
4. Check "Shutdown source when not visible" for performance
5. Position and resize as needed in your scene

## Controls

### Scorer Interface

**Number Pad:**
- Click number buttons to build a score
- Click Submit or press Enter to record the score

**Quick Scores:**
- Buttons for common scores (95, 100, 121, 125, 135, 140, 180)
- Click for instant score entry

**Action Buttons:**
- UNDO: Undo last score entry
- MISS: Record a missed dart
- BUST: Mark current turn as bust (score goes back)
- Reset Game: Start a new game

**Keyboard Shortcuts:**
- Number keys (0-9): Enter scores
- Enter: Submit score
- Backspace: Delete last digit
- Escape: Clear current input

**Player Names:**
- Click player name fields to edit
- Changes sync automatically to viewer

**Game Format:**
- Select 301, 501, or 701 from dropdown
- Changing format resets the game

## Architecture

```
Dartstream2/
├── server.js              # Express + WebSocket server
├── package.json           # Dependencies and scripts
├── public/
│   ├── scorer.html        # Control panel interface
│   ├── viewer.html        # TV scoreboard display
│   ├── css/
│   │   ├── scorer.css     # Control panel styles
│   │   └── viewer.css     # TV viewer styles
│   └── js/
│       ├── scorer.js      # Control panel logic
│       └── viewer.js      # TV viewer logic
└── README.md
```

## WebSocket Events

The app uses WebSocket for real-time communication:

**Client → Server:**
- `score`: Submit a score value
- `undo`: Undo last action
- `miss`: Record a miss
- `bust`: Record a bust
- `reset`: Reset the game
- `updatePlayer`: Update player name

**Server → Client:**
- `state`: Complete game state update

## Customization

### Changing Port
Edit `server.js` line 152:
```javascript
const PORT = process.env.PORT || 3000;
```

### Styling the Viewer
Edit `public/css/viewer.css` to match your stream branding:
- Colors: Update gradient values and accent colors
- Fonts: Change font families in the CSS
- Layout: Adjust grid layouts and spacing

### Adding Satellite Number
The satellite number (8068) can be edited in the game state in `server.js`

## Troubleshooting

**Viewer not updating:**
- Check WebSocket connection status in browser console
- Ensure both scorer and viewer are connected to the same server
- Check firewall settings

**Server won't start:**
- Ensure port 3000 is not in use: `netstat -ano | findstr :3000`
- Kill conflicting process or change port

**OBS shows blank page:**
- Verify URL is correct (`/viewer` path)
- Check OBS browser source settings
- Try refreshing the browser source

## Next Steps (Future Parts)

This is Part 1 of the DartStream multi-part application. Future additions:
- Player statistics and match history
- Tournament bracket management
- Multi-match scheduling
- Player profiles and photos
- Advanced analytics
- Mobile companion app
- Cloud sync capabilities

## License

MIT License - Feel free to modify and use for your dart streaming needs!

## Support

For issues or questions about this scoring app, check the browser console for WebSocket connection status and errors.
