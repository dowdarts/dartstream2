# DartConnect Scoring App

A professional darts scoring application designed for live streaming broadcasts. This app replicates the DartConnect interface and scoring logic for 501 and other dart game formats.

## Features

### Game Modes
- **Quick 501 SIDO** - Alternate start, Best of 3 legs
- **Extended 501 SIDO** - Alternate start, Best of 9 legs
- **Quick Cricket** - Best of 3 legs
- **Chicago** - Game choice format, Best of 3 legs
- **Custom Match Menu** - Create your own match rules

### Core Functionality
- ✅ Player library management with 20+ preset players
- ✅ Flexible match settings (sets, legs, game types)
- ✅ Advanced match configuration options
- ✅ 501 game with straight-in/double-out rules
- ✅ Automatic 3-dart average calculation
- ✅ Leg average and match average tracking
- ✅ Score entry via number pad (1-9, 100, 140, 180)
- ✅ Bust detection and validation
- ✅ Checkout hints
- ✅ Set and leg tracking
- ✅ Alternate start format
- ✅ Bull-up option for starting player selection

## How to Use

### Getting Started
1. Open `index.html` in a web browser
2. Select a game mode from the main menu
3. Choose players from the library or use default players
4. Select starting player (or use coin toss/random)
5. Start scoring!

### Scoring
- Click number buttons (1-9) to enter dart scores
- Use quick score buttons: **100**, **140**, **180**
- Click **MISS** to record a missed dart
- Click **BACK** to undo the last dart entry
- After 3 darts, the visit auto-submits

### Game Rules (501 SIDO)
- Each player starts with 501 points
- **SIDO** = Straight In, Double Out
  - Any score starts the game
  - Must finish on a double to win
- Subtracts each dart score from player total
- First to exactly 0 wins the leg
- Busts (going below 0 or landing on 1) reset the turn
- First to win required legs (e.g., 2 out of 3) wins the match

### Calculating Averages
The app automatically calculates:

**3-Dart Average Formula:**
```
(Points Scored ÷ Darts Thrown) × 3
```

**Example:**
- Player scores 501 points in 15 darts
- Average = (501 ÷ 15) × 3 = **100.2**

**Leg Average** - Performance for current leg only  
**Match Average** - Overall performance across all legs

## File Structure
```
Dartstream2/
├── index.html          # Main HTML structure
├── styles.css          # All styling and layout
├── app.js              # Game logic and state management
└── README.md           # This file
```

## Technical Details

### Game State Management
The app maintains a comprehensive game state including:
- Player scores, darts thrown, wins
- Current visit and dart count
- Set and leg tracking
- Match settings and format
- Player library

### Screens
1. **Game Mode Selection** - Choose game format
2. **Player Selection** - Pick left/right opponents
3. **Player Library** - Manage player database
4. **Match Settings** - Configure legs, sets, start format
5. **Game Selection** - Choose 301/501/Cricket
6. **Starting Player** - Select who throws first
7. **Main Game** - Active scoreboard and input

### Color Scheme
- **Primary Red**: #8b0000 (Dark Red)
- **Gold/Yellow**: #d4af37 (Accent color)
- **Background**: #000000 (Black)
- **Secondary**: #1a1a1a, #3a3a3a (Dark grays)
- **Buttons**: Gradient combinations for depth

## Future Enhancements
This scoring app is designed to integrate with other streaming tools:
- OBS Browser Source compatibility
- Real-time statistics overlays
- Multi-camera integration
- Player profile graphics
- Match replay system
- Live commentary integration

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Edge, Safari)
- Responsive design for different screen sizes
- No external dependencies required

## Usage for Live Streaming

### OBS Setup
1. Add Browser Source
2. Point to `index.html` file path
3. Set resolution (e.g., 1920x1080)
4. Configure as needed for overlay or full screen

### Tips
- Use fullscreen mode for clean overlay
- Score entry is simple and fast for live games
- All calculations are automatic
- Checkout hints help players and viewers

## Support
For issues or enhancements, refer to the reference files:
- `Scoring-app-basic-dart-logic.txt` - Scoring rules
- `scoringappcodereference.txt` - Original HTML reference

---

**Version**: 1.0  
**Based on**: DartConnect v3.24.9  
**License**: For streaming production use
