# DartStream Play Online - Visual Design Guide

## Color Scheme
```
Primary:     #FF6B35 (Orange - Action buttons, accents)
Secondary:   #004E89 (Dark Blue - Headers, text)
Success:     #2ECC71 (Green - Positive actions)
Error:       #E74C3C (Red - Errors)
Warning:     #F39C12 (Orange - Warnings)
Light BG:    #f5f5f5 (Light Gray - Cards)
Dark BG:     #1a1a1a (Very Dark - Body background)
```

## Typography
- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Headings**: Bold, large size (2.5-3rem)
- **Body Text**: Regular weight, readable size (1rem)
- **Monospace**: 'Monaco', 'Courier New' (for room codes)

## Component Styling

### Start Screen Header
```
┌─────────────────────────────┐
│     [DartStream Logo]       │  ← Centered, 150x150px
│        DartStream           │  ← Gradient text (Blue to Orange)
│ Live Video Calling for      │  ← Subtitle text
│ Darts Matches              │
└─────────────────────────────┘
   (bottom border: 3px orange)
```

### Room Option Cards
```
╔═════════════════════════════╗
║ 🆕 CREATE ROOM             ║  ← Green top border (4px)
║                            ║
║ Generate a unique 4-digit  ║
║ code to share with your    ║
║ opponent...                ║
║                            ║
║ ┌──────────────────────┐   ║
║ │ CREATE ROOM #        │   ║  ← Button with orange gradient
║ └──────────────────────┘   ║
║                            ║
║ ✓ Get unique code          ║
║ ✓ Share with opponent      ║
║ ✓ 60 second expiry         ║
╚═════════════════════════════╝

    ┌────────┐
    │   OR   │  ← Divider
    └────────┘

╔═════════════════════════════╗
║ 🔗 JOIN ROOM               ║  ← Blue top border (4px)
║                            ║
║ Have a 4-digit code from   ║
║ your opponent? Click below ║
║ to join their room.        ║
║                            ║
║ ┌──────────────────────┐   ║
║ │ JOIN ROOM            │   ║  ← Button with dark blue gradient
║ └──────────────────────┘   ║
║                            ║
║ ✓ Enter code               ║
║ ✓ Join room                ║
║ ✓ Configure settings       ║
╚═════════════════════════════╝
```

### Device Selection Dropdowns
```
Before:
┌─────────────────────────────┐
│ Camera                      │ ← White dropdown, hard to see
└─────────────────────────────┘

After:
┌─────────────────────────────┐
│ 📹 Camera                   │
├─────────────────────────────┤
│ Select camera...          ▼ │ ← 2px border, clear arrow icon
└─────────────────────────────┘

Focus State:
┌─────────────────────────────┐
│ Camera device name        ▼ │ ← Orange border, shadow glow
└─────────────────────────────┘
```

## Animation Timings
- **Fade In**: 0.3s ease-in
- **Slide Down (Logo)**: 0.6s ease-out
- **Button Hover**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- **Dropdown Focus**: 0.2s smooth
- **Card Elevation**: translateY(-5px) on hover

## Responsive Design
- **Desktop**: Full layout, wide card layout
- **Tablet**: Adjusted spacing, readable fonts
- **Mobile**: Single column, touch-friendly buttons (min 48px height)

## Accessibility Features
- Sufficient color contrast (WCAG AA standard)
- Focus states clearly visible
- Semantic HTML structure
- Alt text for images
- Clear button labels

## Interactive States

### Buttons
```
Default: Orange gradient background
Hover:   Darker orange, lifted (transform: translateY(-3px))
Active:  Slightly pressed (transform: translateY(-1px))
Disabled: Opacity 0.5, cursor: not-allowed
```

### Dropdowns
```
Default:   2px #ddd border
Hover:     2px #999 border, arrow turns orange
Focus:     2px #FF6B35 border, blue shadow
Option:    White background, dark text
```

### Cards
```
Default:   Light gradient background, subtle shadow
Hover:     Brighter gradient, elevated (transform: translateY(-5px))
           Enhanced shadow, border color changes
Border:    Create = Green (#4caf50)
           Join = Blue (#2196f3)
```

## Visual Hierarchy
1. **Logo** - Eyes drawn here first
2. **Title** - Main heading with gradient
3. **Card Headers** - Subheadings
4. **Descriptive Text** - Supporting content
5. **Buttons** - Call to action (prominent in orange)
6. **Feature List** - Additional information

## Spacing Guidelines
- **Section Padding**: 3rem
- **Card Padding**: 3rem 2rem
- **Form Group Margin**: 1.5rem
- **Button Gap**: 1rem
- **Card Grid Gap**: 2.5rem

## Shadow Hierarchy
```
Subtle:   0 2px 8px rgba(0,0,0,0.1)
Default:  0 4px 15px rgba(255, 107, 53, 0.3)
Elevated: 0 8px 25px rgba(255, 107, 53, 0.4)
Large:    0 4px 20px rgba(0,0,0,0.15)
Focus:    0 0 0 3px rgba(255, 107, 53, 0.1)
```

## Brand Identity
- **Primary Color**: Orange (#FF6B35) - Dynamic, energetic
- **Secondary Color**: Dark Blue (#004E89) - Professional, trustworthy
- **Logo Position**: Always centered, above title
- **Typography**: Modern, sans-serif
- **Overall Tone**: Professional, user-friendly, modern

---

This design system ensures a consistent, professional appearance throughout the Play Online application while maintaining excellent usability and accessibility.
