# Remote Control Feature - Quick Reference Guide

## 🎯 Quick Start

### For Players Testing the Feature

**Requirements:**
- Two Supabase accounts with linked player accounts
- Two browsers (or incognito windows)
- Both players' names from `player_accounts` table

**Test Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAYER 1 (HOST)                          │
│                                                             │
│ 1. Open VideoStreamScoringApp                              │
│ 2. Sign in as "Matthew Dow"                                │
│ 3. Click "Create Game Room"                                │
│ 4. Code displayed: "ABC123"                                │
│ 5. Share code with Player 2                                │
│ 6. Wait for "Matthew Dow VS cgcdarts" screen              │
│ 7. Click to select starting player                         │
└─────────────────────────────────────────────────────────────┘
                            ↓ Share Code ↓
┌─────────────────────────────────────────────────────────────┐
│                    PLAYER 2 (GUEST)                         │
│                                                             │
│ 1. Open VideoStreamScoringApp                              │
│ 2. Sign in as "cgcdarts"                                   │
│ 3. Click "Join Game Room"                                  │
│ 4. Enter code: "ABC123"                                    │
│ 5. Click "Join Game"                                       │
│ 6. See "Matthew Dow VS cgcdarts" screen                   │
│ 7. Wait for host to select starting player                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Files Structure

### Main Directory Files
```
remote-control.js                              Core module
remote-control-ui.js                           UI controller
REMOTE-CONTROL-IMPLEMENTATION.md               Full guide
VIDEOSTREAM-REMOTE-CONTROL-SUMMARY.md         Summary
REMOTE-CONTROL-QUICK-REFERENCE.md             Quick reference
```

### VideoStreamScoringApp in "bring over" folder
```
videostreamscoringapp.html                    Updated with auth screens
styles.css                                    Updated with auth styles
app.js                                        No changes needed
remote-control.js                             Same as main
remote-control-ui.js                          Same as main
REMOTE-CONTROL-IMPLEMENTATION.md              Same as main
```

---

## 🔑 Key Concepts

### Connection Code
- **Format:** 6 characters (e.g., "ABC123")
- **Characters:** A-Z and 0-9
- **Uniqueness:** Guaranteed unique per room
- **Lifetime:** Until room is finished or 1+ minute inactive
- **Sharing:** Host shares code with guest

### Room States
```
"waiting" → Host created, waiting for guest
"active"  → Both players connected, game in progress
"finished" → Game completed, room cleaned up
```

### Player Roles
```
HOST:   Creates room, generates code, selects starting player
GUEST:  Joins room with code, waits for host to start game
```

---

## 🛠️ API Cheat Sheet

### Create a Room (Host)
```javascript
const result = await RemoteControlModule.createGameRoom();
console.log(result.code);  // "ABC123"
```

### Join a Room (Guest)
```javascript
const result = await RemoteControlModule.joinGameRoom("ABC123");
console.log(result.hostPlayer.fullName);   // "Matthew Dow"
console.log(result.guestPlayer.fullName);  // "cgcdarts"
```

### Listen for Updates
```javascript
RemoteControlModule.subscribeToRoom((roomData) => {
    console.log('Player connected:', roomData.guest_id);
});
```

### Update Game State
```javascript
await RemoteControlModule.updateGameState({
    starting_player: 1,
    scores: { player1: 500, player2: 501 }
});
```

### Get Current User
```javascript
const user = await RemoteControlModule.getCurrentUser();
const player = await RemoteControlModule.getLinkedPlayer(user.id);
console.log(player.fullName);  // "Matthew Dow"
```

### Leave Room
```javascript
await RemoteControlModule.leaveRoom();
```

---

## 🖥️ Screen Navigation

```
┌─────────────────┐
│  Login Screen   │
└────────┬────────┘
         │ Sign in
         ↓
┌──────────────────────────┐
│ Connection Mode Screen   │
└──────┬──────────┬────────┘
       │          │
    Create      Join
       │          │
       ↓          ↓
┌─────────────┐ ┌──────────────┐
│Room Created │ │Join Room     │
│   (Host)    │ │ (Guest)      │
└──────┬──────┘ └──────┬───────┘
       │               │
       │ wait/enter code
       │               │
       └───────┬───────┘
               │
               ↓
┌────────────────────────────────┐
│Starting Player Screen          │
│Matthew Dow VS cgcdarts        │
└────────┬───────────────────────┘
         │ Host selects start
         ↓
┌────────────────────────────────┐
│Game Screen                     │
│[GAME PLAYS]                    │
└────────────────────────────────┘
```

---

## 🐛 Troubleshooting Quick Fixes

### "Connection code not found"
- ✅ Host: Make sure you generated code (click "Create Game Room")
- ✅ Guest: Verify you copied code correctly
- ✅ Guest: Check code hasn't expired (inactive 1+ minute)

### "Player names showing as Home/Away"
- ✅ Both players must be signed in
- ✅ Wait for "Matthew Dow VS cgcdarts" message
- ✅ Both must have linked player accounts

### "Can't join with valid code"
- ✅ Room might be "active" already (another guest joined)
- ✅ Code might be from a finished game
- ✅ Check Supabase game_rooms table for room status

### "No linked player account found"
- ✅ User must have entry in `player_accounts` table
- ✅ Entry must have correct `user_id` matching auth user
- ✅ Create player account through player library first

---

## 📊 Database Schema Quick Reference

### game_rooms Table
```sql
id              UUID (primary key)
room_code       VARCHAR(6) - e.g., "ABC123"
host_id         UUID - Supabase user ID
guest_id        UUID - Supabase user ID or NULL
status          VARCHAR(20) - 'waiting', 'active', 'finished'
game_state      JSONB - { host_player, guest_player, ... }
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### player_accounts Table (Key Fields)
```sql
user_id         UUID - Links to auth.users
first_name      VARCHAR
last_name       VARCHAR
email           VARCHAR
player_id       VARCHAR - Unique code
```

---

## 🔔 Event Flow

### Host Creating Room
```
1. User clicks "Create Game Room"
2. RemoteControlModule.createGameRoom() called
3. Generate unique 6-char code
4. Insert into game_rooms table
5. Display code on screen
6. Subscribe to room updates
7. Wait for guest_id to become non-null
8. When guest joins, show starting player screen
```

### Guest Joining Room
```
1. User clicks "Join Game Room"
2. User enters code "ABC123"
3. RemoteControlModule.joinGameRoom("ABC123") called
4. Query game_rooms table for matching code
5. Verify room status is "waiting"
6. Update room: set guest_id, status='active'
7. Fetch host player info from game_state
8. Navigate to starting player screen
9. Subscribe to room updates
```

---

## 🎮 Game Flow with Remote Players

```
Matthew Dow (Host)          →  abc123  ←  cgcdarts (Guest)
     │                                        │
     ├──► Create Room ──────────────────┐    │
     │    Display: ABC123              │    │
     │                                 │    │
     │                                 │◄───┤ Enter Code
     │                                 │    │
     ├─── Wait for Connection ────────────┐ │
     │                                    │ │
     │◄─── Guest Joined Notification ◄────┘ │
     │                                       │
     ├── Both See: ──────────────────────────┤
     │  "Matthew Dow VS cgcdarts"           │
     │                                       │
     ├─► Select Starting Player ───┐        │
     │                             │        │
     │◄── Start Player Selected ◄──┤        │
     │                             │        │
     ├─────── GAME BEGINS ───────────────┤
     │                                    │
     └────► [PLAYING] [SCORING] [SYNCED] ◄─┘
```

---

## ✅ Testing Checklist

Before submitting code for review:

- [ ] Two test accounts created with linked players
- [ ] Host can create room and get unique code
- [ ] Code is exactly 6 characters
- [ ] Guest can join with correct code
- [ ] Both players' names display on starting screen
- [ ] Only host can click starting player buttons
- [ ] Game proceeds normally after starting
- [ ] Closing host window removes room
- [ ] Invalid codes show error message
- [ ] Copy button works for connection code

---

## 🚀 Deployment Checklist

Before deploying to production:

1. **Copy files to deployment directory**
   - remote-control.js
   - remote-control-ui.js
   - Updated videostreamscoringapp.html
   - Updated styles.css

2. **Verify Supabase configuration**
   - SUPABASE_URL set correctly
   - SUPABASE_ANON_KEY set correctly
   - game_rooms table exists
   - player_accounts table exists
   - RLS policies enabled

3. **Test authentication**
   - Supabase auth working
   - Player accounts linked correctly
   - JWT tokens valid

4. **Monitor database**
   - game_rooms auto-cleanup working
   - No accumulation of stale rooms
   - Connection codes generating properly

---

## 📞 Support Resources

1. **REMOTE-CONTROL-IMPLEMENTATION.md** - Full technical guide
2. **VIDEOSTREAM-REMOTE-CONTROL-SUMMARY.md** - Feature summary
3. **remote-control.js** - Inline code comments
4. **remote-control-ui.js** - Inline code comments

---

**Last Updated:** December 14, 2025
**Version:** 1.0
**Status:** Beta - Ready for Testing
