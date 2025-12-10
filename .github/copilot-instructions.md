# DartStream AI Coding Instructions

## Project Overview
DartStream is a professional darts scoring and streaming platform built with **vanilla JavaScript (ES6 modules), HTML5, and CSS3**. No build tools, bundlers, or frameworks—just pure web standards. The app runs entirely client-side with Supabase as the backend database.

## Architecture: Modular ES6 Design

### Core Module System (Read `MODULAR-ARCHITECTURE.md` for full details)
The codebase uses a **strict modular separation** pattern with ES6 imports/exports:

1. **`player-library.js`** - Player database CRUD operations
   - Exports: `PlayerLibraryModule` with methods like `initialize()`, `addPlayer()`, `getAllPlayers()`
   - Uses `window.PlayerDB` (from `supabase-config.js`) for Supabase operations
   - Implements localStorage caching for instant UI updates

2. **`game-setup.js`** - Game configuration and player selection
   - Exports: `GameSetupModule` with `startGame()` returning a config object
   - Handles UI for game modes (301/501 SIDO/DIDO), player selection, match settings
   - Returns complete game config: `{ gameType, startScore, player1Name, player2Name, totalLegs, ... }`

3. **`scoring-app.js`** - X01 scoring engine
   - Exports: `ScoringAppModule` with `initialize(config)`
   - Manages game state: current scores, averages, achievements (180s, 171s, etc.)
   - Implements bust detection (score = 1 or < 0) and double-out win validation
   - Dual-function buttons: 100/×, 180/0 or BUST, 140/+

4. **`app-main.js`** - Orchestrator
   - Coordinates initialization: PlayerLibrary → GameSetup → ScoringApp
   - Uses `waitForSupabase()` pattern—checks for `window.PlayerDB` before proceeding
   - Attaches "Start Game" button: `GameSetupModule.startGame()` → `ScoringAppModule.initialize(config)`

5. **`supabase-config.js`** - Database configuration
   - Exposes `window.PlayerDB` globally (bridge between old and new patterns)
   - Initializes Supabase client: `window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`

### Critical Pattern: window.* Global Bridge
Because Supabase loads asynchronously via CDN, the app uses **global window objects** as a compatibility layer:
- `window.PlayerDB` - Database methods (defined in `supabase-config.js`)
- `window.supabaseClient` - Supabase client instance
- `window.GameStateSync` - Real-time sync for multi-device (controller/scoreboard)

**When editing modules:** Never assume `PlayerDB` is immediately available. Always wait for `window.PlayerDB` to exist (see `waitForSupabase()` in `app-main.js`).

## Database Schema (Supabase PostgreSQL)

### Key Tables
- **`players`** - Player library (id, first_name, last_name, nationality)
- **`player_accounts`** - User authentication (user_id, email, account_linked_player_id → players.id)
- **`match_stats`** - Match records (player_library_id, won, legs_won, average_3dart, count_180s, etc.)

### Important SQL Patterns
- **RLS Policies**: Public access for scoring app (see `create-match-stats-table.sql`)
- **Trigger Function**: `update_player_lifetime_stats(p_player_library_id)` aggregates match_stats into player_accounts.lifetime_stats (JSONB)
- **JSONB Columns**: `lifetime_stats`, `leg_scores`, `checkout_history` for flexible data

## Development Workflow

### Editing Guidelines (From MODULAR-ARCHITECTURE.md)
- **Player library only?** → Edit `player-library.js` (don't touch game-setup/scoring-app)
- **Game setup/settings only?** → Edit `game-setup.js`
- **Scoring logic only?** → Edit `scoring-app.js`
- **Module coordination?** → Edit `app-main.js`

### Testing Locally
1. No build step required—open `scoring-app.html` directly in browser
2. Use `test-match-stats.html` to verify database connection
3. Check browser console for module loading sequence: `PlayerDB found! → Loading player library... → Initializing game setup...`

### Deployment
- **Root folder**: Production files for static hosting (GitHub Pages, Netlify)
- **`dartstream-webapp/`**: Mirror for Fire OS/Silk Browser compatibility (no PWA features)
- Upload to any static host—no server-side logic required

## Supabase Integration

### Configuration
- Project ID: `kswwbqumgsdissnwuiab`
- Anon key stored in `supabase-config.js` (safe for client-side use)
- CDN loaded via `<script>` tag in HTML (not npm package)

### Common Operations
```javascript
// Get all players (with account linkage check)
const players = await window.PlayerDB.getAllPlayers();

// Add player
await window.PlayerDB.addPlayer(firstName, lastName, nationality);

// Record match stats
await window.PlayerDB.recordMatchStats({
  player_library_id: '...',
  won: true,
  average_3dart: 85.5,
  count_180s: 3,
  ...
});
```

## Key Conventions

### Scoring Logic Specifics
- **Pre-turn score tracking**: Store `preTurnScore` before each 3-dart turn for bust restoration
- **Auto-submit**: After 3 darts entered, turn auto-submits
- **Bust conditions**: `score === 1` OR `score < 0` OR (doubleOut && finalScore !== 0)
- **Achievement tracking**: Incremented on turn submit (e.g., `turnTotal === 180` → `count_180s++`)

### UI Patterns
- **Screen switching**: `.screen` class with `.active` toggle (see `app-main.js` → `showScreen()`)
- **Dual-function buttons**: Detect long-press for secondary function (×, 0 or BUST, +)
- **Player selection**: Green checkmark (✓) indicates linked account (`account_linked_player_id`)

### File Organization
- **HTML pages**: Self-contained apps (e.g., `scoring-app.html`, `match-central.html`, `controller.html`)
- **Shared CSS**: Single `styles.css` (2500+ lines) with namespaced classes
- **No bundler**: Scripts loaded via `<script type="module">` in HTML

## Troubleshooting Common Issues

### "PlayerDB is not defined"
- Check `supabase-config.js` loaded before `app-main.js` in HTML
- Verify `waitForSupabase()` completes before module initialization

### Module import errors
- Ensure file paths use relative imports: `./player-library.js` (not `/player-library.js`)
- Check `type="module"` attribute on script tags

### Database connection failures
- Verify Supabase CDN script loaded: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Check browser console for RLS policy errors (may need to update policies in Supabase dashboard)

## Testing & Quality

### Manual Testing Checklist
1. Player library loads from Supabase (check network tab)
2. Game mode selection works (301/501 SIDO/DIDO)
3. Player selection filters/adds/edits correctly
4. Scoring: 3-dart auto-submit, bust detection, averages calculate
5. Match completion saves to `match_stats` table

### No Automated Tests
This is a personal project with manual testing only. When making changes:
- Test in multiple browsers (Chrome, Firefox, Safari recommended)
- Verify on Fire OS/Silk if deploying to `dartstream-webapp/`

## External Dependencies
- **Supabase**: Database, auth, real-time (loaded via CDN)
- **No npm packages** in production (package.json only for local dev server: `npx serve`)

## Future Context for AI Agents
- **Legacy file**: `app.js` (2021 lines) is the old monolithic version—kept as backup but not used
- **Planned features** (see README.md): Cricket game mode, tournament brackets, PWA mobile app
- **Fire OS compatibility**: `dartstream-webapp/` removes PWA manifest for broader compatibility
