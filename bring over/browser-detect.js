// Browser detection script for auto-redirecting Silk browser to webapp version
(function() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isSilk = /\bSilk\b/i.test(userAgent);
    const isFireOS = /\bAFT[A-Z]/i.test(userAgent) || /\bKF[A-Z]/i.test(userAgent);
    
    // If Silk browser or Fire device detected, redirect to webapp version
    if (isSilk || isFireOS) {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop();
        
        // Only redirect if not already in webapp folder
        if (!currentPath.includes('/dartstream-webapp/')) {
            // Map current page to webapp equivalent
            const fileMap = {
                'index.html': 'dartstream-webapp/index.html',
                'videostreamscoringapp.html': 'dartstream-webapp/videostreamscoringapp.html',
                'match-central.html': 'dartstream-webapp/match-central.html',
                'scoreboard.html': 'dartstream-webapp/scoreboard.html',
                'controller.html': 'dartstream-webapp/controller.html',
                'player-account.html': 'dartstream-webapp/player-account.html',
                '': 'dartstream-webapp/index.html' // Root redirect
            };
            
            const targetFile = fileMap[currentFile] || fileMap[''];
            const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
            
            window.location.href = baseUrl + targetFile;
        }
    }
})();
