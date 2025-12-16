# DartStream Online Scorer - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### For Testing Locally
```bash
# Terminal 1: Serve files
npx serve

# Terminal 2: Open browser
# Go to: http://localhost:3000/dartstream-webapp/online-scorer.html
```

### Two-Tab Test
1. Open `online-scorer.html` in **Tab A** (Host)
2. Open `online-scorer.html` in **Tab B** (Guest)
3. Tab A: Click "Host Match"
4. Tab B: Click "Join Match" → Enter code from Tab A
5. Both: Game screen should load → Start playing!

---

## 📊 Database Schema Quick View

```javascript
// Table: live_matches
{
  id: UUID,                    // Primary key
  room_code: "A1B2",          // Unique 4-char code
  host_name: "Matthew",        // Player 1 name
  guest_name: "Moe",           // Player 2 name
  game_type: "501",            // '501' or '301'
  current_turn: "host",        // 'host' or 'guest'
  scores: {                     // Game state (JSONB)
    host: 501,
    guest: 501,
    host_legs_won: 0,
    guest_legs_won: 0,
    // ... more fields
  },
  is_active: true,             // Flag for active matches
  last_updated: timestamp,     // Auto-updated
}
```

---

## 🔄 Real-Time Flow Diagram

```
Host Clicks "100"
      ↓
JavaScript: onlineState.localInput = 100
      ↓
Host Clicks "MISS" (submits)
      ↓
submitScore() {
  1. newScore = 501 - 100 = 401
  2. Send to Supabase: { scores: {...}, current_turn: 'guest' }
  3. Clear local input
}
      ↓
Supabase: UPDATE live_matches WHERE room_code='A1B2'
      ↓
Real-time Broadcast to Both Clients
      ↓
Both clients: renderGameState(updated_data)
      ↓
Guest's screen: Score updates + Keypad unlocks
Host's screen: Keypad locks (grayed out)
      ↓
Guest starts throwing (same cycle)
```

---

## 🎯 Key Functions Reference

### Setup Functions
```javascript
hostMatch()                    // Create match, generate code
joinMatch()                    // Join existing match with code
```

### Game Functions
```javascript
submitScore()                  // Process 3-dart turn, update DB
addToInput(value)             // Add dart to current input
undoLastDart()                // Remove last dart from input
```

### State Functions
```javascript
showScreen(screenId)          // Toggle between screens
subscribeToMatchUpdates()     // Setup real-time listener
renderGameState(matchData)    // Update DOM from DB
updateTurnStatus(currentTurn) // Lock/unlock keypad
```

### Utility Functions
```javascript
generateRoomCode()            // Generate 4-char code
resetOnlineState()            // Clear session data
startGame()                   // Load game screen
```

---

## 🔐 Security & RLS

### Current Policy (Phase 1)
```sql
-- Anyone can read active matches
CREATE POLICY "Anyone can read active matches"
ON live_matches FOR SELECT USING (is_active = true);

-- Anyone can insert (create match)
CREATE POLICY "Anyone can create a match"
ON live_matches FOR INSERT WITH CHECK (true);

-- Anyone can update
CREATE POLICY "Anyone can update a match"
ON live_matches FOR UPDATE USING (is_active = true);
```

### Phase 2 Enhancement (Planned)
```sql
-- Add auth_user_id tracking
ALTER TABLE live_matches ADD COLUMN created_by UUID;

-- Only creator can end match
CREATE POLICY "Creator can end match"
ON live_matches FOR UPDATE USING (created_by = auth.uid());
```

---

## ⚙️ Configuration Constants

```javascript
// In online-scoring-engine.js (top of file)

const CONFIG = {
  ROOM_CODE_LENGTH: 4,              // 'A1B2' format
  ROOM_CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  MATCH_EXPIRY_HOURS: 1,            // Auto-expire after 1 hour
  SYNC_TIMEOUT: 5000,               // 5 second timeout for updates
  INITIAL_SCORE_501: 501,
  INITIAL_SCORE_301: 301,
  MAX_INPUT_LENGTH: 3,              // Max darts per turn (3)
  BUST_SCORE_MIN: 2,                // Bust if score becomes 1 or less
  TURN_LOCK_OPACITY: 0.5,           // Keypad opacity when locked
};
```

---

## 🐛 Debugging Checklist

### "Room not found"
```javascript
// Check Supabase has the match
supabase
  .from('live_matches')
  .select('*')
  .eq('room_code', 'A1B2')
  // Should return 1 row
```

### "Scores not syncing"
```javascript
// Check listener is active
console.log(onlineState.isSubscribed);  // Should be true
console.log(onlineState.supabaseChannel);  // Should exist
```

### "Keypad always locked"
```javascript
// Check current_turn in database
supabase
  .from('live_matches')
  .select('current_turn')
  .eq('id', matchId)
  // Should match (myRole === 'host' || myRole === 'guest')
```

### "No console errors but nothing happens"
```javascript
// Check Supabase client loaded
console.log(window.supabase);  // Should have supabase object
console.log(window.supabaseClient);  // Alternate name
```

---

## 📱 Responsive Breakpoints

| Device | Width | CSS Class |
|--------|-------|-----------|
| Mobile | < 480px | `.mobile` (auto) |
| Tablet | 480-768px | `.tablet` (auto) |
| Desktop | > 768px | `.desktop` (auto) |

**Note**: CSS is automatically responsive. No need to add classes manually.

---

## 🎨 Color Reference

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Your Turn | Green | #28a745 | Status bar when it's your turn |
| Opponent's Turn | Red | #dc3545 | Status bar when waiting |
| Gold Accent | Gold | #ffd700 | Buttons, borders, highlights |
| Dark Background | Black | #000 | Main app background |
| Dark Control | Dark Gray | #1a1a1a | Input fields, modals |

---

## 📈 Performance Tips

### For Faster Sync
1. ✅ Good: 50-100ms RTT (round-trip time)
2. ⚠️ Caution: 100-300ms RTT (noticeable delay)
3. ❌ Poor: > 500ms RTT (lag feels bad)

### To Improve
- Use wired connection (not WiFi if possible)
- Test during off-peak hours
- Verify Supabase region is closest to you
- Check ISP for packet loss

---

## 🚦 State Transitions

```
START
  ├─ Landing Screen
  │   ├─ Host Match Button
  │   └─ Join Match Button
  │
  ├─ Host Path
  │   ├─ Setup Screen (name + game type)
  │   ├─ Create Match (Supabase INSERT)
  │   ├─ Waiting Screen (spinner + room code)
  │   └─ Game Screen (when guest joins)
  │
  └─ Guest Path
      ├─ Setup Screen (name + room code)
      ├─ Join Match (Supabase UPDATE guest_name)
      ├─ Waiting Screen (brief)
      └─ Game Screen (when host starts)

GAME SCREEN
  ├─ Real-time sync active
  ├─ Keypad locked/unlocked based on turn
  ├─ Status bar shows turn
  └─ Exit Match → Back to Landing
```

---

## 🔗 External Dependencies

```html
<!-- Required in online-scorer.html -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="online-scoring-engine.js"></script>
```

**Note**: No npm packages required! Pure browser JavaScript.

---

## 📝 Common Customizations

### Change Starting Score
```javascript
// In online-scoring-engine.js > hostMatch()
const startScore = onlineState.gameType === '501' ? 501 : 301;
// Change to:
const startScore = 701;  // For 701 game
```

### Change Room Code Length
```javascript
// In generateRoomCode()
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {  // Change 4 to 6 for longer codes
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### Change Match Expiry Time
```javascript
-- In create-live-matches-table.sql
UPDATE public.live_matches
SET is_active = false
WHERE is_active = true
AND last_updated < NOW() - INTERVAL '1 hour';  -- Change '1 hour' to '24 hours'
```

---

## 🎓 Learning Path

**New to the codebase?** Read in this order:

1. **This card** (5 min) ← You are here
2. **ONLINE-SCORER-SETUP.md** (10 min) - Setup & testing
3. **online-scorer.html** (10 min) - Understand the UI structure
4. **online-scoring-engine.js** (20 min) - Read the logic flow
5. **create-live-matches-table.sql** (10 min) - Understand database schema
6. **ONLINE-SCORER-GUIDE.md** (30 min) - Deep dive into architecture

---

## ✅ Pre-Launch Verification

Run this in browser console while testing:

```javascript
// Should return true for all
console.log('✓ Supabase:', !!window.supabase);
console.log('✓ State:', !!window.onlineState);
console.log('✓ Room Code:', onlineState.roomCode);
console.log('✓ My Role:', onlineState.myRole);
console.log('✓ Current Turn:', onlineState.currentTurn);
console.log('✓ Subscribed:', onlineState.isSubscribed);

// Check RLS by attempting write
supabase
  .from('live_matches')
  .select('count(*)', { count: 'exact' })
  .eq('is_active', true)
  .then(r => console.log('✓ RLS Read:', r.data?.count || 0, 'active matches'));
```

---

## 🆘 Quick Help

| Problem | Solution |
|---------|----------|
| "Can't connect" | Check internet, verify Supabase loaded |
| "Room not found" | Check room code spelling, try creating new match |
| "Scores not updating" | Refresh page, check console for errors |
| "Keypad frozen" | Wait for opponent's turn to complete, or refresh |
| "Game screen won't load" | Check browser console (F12), look for errors |

---

## 📞 Support Channels

- **Technical Issues**: Check console (F12) for error messages
- **Logic Issues**: See ONLINE-SCORER-GUIDE.md
- **Setup Issues**: See ONLINE-SCORER-SETUP.md
- **Code Questions**: Read inline comments in online-scoring-engine.js

---

**Last Updated**: December 16, 2025
**Version**: 1.0.0 (Phase 1)
**Status**: ✅ Production Ready
