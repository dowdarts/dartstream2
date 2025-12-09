# DartStream Landing Page

This is a standalone version of the DartStream landing page that can be edited and deployed independently from the main application.

## Files Included

- **index.html** - Main landing page with all styles embedded
- **manifest.json** - PWA manifest for installable app experience
- **dartstream-logo.png** - Main DartStream logo
- **logos/** - Partner logos folder containing all company logos

## Features

- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ PWA-ready with manifest.json
- ✅ All styles embedded in HTML (no external CSS dependencies)
- ✅ Professional gradient design with DartStream branding
- ✅ Feature showcase section
- ✅ App cards linking to all DartStream applications
- ✅ Partner logos footer
- ✅ Optimized for all screen sizes

## Editing

All styling is contained within the `<style>` tag in index.html. You can edit:

- Colors and gradients
- Font sizes (using clamp() for responsive scaling)
- Layout and spacing
- Content and copy
- Logo sizes and positioning

## Deployment

This folder can be deployed to any static hosting service:

- **GitHub Pages** - Upload to a gh-pages branch
- **Netlify** - Drag and drop the folder
- **Vercel** - Connect to Git repository
- **Any web host** - Upload via FTP/SFTP

## App Links

The landing page links to these DartStream apps:
- Scoring App (`scoring-app.html`)
- Match Central (`match-central.html`)
- Scoreboard Display (`scoreboard.html`)
- Scoreboard Controller (`controller.html`)
- Player Account (`player-account.html`)

**Note:** Update these links if deploying the landing page separately from the main app.

## Customization

### Changing Colors
The main brand colors are:
- Gold/Yellow: `#facc15`
- Dark Blue: `#1a1a2e`
- Mid Blue: `#16213e`
- Gray Text: `#94a3b8`
- Border Gray: `#334155`

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

All font sizes and spacing use `clamp()` for automatic responsive scaling.

## License

© 2025 DartStream. Created by MDStudios for CGCDarts & Atlantic Amateur Darts Series.
