# 🚀 Remote Scoreboard Quick Start

## Your Setup

- **Scorekeeper**: https://dowdarts.github.io/dartstream1/ ✅ Already deployed!
- **Scoreboard**: Needs separate hosting with Supabase sync

---

## 🎯 Goal

Host the scoreboard on a different server/computer that syncs with your GitHub Pages scorekeeper.

---

## ⚡ Quick Steps

### 1. Set Up Supabase (5 minutes)

1. Go to https://supabase.com → Sign up (FREE)
2. Create new project named "dartstream"
3. In **SQL Editor**, paste this:

```sql
CREATE TABLE game_states (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON game_states FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON game_states FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON game_states FOR UPDATE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
```

4. Click **Run**
5. Go to **Settings → API** and copy:
   - Project URL
   - Anon key

### 2. Configure Scorekeeper

Create file `scorekeeper-app/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Then rebuild and deploy:

```bash
cd scorekeeper-app
npm run build
npm run deploy
```

### 3. Host Scoreboard

**Option A: Netlify (Easiest - 2 minutes)**

1. Go to https://netlify.com
2. Sign up (free)
3. Drag & drop `scoreboard-app/supabase.html`
4. Get URL like: `https://dartstream-board.netlify.app`

**Option B: GitHub Pages (Separate Repo)**

1. Create new repo: `dartstream-scoreboard`
2. Upload `supabase.html` as `index.html`
3. Enable Pages
4. Get URL: `https://yourusername.github.io/dartstream-scoreboard/`

**Option C: Any Computer with Browser**

Just open `supabase.html` in Chrome/Edge - works from `file://` too!

### 4. Connect & Use

1. **Open scoreboard** URL
2. **Enter** Supabase credentials (one-time setup)
3. **Open scorekeeper**: https://dowdarts.github.io/dartstream1/
4. **Start match** and score
5. **Watch scoreboard** update in real-time! 🎯

---

## 🎥 For OBS Streaming

### If scoreboard is hosted online:

**Add Browser Source:**
- URL: `https://your-scoreboard-url.com`
- Width: 1920
- Height: 1080

### If scoreboard is local file:

**Add Browser Source:**
- ✅ Local File
- Browse to: `C:\Users\cgcda\dartstream\scoreboard-app\supabase.html`
- Width: 1920
- Height: 1080

Then just open the scorekeeper in your regular browser and start scoring!

---

## 📁 Files You Need

- **Scoreboard HTML**: `scoreboard-app/supabase.html` ← Deploy this
- **Setup SQL**: `supabase-setup.sql` ← Run in Supabase
- **Full Guide**: `SUPABASE_SETUP.md` ← Detailed instructions

---

## ✅ Checklist

- [ ] Supabase account created
- [ ] Database table `game_states` created
- [ ] Realtime enabled on table
- [ ] Supabase credentials added to scorekeeper `.env`
- [ ] Scorekeeper rebuilt and deployed
- [ ] Scoreboard hosted (Netlify/GitHub/Local)
- [ ] Scoreboard connected to Supabase
- [ ] Test: Start match, see it on scoreboard!

---

## 🆘 Need Help?

**Check these first:**
1. Browser console (F12) for errors
2. Supabase → Table Editor → Verify table exists
3. Supabase → Logs → Check for connection errors
4. Make sure both apps can reach internet

**Common issues:**
- "Not connected" → Check Supabase URL/key are correct
- No updates → Make sure Realtime is enabled on table
- Can't connect → Check firewall/proxy settings

---

## 🎯 That's It!

You now have:
- ✅ Scorekeeper on GitHub Pages
- ✅ Scoreboard on separate host
- ✅ Real-time sync via Supabase
- ✅ Can be used from anywhere with internet!

**Start scoring and enjoy! 🎯**
