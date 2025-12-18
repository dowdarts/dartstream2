# Fix Join Request RLS Error

## Problem
Guests cannot send join requests due to RLS policy blocking UPDATE on game_rooms table.

**Error:** `new row violates row-level security policy for table "game_rooms"`

## Solution
Run the SQL migration in Supabase SQL Editor to update RLS policies.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `kswwbqumgsdissnwuiab`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the SQL**
   - Open file: `dartstream-webapp/fix-game-rooms-rls-join-requests.sql`
   - Copy all the SQL content
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see a table showing the new policies at the bottom
   - Check for these policies:
     - `Allow hosts to update their matches`
     - `Allow join requests from authenticated users`
     - `Allow guests to update accepted matches`

5. **Test the Fix**
   - Hard refresh your browser (Ctrl+Shift+R)
   - Try clicking a match in the lobby
   - Should now show "Join Request Sent!" screen
   - No more 403 Forbidden errors

## What Changed

### New RLS Policies:

1. **Host Updates** - Hosts can update their own matches
2. **Join Requests** - Any authenticated user can send join requests to waiting matches
3. **Guest Updates** - Guests can update matches they've been accepted to

### Security Rules:

- Only allow join requests to matches with status='waiting'
- Only allow one pending request at a time
- Users can only set their own user ID as pending_guest_id
- Hosts can always update their matches
- Guests can only update once accepted (guest_id matches their auth.uid())

## Testing

After applying the SQL:
1. Host creates match → sees waiting room ✓
2. Guest clicks match → sends join request (should work now)
3. Guest sees "Join Request Sent" screen ✓
4. Host sees join request notification ✓
5. Host accepts → both connect ✓
