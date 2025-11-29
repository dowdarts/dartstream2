let ws;
let gameState = null;

// Connect to WebSocket
function connectWebSocket() {
    // Connect to WebSocket server on port 3000
    const wsUrl = 'ws://localhost:3000';
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Viewer connected to server');
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'state') {
            const previousState = gameState;
            gameState = message.data;
            updateDisplay(previousState);
        }
    };
    
    ws.onclose = () => {
        console.log('Viewer disconnected from server');
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function updateDisplay(previousState) {
    if (!gameState) return;
    
    // Update player names
    document.getElementById('homeName').textContent = gameState.home.name;
    document.getElementById('awayName').textContent = gameState.away.name;
    
    // Update scores with animation
    updateScore('home', gameState.home.remaining, previousState?.home.remaining);
    updateScore('away', gameState.away.remaining, previousState?.away.remaining);
    
    // Update averages (placeholder - would calculate from actual game data)
    const homeAvg = calculateAverage(gameState.home);
    const awayAvg = calculateAverage(gameState.away);
    document.getElementById('homeAvg').textContent = homeAvg.toFixed(2);
    document.getElementById('awayAvg').textContent = awayAvg.toFixed(2);
    
    // Update sets and legs
    document.getElementById('homeSets').textContent = gameState.home.sets;
    document.getElementById('awaySets').textContent = gameState.away.sets;
    document.getElementById('homeLegs').textContent = gameState.home.legs;
    document.getElementById('awayLegs').textContent = gameState.away.legs;
    
    // Update turn number
    document.getElementById('turnNumber').textContent = gameState.turnNumber;
    
    // Update active player indicator
    const homeStatus = document.getElementById('homeStatus');
    if (gameState.currentTurn === 'home') {
        homeStatus.classList.add('active');
    } else {
        homeStatus.classList.remove('active');
    }
    
    // Update throw displays
    updateThrows();
    
    // Highlight away player box when it's their turn
    const awayBox = document.querySelector('.away-player');
    const homeBox = document.querySelector('.home-player');
    
    if (gameState.currentTurn === 'away') {
        awayBox.style.transform = 'scale(1.02)';
        homeBox.style.transform = 'scale(1)';
    } else {
        homeBox.style.transform = 'scale(1.02)';
        awayBox.style.transform = 'scale(1)';
    }
}

function updateScore(player, newScore, oldScore) {
    const element = document.getElementById(`${player}Score`);
    element.textContent = newScore;
    
    // Add animation if score changed
    if (oldScore !== undefined && newScore !== oldScore) {
        element.classList.remove('score-animation');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('score-animation');
        
        setTimeout(() => {
            element.classList.remove('score-animation');
        }, 500);
    }
}

function updateThrows() {
    // Update home throws
    document.getElementById('homeThrow1').textContent = 
        gameState.currentTurn === 'home' ? (gameState.throws.turn1 || '-') : '-';
    document.getElementById('homeThrow3').textContent = 
        gameState.currentTurn === 'home' ? (gameState.throws.turn3 || '-') : '-';
    document.getElementById('homeThrow5').textContent = 
        gameState.currentTurn === 'home' ? (gameState.throws.turn5 || '-') : '-';
    
    // Update away throws
    document.getElementById('awayThrow1').textContent = 
        gameState.currentTurn === 'away' ? (gameState.throws.turn1 || '-') : '-';
    document.getElementById('awayThrow3').textContent = 
        gameState.currentTurn === 'away' ? (gameState.throws.turn3 || '-') : '-';
    document.getElementById('awayThrow5').textContent = 
        gameState.currentTurn === 'away' ? (gameState.throws.turn5 || '-') : '-';
}

function calculateAverage(player) {
    // Placeholder calculation - in real app would track all throws
    const startingScore = parseInt(gameState.gameFormat);
    const remaining = player.remaining;
    const scored = startingScore - remaining;
    
    // Estimate based on turns (rough calculation)
    if (gameState.turnNumber > 1) {
        return scored / (gameState.turnNumber * 3);
    }
    
    return 0;
}

// Initialize
connectWebSocket();

// Prevent context menu and text selection for cleaner OBS capture
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.body.style.userSelect = 'none';
