# DartStream Professional Application v2.6.0

## Folder Structure

```
main-app-dartstream2/
├── index.html                 # Main landing page
├── pages/                     # All application pages
│   ├── scoring-app.html      # Local scoring application
│   ├── webapp-online-scorer.html  # Online multiplayer scorer
│   ├── controller.html       # Remote control interface
│   ├── scoreboard.html       # Display scoreboard
│   ├── match-central.html    # Match management
│   ├── player-account.html   # Player account management
│   ├── play-online.html      # Video calling
│   └── ...                   # Other pages
├── js/                        # JavaScript modules
│   ├── supabase-config.js    # Database configuration
│   ├── app-main.js           # Main app orchestrator
│   ├── game-setup.js         # Game configuration
│   ├── scoring-app.js        # Scoring engine
│   ├── player-library.js     # Player management
│   ├── online-scoring-engine.js  # Online scoring logic
│   ├── room-manager.js       # Room management
│   ├── video-room.js         # Video calling logic
│   └── ...                   # Other modules
├── css/
│   └── styles.css            # Main stylesheet
└── assets/
    ├── images/               # Button images and logos
    │   ├── button 1.png
    │   ├── button 2.png
    │   ├── button 3.png
    │   ├── dartstream-logo.png
    │   └── Video Stream Logo.png
    ├── flags/                # Country flags for players
    └── logos/                # Additional logos

```

## Quick Start

1. Open `index.html` in a modern web browser
2. Choose your desired feature:
   - **Scoring App**: Local X01 scoring with statistics
   - **Online Scorer**: Multiplayer online matches
   - **Video Call**: Video communication with remote players
   - **Controller**: Remote control for scoreboard
   - **Match Central**: Manage multiple matches

## Features

- **X01 Scoring**: 301/501 SIDO/DIDO with full statistics
- **Online Multiplayer**: Real-time synchronized scoring
- **Video Calling**: WebRTC-based video communication
- **Player Management**: Database of players with accounts
- **Statistics Tracking**: Averages, checkouts, achievements
- **Remote Control**: Control scoreboard from another device
- **Match Management**: Track multiple ongoing matches

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Supabase backend and online features)
- Camera/microphone (optional, for video calling)

## Technology Stack

- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Video**: WebRTC
- **Architecture**: Modular ES6 imports/exports

## Version History

- **v2.6.0** - Current version
  - Online scorer with averages
  - Direct video call access
  - Player selection improvements
  - Enhanced UI/UX

- **v2.5.0** - Take Control feature
- **v2.2.1** - Online scoring foundation
- **v2.1.1** - Base application

## Support

For issues or questions, visit the GitHub repository.
