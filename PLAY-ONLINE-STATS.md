# Play Online - Match Stats Saving Guide

## How Match Stats Are Saved in Play Online Mode

### Overview
When playing online via VideoStream, match statistics are **automatically saved** to both players' accounts (if they have linked player profiles).

### Requirements for Stats Saving
1. **Both players must be signed in** to their DartStream accounts
2. **Both players must have linked their account** to a player profile in the Player Library
3. The match must be completed (not forfeited)

### How It Works

#### During the Match:
1. **Turn Completion**: Each time a player completes their 3-dart turn:
   - Score is updated locally in the iframe
   - Score update is sent to the opponent in real-time via Supabase Realtime
   - Turn control switches to the opponent
   - Both players see the same game state

#### When Match Ends:
1. **Winner determined**: Scoring app detects match winner (e.g., first to win 2 sets)
2. **Match Complete Modal**: Shows winner and final stats for 3 seconds
3. **Auto-Save Process**:
   - **Local Player Stats**:
     - Fetches local player's linked `account_linked_player_id` from `player_accounts` table
     - Fetches opponent's account info from the game room
     - Creates match stats record with:
       - Match ID (unique: `online_[ROOMCODE]_[TIMESTAMP]`)
       - Winner status (won: true/false)
       - Legs won/lost, sets won/lost
       - Match averages, total darts thrown
       - Achievement counts (180s, 171s, 95s, 100+, 120+, 140+, 160+)
     - Saves to `match_stats` table via `window.PlayerDB.recordMatchStats()`
     - Triggers `update_player_lifetime_stats()` function to aggregate into `player_accounts.lifetime_stats`

   - **Opponent Stats**:
     - Match completion is broadcast to opponent via Supabase Realtime
     - Opponent receives the full game state and match data
     - Opponent's client saves their own stats using the same match ID
     - Both players' stats are saved independently but with matching `match_id`

4. **Confirmation**: Both players see "Match completed! Your stats have been saved to your account."

### Data Saved Per Player

Each player's `match_stats` record includes:

```javascript
{
  match_id: "online_A5B2_1733886400000",
  player_library_id: "uuid-of-player",
  opponent_name: "John Doe",
  match_date: "2025-12-10T20:30:00Z",
  won: true,
  legs_won: 3,
  legs_lost: 1,
  sets_won: 2,
  sets_lost: 0,
  total_darts_thrown: 54,
  total_score: 1503,
  average_3dart: 83.5,
  count_180s: 1,
  count_171s: 0,
  count_95s: 2,
  count_100_plus: 5,
  count_120_plus: 3,
  count_140_plus: 1,
  count_160_plus: 0,
  leg_scores: [...], // Detailed leg-by-leg data
  checkout_history: []
}
```

### Viewing Your Stats

After playing online:
1. Go to **Match Central** (`match-central.html`)
2. Your online match will appear in "Recent Matches"
3. Lifetime stats will be updated automatically:
   - Total matches played
   - Total wins/losses
   - Overall average
   - Total 180s, 171s, etc. (lifetime achievements)

### What If Stats Don't Save?

**Player Not Linked**:
- If you don't have a player profile linked to your account:
  - Match completes normally
  - Stats are NOT saved
  - Message: "No linked player account, stats not saved"
- **Solution**: Go to Player Account page → Link your account to an existing player or create a new player profile

**Opponent Not Linked**:
- If your opponent doesn't have a linked account:
  - YOUR stats are still saved
  - Opponent's stats are NOT saved
  - Your match record shows opponent name but opponent won't have a match record

**Database Error**:
- If there's a connection issue during save:
  - Match completes
  - Error message displayed
  - **Manual Save**: Currently not available (stats lost)
  - **Prevention**: Ensure stable internet connection during online play

### Database Schema

**Tables Involved**:
1. `match_stats` - Individual match records
2. `player_accounts` - User accounts with `lifetime_stats` JSONB
3. `game_rooms` - Online game room tracking
4. `players` - Player library profiles

**Trigger**: After insert/update on `match_stats`, the `update_player_lifetime_stats()` function automatically aggregates all match stats into the player's lifetime stats.

### Testing Stats Saving

1. **Create Two Test Accounts**:
   - Account A: Sign up, link to "Player One" in library
   - Account B: Sign up, link to "Player Two" in library

2. **Start Online Match**:
   - Account A: Host match → Generate code (e.g., "A5B2")
   - Account B: Join match → Enter "A5B2"

3. **Play a Quick Match**:
   - Set match to "First to 1 leg" for quick testing
   - Play through one leg until winner

4. **Verify Stats Saved**:
   - Both players: Go to Match Central
   - Check "Recent Matches" - should show the same match
   - Check lifetime stats - should be updated

5. **Database Verification**:
   - Go to Supabase Dashboard → Table Editor → `match_stats`
   - Filter by match_id starting with "online_"
   - Should see 2 records (one for each player) with same `match_id`

### Troubleshooting

**"Please sign in to use Play Online features"**
- You're not logged in
- Go to Player Account page and sign in

**Stats not appearing in Match Central**
- Refresh the page
- Check if you have `account_linked_player_id` set in your player account
- Check browser console for errors

**Opponent's video not connecting**
- This is a WebRTC issue, not stats-related
- Stats will still save even if video fails
- Check firewall/NAT settings

**Match ID collision** (rare)
- If two matches use same room code and finish at exact same millisecond
- Timestamp includes milliseconds, so extremely unlikely
- Both matches would still save (different player_library_ids)

---

## Summary

✅ **Online matches automatically save stats** to both players' accounts  
✅ **No manual save required** - auto-save after match completion  
✅ **Stats sync to Match Central** via `update_player_lifetime_stats()` trigger  
✅ **Works even if opponent disconnects** - local stats still saved  
✅ **Requires account linkage** - both players must link to Player Library profiles
