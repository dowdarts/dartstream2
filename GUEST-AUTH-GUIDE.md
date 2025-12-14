# Guest Mode Authentication System

## Overview

All DartStream apps now work **without authentication**. Users can:
- ✅ Play dart games (scoring-app, videostreamscoringapp)
- ✅ Use video calling (play-online)
- ✅ Use controllers and displays (controller, scoreboard)
- ✅ View player library

**Only with authentication**:
- 📊 Save and view personal statistics (player-account)
- 👤 Create and manage accounts
- 💾 Persistent match history

## How It Works

### Guest Mode System (`guest-auth.js`)

New module automatically detects authentication status:

```javascript
GuestAuth.isAuthenticated()  // true if logged in
GuestAuth.isGuest()         // true if in guest mode
GuestAuth.getUserId()       // Returns guest_id or user_id
GuestAuth.canAccessStats()  // true only if authenticated
```

### Auto-Detection

1. App loads → guest-auth.js initializes
2. Checks for existing Supabase session
3. If session found → authenticated mode (shows account/stats)
4. If no session → guest mode (shows banner, full app access)
5. Event dispatched: `guestAuthReady`

### Flow Diagram

```
User Opens App
    ↓
guest-auth.js loads
    ↓
Check Supabase session
    ↓
    ├─ Session exists → Authenticated mode ✅
    │  └─ Show account details
    │  └─ Show stats
    │  └─ Can save data
    │
    └─ No session → Guest mode 👤
       └─ Show guest banner
       └─ Stats unavailable
       └─ Full app access
       └─ "Sign in" link available
```

## App Status

### ✅ Works Without Authentication

| App | Feature | Status |
|-----|---------|--------|
| **scoring-app** | Play 301/501 games | ✅ Full access |
| **videostreamscoringapp** | Scoring + embedded video | ✅ Full access |
| **play-online** | Peer-to-peer video calls | ✅ Full access |
| **controller** | Remote control matches | ✅ Full access |
| **index** | Navigate between apps | ✅ Full access |
| **match-central** | View/manage matches | ✅ Full access |
| **scoreboard** | Display scores | ✅ Full access |

### 🔐 Requires Authentication

| App | Feature | Status |
|-----|---------|--------|
| **player-account** | View personal stats | ⚠️ Login required |
| **player-account** | Save match results | ⚠️ Login required |
| **player-account** | View history | ⚠️ Login required |

## File Structure

```
Root:
└── guest-auth.js               ← Core authentication module (NEW)

Each App Folder:
└── guest-auth.js               ← Copied to all apps
```

## Implementation Details

### Guest Mode Banner

Apps show optional banner when in guest mode:

```html
<!-- In player-account.html -->
<div id="guestModeBanner" class="guest-mode-banner" style="display: none;">
    <div class="guest-banner-content">
        <span class="guest-icon">👤</span>
        <span class="guest-text">You're in guest mode. 
            <a href="#" onclick="showLoginForm()">Sign in to save your stats</a>
        </span>
        <button class="close-banner" onclick="closeBanner()">×</button>
    </div>
</div>
```

### Usage in Apps

**Check if user can access stats**:
```javascript
if (GuestAuth.canAccessStats()) {
    // Show stats features
    loadPlayerStats();
} else {
    // Show "Sign in to see stats" message
    showStatsLockedMessage();
}
```

**Get current user ID** (works for guest & authenticated):
```javascript
const userId = GuestAuth.getUserId();
// Returns: "guest_1702xxx" or "user-uuid"
```

**Check authentication status**:
```javascript
if (GuestAuth.isAuthenticated()) {
    console.log('User logged in as:', GuestAuth.getUserEmail());
} else {
    console.log('Using guest mode');
}
```

**Listen for auth changes**:
```javascript
window.addEventListener('guestAuthReady', (e) => {
    if (e.detail.isGuest) {
        console.log('Guest mode active');
    } else {
        console.log('User authenticated');
    }
});
```

## Guest Mode Behavior

### What Guest Users Can Do
✅ Play full scoring games
✅ Use video calling
✅ Control displays
✅ View player library
✅ Browse app features
✅ Test all functionality

### What Requires Sign-In
🔒 Save personal statistics
🔒 Access match history
🔒 View account details
🔒 Link player accounts
🔒 Persistent data storage

## Player-Account App Changes

**Updated** `player-account.html`:
- Added guest mode banner
- Shows "Sign in" prompt
- Full guest functionality

**Updated** `player-account.js`:
- Uses GuestAuth instead of direct Supabase auth
- Checks `GuestAuth.isAuthenticated()`
- Shows login form if not authenticated
- Displays guest banner if in guest mode

## Scoring-App Changes

**Updated** `scoring-app.html`:
- Includes `guest-auth.js`
- Works fully in guest mode
- No stats saved (only in memory)

**No changes needed** to:
- `scoring-app.js` - Works with guest IDs
- `game-setup.js` - Player selection unchanged
- `player-library.js` - Falls back to localStorage

## Play-Online Changes

**Updated** `play-online.html`:
- Includes `guest-auth.js`
- Full video calling in guest mode
- Room codes work without account

**No changes needed** to:
- `play-online-app.js` - Works with guest IDs
- `video-room.js` - Peer connections unchanged
- `room-manager.js` - Room data independent

## Database Impact

**No changes to database**:
- Guest data not saved to database
- All existing tables unchanged
- Only authenticated users save stats
- No new columns needed

## Session Persistence

### Authenticated Users
- Session persists across browser refreshes
- Supabase handles session storage
- User remains logged in until logout

### Guest Users
- Guest ID regenerated on page reload
- No persistent session needed
- Each session is independent
- No cookies or storage required

## Logout Flow

**For authenticated users**:
```javascript
await GuestAuth.logout();
// User switched to guest mode
// Guest banner appears
// Stats become unavailable
```

## Transitioning Guest → Authenticated

**When user signs in**:
```javascript
// 1. User logs in via Supabase Auth
// 2. page refreshes or app detects session change
// 3. GuestAuth.initialize() runs again
// 4. Session detected → authenticated mode
// 5. Stats now available
// 6. Banner disappears
```

## Configuration

### No Configuration Needed
- All apps auto-detect mode
- Supabase credentials unchanged
- No new environment variables

### Optional Customization

**Change guest ID format** in `guest-auth.js`:
```javascript
this.guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// Customize prefix, timestamp, random string as needed
```

**Customize stats message** in app:
```javascript
const message = GuestAuth.getStatsMessage();
// Returns: "📊 Create an account to save and view your statistics"
```

## Testing

### Test Guest Mode
1. Open any app
2. Do NOT log in
3. App works fully
4. Try player-account → see banner

### Test Authenticated Mode
1. Open player-account.html with `?action=register`
2. Create account
3. Log in
4. Stats available
5. Banner gone

### Test Transitions
1. Open app authenticated
2. Use stats features
3. Manual logout
4. Switch to guest mode
5. Stats unavailable
6. Can re-login

## Browser Console Logs

### Guest Mode
```
🔐 GuestAuth initializing...
👤 Entering guest mode...
✅ Guest mode enabled: guest_1702xxx
✅ GuestAuth ready
```

### Authenticated Mode
```
🔐 GuestAuth initializing...
✅ User authenticated: user@example.com
✅ GuestAuth ready
```

## Migration Notes

### For Existing Apps
- Simply include `guest-auth.js`
- Apps continue to work unchanged
- Stats features auto-lock for guests
- No code changes required

### For New Features
- Check `GuestAuth.isAuthenticated()`
- Use `GuestAuth.getUserId()` for generic user reference
- Reserve stat-saving for authenticated only

## Security

### What's Protected
- Stats/history only saved for authenticated users
- User sessions managed by Supabase Auth
- Guest data never persisted
- No personal data collected from guests

### What's Public
- Player library (already public)
- Game functionality (no auth-gated features)
- Video call room codes (transient)
- Scoreboard displays (no auth needed)

## Performance Impact

### Minimal Overhead
- `guest-auth.js` is ~3 KB
- Single session check on init
- No polling or background checks
- Instant mode detection

## Future Enhancements

- [ ] Social login (Google, GitHub)
- [ ] Remember guest preference
- [ ] Optional guest stats (local-only)
- [ ] Migrate guest data on signup
- [ ] Session timeout for guests
- [ ] Guest session history

## Support

### Common Issues

**Q: User logged in but stats unavailable**
A: Clear browser cache, check Supabase status, verify session cookie

**Q: Guest banner won't disappear**
A: Close banner with × button, or wait for refresh

**Q: Stats saved in guest mode**
A: Stats only save for authenticated users - data will be lost on page reload

**Q: Can't sign in**
A: Check player-account app, ensure Supabase credentials correct

## API Reference

### GuestAuth Object

```javascript
// Properties
GuestAuth.currentUser           // User object or null
GuestAuth.isGuestMode          // Boolean
GuestAuth.guestId              // String (guest_xxx)
GuestAuth.supabaseClient       // Supabase instance

// Methods
await GuestAuth.initialize(supabaseClient)
GuestAuth.enterGuestMode()
GuestAuth.getUserId()          // → "guest_xxx" or user_id
GuestAuth.getUserEmail()       // → "user@example.com" or null
GuestAuth.isAuthenticated()    // → boolean
GuestAuth.isGuest()            // → boolean
GuestAuth.getStatus()          // → { isAuthenticated, isGuest, userId, email, user }
await GuestAuth.logout()
GuestAuth.canAccessStats()     // → boolean
GuestAuth.getStatsMessage()    // → string

// Events
window.addEventListener('guestAuthReady', (e) => {
    e.detail = { isAuthenticated, isGuest, userId, email, user }
});
```

---

**Status**: ✅ Complete
**All Apps**: Working without auth
**Stats**: Authenticated only
**Guest Mode**: Seamless and automatic
