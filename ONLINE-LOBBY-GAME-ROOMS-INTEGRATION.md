# Online Lobby - Game Rooms Integration

## Summary
Converted the Online Lobby system to use the existing `game_rooms` table (online scorer's match system) instead of creating separate `lobby_matches` and `join_requests` tables. This provides a simpler, instant-join workflow.

## Changes Made (Commit: e58761b)

### 1. Database Integration
**Before:** Tried to use non-existent `lobby_matches` and `join_requests` tables
**After:** Uses existing `game_rooms` table from online scorer

### 2. Match Browsing
**loadAvailableMatches():**
- Changed FROM `lobby_matches` → FROM `game_rooms`
- Filter: `.eq('status', 'waiting').is('guest_id', null)`
- Shows only open matches waiting for guests

### 3. Match Display
**renderMatches():**
- Parses `game_state` JSON from `game_rooms` table
- Extracts: `host_name`, `game_type`, `start_type`, `match_format`, `total_legs`
- Formats display: "501 SIDO Best of 3"

### 4. Direct Join (No Approval)
**handleMatchClick():**
- **Before:** Created join request, waited for host approval
- **After:** Instantly joins match by updating `game_rooms`:
  ```javascript
  UPDATE game_rooms 
  SET guest_id = myUserId,
      game_state = {...game_state, guest_name: myName}
  WHERE room_code = matchRoomCode
  ```
- Both players immediately redirect to split-screen

### 5. Match Creation
**createLobbyMatch():**
- **Before:** INSERT into `lobby_matches`
- **After:** INSERT into `game_rooms` with:
  ```javascript
  {
    room_code: 'ABCD',
    host_id: myUserId,
    status: 'waiting',
    game_state: {
      host_name: myName,
      host_player_id: null,
      game_type: '501',
      start_type: 'SIDO', 
      match_format: 'bo3',
      total_legs: 3,
      match_title: 'Open Match'
    }
  }
  ```

### 6. Real-time Subscriptions
**subscribeToLobbyUpdates():**
- Changed to watch `game_rooms` table
- Channel: `'lobby_game_rooms_channel'`
- Listens for: INSERT, UPDATE, DELETE on `game_rooms`

**subscribeToJoinRequests():**
- Commented out (not needed with direct join)

### 7. Removed Code
Commented out unused functions:
- `sendJoinRequest()`
- `cancelJoinRequest()`
- `acceptJoinRequest()`
- `declineJoinRequest()`
- `showJoinRequestModal()`

Removed from state:
- `myPendingRequest`
- `currentJoinRequest`
- `joinRequestListener`

## New Workflow

### Host Side:
1. Click "Host Match" button
2. Fill out match setup modal (501/301, SIDO/DIDO, format)
3. System creates entry in `game_rooms` table
4. Match appears in lobby with status 'waiting'
5. Host waits for guest to join

### Guest Side:
1. Browse available matches in lobby grid
2. See formatted info: "Host: John | 501 SIDO Best of 3"
3. Click match card to join
4. System updates `game_rooms` with guest info
5. Both players auto-redirect to split-screen
6. Online scorer loads with match already configured
7. Video call auto-connects

## Technical Details

### game_rooms Table Structure
```sql
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY,
  room_code TEXT UNIQUE,
  host_id UUID,
  guest_id UUID,
  status TEXT, -- 'waiting', 'in_progress', 'completed'
  game_state JSONB,
  created_at TIMESTAMP
);
```

### game_state JSON Structure
```javascript
{
  host_name: "John Doe",
  host_player_id: null, // Set later in player selection
  guest_name: "Jane Smith",
  guest_player_id: null,
  game_type: "501",
  start_type: "SIDO", // or "DIDO"
  match_format: "bo3", // or "single", "bo5", "bo7"
  total_legs: 3,
  match_title: "Open Match"
}
```

## Benefits

✅ **Simpler:** No join request approval system
✅ **Faster:** Instant join on click
✅ **Integrated:** Uses existing online scorer infrastructure
✅ **No new tables:** Leverages `game_rooms` that already exists
✅ **Auto-connect:** Both scorer and video call connect automatically
✅ **Real-time:** Live updates when matches are created/joined

## Testing Checklist

- [ ] Host creates match with 501 Best of 3
- [ ] Match appears in lobby with correct format
- [ ] Guest can see match in lobby grid
- [ ] Guest clicks match → both redirect to split-screen
- [ ] Online scorer loads with correct game settings
- [ ] Video call auto-connects for both players
- [ ] Match starts successfully after player selection
- [ ] Real-time updates when new matches created

## Files Modified

- `dartstream-webapp/online-lobby.js` - Complete refactor for game_rooms

## Version
- Online Lobby: v1.0.1
- Split-Screen: v2.6.6
- Play Online (Video): v2.6.2

## Related Documentation
- [ONLINE-LOBBY-COMPLETE.md](ONLINE-LOBBY-COMPLETE.md) - Original lobby design
- [PLAY-ONLINE-QUICK-REFERENCE.md](PLAY-ONLINE-QUICK-REFERENCE.md) - Video call system
- [SPLIT-SCREEN-QUICK-START.md](SPLIT-SCREEN-QUICK-START.md) - Split-screen integration
