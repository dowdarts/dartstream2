# Online Scorer Authentication Update

## Overview
Updated `online-scoring-engine.js` to require user authentication before accessing online scoring. Users must be logged into their player account to play online matches.

## Key Changes

### 1. Authentication Check on Load
- **Before**: App loaded without any authentication requirement
- **After**: On page load, the app:
  1. Checks for active Supabase session via `window.supabaseClient.auth.getSession()`
  2. Retrieves authenticated user's player data from `player_accounts` table
  3. Links to their full name from `players` table
  4. Redirects to login page if not authenticated

```javascript
async function checkAuthentication() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (session && session.user) {
        return session.user;  // Authenticated ✅
    } else {
        redirectToLogin();  // Not authenticated, redirect to player-account.html
    }
}
```

### 2. Automatic Player Data Loading
- **Before**: User had to manually enter their name each time
- **After**: Player name automatically loaded from database based on authenticated user

```javascript
async function initializePlayerData(user) {
    // Get linked player from player_accounts table
    const { data: accounts } = await window.supabaseClient
        .from('player_accounts')
        .select('account_linked_player_id')
        .eq('user_id', user.id)
        .single();
    
    // Get full name from players table
    const { data: player } = await window.supabaseClient
        .from('players')
        .select('first_name, last_name')
        .eq('id', accounts.account_linked_player_id)
        .single();
    
    onlineState.myName = `${player.first_name} ${player.last_name}`;
}
```

### 3. Simplified UI - No Manual Name Entry
- **Before**: Host form had `host-name-input` field, Join form had `guest-name-input` field
- **After**: Both fields hidden/disabled; authenticated name displayed in title
  - Host Setup: "Host Match - [Player Name]"
  - Join Setup: "Join Match"

### 4. Enhanced Match Creation with User IDs
When hosting or joining, the system now stores:
- `host_user_id` - Authenticated user ID
- `host_player_id` - Link to players table for stats
- `guest_user_id` - Guest's authenticated user ID
- `guest_player_id` - Guest's player ID

```javascript
const { data, error } = await window.supabaseClient
    .from('live_matches')
    .insert([{
        room_code: onlineState.roomCode,
        host_name: onlineState.myName,
        host_user_id: onlineState.authenticatedUser.id,
        host_player_id: onlineState.myPlayerId,
        // ... game type, scores, etc.
    }])
```

### 5. Fixed Supabase Client References
- Replaced all `window.supabase` references with `window.supabaseClient` for consistency
- Ensures compatibility with supabase-config.js initialization pattern

## State Management

### Global State (onlineState)
```javascript
{
    authenticatedUser: { id, email },  // ✨ NEW: Auth session info
    myName: string,                    // ✨ Auto-populated from player_accounts
    myPlayerId: string,                // ✨ NEW: Link to players table
    myRole: 'host' | 'guest',
    roomCode: string,
    matchId: number,
    opponentName: string,
    opponentPlayerId: string,          // ✨ NEW: Opponent's player ID
    gameType: '501' | '301',
    currentTurn: string,
    localInput: number,
    isSubscribed: boolean,
    supabaseChannel: object
}
```

### Reset Behavior
- `resetOnlineState()` now preserves authentication data
- When user returns to landing screen, they stay logged in
- Only match-specific data is cleared between games

## Database Integration

### Required Tables
1. **player_accounts** (must exist in Supabase)
   - `user_id` - Supabase auth user ID
   - `account_linked_player_id` - Foreign key to players.id

2. **players** (existing)
   - `id` - Primary key
   - `first_name`, `last_name` - Used to display player name

3. **live_matches** (existing, updated schema)
   - `host_user_id` - NEW: Supabase user ID
   - `host_player_id` - NEW: Link to players table
   - `guest_user_id` - NEW: Supabase user ID  
   - `guest_player_id` - NEW: Link to players table

## Error Handling

### Authentication Failures
If authentication check fails:
1. Error message displayed on landing screen
2. 3-second timeout before redirect to `player-account.html`
3. Console logs detailed error information

```javascript
if (session && session.user) {
    // Success: Continue to scoring
} else {
    showAuthError('Please log in to play online');
    setTimeout(() => window.location.href = './player-account.html', 3000);
}
```

## Testing

### Manual Test Flow
1. **Not logged in**: Open online-scoring.html → See redirect to login page
2. **Logged in**: Open online-scoring.html → Shows authenticated player name
3. **Host match**: No name input needed, auto-populated
4. **Join match**: No name input needed, uses authenticated identity
5. **Match stats**: Recorded with user_id and player_id for future analytics

### Browser Console Expected Output
```
✅ User authenticated: user@example.com
📊 Player data loaded: John Smith, player-id-123
✅ Match created with room code: A7F2
✅ Match host started [room-code]
```

## Configuration Requirements

### HTML Page (online-scoring.html)
Must load scripts in order:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./supabase-config.js"></script>
<script src="./online-scoring-engine.js" type="module"></script>
```

### Supabase Setup
- Auth must be configured for email/password signup
- player_accounts table must have RLS policy allowing user to read own account
- Live matches must exist with new schema columns

## Migration Notes

### For Existing player_accounts Table
If `player_accounts` table doesn't have `account_linked_player_id`:
```sql
ALTER TABLE player_accounts 
ADD COLUMN account_linked_player_id UUID REFERENCES players(id);
```

### For Existing live_matches Table
If `live_matches` table needs new columns:
```sql
ALTER TABLE live_matches 
ADD COLUMN host_user_id UUID,
ADD COLUMN host_player_id UUID REFERENCES players(id),
ADD COLUMN guest_user_id UUID,
ADD COLUMN guest_player_id UUID REFERENCES players(id);
```

## Files Modified
- ✅ `dartstream-webapp/online-scoring-engine.js`
  - Added auth check on init
  - Added player data loading
  - Updated UI to hide name inputs
  - Fixed Supabase client references
  - Enhanced match creation with user IDs

## Files Unmodified (Can be used as-is)
- ✅ `online-scoring.html` - No changes needed (auth handled in JS)
- ✅ `supabase-config.js` - Already initializes `window.supabaseClient`
- ✅ `styles.css` - No styling changes
- ✅ `player-account.html` - Redirect target unchanged

## Future Enhancements
1. **Player Statistics**: Link match stats to authenticated user_id
2. **Match History**: Query live_matches by user_id for recent games
3. **Leaderboards**: Aggregate stats across authenticated users
4. **Notifications**: Alert when opponent joins/completes match
5. **Rating System**: Track win/loss by authenticated player
