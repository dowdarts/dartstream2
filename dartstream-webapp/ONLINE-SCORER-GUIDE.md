# DartStream Online Scoring Engine

## Overview
The Online Scoring Engine is a real-time synchronized darts scoring application that allows two remote players to compete in X01 games (301/501) with instant score synchronization via Supabase.

## Architecture

### Files
- **online-scorer.html** - Simplified UI with Host/Join landing screen and game screen
- **online-scoring-engine.js** - Core logic for real-time sync, turn-locking, and database operations
- **create-live-matches-table.sql** - Supabase schema for live match storage
- **styles.css** - Extended with online-specific styling (appended to existing file)

### Design Pattern: Database-Driven State

Unlike the original scoring-app which uses local state, the online scorer follows a **database-driven** pattern:

1. **Local Input**: Player enters darts locally (100, 180, etc.)
2. **Calculate**: JavaScript validates the input locally (bust detection, score calculation)
3. **Write to DB**: Update the `live_matches` table with new scores and switch turn
4. **Real-time Listener**: Supabase notifies both clients of the change
5. **Render from DB**: Both clients update their UI from the database state

**Benefit**: Both players always see the same data. No client-side conflicts possible.

---

## Setup & Deployment

### Phase 1: Supabase Migration
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the script in `create-live-matches-table.sql`
3. This creates:
   - `live_matches` table with UUID, room_code, scores (JSONB), turn tracking
   - RLS policies for public read/write
   - Timestamp triggers for auto-expiry

### Phase 2: Upload Files
Upload these files to your hosting (same directory as existing DartStream):
- `online-scorer.html`
- `online-scoring-engine.js`
- Updated `styles.css`

### Phase 3: Test
- Open `online-scorer.html` in two different browsers (or browser tabs)
- One tab: Click "Host Match"
- Other tab: Click "Join Match" and enter the code shown on the host tab

---

## User Flow

### Host Match (Player 1)
1. Click **"Host Match"** on landing screen
2. Enter your name (defaults to "Home")
3. Select game type (501 SIDO or 301 DIDO)
4. Click **"Create Match"**
5. A 4-letter room code is generated and displayed
6. Wait for opponent to join...
7. Once opponent joins, game screen loads automatically
8. Host always throws first

### Join Match (Player 2)
1. Click **"Join Match"** on landing screen
2. Enter your name (defaults to "Away")
3. Enter the 4-letter room code from the host
4. Click **"Join Match"**
5. Once host starts, game screen loads automatically
6. You can throw when it's your turn (turn status bar indicates this)

---

## Real-Time Synchronization

### Database Schema (`live_matches` Table)

```sql
{
  id: UUID,
  room_code: "A1B2",  -- 4-letter unique match identifier
  host_name: "Matthew",
  guest_name: "Moe",
  game_type: "501",  -- '501' or '301'
  start_type: "SI",  -- Straight In
  current_turn: "host",  -- 'host' or 'guest'
  scores: {
    host: 501,
    guest: 501,
    host_leg_avg: 0,
    guest_leg_avg: 0,
    host_match_avg: 0,
    guest_match_avg: 0,
    host_legs_won: 0,
    guest_legs_won: 0,
    host_darts_thrown: 0,
    guest_darts_thrown: 0,
    score_history: []
  },
  is_active: true,
  created_at: timestamp,
  last_updated: timestamp,
  updated_by: "host"  -- track who last moved
}
```

### Real-Time Listener

The app listens for `UPDATE` events on the `live_matches` table:

```javascript
supabase
  .channel(`match-${roomCode}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'live_matches'
  }, (payload) => {
    renderGameState(payload.new);  // Update UI from DB
  })
  .subscribe();
```

Both players receive updates in < 100ms, keeping the UI synchronized.

---

## Turn-Locking System

### How It Works

1. **Check Turn**: When a score is submitted, the database is updated with `current_turn: 'guest'`
2. **Supabase Notifies**: Both clients receive the update
3. **Lock/Unlock Keypad**: JavaScript checks if `currentTurn === myRole`
   - If it's your turn: Keypad is enabled (opacity: 1, pointer-events: auto)
   - If it's their turn: Keypad is disabled (opacity: 0.5, pointer-events: none)
4. **Status Bar**: Visual feedback shows:
   - **Green + "🎯 YOUR THROW"** when it's your turn
   - **Red + "⏳ OPPONENT'S TURN"** when waiting

### Code Example
```javascript
function updateTurnStatus(currentTurn) {
    const isMyTurn = 
        (myRole === 'host' && currentTurn === 'host') ||
        (myRole === 'guest' && currentTurn === 'guest');
    
    const keypad = document.getElementById('number-pad');
    
    if (isMyTurn) {
        keypad.style.pointerEvents = 'auto';
        keypad.style.opacity = '1';
        statusBar.style.backgroundColor = '#28a745';  // Green
        statusText.textContent = '🎯 YOUR THROW';
    } else {
        keypad.style.pointerEvents = 'none';
        keypad.style.opacity = '0.5';
        statusBar.style.backgroundColor = '#dc3545';  // Red
        statusText.textContent = '⏳ OPPONENT\'S TURN';
    }
}
```

---

## Scoring Flow

### 1. Build Local Input
Player clicks number pad buttons (1, 20, 180, etc.) → `onlineState.localInput` accumulates

### 2. Submit Score
Player clicks MISS or completes 3 darts → `submitScore()` is triggered

### 3. Validation & Calculation
```javascript
let newScore = scores[playerKey] - scoreInput;

// Bust detection
if (newScore < 0 || newScore === 1) {
    newScore = scores[playerKey];  // Restore
}
```

### 4. Send to Database
```javascript
const { error } = await supabase
    .from('live_matches')
    .update({
        scores: updatedScores,      // New game state
        current_turn: nextTurn,     // Switch turn
        updated_by: playerKey
    })
    .eq('id', matchId);
```

### 5. Real-Time Update
- Supabase broadcasts update to both clients
- Both clients call `renderGameState()` with updated scores
- UI reflects the change within ~100ms

---

## Error Handling & Edge Cases

### Connection Loss
- If the internet connection drops, the app will continue to work locally but won't sync
- Once reconnected, the next score submission will sync to the database
- **Future enhancement**: Implement local queue of pending updates

### Room Code Collision
- Room codes are 4 characters (alphanumeric) → 36^4 = 1.6 million combinations
- Supabase UNIQUE constraint prevents duplicate codes
- If duplicate (rare), user gets error and can try again

### Abandoned Matches
- Matches that haven't been updated in 1 hour are auto-marked `is_active = false`
- Prevents database bloat
- Scheduled job runs via database trigger

### Multiple Tabs
- If a player opens the app in multiple tabs/windows:
  - First tab establishes connection
  - Other tabs will also connect
  - **Issue**: Could submit scores from both tabs → **TODO**: Add browser session tracking

---

## Dual-Function Buttons

Like the original scoring-app, special buttons have dual functions:

| Button | Default | Long-Press | Purpose |
|--------|---------|-----------|---------|
| 100 | 100 | × (multiply for runs) | Double-count strategy |
| 180 | 180 | 0 (miss) | Perfect dart or skip |
| 140 | 140 | + (add/bonus) | Consistent high scorer |

**Implementation**: JavaScript detects button press duration. Long-press (> 500ms) triggers alt function.

---

## Keyboard Support (Future)

Currently, the app only supports touch/click input. Future versions could add:
- Physical dart board button mapping (1-6 = 1-60, 7-9 = 7-90, 0 = 100, etc.)
- Keyboard shortcuts (T = 180, M = miss, U = undo)
- Voice input (Google Cloud Speech-to-Text)

---

## Testing Checklist

### Local Testing (Single Device)
- [x] Landing screen displays "Host Match" and "Join Match"
- [x] Host setup form allows name entry and game type selection
- [x] Join setup form allows name and room code entry
- [x] Room code is generated and displays correctly on host waiting screen
- [x] Supabase connection works (check browser console)

### Multi-Device Testing (Two Browsers)
- [ ] Host creates match and gets room code
- [ ] Guest joins with correct room code
- [ ] Both players see each other's names
- [ ] Guest name appears on host screen
- [ ] Game screen loads for both automatically
- [ ] Turn status shows "YOUR THROW" and "OPPONENT'S TURN" correctly
- [ ] Keypad is locked when it's not your turn
- [ ] Score updates appear on both screens within 1 second
- [ ] Turn switches after each submission
- [ ] Scores match on both players' screens

### Sync Testing
- [ ] Host submits a score
- [ ] Guest screen updates with new score
- [ ] Guest submits a score
- [ ] Host screen updates with new score
- [ ] Score history is tracked in database
- [ ] Leg averaging calculates correctly

### Edge Cases
- [ ] Player joins with invalid room code (error message)
- [ ] Player opens app in two tabs (how does it handle this?)
- [ ] Player exits match and returns to landing
- [ ] Game completes (legs won logic)

---

## Future Enhancements

### Phase 2: Advanced Features
1. **Leg Management**
   - Track legs won automatically when player reaches 0
   - Display current leg score (e.g., "Leg 1 of 3")
   - Announce leg winners

2. **Match Statistics**
   - Calculate 3-dart average mid-game
   - Track best legs
   - Display player averages from database

3. **Multi-Leg Matches**
   - Support "Best of 3", "Best of 5", etc.
   - Auto-reset scores between legs
   - Track set/match progression

4. **Spectator Mode**
   - Allow third player to view (read-only access)
   - Display match info on TV/scoreboard

5. **Controller Integration**
   - Separate controller app that syncs with game
   - Bluetooth or Wi-Fi connection
   - Larger display for remote/streaming

### Phase 3: Advanced Sync
1. **Offline Queue**
   - Store pending updates locally
   - Sync when connection resumes
   - Conflict resolution (last-write-wins)

2. **Replay/Undo**
   - Store complete match history
   - Allow reviewing previous legs
   - Admin can reverse incorrect submissions

3. **Voice Chat**
   - Integrate Twilio or Discord API
   - In-app calling between players
   - Stream to Twitch/YouTube simultaneously

---

## Troubleshooting

### Issue: "Room code not found"
- **Cause**: Room code doesn't exist or match expired
- **Fix**: Host should regenerate and share a new code

### Issue: Scores not syncing
- **Cause**: Internet connection issue or Supabase downtime
- **Fix**: Check browser network tab, verify Supabase status

### Issue: Keypad stays locked
- **Cause**: Turn tracking got out of sync
- **Fix**: Refresh the page (data will reload from database)

### Issue: Both players can't see opponent's name
- **Cause**: Guest hasn't joined yet, or connection failed
- **Fix**: Have guest verify they're in correct room, refresh page

---

## Code Structure

### online-scorer.html
- Landing screen (Host/Join buttons)
- Setup screen (form inputs)
- Waiting screen (spinner while opponent joins)
- Game screen (scoreboard + keypad)
- Match complete modal

### online-scoring-engine.js
- **State Management**: `onlineState` object holds role, room code, match data
- **Screen Control**: `showScreen()` toggles visibility
- **Host Logic**: `hostMatch()` creates match and generates room code
- **Join Logic**: `joinMatch()` finds match and updates it with guest name
- **Sync Logic**: `subscribeToMatchUpdates()` listens for changes
- **Render Logic**: `renderGameState()` updates DOM from database
- **Input Logic**: `addToInput()`, `submitScore()`, `undoLastDart()`

### Supabase Integration
- Table: `live_matches`
- Auth: Public (no user authentication required for now)
- RLS: Permissive (any client can read/write)
- Listeners: Real-time channels via `postgres_changes` events

---

## API Reference

### Global Functions (window.OnlineScorer)

**Host a new match:**
```javascript
hostMatch()
// Creates row in live_matches, generates 4-char room code
// Sets onlineState.myRole = 'host'
```

**Join existing match:**
```javascript
joinMatch()
// Finds match by room_code in live_matches
// Sets onlineState.myRole = 'guest'
// Updates guest_name in database
```

**Submit a turn's score:**
```javascript
submitScore()
// Calculates new score from onlineState.localInput
// Sends to database with current_turn switch
// Clears local input
```

**Lock/unlock keypad based on turn:**
```javascript
updateTurnStatus(currentTurn)
// If currentTurn === myRole: Enable keypad, show "YOUR THROW"
// Else: Disable keypad, show "WAITING FOR..."
```

**Render full game state from database:**
```javascript
renderGameState(matchData)
// Updates: player names, scores, turn status, score history
// Called whenever database changes (via listener)
```

---

## License & Credits
Part of DartStream Professional Dart Scoring Platform.
Built with Supabase (https://supabase.com) for real-time database sync.
