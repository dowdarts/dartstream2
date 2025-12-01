# DartStream Modular Architecture

## Overview
The app is now split into separate, focused modules for easier maintenance and development.

## File Structure

### Core Modules

1. **player-library.js** - Player Database Management
   - Handles all Supabase player interactions
   - Functions: initialize(), addPlayer(), updatePlayer(), deletePlayers(), refreshFromDatabase()
   - Manages localStorage caching
   - Exports: `PlayerLibraryModule`

2. **game-setup.js** - Game Configuration & Player Selection
   - Handles game mode selection (301/501, DIDO/SIDO, quick/extended/custom)
   - Manages player selection UI
   - Player library modal (add/edit/delete/filter players)
   - Match settings configuration
   - Exports: `GameSetupModule` with `startGame()` that returns complete game config
   
3. **scoring-app.js** - Pure Scoring Logic
   - X01 scoring calculator
   - Number pad input handling
   - Turn management (3-dart turns, pre-turn score tracking)
   - Bust detection (score = 1 or < 0)
   - Win validation (score = 0 AND double out)
   - Average calculations (leg/match averages)
   - Dual-function buttons (100/×, 180/0 or BUST, 140/+)
   - Keyboard hotkey support
   - Exports: `ScoringAppModule` with `initialize(config)`

4. **app-main.js** - Main Orchestrator
   - Coordinates all modules
   - Initialization sequence:
     1. Initialize player library
     2. Initialize game setup
     3. Show game mode screen
     4. On "Start Game" → get config from GameSetupModule → initialize ScoringAppModule
   
5. **supabase-config.js** - Database Configuration
   - Supabase client initialization
   - PlayerDB object with database methods

6. **app.js** - Legacy file (can be kept as backup or deleted)

## Data Flow

```
User selects game mode
    ↓
GameSetupModule handles setup screens
    ↓
User selects players and settings
    ↓
User clicks "Start Game"
    ↓
app-main.js gets config from GameSetupModule
    ↓
app-main.js passes config to ScoringAppModule.initialize()
    ↓
ScoringAppModule runs the game with provided settings
```

## Communication Between Modules

### Player Library → Game Setup
```javascript
// Game setup uses player library
const players = PlayerLibraryModule.getAllPlayers();
await PlayerLibraryModule.addPlayer(firstName, lastName);
```

### Game Setup → Scoring App
```javascript
// Game setup returns configuration
const config = GameSetupModule.startGame();
// Returns: {
//   gameType: '501',
//   startScore: 501,
//   startType: 'SIDO',
//   finishType: 'Double Out',
//   totalLegs: 3,
//   legsToWin: 2,
//   player1Name: 'John Doe',
//   player2Name: 'Jane Smith',
//   ...
// }

// Main app passes to scoring module
ScoringAppModule.initialize(config);
```

### Scoring App → Game Setup
```javascript
// When exiting game or match ends
ScoringAppModule.showScreen('game-mode-screen');
```

## Benefits of Modular Structure

1. **Separation of Concerns**
   - Player library: Only handles database
   - Game setup: Only handles configuration
   - Scoring app: Only handles scoring logic

2. **Easier Maintenance**
   - Edit scoring logic without touching player library
   - Modify player database without affecting game rules
   - Change UI/UX in setup screens independently

3. **Better Testing**
   - Each module can be tested independently
   - Mock data can be passed to modules

4. **Code Reusability**
   - Scoring module can be used for different game types
   - Player library can be shared across features

5. **Cleaner Development**
   - Work on one area without risk of breaking others
   - Smaller files are easier to navigate
   - Clear module responsibilities

## Editing Guidelines

### To edit PLAYER LIBRARY only:
- Edit: `player-library.js`
- Don't touch: `game-setup.js`, `scoring-app.js`

### To edit GAME SETUP/SETTINGS only:
- Edit: `game-setup.js`
- Don't touch: `player-library.js`, `scoring-app.js`

### To edit SCORING CALCULATOR only:
- Edit: `scoring-app.js`
- Don't touch: `player-library.js`, `game-setup.js`

### To change app initialization or module coordination:
- Edit: `app-main.js`

## Module Exports

### player-library.js
```javascript
export const PlayerLibraryModule = {
    initialize(),
    addPlayer(firstName, lastName),
    updatePlayer(playerId, firstName, lastName),
    deletePlayers(playerIds),
    refreshFromDatabase(),
    getAllPlayers(),
    findPlayerByName(firstName, lastName)
}
```

### game-setup.js
```javascript
export const GameSetupModule = {
    initialize(),
    startGame(), // Returns game config object
    // Plus many internal UI handlers
}
```

### scoring-app.js
```javascript
export const ScoringAppModule = {
    initialize(config), // Accepts game config
    // Plus all scoring functions (addScore, handleBust, etc.)
}
```

## Legacy Files

- **app.js** - Original monolithic file (2021 lines)
  - Can be kept as backup reference
  - Can be deleted once modular version is confirmed working
  - All functionality has been extracted to modules

## Testing the New Structure

1. Open app in browser
2. Should show game mode selection
3. Select a game mode
4. Player selection should work (library loaded from Supabase)
5. Start game
6. Scoring should work exactly as before
7. Number buttons should register inputs
8. All X01 rules should apply correctly

## Rollback Plan

If issues occur:
1. Revert index.html to use `app.js` instead of `app-main.js`
2. All original functionality is preserved in `app.js`
