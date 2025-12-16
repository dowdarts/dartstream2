# Split Screen Implementation - Quick Start

## What Was Added

### 1. New Files Created
```
dartstream-webapp/
├── videostream-online-split.html    ← Main split-screen page
├── play-online-modes.html           ← Mode selection screen
└── (existing files remain)
```

### 2. Updated Files
```
dartstream-webapp/
└── index.html                       ← Added "Play Online" card
```

## User Journey

```
User Opens App
    ↓
index.html (Main Dashboard)
    ├─ See "Play Online" card
    └─ Click it
        ↓
    play-online-modes.html (3 Options)
        ├─ 📊 Online Scorer (Full Screen)
        ├─ 🎬📊 Video + Scoring (NEW SPLIT SCREEN)
        └─ 🎥 Traditional VideoStream
            ↓
    [User Selects "Video + Scoring"]
        ↓
    videostream-online-split.html (SPLIT SCREEN)
        ├─ LEFT: 📹 Video Chat Section
        └─ RIGHT: 📊 Online Scorer Section
            ↓
        [User logs in]
            ↓
        [Host or Join Match]
            ↓
        [Score + Watch Simultaneously]
```

## How It Works

### Split Screen Layout

#### Desktop (1920x1080+)
```
┌────────────────────┬────────────────────┐
│                    │                    │
│  VIDEO CHAT        │   ONLINE SCORER    │
│  (50% width)       │   (50% width)      │
│                    │                    │
│  • Placeholder     │  • Game Setup      │
│  • Ready for       │  • Score Input     │
│    WebRTC/Jitsi    │  • Match Status    │
│                    │  • Real-time Sync  │
│                    │                    │
└────────────────────┴────────────────────┘
```

#### Tablet / Mobile
```
┌──────────────────────────────┐
│   VIDEO CHAT (40%)           │
│                              │
├──────────────────────────────┤
│   ONLINE SCORER (60%)        │
│                              │
│  • Game Setup                │
│  • Score Input               │
│  • Match Status              │
│                              │
└──────────────────────────────┘
```

### Key Features

✅ **Responsive Design**
- Automatically adapts to screen size
- Desktop: Side-by-side (50/50)
- Tablet: Stacked vertical (40/60)
- Mobile: Stacked vertical (35/65)

✅ **Shared Authentication**
- Single login via player-account.html
- Both sections use same `window.supabaseClient`
- Player data preserved across both views

✅ **Golden UI Separator**
- Visual separation between video and scorer
- Golden (#FFD700) border matching DartStream theme
- Responsive to screen size

✅ **Embedded Scorer**
- online-scorer.html loaded dynamically
- Full functionality preserved
- No modifications needed to scorer

## File Details

### videostream-online-split.html
**Size**: ~8KB
**Purpose**: Main split-screen container
**Features**:
- Flex layout with responsive breakpoints
- Loads online-scorer.html on demand
- Video placeholder ready for future integration
- Shared Supabase client

**Key Sections**:
```html
<div class="split-screen-container">
    <div class="video-section">
        <!-- Left: Video Chat -->
    </div>
    <div class="scorer-section">
        <div id="scorer-app">
            <!-- Right: Embedded Scorer -->
        </div>
    </div>
</div>
```

### play-online-modes.html
**Size**: ~6KB
**Purpose**: Mode selection screen
**Features**:
- 3 play mode options
- Beautiful card layout with hover effects
- Easy navigation to each mode
- Back button to main app

**Options**:
1. 📊 Online Scorer - Full screen scoring
2. 🎬📊 Video + Scoring - NEW split screen
3. 🎥 Traditional VideoStream - Original app

### Updated index.html
**Changes**:
- Added 1 new app card: "Play Online"
- Icon: 🎬 (clapperboard/video)
- Position: After "Scoreboard Controller"
- Links to: play-online-modes.html

```html
<a href="play-online-modes.html" class="app-card">
    <div class="app-icon">🎬</div>
    <h2>Play Online</h2>
    <p>Score matches online with video chat or traditional split-screen modes</p>
    <div class="device-type">💻 Desktop / Tablet</div>
</a>
```

## Technical Details

### Responsive Breakpoints
```css
Desktop  (1920px+):  50% | 50%  (side-by-side)
Laptop   (1024px):   50% | 50%  (side-by-side)
Tablet   (1024px):   40% | 60%  (vertical stack)
Mobile   (768px):    35% | 65%  (vertical stack)
```

### CSS Features Used
- Flexbox for layout
- Media queries for responsiveness
- CSS Grid for sub-layouts
- Custom scrollbar styling
- Responsive font sizing with `clamp()`

### JavaScript Features
- Fetch API to load scorer HTML
- DOM Parser to extract content
- Dynamic script injection for online-scoring-engine.js
- Error handling with user feedback

## Integration Points

### Scorer App Integration
```javascript
// Load scorer dynamically
const response = await fetch('./online-scorer.html');
const html = await response.text();
const doc = parser.parseFromString(html, 'text/html');
const appContent = doc.getElementById('app');
container.innerHTML = appContent.innerHTML;

// Load scorer engine
const script = document.createElement('script');
script.src = './online-scoring-engine.js';
document.body.appendChild(script);
```

### Supabase Configuration
```javascript
// Shared client between sections
window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY
);
```

### Video Placeholder Ready
```javascript
const SplitScreenIntegration = {
    switchToVideoStream(videoElement) {
        const container = document.getElementById('video-container');
        container.style.display = 'block';
        container.appendChild(videoElement);
    }
};
```

## Testing Checklist

### Page Load
- [ ] videostream-online-split.html loads without errors
- [ ] Scoreboard shows loading spinner
- [ ] Video placeholder visible on left
- [ ] Scorer app loads on right
- [ ] Golden border visible between sections

### Layout Tests
- [ ] Desktop (1920px): Side-by-side layout
- [ ] Laptop (1280px): Side-by-side layout
- [ ] Tablet (1024px): Vertical stack (40/60)
- [ ] Mobile (768px): Vertical stack (35/65)
- [ ] Rotation changes layout appropriately

### Functionality Tests
- [ ] Can sign in through scorer
- [ ] Can host a match
- [ ] Can join a match
- [ ] Scoring works properly
- [ ] Real-time sync works
- [ ] Back button returns to play-online-modes.html

### Play Mode Selection
- [ ] play-online-modes.html loads correctly
- [ ] All 3 options visible with descriptions
- [ ] Click "Online Scorer" → online-scorer.html
- [ ] Click "Video + Scoring" → videostream-online-split.html
- [ ] Click "Traditional VideoStream" → videostreamscoringapp.html
- [ ] Back button returns to main index.html

### Main Dashboard
- [ ] index.html shows new "Play Online" card
- [ ] Card has correct icon (🎬)
- [ ] Card has correct title and description
- [ ] Clicking card → play-online-modes.html
- [ ] Styling matches other app cards

## Performance Notes

**Memory Usage**: 
- Online scorer + split screen = moderate increase
- Video streaming (when added) will require optimization
- Recommended: 4GB RAM minimum for smooth operation

**Network**: 
- All resources load from same origin
- Supabase real-time subscriptions shared
- Consider CDN for assets in production

**Browser Compatibility**:
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## Future Enhancements

### Phase 1 (Quick Wins)
- [ ] Connect video and scorer via same room code
- [ ] Add toast notifications on opponent connect
- [ ] Add audio-only mode

### Phase 2 (Video Integration)
- [ ] WebRTC peer-to-peer video
- [ ] Jitsi Meet fallback
- [ ] Picture-in-picture support

### Phase 3 (Polish)
- [ ] Broadcast mode (spectators)
- [ ] Recording capability
- [ ] Chat overlay
- [ ] Instant replay

## Deployment

### Step 1: Upload Files
```bash
# Copy new files to dartstream-webapp/
cp videostream-online-split.html /var/www/dartstream-webapp/
cp play-online-modes.html /var/www/dartstream-webapp/
```

### Step 2: Verify Links
- Ensure online-scorer.html is accessible at `./online-scorer.html`
- Ensure online-scoring-engine.js is accessible at `./online-scoring-engine.js`
- Ensure styles.css exists and loaded
- Ensure all images/logos present

### Step 3: Test
```bash
# Open in browser
http://localhost:3000/dartstream-webapp/index.html
# Click "Play Online"
# Select "Video + Scoring"
# Test full workflow
```

## Troubleshooting

### Split screen not loading
**Problem**: Blank page or error
**Solution**: 
- Check browser console for errors
- Verify online-scorer.html is accessible
- Check Supabase client initialization
- Verify CORS if accessing from different domain

### Scorer not appearing on right
**Problem**: Only video section shows
**Solution**:
- Wait 2-3 seconds for async load
- Check browser console for fetch errors
- Verify online-scoring-engine.js loaded
- Check network tab in dev tools

### Layout not responsive
**Problem**: Still shows desktop layout on tablet
**Solution**:
- Hard refresh browser (Ctrl+Shift+R)
- Check viewport meta tag in HTML
- Verify CSS media queries are present
- Test with actual device (not just browser resize)

### Authentication issues
**Problem**: "Please log in" message in scorer
**Solution**:
- Verify player-account.html is accessible
- Check Supabase session
- Ensure player_accounts table exists
- Verify RLS policies allow read access

## Links

- 🏠 Main App: `../index.html`
- 🎬 Play Online Modes: `./play-online-modes.html`
- 📊 Online Scorer (Full): `./online-scorer.html`
- 🎬📊 Split Screen (NEW): `./videostream-online-split.html`
- 🎥 Traditional VideoStream: `../videostreamscoringapp.html`
- 👤 Player Account: `./player-account.html`

## Support

For issues or feature requests:
1. Check console for error messages
2. Verify all files are deployed
3. Test authentication separately
4. Check Supabase connectivity
5. Review browser compatibility
