# Online Scorer - Quick Setup Checklist

## ✅ Pre-Launch Checklist

### 1. Supabase Configuration
- [ ] Copy SQL from `create-live-matches-table.sql`
- [ ] Go to your Supabase project → SQL Editor
- [ ] Paste and execute the SQL
- [ ] Verify `live_matches` table appears in Tables list
- [ ] Check RLS policies are created:
  - [ ] "Anyone can read active matches" (SELECT)
  - [ ] "Anyone can create a match" (INSERT)
  - [ ] "Anyone can update a match" (UPDATE)

### 2. File Deployment
- [ ] Upload `online-scorer.html` to hosting
- [ ] Upload `online-scoring-engine.js` to hosting
- [ ] Verify `styles.css` includes online-scorer styles (appended)
- [ ] Verify `supabase-config.js` exists and is loaded
- [ ] Check file structure matches expected paths in HTML

### 3. Local Testing (Single Browser)
- [ ] Open `online-scorer.html` in browser
- [ ] Click "Host Match"
- [ ] Enter name (or leave blank)
- [ ] Select game type (501 or 301)
- [ ] Click "Create Match"
- [ ] Verify room code displays on waiting screen
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify Supabase client loaded (should see message)

### 4. Multi-Device Testing (Two Browsers)
- [ ] Open `online-scorer.html` in Browser A (Host)
- [ ] Click "Host Match", get room code (e.g., "A1B2")
- [ ] Open `online-scorer.html` in Browser B (Guest)
- [ ] Click "Join Match"
- [ ] Enter room code from Browser A
- [ ] Click "Join Match"
- [ ] Both browsers should show game screen
- [ ] Verify both see opponent's name
- [ ] Verify turn status bar shows green on host, red on guest

### 5. Real-Time Sync Testing
- [ ] Host clicks number pad (e.g., 100, 80, 20 = 200)
- [ ] Guest's screen updates with new score within 1 second
- [ ] Turn switches (host screen goes red, guest goes green)
- [ ] Guest clicks number pad (e.g., 100, 100, 100 = 300)
- [ ] Host's screen updates with guest's score
- [ ] Turn switches back to host
- [ ] Repeat 3 times to verify consistent sync

### 6. Edge Case Testing
- [ ] Host refreshes page → Should still see match (reload from DB)
- [ ] Guest refreshes page → Should still see match
- [ ] Host exits match → Landing screen appears
- [ ] Both exit → Verify match marked inactive in Supabase

### 7. Performance & Load
- [ ] No lag between button click and input display (< 200ms)
- [ ] No lag between score submission and opponent update (< 1 second)
- [ ] No console errors
- [ ] Keypad is responsive even during sync

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Supabase not initialized" in console | supabase-config.js not loaded | Verify `<script src="supabase-config.js"></script>` in HTML |
| Room code not found on join | Code expired or typo | Verify exact code, try regenerating |
| Scores not syncing | Internet connection or RLS policy issue | Check network tab, verify RLS policies in Supabase |
| Keypad always disabled | Database connection lost | Refresh page |
| Game screen doesn't load after join | Guest didn't properly join match | Check Supabase table, verify guest_name was updated |

---

## 🚀 Launch Approval Criteria

All items below must be ✅ before going live:

- [ ] Supabase table created and RLS policies active
- [ ] All three files uploaded (HTML, JS, updated CSS)
- [ ] Single-device test passes
- [ ] Two-device sync test passes 5+ turns
- [ ] No console errors during testing
- [ ] Keypad lock/unlock works correctly
- [ ] Turn status bar color changes appropriately
- [ ] Room code generation is random and unique
- [ ] Exit match returns to landing without errors

---

## 📊 Success Metrics

After launch, monitor these metrics:

| Metric | Goal | Current |
|--------|------|---------|
| Page load time | < 2 seconds | ___ |
| Room creation latency | < 500ms | ___ |
| Guest join latency | < 1 second | ___ |
| Score sync latency | < 100ms | ___ |
| Database error rate | < 0.1% | ___ |

---

## 🔄 Testing Scenarios

### Scenario 1: Quick Game
1. Host creates match (501 SIDO)
2. Guest joins
3. Host throws 180
4. Guest throws 140
5. Host throws 121 (wins leg)
6. Verify leg counter increments

### Scenario 2: Internet Hiccup
1. Host and guest playing normally
2. Disconnect guest's internet
3. Host submits score
4. Guest reconnects
5. Verify guest's score updates immediately
6. Game continues normally

### Scenario 3: Multiple Matches
1. Create Match A with room code "AAAA"
2. Create Match B with room code "BBBB"
3. Guest joins Match A
4. Another guest joins Match B
5. Verify scores in A don't affect B
6. Both matches run independently

### Scenario 4: Late Join
1. Host and guest play 3 legs
2. Guest closes browser
3. Guest rejoins same room code
4. Verify guest sees correct current score and leg count
5. Game continues from where it left off

---

## 📝 Deployment Checklist

### Pre-Deploy
- [ ] Code reviewed for errors
- [ ] All console warnings addressed
- [ ] CSS tested on mobile, tablet, desktop
- [ ] Supabase policies confirmed working
- [ ] Backup of existing `styles.css` created

### Deploy
- [ ] Files uploaded to production hosting
- [ ] CDN cache cleared (if applicable)
- [ ] Smoke test on production environment
- [ ] Real-time sync verified in production

### Post-Deploy
- [ ] Monitor Supabase logs for errors
- [ ] Check user feedback channels
- [ ] Track analytics (room creation rate, sync latency)
- [ ] Plan Phase 2 features based on user feedback

---

## 📞 Support

### Known Limitations (Phase 1)
- No user authentication (anyone can create/join)
- No persistent match history (deleted after 1 hour)
- No spectator mode
- No controller app integration
- Limited to 501/301 games only

### Roadmap (Phase 2)
- [ ] User authentication
- [ ] Match replay and statistics
- [ ] Multi-leg tournament support
- [ ] Spectator/scoreboard mode
- [ ] Mobile app version
- [ ] Voice chat integration

---

## 🎯 Final Notes

**The online scorer is a simplified, database-driven version of the original scoring-app.** Key differences:

| Feature | Original | Online |
|---------|----------|--------|
| State management | Local JavaScript | Supabase database |
| Player management | Player library | Simple name input |
| Sync mechanism | Manual (same device) | Real-time (via Supabase) |
| Number of devices | 1 (local play) | 2+ (remote play) |
| Game types | All (301, 501, Cricket, etc.) | X01 only (for now) |

**Performance target**: < 100ms latency between remote players.

**Success definition**: Two players in different locations can play a full game of darts with score sync so smooth they feel like they're in the same room.
