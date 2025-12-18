# Online Lobby - Quick Reference Guide

## 🚀 Quick Start

### Setup (One-Time)
1. Run SQL migration: `create-online-lobby-tables.sql` in Supabase dashboard
2. Verify tables created: `lobby_matches`, `join_requests`
3. Check RLS policies are enabled

### For Players

#### Hosting a Match
```
1. Open split-screen-online.html
2. Click "Online Lobby" button on scorer side
3. Click "🎮 Host New Match"
4. Enter match title (or use default "Open Match")
5. Wait for join requests
6. Accept request → auto-connect to match
```

#### Joining a Match
```
1. Open split-screen-online.html
2. Click "Online Lobby" button on scorer side
3. Browse available matches
4. Click on a match card
5. Wait for host to accept
6. Auto-redirect → both scorer and video connect
```

## 📋 File Locations

### Core Files
- **Lobby UI**: `dartstream-webapp/online-lobby.html`
- **Lobby Logic**: `dartstream-webapp/online-lobby.js`
- **Database Schema**: `create-online-lobby-tables.sql`

### Modified Files
- `dartstream-webapp/webapp-online-scorer.html` - Added lobby button
- `dartstream-webapp/online-scoring-engine.js` - Lobby button handler
- `dartstream-webapp/split-screen-online.html` - Auto-connect logic
- `dartstream-webapp/play-online.html` - Video auto-join

## 🔑 Key Functions

### online-lobby.js
```javascript
// Core functions
loadAvailableMatches()      // Load and render match list
hostLobbyMatch()            // Create new lobby match
sendJoinRequest(matchId)    // Request to join a match
acceptJoinRequest()         // Host accepts request
declineJoinRequest()        // Host declines request
cancelJoinRequest(matchId)  // Player cancels their request

// Real-time
subscribeToLobbyUpdates()   // Listen for match changes
subscribeToJoinRequests()   // Listen for join requests

// Auto-connect
// On accept: window.location.href = `./split-screen-online.html?room=${roomCode}&auto=true`
```

## 🔄 Data Flow

### Match Creation
```
Host clicks "Host Match"
    ↓
online-lobby.js: hostLobbyMatch()
    ↓
Supabase: INSERT into lobby_matches
    ↓
Real-time: All clients receive update
    ↓
renderMatches() refreshes UI
```

### Join Request Flow
```
Player clicks match card
    ↓
sendJoinRequest()
    ↓
Supabase: INSERT into join_requests (status='pending')
    ↓
Real-time: Host receives notification
    ↓
showJoinRequestModal() displays accept/decline
```

### Accept Flow
```
Host clicks "Accept"
    ↓
acceptJoinRequest()
    ↓
UPDATE join_requests SET status='accepted'
UPDATE lobby_matches SET status='in_progress'
    ↓
Real-time: Player receives update
    ↓
Both players redirect: split-screen-online.html?room=ABCD&auto=true
    ↓
split-screen passes room to scorer (?room=ABCD)
split-screen sends AUTO_JOIN_VIDEO_ROOM to video call
    ↓
Both systems auto-connect with same room code
```

## 🗄️ Database Quick Ref

### lobby_matches
```sql
-- Create a match
INSERT INTO lobby_matches (
    host_user_id,
    host_display_name,
    room_code,
    match_title,
    status
) VALUES (
    'user-uuid',
    'John Doe',
    'ABCD',
    'Open Match',
    'waiting'
);

-- Query waiting matches
SELECT * FROM lobby_matches 
WHERE status = 'waiting' 
ORDER BY created_at DESC;

-- Update match when player joins
UPDATE lobby_matches 
SET status = 'in_progress',
    joined_user_id = 'player-uuid',
    joined_display_name = 'Jane Smith'
WHERE id = 'match-uuid';
```

### join_requests
```sql
-- Send join request
INSERT INTO join_requests (
    lobby_match_id,
    requesting_user_id,
    requesting_display_name,
    status
) VALUES (
    'match-uuid',
    'user-uuid',
    'Jane Smith',
    'pending'
);

-- Accept request
UPDATE join_requests 
SET status = 'accepted' 
WHERE id = 'request-uuid';

-- Cancel request
UPDATE join_requests 
SET status = 'cancelled' 
WHERE id = 'request-uuid';
```

## 🎯 URL Parameters

### split-screen-online.html
- `?room=ABCD` - Pre-fill room code for online scorer
- `?auto=true` - Enable auto-connect for both systems
- Combined: `?room=ABCD&auto=true` (from lobby)

### webapp-online-scorer.html
- `?room=ABCD` - Auto-join online scorer with this room code

## 🔧 Debugging

### Console Logs to Watch For
```javascript
// Lobby initialization
'[LOBBY] Initializing...'
'✅ Authenticated: user@email.com'
'[LOBBY] Display name: John Doe'
'[LOBBY] ✅ Initialization complete'

// Match loading
'[LOBBY] Loading matches...'
'[LOBBY] Subscribing to real-time updates...'

// Join request (host side)
'[LOBBY] Join request received: {payload}'
'[LOBBY] Showing join request modal: {request}'
'[LOBBY] ✅ Join request accepted, match: {match}'

// Join request (player side)
'[LOBBY] Sending join request for match: matchId'
'[LOBBY] Join request updated: {payload}'
'✅ Request accepted! Connecting to match...'

// Auto-connect
'🔗 Split-screen loaded with room code: ABCD Auto: true'
'🎥 Auto-connecting to video call...'
'📡 Sent AUTO_JOIN_VIDEO_ROOM to video call'
'📹 Video call received auto-join request: {data}'
'🚀 Auto-connecting from lobby...'
'🎥 Auto-clicking join button...'
```

### Common Issues

**Match not appearing in lobby**
- Check: `status = 'waiting'` in database
- Check: RLS policy allows SELECT
- Console: Look for errors in `loadAvailableMatches()`

**Join request not received**
- Check: Supabase channel subscribed
- Console: Look for `'[LOBBY] Subscribing to join requests...'`
- Check: `hosting_lobby_match_id` in localStorage

**Auto-connect not working**
- Check: URL has both `?room=ABCD&auto=true`
- Console: Look for postMessage logs
- Check: 2-second delay for iframe loading
- Check: join button exists in play-online.html

**Video call not auto-joining**
- Console: Look for `'🚀 Auto-connecting from lobby...'`
- Check: `autoConnect` and `fromLobby` flags in message
- Check: join button click happens after 500ms delay

## 🎨 UI Classes

### Match Cards
```css
.match-card                  /* Base card style */
.match-card:hover            /* Hover effect */
.match-card.pending-request  /* Orange border for pending */
.match-card-header           /* Title and status row */
.match-title                 /* Match title (gold) */
.match-status                /* Badge */
.match-status.waiting        /* Green badge */
.match-status.pending        /* Orange badge */
.host-name                   /* Host display name */
.match-info-row              /* Game settings row */
.cancel-request-btn          /* Red cancel button */
```

### Modals
```css
.join-request-modal          /* Modal backdrop */
.join-request-modal.active   /* Show modal */
.modal-content-custom        /* Modal box */
.modal-btn.accept            /* Green accept */
.modal-btn.decline           /* Red decline */
```

## 🔐 Security Notes

- RLS policies restrict write operations to authenticated users
- Room codes are unique (database constraint)
- Join requests cascade delete when match deleted
- Anonymous users can view but should authenticate to play
- All real-time updates respect RLS policies

## 📊 Status Values

### Match Status
- `waiting` - Accepting join requests ✅
- `in_progress` - Players connected 🎮
- `completed` - Match finished (future use) 🏆

### Request Status
- `pending` - Waiting for host ⏳
- `accepted` - Host accepted ✅
- `declined` - Host declined ❌
- `cancelled` - Player cancelled 🚫

## 🚀 Next Steps

To extend the lobby:
1. Add filters (game type, format)
2. Add search functionality
3. Add match history view
4. Add friend invites
5. Add spectator mode
6. Add in-lobby chat

---

**Version**: 1.0.0  
**Last Updated**: December 18, 2025  
**Git Commit**: 768d3a4
