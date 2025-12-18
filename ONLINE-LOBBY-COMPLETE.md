# Online Lobby System - Complete Implementation Guide

## 🎯 Overview
A comprehensive online matchmaking lobby where players can:
- Browse available public matches
- Host matches visible to all players
- Send join requests to match hosts
- Accept/decline join requests as a host
- Auto-connect to both online scorer AND video call when match is accepted
- Use a single room code for both systems

## 📁 Files Created/Modified

### New Files
1. **create-online-lobby-tables.sql** - Database schema
   - `lobby_matches` table: Stores hosted matches with room codes, game settings, status
   - `join_requests` table: Tracks join requests with status (pending/accepted/declined/cancelled)
   - RLS policies for public access and security
   - Indexes for performance

2. **dartstream-webapp/online-lobby.html** - Lobby UI
   - Match cards grid showing available matches
   - Host match button
   - Join request modals
   - Cancel request buttons
   - Real-time updates styling

3. **dartstream-webapp/online-lobby.js** - Lobby logic
   - Authentication check
   - Real-time match list updates (Supabase subscriptions)
   - Join request sending/receiving
   - Accept/decline handling
   - Auto-redirect to split-screen on match accepted
   - Room code generation

### Modified Files
1. **dartstream-webapp/webapp-online-scorer.html**
   - Added "Online Lobby" button to landing screen

2. **dartstream-webapp/online-scoring-engine.js**
   - Added event listener for Online Lobby button
   - Redirects to online-lobby.html

3. **dartstream-webapp/split-screen-online.html**
   - Enhanced URL parameter handling: `?room=ABCD&auto=true`
   - Auto-connect logic for video call when coming from lobby
   - Sends AUTO_JOIN_VIDEO_ROOM message with autoConnect flag

4. **dartstream-webapp/play-online.html**
   - Enhanced AUTO_JOIN_VIDEO_ROOM message handling
   - Auto-clicks join button when `autoConnect=true` and `fromLobby=true`
   - Automatic video room connection for lobby matches

## 🔄 Workflow

### For Host Players:
1. Open split-screen-online.html
2. Click "Online Lobby" on online scorer side
3. Click "Host New Match"
4. Enter match title
5. Match appears in lobby with unique room code
6. Wait for join requests
7. When request received → modal appears with player name
8. Click "Accept" → auto-redirected to split-screen
9. Both scorer and video call connect automatically

### For Joining Players:
1. Open split-screen-online.html
2. Click "Online Lobby" on online scorer side
3. Browse available matches in grid
4. Click on a match card
5. Join request sent to host
6. "Pending" badge appears on match card
7. Can cancel request at any time
8. When host accepts → alert shown → auto-redirected to split-screen
9. Both scorer and video call connect automatically

## 🗄️ Database Schema

### lobby_matches Table
```sql
- id: UUID (primary key)
- host_user_id: UUID (references auth.users)
- host_display_name: TEXT
- room_code: TEXT (unique, 4 characters)
- match_title: TEXT (default: 'Open Match')
- game_type: TEXT (default: '501')
- start_score: INTEGER (default: 501)
- double_in: BOOLEAN (default: false)
- double_out: BOOLEAN (default: true)
- total_legs: INTEGER (default: 1)
- status: TEXT (waiting/in_progress/completed)
- joined_user_id: UUID (nullable)
- joined_display_name: TEXT (nullable)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### join_requests Table
```sql
- id: UUID (primary key)
- lobby_match_id: UUID (references lobby_matches)
- requesting_user_id: UUID (references auth.users)
- requesting_display_name: TEXT
- status: TEXT (pending/accepted/declined/cancelled)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## 🚀 Real-Time Features

### Supabase Subscriptions
1. **Match List Updates** - `lobby_matches_channel`
   - Listens for INSERT/UPDATE/DELETE on lobby_matches
   - Auto-refreshes match grid when changes detected

2. **Join Request Notifications** - `join_requests_channel`
   - Hosts receive INSERT events for pending requests
   - Shows modal for accept/decline
   - Joining players receive UPDATE events
   - Redirects when status changes to 'accepted'
   - Shows alert when status changes to 'declined'

## 🔗 Auto-Connect Integration

### URL Parameter Flow
```
Lobby → Accept → split-screen-online.html?room=ABCD&auto=true
                 ↓
                 online-scoring-engine.js: ?room=ABCD (auto-joins)
                 ↓
                 play-online.html: AUTO_JOIN_VIDEO_ROOM message
                 ↓
                 Auto-clicks join button → both systems connected
```

### Split-Screen Integration
When `auto=true` in URL:
1. Split-screen loads both iframes
2. Passes room code to online scorer via URL parameter
3. Waits 2 seconds for iframes to load
4. Sends AUTO_JOIN_VIDEO_ROOM message to video call iframe with:
   - `roomCode`: The 4-letter room code
   - `fromLobby`: true
   - `autoConnect`: true

### Video Call Auto-Join
When receiving AUTO_JOIN_VIDEO_ROOM with `autoConnect=true`:
1. Waits 1.5 seconds for page initialization
2. Fills room code input field
3. Switches to join screen
4. Waits 500ms
5. Auto-clicks join button
6. WebRTC connection established

## 🎮 UI/UX Features

### Match Cards
- **Green border**: Available matches
- **Orange border**: Match with your pending request
- **Status badges**: "Available", "Pending", "Your Match"
- **Hover effects**: Lift and glow
- **Click to request**: Simple one-click join

### Join Request Modal (Host View)
- Semi-transparent backdrop
- Yellow border for attention
- Player name displayed prominently
- Two-button layout: Accept (green) / Decline (red)
- Cannot be dismissed by clicking outside

### Cancel Request Button
- Red background
- Only appears on matches with pending request
- Click stops propagation (doesn't trigger match click)
- Updates database and refreshes UI

## 🛡️ Security & RLS

### RLS Policies
- **Public read**: Anyone can view waiting matches
- **Authenticated write**: Any user can create matches and join requests
- **Host control**: Only hosts can update/delete their matches
- **Request privacy**: Only host and requester can view join requests

### Guest Mode Support
- Anonymous users can browse lobby
- Can send join requests (stored with guest ID)
- Guest names displayed in match cards
- Full functionality without account

## 📊 Status Tracking

### Match Status Values
- `waiting`: Newly created, accepting join requests
- `in_progress`: Match accepted, players connected
- `completed`: Match finished (future use)

### Join Request Status Values
- `pending`: Waiting for host response
- `accepted`: Host accepted, player redirected
- `declined`: Host declined request
- `cancelled`: Requester cancelled before host responded

## 🔧 Technical Details

### Room Code Generation
```javascript
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
```
- Excludes similar characters (I, O, 0, 1, L)
- 4 characters long
- Unique constraint in database

### LocalStorage Usage
- `hosting_lobby_match_id`: Tracks which match the user is currently hosting
- Used to filter join request notifications
- Cleared when match ends or user leaves

### Cleanup on Unload
```javascript
window.addEventListener('beforeunload', () => {
    if (lobbyState.realtimeChannel) {
        lobbyState.realtimeChannel.unsubscribe();
    }
    if (lobbyState.joinRequestListener) {
        lobbyState.joinRequestListener.unsubscribe();
    }
});
```

## 🧪 Testing Checklist

### Host Flow
- [ ] Open split-screen, click Online Lobby
- [ ] Click "Host New Match", enter title
- [ ] Verify match appears in lobby with room code
- [ ] Wait for join request (use second browser/device)
- [ ] Verify modal appears with requester name
- [ ] Click Accept
- [ ] Verify redirect to split-screen with room code in URL
- [ ] Verify online scorer auto-connects
- [ ] Verify video call auto-connects (check console logs)
- [ ] Verify both systems use same room code

### Join Flow
- [ ] Open split-screen, click Online Lobby
- [ ] See hosted match in grid
- [ ] Click match card
- [ ] Verify "Pending" badge appears
- [ ] Click "Cancel Request" button
- [ ] Verify badge disappears
- [ ] Click match again to re-request
- [ ] Wait for host to accept
- [ ] Verify alert shows "Request accepted!"
- [ ] Verify redirect to split-screen
- [ ] Verify both systems auto-connect

### Real-Time Updates
- [ ] Two browsers: Browser A hosts, Browser B views lobby
- [ ] Verify Browser B sees new match instantly
- [ ] Browser B sends join request
- [ ] Verify Browser A gets modal instantly
- [ ] Browser A declines
- [ ] Verify Browser B gets "declined" alert instantly
- [ ] Verify match stays in lobby after decline

### Edge Cases
- [ ] Host leaves while join request pending → request auto-cleaned (database CASCADE)
- [ ] Multiple join requests for same match → only one shown at a time
- [ ] User has pending request, tries to request again → alert shown
- [ ] Network disconnection → reconnects and loads matches
- [ ] Refresh page while in lobby → matches reload correctly

## 🎨 Styling & Responsiveness

### Desktop (>768px)
- Match cards: 3-4 per row (auto-fill with min 350px)
- Large buttons with hover effects
- Side-by-side action buttons

### Mobile (<768px)
- Match cards: 1 per row (full width)
- Stacked buttons
- Touch-friendly tap targets
- Responsive grid layout

### Dark Theme
- Background: `#1a1a2e`
- Card background: `rgba(255,255,255,0.1)`
- Accent: `#FFD700` (gold)
- Hover: Yellow glow

## 🚀 Future Enhancements

### Potential Features
1. **Match Filters**: Filter by game type (301/501), format, skill level
2. **Search**: Search for specific players or match titles
3. **Friend System**: Invite specific friends to matches
4. **Match History**: Show completed matches in lobby
5. **Spectator Mode**: Allow others to watch matches
6. **Chat**: In-lobby text chat between players
7. **Rankings**: Leaderboard based on match stats
8. **Tournaments**: Bracket-style tournament creation from lobby
9. **Private Matches**: Password-protected matches
10. **Match Settings**: More granular control (legs, sets, double in/out)

## 📝 Notes for AI Agents

### When Editing Lobby System
- **Database changes**: Update `create-online-lobby-tables.sql` and run migration
- **Match list changes**: Edit `renderMatches()` function in online-lobby.js
- **Join request flow**: Check both INSERT and UPDATE subscriptions
- **Auto-connect changes**: Modify split-screen-online.html and play-online.html together
- **UI styling**: Use existing `.match-card` classes or add new ones inline

### Common Issues
- **"No matches"**: Check RLS policies, ensure status='waiting' in query
- **Join request not received**: Verify Supabase channel subscription active
- **Auto-connect fails**: Check console for postMessage timing issues
- **Room code mismatch**: Ensure same code passed to both scorer and video call

### Architecture Pattern
```
online-lobby.js (state management)
    ↓
Supabase (database + real-time)
    ↓
split-screen-online.html (coordinator)
    ↓
├── online-scoring-engine.js (scorer)
└── play-online.html (video call)
```

## 🎉 Version History
- **v1.0.0** (Initial Release) - Full online lobby system with join requests and auto-connect

---

**Git Commit**: `9d348db` - feat: add online lobby system with join requests and auto-connect
