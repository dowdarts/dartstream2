# 🚀 DartStream2 Deployment Checklist

Complete this checklist before deploying your app.

---

## Pre-Deployment (Local Testing)

### Basic Setup
- [ ] All app folders exist in `c:\Users\cgcda\Dartstream2\app-folders\`
- [ ] Each folder contains its main HTML file
- [ ] All required files are present (see app-specific checklist below)
- [ ] `/flags` and `/logos` folders exist in each app

### Local Testing
- [ ] Open app HTML in browser (e.g., `scoring-app/scoring-app.html`)
- [ ] Page loads without errors
- [ ] Logo/images display correctly
- [ ] Flags display in player selection (if applicable)
- [ ] Check browser console for JavaScript errors
- [ ] Test all main features work
- [ ] Mobile/tablet view tested
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

### Database Connection (if using Supabase)
- [ ] Supabase project is accessible
- [ ] `supabase-config.js` contains correct URL and key
- [ ] Can fetch player data (if applicable)
- [ ] Can save match stats (if applicable)
- [ ] RLS policies are correctly configured

---

## App-Specific Checklist

### ✅ Scoring App
**Required Files:**
- [ ] `scoring-app.html`
- [ ] `scoring-app.js`, `app.js`, `app-main.js`
- [ ] `game-setup.js`, `player-library.js`
- [ ] `browser-detect.js`, `supabase-config.js`
- [ ] `styles.css`
- [ ] `manifest-scoring.json`
- [ ] `dartstream-logo.png`
- [ ] `/flags` directory with 40+ country flags
- [ ] `/logos` directory with organization logos

**Testing:**
- [ ] Game mode selection works
- [ ] Player selection/creation works
- [ ] Scoring entry works (3 darts)
- [ ] Auto-submit after 3 darts works
- [ ] Bust detection works
- [ ] Scores calculate correctly
- [ ] Match completion saves to database

---

### ✅ Controller
**Required Files:**
- [ ] `controller.html`
- [ ] `browser-detect.js`
- [ ] `supabase-config.js`
- [ ] `manifest.json`
- [ ] `/flags` directory
- [ ] `/logos` directory

**Testing:**
- [ ] Page loads without errors
- [ ] Can enter connection code
- [ ] Connection status updates
- [ ] UI is responsive

---

### ✅ Scoreboard
**Required Files:**
- [ ] `scoreboard.html`
- [ ] `browser-detect.js`
- [ ] `/flags` directory
- [ ] `/logos` directory

**Testing:**
- [ ] Page loads full screen
- [ ] Green screen background visible (#00ff00)
- [ ] Score display renders
- [ ] OBS can capture as browser source
- [ ] Text is readable in streaming quality
- [ ] Updates in real-time from controller

---

### ✅ Match Central
**Required Files:**
- [ ] `match-central.html`
- [ ] `browser-detect.js`
- [ ] `/flags` directory
- [ ] `/logos` directory

**Testing:**
- [ ] Page loads without errors
- [ ] Match list displays
- [ ] Can search/filter matches
- [ ] Connection codes visible
- [ ] Responsive on mobile

---

### ✅ Player Account
**Required Files:**
- [ ] `player-account.html`
- [ ] `player-account.js`
- [ ] `browser-detect.js`
- [ ] `styles.css`
- [ ] `dartstream-logo.png`
- [ ] `/flags` directory
- [ ] `/logos` directory

**Testing:**
- [ ] Page loads without errors
- [ ] Player stats display
- [ ] Can login/authenticate
- [ ] Account linking works
- [ ] Lifetime stats show correctly
- [ ] Mobile/tablet responsive

---

### ✅ Index/Landing
**Required Files:**
- [ ] `index.html`
- [ ] `browser-detect.js`
- [ ] `supabase-config.js`
- [ ] `manifest.json`
- [ ] `dartstream-logo.png`
- [ ] `/flags` directory
- [ ] `/logos` directory

**Testing:**
- [ ] Page loads without errors
- [ ] Links to other apps work
- [ ] Logo displays
- [ ] Navigation clear and intuitive
- [ ] Mobile responsive
- [ ] Auth status shows correctly

---

## Deployment Steps

### Choose Hosting Platform
- [ ] Platform selected (Netlify, Vercel, GitHub Pages, etc.)
- [ ] Account created and logged in
- [ ] Hosting plan reviewed (free tier sufficient for testing)

### Prepare Files
- [ ] Choose which app(s) to deploy
- [ ] Review file paths are correct
- [ ] Optional: Rename HTML files to `index.html` for cleaner URLs
- [ ] Optional: Customize logos and images
- [ ] Optional: Update colors in CSS

### Deploy to Hosting

#### Option A: Direct Upload
- [ ] Zip app folder(s)
- [ ] Upload via hosting platform UI
- [ ] Extract/deploy files
- [ ] Get public URL
- [ ] Test in browser

#### Option B: Git Integration
- [ ] Commit app-folders to Git
- [ ] Push to GitHub/GitLab
- [ ] Connect repository to hosting platform
- [ ] Auto-deploy configured
- [ ] Get public URL
- [ ] Test in browser

#### Option C: FTP/SFTP
- [ ] FTP credentials obtained
- [ ] Connect to server via FTP client
- [ ] Upload app folder(s)
- [ ] Set correct permissions
- [ ] Get public URL
- [ ] Test in browser

---

## Post-Deployment Verification

### Access & Loading
- [ ] App loads at deployed URL
- [ ] No 404 errors
- [ ] Page loads completely
- [ ] All assets load (check browser Network tab)

### Functionality
- [ ] All features work as in local testing
- [ ] Database connections work (if applicable)
- [ ] Supabase calls succeed (check console)
- [ ] No JavaScript errors in console
- [ ] No CSS layout issues

### Performance
- [ ] Page loads reasonably fast (< 3 seconds)
- [ ] No 404 errors for any assets
- [ ] Images optimized and display correctly
- [ ] Responsive on mobile devices

### Cross-Browser Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested on mobile (iOS/Android)
- [ ] Tested on tablet

### Security
- [ ] No secrets in code (API keys, passwords)
- [ ] HTTPS enabled on hosting
- [ ] Supabase key is anonymous key only
- [ ] No console warnings/errors
- [ ] Database RLS policies enforced

---

## Ongoing Maintenance

### Regular Tasks
- [ ] Monitor user feedback
- [ ] Check error logs weekly
- [ ] Update content as needed
- [ ] Backup database regularly
- [ ] Monitor uptime

### Updates
- [ ] Test updates locally before deploying
- [ ] Keep dependencies updated (Supabase JS, etc.)
- [ ] Security patches applied promptly
- [ ] Performance optimizations reviewed

### Scaling
- [ ] Monitor database query performance
- [ ] Add caching if needed
- [ ] Consider CDN for assets
- [ ] Load test before high-traffic events

---

## Rollback Procedure

If issues occur after deployment:

1. [ ] Identify the problem
2. [ ] Check server logs
3. [ ] Review recent changes
4. [ ] Have previous version ready
5. [ ] Re-deploy previous working version
6. [ ] Notify users of issue
7. [ ] Fix problem locally
8. [ ] Re-deploy corrected version

---

## Documentation for Users

Before sharing with users, provide:

- [ ] Link to app
- [ ] Instructions on how to use
- [ ] Supported browsers
- [ ] Expected behavior
- [ ] Support contact information
- [ ] FAQ (if applicable)

---

## First-Time User Testing

### Invite Beta Testers
- [ ] 2-3 trusted users
- [ ] Different devices (desktop, mobile, tablet)
- [ ] Different browsers
- [ ] Different network conditions

### Gather Feedback
- [ ] Does app work as expected?
- [ ] Any confusing parts?
- [ ] Any missing features?
- [ ] Performance acceptable?
- [ ] Mobile experience good?
- [ ] Any bugs encountered?

### Address Issues
- [ ] Document reported issues
- [ ] Prioritize by severity
- [ ] Fix critical bugs
- [ ] Deploy updated version
- [ ] Notify testers

---

## Final Sign-Off

### Ready to Launch
- [ ] All checklists completed
- [ ] Testing passed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Support plan ready

### Go Live
- [ ] Deploy to production
- [ ] Final verification
- [ ] Monitor first 24 hours
- [ ] Celebrate! 🎉

---

## Quick Reference

### File Locations
```
Deployed App Location: /app-folders/[app-name]/
Main Entry Point: /app-folders/[app-name]/[app-name].html
Assets: /app-folders/[app-name]/flags/, /logos/
Database Config: /app-folders/[app-name]/supabase-config.js
```

### Common Issues & Fixes
```
404 Errors        → Check file paths, verify all files uploaded
Images Missing    → Verify /flags and /logos folders copied
DB Not Connecting → Check supabase-config.js, RLS policies
CSS Broken        → Check styles.css uploaded, paths correct
JS Errors         → Check all .js files uploaded, script tags
Mobile Issues     → Test viewport settings, responsive design
```

### Support Resources
- Local: Check `/app-folders/README.md`
- Local: Check `/app-folders/QUICK-REFERENCE.md`
- Code: Check browser console (F12)
- Database: Check Supabase dashboard

---

## Deployment Confirmation

**Date Deployed:** _______________  
**App(s) Deployed:** _______________  
**URL:** _______________  
**Tested By:** _______________  
**Status:** ⬜ Ready | ⬜ Testing | ⬜ Live

---

**Need Help?** See QUICK-REFERENCE.md or README.md for detailed guides.
