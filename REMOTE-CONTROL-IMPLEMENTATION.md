# VideoStreamScoringApp - Remote Control Implementation Guide

## Overview

The VideoStreamScoringApp now supports remote multiplayer functionality. Two players from different locations can connect to the same game using a connection code. The implementation uses Supabase for authentication, real-time sync, and game room management.

## Architecture

### New Files Added

1. **remote-control.js** - Core remote control module
   - Connection code generation and validation
   - Authentication via Supabase
   - Game room creation and joining
   - Real-time subscriptions

2. **remote-control-ui.js** - UI controller for connection flow
   - Screen navigation
   - Form handling (login, connection code entry)
   - Event listeners
   - Player information display

3. **Updated videostreamscoringapp.html**
   - New auth and connection screens
   - Supabase client initialization
   - Script references for new modules

4. **Updated styles.css**
   - Authentication screen styles
   - Connection code display styles
   - Auth form and button styles
   - Connection status animations

## Flow Overview

### For Host (Game Creator)

```
Login Screen 
    ↓
Connection Mode Screen (Choose "Create Game Room")
    ↓
Room Created Screen (Display connection code)
    ↓ (Wait for opponent)
Starting Player Screen (Both players connected)
    ↓
Game Proceeds
```

### For Guest (Joining Player)

```
Login Screen 
    ↓
Connection Mode Screen (Choose "Join Game Room")
    ↓
Join Room Screen (Enter 6-character code)
    ↓
Starting Player Screen (Connected to host)
    ↓
Game Proceeds
```

## How It Works

### 1. Authentication

Players must have a Supabase auth account with a linked player account in the `player_accounts` table.

**Required Player Account Fields:**
- `user_id` - Foreign key to auth.users
- `first_name` - Player first name
- `last_name` - Player last name
- `email` - Email address
- `player_id` - Unique player code

**Login Flow:**
```javascript
// User signs in with email/password
// System fetches linked player info via:
await RemoteControlModule.getLinkedPlayer(user.id)
```

### 2. Room Creation (Host)

```javascript
// Host calls:
const result = await RemoteControlModule.createGameRoom();

// Returns:
{
    roomId: "uuid-of-room",
    code: "ABC123"  // 6-character connection code
}

// Room is stored in game_rooms table with:
- room_code: "ABC123"
- host_id: "user-uuid"
- status: "waiting"
- game_state: { host_player: {...} }
```

### 3. Room Joining (Guest)

```javascript
// Guest enters code and calls:
const result = await RemoteControlModule.joinGameRoom("ABC123");

// System verifies:
1. Code exists in game_rooms table
2. Room status is "waiting" (not already full)
3. Guest has linked player account

// On success, room is updated:
- guest_id: "guest-user-uuid"
- status: "active"
- game_state: { host_player: {...}, guest_player: {...}, both_players_connected: true }

// Returns:
{
    roomId: "uuid",
    code: "ABC123",
    hostPlayer: { fullName, playerId, ... },
    guestPlayer: { fullName, playerId, ... }
}
```

### 4. Real-time Synchronization

Once both players are connected, the app subscribes to room changes:

```javascript
RemoteControlModule.subscribeToRoom((roomData) => {
    // Called whenever room_games table is updated
    // Can sync game state, scores, player actions, etc.
});
```

**Current Implementation:**
- Room is listened for guest connection
- Upon guest connection, shows starting player screen with both players' names
- Host sees player names updated in real-time

**Future Enhancement:**
- Game state updates during play
- Score syncing
- Turn tracking
- Undo/redo synchronization

### 5. Starting Player Selection (Host Only)

When both players are connected, the starting player screen shows:

```
[Host Player Name] VS [Guest Player Name]

Buttons (Host Only):
- Start [Host Player Name]
- Start [Guest Player Name]
- Coin Toss
- Random
- Skip
```

The host selects who starts the game. This can be extended to sync with guest via `updateGameState()`.

## Database Schema

### game_rooms Table

```sql
id UUID PRIMARY KEY
room_code VARCHAR(6) UNIQUE -- Connection code like "ABC123"
host_id UUID REFERENCES auth.users
guest_id UUID REFERENCES auth.users (null until joined)
status VARCHAR(20) -- 'waiting' | 'active' | 'finished'
game_state JSONB -- Flexible game data
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**game_state Structure:**
```json
{
  "host_player": {
    "userId": "uuid",
    "playerId": "uuid",
    "firstName": "Matthew",
    "lastName": "Dow",
    "fullName": "Matthew Dow"
  },
  "guest_player": {
    "userId": "uuid",
    "playerId": "uuid",
    "firstName": "User",
    "lastName": "Name",
    "fullName": "User Name"
  },
  "both_players_connected": true,
  "starting_player": 1 | 2,  // Which player starts (optional)
  "current_scores": {...},   // Can extend for live sync
  "match_settings": {...}    // Game mode, legs, etc.
}
```

## API Reference

### RemoteControlModule Methods

#### `initialize()`
Initialize the module. Waits for Supabase client.
```javascript
await RemoteControlModule.initialize();
```

#### `getCurrentUser()`
Get current authenticated user.
```javascript
const user = await RemoteControlModule.getCurrentUser();
// Returns: { id, email, ... }
```

#### `getLinkedPlayer(userId)`
Get player account linked to user.
```javascript
const player = await RemoteControlModule.getLinkedPlayer(userId);
// Returns: { playerId, firstName, lastName, fullName, playerCode, linkedPlayerId }
```

#### `createGameRoom()`
Create a new game room. Returns unique code.
```javascript
const result = await RemoteControlModule.createGameRoom();
// Returns: { roomId, code: "ABC123" }
```

#### `joinGameRoom(code)`
Join existing room with code.
```javascript
const result = await RemoteControlModule.joinGameRoom("ABC123");
// Returns: { roomId, code, hostPlayer, guestPlayer }
```

#### `subscribeToRoom(onUpdate)`
Listen for room updates in real-time.
```javascript
RemoteControlModule.subscribeToRoom((roomData) => {
    console.log('Room updated:', roomData);
});
```

#### `updateGameState(gameState)`
Update game state in room (syncs to other player).
```javascript
await RemoteControlModule.updateGameState({
    starting_player: 1,
    current_scores: { player1: 500, player2: 498 }
});
```

#### `leaveRoom()`
Leave current room and clean up.
```javascript
await RemoteControlModule.leaveRoom();
```

### RemoteControlUI Methods

#### `showConnectionModeScreen(playerInfo)`
Show screen to choose create or join room.
```javascript
RemoteControlUI.showConnectionModeScreen(player);
```

#### `switchScreen(screenId)`
Navigate to different screen.
```javascript
RemoteControlUI.switchScreen('join-room-screen');
```

## Integration with Existing Game

The implementation integrates with the existing scoring app:

1. **Player Names** - Dynamically populated from linked accounts
   - `gameState.players.player1.name` = Host player name
   - `gameState.players.player2.name` = Guest player name

2. **Starting Player Selection** - Host only
   - Host clicks button to select who starts
   - Can be extended to sync choice to guest

3. **Game Screens** - Unchanged
   - Game screen works with remote player info
   - All scoring logic works as-is

## Testing the Feature

### Prerequisites

1. Two Supabase user accounts with linked player accounts
   - Account 1: Matthew Dow (or similar)
   - Account 2: cgcdarts (or similar)

2. Both accounts must have `player_accounts` entry

### Test Scenario

**Setup:**
- Open app in two browser windows (or devices)
- Sign in as Player 1 in first window
- Sign in as Player 2 in second window

**Flow:**
1. Player 1 clicks "Create Game Room"
2. System displays code (e.g., "ABC123")
3. Player 2 clicks "Join Game Room"
4. Player 2 enters code from Player 1
5. System shows "Starting Player: Player 1 vs Player 2"
6. Player 1 selects starting player
7. Game begins with both players' real names displayed

### Expected Results

- ✅ Code is 6 characters, unique
- ✅ Code can be copied to clipboard
- ✅ Guest can join with correct code
- ✅ Both players' names display
- ✅ Starting player screen shows both names
- ✅ Only host can select starting player
- ✅ Game screen shows real player names
- ✅ Scores/stats linked to correct players

## Error Handling

### Login Errors
- Invalid credentials → "Invalid email or password"
- No linked account → "No linked player account found"

### Connection Errors
- Invalid code → "Connection code not found"
- Code not 6 chars → "Invalid code format"
- Room full → "Game room is no longer accepting connections"
- Room inactive → Database cleanup (rooms inactive 1+ minute auto-deleted)

## Security Considerations

### Row Level Security (RLS)

The `game_rooms` table has RLS policies allowing both authenticated and anonymous access:

```sql
-- Both authenticated and anon users can manage rooms
CREATE POLICY "Authenticated users can manage rooms" ON game_rooms FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon users can manage rooms" ON game_rooms FOR ALL TO anon USING (true);
```

This is permissive for multiplayer gameplay but consider restricting in production.

### Cleanup Job

Inactive rooms (status ≠ 'active' and not updated in 1 minute) are auto-deleted:

```sql
-- Runs every 30 seconds
SELECT cleanup_inactive_rooms();
```

## Future Enhancements

### 1. Real-time Score Syncing
```javascript
// When player throws dart:
RemoteControlModule.updateGameState({
    current_player: 1,
    dart_entered: 20,
    turn_total: 20,
    ...
});
```

### 2. Host Control Features
- Only host can pause/resume game
- Only host can confirm score entry from guest
- Only host can undo/redo moves

### 3. Spectator Mode
- Third browser can join as spectator
- Views scores in real-time
- No input ability

### 4. Statistics Sync
- Auto-save match stats to `match_stats` table
- Update player lifetime stats
- Leaderboards

### 5. Mobile App Integration
- PWA for mobile players
- Push notifications for turn
- Offline mode with sync when online

## Troubleshooting

### "Supabase client not available"
- Check if Supabase CDN script is loaded
- Wait 2-3 seconds for initialization
- Check browser console for errors

### Connection code not found
- Verify host created room first
- Code might have been auto-deleted (inactive rooms)
- Guest trying to enter code before host finishes setup

### Both players not connecting
- Check `game_rooms` table in Supabase
- Verify room status is 'waiting'
- Check auth users exist and have linked player accounts

### Player names showing as "Home" / "Away"
- Connection not established yet
- Verify both players signed in with correct accounts
- Check RemoteControlUI.onBothPlayersConnected() is called

## Support & Questions

For issues or questions:
1. Check browser console (F12) for error messages
2. Review Supabase logs in dashboard
3. Verify game_rooms table has data for current room
4. Test with fresh login (clear localStorage if needed)

---

**Last Updated:** 2024-12-14
**Version:** 1.0
**Status:** Beta - Testing and feedback needed
