# Online Scorer Authentication - Quick Reference

## TL;DR Changes

✅ **Online scorer now requires Supabase authentication**
- Users must be logged into their player account before accessing online matches
- Player names auto-load from the database (no manual entry)
- Match records now link to authenticated users for future stats tracking

## What Changed in online-scoring-engine.js

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Auth Required** | ❌ No | ✅ Yes (redirects to login if not authenticated) |
| **Player Name Input** | ✅ User enters manually | ❌ Auto-populated from DB |
| **Name Storage** | Text input value | `player_accounts.account_linked_player_id` → `players.first_name/last_name` |
| **Match Records** | Room code + scores | + `host_user_id`, `host_player_id`, `guest_user_id`, `guest_player_id` |
| **Supabase Client** | `window.supabase` | `window.supabaseClient` (consistent with config) |

## User Journey

### ✅ Logged In User
```
Open online-scoring.html 
→ Auth check passes ✅
→ Load player data from DB
→ Show landing screen with "Host Match" / "Join Match" buttons
→ Choose game type
→ Host or join match (names auto-filled)
```

### ❌ Not Logged In User
```
Open online-scoring.html 
→ Auth check fails ❌
→ Show "Please log in to play online"
→ Redirect to player-account.html after 3 seconds
```

## Code Integration Points

### 1. Page Load
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuthentication();
    if (user) {
        await initializePlayerData(user);
        setupEventListeners();
    }
});
```

### 2. Authentication Check
```javascript
async function checkAuthentication() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session?.user) return session.user;
    else showAuthError(...) && redirect(...);
}
```

### 3. Player Data Load
```javascript
async function initializePlayerData(user) {
    // Get account → linked player ID
    // Get player → first_name + last_name
    onlineState.myName = `${firstName} ${lastName}`;
    onlineState.myPlayerId = playerId;
}
```

### 4. Match Creation
```javascript
await window.supabaseClient.from('live_matches').insert([{
    host_name: onlineState.myName,
    host_user_id: onlineState.authenticatedUser.id,  // ✨ NEW
    host_player_id: onlineState.myPlayerId,          // ✨ NEW
    ...
}])
```

## Testing Checklist

- [ ] Open online-scoring.html **without** logging in → redirects to login
- [ ] Log in via player-account.html
- [ ] Open online-scoring.html again → shows authenticated player name
- [ ] "Host Match" button shows "Host Match - [Your Name]"
- [ ] Host a match → room code generated, no name input
- [ ] Join a match → uses your authenticated name automatically
- [ ] Browser console shows: "✅ User authenticated" + "📊 Player data loaded"

## Database Schema Changes

### New Columns in live_matches
```sql
host_user_id UUID          -- Supabase auth user ID
host_player_id UUID        -- Foreign key to players.id
guest_user_id UUID         -- Supabase auth user ID
guest_player_id UUID       -- Foreign key to players.id
```

### Required Columns in player_accounts
```sql
user_id UUID               -- Supabase auth user ID
account_linked_player_id UUID  -- Foreign key to players.id
```

## Console Output Examples

### Success ✅
```
✅ User authenticated: user@example.com
📊 Player data loaded: John Smith, [player-uuid]
✅ Match created with room code: A7F2
```

### Error ❌
```
⚠️ No active session. Redirecting to login...
❌ Supabase client not available
❌ Error loading player data: PGRST116
```

## Files & Locations

- **Modified**: `dartstream-webapp/online-scoring-engine.js`
- **No Changes**: `online-scoring.html`, `supabase-config.js`, `styles.css`
- **Redirect Target**: `player-account.html` (for login)

## Backward Compatibility

❌ **Breaking Change**: Old system used manual name entry, new system requires auth
- If user wasn't logged in, they get redirected to login page
- Existing player library credentials needed (from player-account.html signup)

## Migration for Existing Users

If existing users want to use online scorer:
1. Sign up / Log in via `player-account.html`
2. Link their player profile to their account
3. Then open `online-scoring.html` → works with auth ✅

## Future Enhancements

- [ ] Stats saved to `match_stats` table linked by `host_user_id` / `guest_user_id`
- [ ] Leaderboard filtered by authenticated user
- [ ] Match history queryable via `user_id`
- [ ] Notifications when opponent joins/completes match
- [ ] Rating/ELO system per authenticated player
