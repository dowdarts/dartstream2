# DartStream Play Online - Video Call Room

## Overview

**DartStream Play Online** is a standalone peer-to-peer video calling application that allows players to connect via WebRTC for real-time video communication. This application is **completely independent** from the scoring app and other DartStream modules—it's a dedicated video communication platform.

## Features

- 🎥 **Peer-to-Peer WebRTC** - Direct video/audio connection between players (no server relay)
- 🔗 **Room-Based Architecture** - Create/join rooms via unique 4-digit codes
- 📱 **Multi-Platform** - Works on desktop, tablet, and mobile (with camera/mic access)
- 🎤 **Media Controls** - Toggle audio/video during calls
- 👥 **Multiple Participants** - Support for 2+ players in a single room
- ⏱️ **Call Duration Tracking** - Automatic call timer
- 🌍 **Country Selection** - Display player nationality
- 💾 **Supabase Integration** - Room data stored in `game_rooms` table
- ⚡ **Real-Time Signaling** - Supabase Realtime channels for peer discovery

## Architecture

### Module Structure

```
play-online/
├── play-online.html          # Main entry point (screens/UI structure)
├── play-online.js            # UI controller (form handling, screen navigation)
├── play-online-app.js        # Main orchestrator (coordinates modules)
├── video-room.js             # WebRTC peer-to-peer engine
├── room-manager.js           # Room creation/joining/management
├── styles.css                # Complete styling (responsive, mobile-friendly)
├── manifest.json             # PWA configuration
├── supabase-config.js        # Database configuration (copied from root)
├── browser-detect.js         # Browser detection utilities (copied)
├── dartstream-logo.png       # App logo
├── flags/                    # Country flags (40+ PNG files)
└── logos/                    # Organization logos
```

### Core Modules

#### 1. **video-room.js** - WebRTC Peer Management
Handles all WebRTC peer-to-peer communication:
- `initialize(roomCode, playerId, playerName, videoElement)` - Setup with camera/mic
- `setupRealtimeChannel()` - Supabase Realtime for signaling
- `createOffer(peerId)` - Generate WebRTC offer
- `handleRemoteOffer(peerId, offer)` - Process incoming offer
- `handleRemoteAnswer(peerId, answer)` - Handle answer
- `handleRemoteIceCandidate(peerId, candidateData)` - Add ICE candidates
- `toggleAudio(enabled)` / `toggleVideo(enabled)` - Media controls
- `leaveRoom()` - Clean disconnect

**Signaling**: Uses Supabase Realtime to broadcast:
- Offers and answers (SDP)
- ICE candidates
- Peer presence (joined/left)

#### 2. **room-manager.js** - Room Lifecycle
Manages room data in Supabase `game_rooms` table:
- `generateRoomCode()` - Create random 4-digit code
- `createRoom()` - Host creates new room, returns code
- `joinRoom(roomCode, playerName)` - Guest joins existing room
- `getRoomDetails(roomCode)` - Fetch room info
- `updateRoomStatus(status)` - Update room state (waiting/active/finished)
- `leaveRoom()` - Close room or exit

**Room States**: `waiting` → `active` → `finished`

#### 3. **play-online-app.js** - Main Orchestrator
Coordinates VideoRoom and RoomManager:
- `initialize(supabaseClient, playerId, playerName)` - Setup
- `createAndStartRoom()` - Flow: create → init video → return room code
- `joinExistingRoom(roomCode)` - Flow: join → init video → connect to peers
- `toggleAudio()` / `toggleVideo()` - Delegate to VideoRoom
- `leaveRoom()` - Cleanup and disconnect
- Event callbacks: `onPeerJoined`, `onPeerVideoReady`, `onPeerLeft`, `onError`

#### 4. **play-online.js** - UI Controller
Manages screens, forms, and user interactions:
- Screen navigation (setup → room select → test → lobby → video call → ended)
- Form validation (player name, room code)
- Event listeners (button clicks, form submissions)
- Peer list updates (joined/left/connected)
- Call timer management
- Error handling and modals

### Screen Flow

1. **Setup Screen** - Enter player name & country
2. **Room Selection** - Create new or join existing room
3. **Test Screen** - Camera/microphone verification
4. **Lobby Screen** - Wait for peers, view participants
5. **Video Call Screen** - Active call with controls
6. **Ended Screen** - Call summary, option for new call

## Database Schema

### game_rooms table
```sql
CREATE TABLE game_rooms (
  id BIGINT PRIMARY KEY,
  room_code VARCHAR(4) UNIQUE NOT NULL,
  host_id TEXT NOT NULL,
  guest_id TEXT,
  status VARCHAR(20) DEFAULT 'waiting',  -- waiting, active, finished
  game_state JSONB DEFAULT '{}':JSONB,   -- { participants: [...], createdAt: ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `room_code` - Quick lookup by code
- `status` - Filter active rooms
- `created_at` - Cleanup old rooms

## Usage

### For Players

1. **Open the app**: Visit `play-online.html`
2. **Enter name**: Type your player name and select country
3. **Create or Join**:
   - **Create**: Click "Create Room" → get 4-digit code → share with friend
   - **Join**: Enter friend's code → click "Join Room"
4. **Test devices**: Verify camera and microphone working
5. **Wait in lobby**: See who's in the room
6. **Start video call**: Once all peers present, click "Start Video Call"
7. **Call controls**:
   - 🎙️ Toggle microphone
   - 📹 Toggle camera
   - 📞 Hang up
8. **End call**: Call ends when any player hangs up

### For Developers

#### Initialize the app:
```javascript
// In HTML, scripts load in order:
// 1. supabase-config.js
// 2. video-room.js
// 3. room-manager.js
// 4. play-online-app.js
// 5. play-online.js (initializes UI)

// The UI will auto-initialize on DOMContentLoaded
// No manual initialization needed
```

#### Listen for events:
```javascript
window.addEventListener('peerJoined', (e) => {
    console.log('Peer joined:', e.detail.peerId, e.detail.peerData.name);
});

window.addEventListener('peerVideoReady', (e) => {
    console.log('Peer video ready:', e.detail.peerId);
});

window.addEventListener('peerLeft', (e) => {
    console.log('Peer left:', e.detail.peerId);
});
```

#### Direct API access:
```javascript
// Create room
const roomData = await PlayOnlineApp.createAndStartRoom();
console.log('Room code:', roomData.roomCode);

// Join room
const joinedData = await PlayOnlineApp.joinExistingRoom('1234');
console.log('Joined as:', joinedData.role);

// Toggle controls
await PlayOnlineApp.toggleAudio(false);  // Mute
await PlayOnlineApp.toggleVideo(true);   // Camera on

// Leave
await PlayOnlineApp.leaveRoom();

// Get state
const state = PlayOnlineApp.getState();
console.log('Is in room:', state.isInRoom);
console.log('Is connected:', state.isPeerConnected);
```

## Configuration

### Supabase Setup

The app expects these Supabase credentials (set in `supabase-config.js`):
```javascript
const SUPABASE_URL = 'https://kswwbqumgsdissnwuiab.supabase.co';
const SUPABASE_ANON_KEY = '...'; // Public key (safe for client)
```

### WebRTC Configuration

STUN servers (turn for NAT traversal):
```javascript
const rtcConfig = {
    iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] }
    ]
};
```

For production TURN servers (relay), update `video-room.js`:
```javascript
iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    {
        urls: ['turn:your-turn-server.com:3478'],
        username: 'your-username',
        credential: 'your-password'
    }
]
```

## Responsive Design

- **Desktop** (1920×1080+): Multi-column video grid
- **Tablet** (768-1024px): Single column with responsive controls
- **Mobile** (< 768px): Full-screen video, bottom controls bar

## Browser Compatibility

- ✅ Chrome/Chromium (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14.1+)
- ✅ Edge (v90+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Requirements**:
- WebRTC support (RTCPeerConnection, RTCDataChannel)
- getUserMedia (camera/mic access)
- Promise support
- ES6 module syntax

## Security

### What's Public (RLS Policies)
- Room codes (code discovery)
- Participant names
- Room status

### What's Private
- Personal data stored locally only
- Video streams (peer-to-peer, never touch server)
- SDP offers/answers (via Realtime channels, not stored)

### Best Practices
1. Never share room code publicly
2. Room codes expire after 1 hour (cleanup function)
3. Only video metadata in database, not actual streams
4. Use HTTPS in production

## Troubleshooting

### "Camera/Microphone access denied"
- Check browser permissions settings
- Try incognito/private mode
- Restart browser and try again

### "Cannot find peer"
- Verify both players have same 4-digit room code
- Check internet connection stability
- Ensure Supabase project is accessible
- Check browser console for errors

### "Video freezes or lags"
- Check network latency (Ctrl+Shift+J → Network tab)
- Reduce video resolution in WebRTC constraints
- Move closer to WiFi router
- Try disabling other video apps

### "Peer left unexpectedly"
- Network interruption (check WiFi)
- Browser tab backgrounded/minimized
- Peer closed app or closed laptop
- Check browser console for specific error

### "Supabase connection failed"
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in `supabase-config.js`
- Check Supabase project status in dashboard
- Verify `game_rooms` table exists with RLS policies
- Check browser console for detailed error

## Performance

**Typical Metrics**:
- Initial setup: 2-3 seconds
- Peer connection: 1-2 seconds
- Video stream quality: 480p-720p (adjustable)
- Latency: 50-200ms depending on network

**Optimization Tips**:
1. Reduce video resolution for slower connections
2. Close other bandwidth-heavy apps
3. Use 5GHz WiFi or Ethernet
4. Enable hardware video encoding (automatic in modern browsers)

## Future Enhancements

- [ ] Screen sharing capability
- [ ] Call recording (local or cloud)
- [ ] Chat/messaging during calls
- [ ] Room password protection
- [ ] Scheduled calls
- [ ] Call history and stats
- [ ] Integration with scoring app (optional)

## Deployment

### Static Hosting (GitHub Pages, Netlify, Vercel)
1. Copy entire `play-online/` folder to static host
2. Ensure Supabase project is accessible
3. No server-side code required
4. Update `manifest.json` with correct start_url

### Fire OS / Silk Browser
1. Place in `dartstream-webapp/` for compatibility
2. Remove PWA manifest if needed (Silk Browser issues)
3. Test on actual Fire device

### Local Development
```bash
# Serve locally (requires Python or Node.js)
npx serve ./play-online

# Or use Python
python -m http.server 8000
# Visit http://localhost:8000/play-online.html
```

## License

Part of DartStream project. See root LICENSE file.

## Support

- **Issues**: Check browser console (F12) for errors
- **Questions**: Refer to MODULAR-ARCHITECTURE.md in root
- **Database**: See Supabase dashboard for room_codes table
- **WebRTC**: Consult MDN Web Docs for RTCPeerConnection API

---

**Created**: Latest DartStream iteration
**Status**: Production-ready
**Isolation Level**: Complete (no dependencies on other DartStream apps)
**Last Updated**: [Current Date]
