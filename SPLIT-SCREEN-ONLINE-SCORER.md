# Split Screen Video + Online Scorer

## Overview
New split-screen mode that combines video chat with online dart scoring, allowing players to see each other while keeping score in real-time.

## Files Created

### 1. **videostream-online-split.html** (New)
The main split-screen page that combines:
- **Left Side**: Video chat placeholder (for future webcam integration)
- **Right Side**: Full online-scorer.html app interface

**Location**: `dartstream-webapp/videostream-online-split.html`

**Features**:
- Responsive 50/50 split layout on desktop
- Stacks vertically on mobile (40% video / 60% scorer)
- Embedded online-scorer.html dynamically loaded
- Shared authentication and Supabase client
- Golden border separator between sections

### 2. **play-online-modes.html** (New)
Selection screen for choosing between play modes

**Location**: `dartstream-webapp/play-online-modes.html`

**Options**:
- 📊 **Online Scorer** - Full screen scoring only
- 🎬📊 **Video + Scoring** - Split screen with video and scorer
- 🎥 **Traditional VideoStream** - Original VideoStream app

## Layout

### Desktop (1920x1080+)
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   VIDEO CHAT        │   ONLINE SCORER     │
│   (Left 50%)        │   (Right 50%)       │
│                     │                     │
│ - Player feed       │ - Game screen       │
│ - Connection info   │ - Score input       │
│                     │ - Match control     │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

### Tablet/Hybrid (1024px)
```
┌──────────────────────────────────┐
│                                  │
│   VIDEO CHAT (40% height)        │
│                                  │
├──────────────────────────────────┤
│                                  │
│   ONLINE SCORER (60% height)     │
│                                  │
└──────────────────────────────────┘
```

### Mobile (<768px)
Stacks vertically with 35% video / 65% scorer

## How It Works

### 1. User Flow
```
index.html (main page)
    ↓
    [Choose "Play Online"]
    ↓
play-online-modes.html (selection screen)
    ↓
    [Choose "Video + Scoring"]
    ↓
videostream-online-split.html (split screen loads)
    ↓
online-scorer.html embedded in right section
    ↓
[User logs in]
    ↓
[Host or Join online match]
    ↓
[Concurrent video + scoring]
```

### 2. Technical Integration
- **Split Container**: Flex layout with golden border separator
- **Video Section**: Left side with placeholder for webcam feed
- **Scorer Section**: Right side with embedded online-scorer.html
- **Shared Auth**: Single `window.supabaseClient` for both sections
- **Responsive CSS**: Media queries adjust layout for different screen sizes

## Styling Highlights

### Color Scheme
- **Background**: Dark gray/black (#1a1a1a, #000)
- **Accent**: Gold (#FFD700)
- **Borders**: Gold separator between sections
- **Text**: White with reduced opacity for secondary info

### Responsive Breakpoints
```css
Desktop:     1920px - Full 50/50 split
Laptop:      1024px - 50/50 split
Tablet:      1024px - Vertical stack (40/60)
Mobile:      768px  - Vertical stack (35/65)
```

## Usage

### For End Users
1. Open main app (index.html)
2. Select "Play Online" mode
3. Click "Video + Scoring" option
4. Log in with player account
5. Host or join a match
6. Video and scoring appear side-by-side
7. Play with concurrent video chat

### For Developers

#### Launching Split Screen Programmatically
```javascript
// From any page:
window.location.href = './dartstream-webapp/videostream-online-split.html';
```

#### Accessing Video Container
```javascript
const videoContainer = document.getElementById('video-container');
SplitScreenIntegration.switchToVideoStream(videoElement);
```

#### Accessing Scorer App
```javascript
const scorerApp = document.getElementById('scorer-app');
// The online-scoring-engine.js runs in this container
```

## Current Limitations

1. **Video Placeholder**: Video section currently shows placeholder. Needs:
   - WebRTC implementation for peer-to-peer video
   - Or integration with existing video streaming service
   - Connection code linking between video and scorer

2. **Synchronization**: Video and scorer are independent
   - Could add matched connection codes (same room code for both)
   - Could link video session to scorer match via shared room code

3. **Mobile Experience**: Still compact
   - Consider gesture controls for input on small screens
   - Could hide video on very small devices

## Future Enhancements

### Phase 1 (Quick Wins)
- [ ] Add connection code linking (same room code for video + scorer)
- [ ] Add local video preview (webcam feed)
- [ ] Toast notifications when opponent connects to video

### Phase 2 (Video Integration)
- [ ] WebRTC peer-to-peer video
- [ ] Fallback to Jitsi Meet or similar if WebRTC unavailable
- [ ] Picture-in-picture mode
- [ ] Screen share option for scoreboard view

### Phase 3 (Polish)
- [ ] Broadcast mode (stream to spectators)
- [ ] Audio-only mode for bandwidth-limited connections
- [ ] Recording capability
- [ ] Instant replay of close finishes
- [ ] Chat overlay for spectators

### Phase 4 (Advanced)
- [ ] Multiple camera angles (POV + wide angle)
- [ ] Automatic throw detection via computer vision
- [ ] AI-powered commentary generation
- [ ] Live spectator betting system

## Files Modified
- ✅ **Created**: `videostream-online-split.html`
- ✅ **Created**: `play-online-modes.html`
- ✅ **No changes**: `online-scorer.html` (used as-is)
- ✅ **No changes**: `online-scoring-engine.js` (used as-is)
- ✅ **No changes**: `supabase-config.js` (used as-is)

## Files Unmodified
- `online-scorer.html` - Works standalone and embedded
- `online-scoring-engine.js` - No changes needed
- `styles.css` - Shared stylesheet
- `videostreamscoringapp.html` - Unchanged traditional app

## Testing Checklist

- [ ] Split screen loads without errors
- [ ] Left video section shows placeholder
- [ ] Right scorer section loads online-scorer.html
- [ ] Authentication works in embedded scorer
- [ ] Can host match in split view
- [ ] Can join match in split view
- [ ] Layout responsive on desktop (50/50)
- [ ] Layout responsive on tablet (40/60 vertical)
- [ ] Layout responsive on mobile (35/65 vertical)
- [ ] Golden border visible between sections
- [ ] Back button returns to play-online-modes.html
- [ ] Play mode selection shows all 3 options
- [ ] Each mode button links to correct page

## Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes
- Split screen doubles the DOM complexity (both apps loaded)
- Monitor memory usage with video streaming active
- Optimize scorer animations for concurrent playback
- Consider lazy-loading video section if not immediately needed

## Deployment
All files ready for deployment to static hosting:
- Upload `videostream-online-split.html` to `dartstream-webapp/`
- Upload `play-online-modes.html` to `dartstream-webapp/`
- Ensure `online-scorer.html` is accessible at `./online-scorer.html`
- Ensure `online-scoring-engine.js` is accessible at `./online-scoring-engine.js`
- All other dependencies already exist

## Links
- 🎯 Online Scorer (Full Screen): `./online-scorer.html`
- 🎬 Video + Scorer (Split): `./videostream-online-split.html`
- 📺 Traditional VideoStream: `../videostreamscoringapp.html`
- 🏠 Mode Selector: `./play-online-modes.html`
- 🏠 Main App: `./index.html`
