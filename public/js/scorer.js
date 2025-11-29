let ws;
let gameState = null;
let currentInput = '';

// Connect to WebSocket
function connectWebSocket() {
    // Connect to WebSocket server on port 3000
    const wsUrl = 'ws://localhost:3000';
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'state') {
            gameState = message.data;
            updateUI();
        }
    };
    
    ws.onclose = () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    if (connected) {
        indicator.classList.add('connected');
        text.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

function sendMessage(type, data = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
    }
}

function updateUI() {
    if (!gameState) return;
    
    console.log('Updating UI with state:', gameState);
    
    // Update player names
    document.getElementById('homeName').value = gameState.home.name;
    document.getElementById('awayName').value = gameState.away.name;
    
    // Update scores
    document.getElementById('homeScore').textContent = gameState.home.remaining;
    document.getElementById('awayScore').textContent = gameState.away.remaining;
    
    // Calculate and update averages
    const homeAvg = calculateAverage('home');
    const awayAvg = calculateAverage('away');
    document.getElementById('homeAvg').textContent = homeAvg.toFixed(2);
    document.getElementById('awayAvg').textContent = awayAvg.toFixed(2);
    
    // Update sets and legs
    document.getElementById('homeSets').textContent = `S:${gameState.home.sets}-${gameState.away.sets}`;
    document.getElementById('homeLegs').textContent = `L:${gameState.home.legs}-${gameState.away.legs}`;
    
    // Update turn number
    document.getElementById('turnNumber').textContent = gameState.turnNumber;
    
    // Update active player status
    const homeStatus = document.getElementById('homeStatus');
    const awayStatus = document.getElementById('awayStatus');
    const homeSection = document.querySelector('.player-section.home');
    const awaySection = document.querySelector('.player-section.away');
    
    if (gameState.currentTurn === 'home') {
        homeStatus.classList.add('active');
        awayStatus.classList.remove('active');
        homeSection.style.transform = 'scale(1.02)';
        awaySection.style.transform = 'scale(1)';
    } else {
        awayStatus.classList.add('active');
        homeStatus.classList.remove('active');
        awaySection.style.transform = 'scale(1.02)';
        homeSection.style.transform = 'scale(1)';
    }
    
    // Update throw displays
    document.getElementById('homeT1').textContent = gameState.throws.turn1 || 0;
    document.getElementById('homeT3').textContent = gameState.throws.turn3 || 0;
    document.getElementById('homeT5').textContent = gameState.throws.turn5 || 0;
}

function calculateAverage(player) {
    const playerData = gameState[player];
    const startingScore = parseInt(gameState.gameFormat);
    const scored = startingScore - playerData.remaining;
    
    // Calculate average per dart (total scored / number of darts thrown)
    const totalTurns = gameState.turnNumber;
    if (totalTurns > 0) {
        const dartsThrown = (totalTurns - 1) * 3 + (gameState.currentThrow - 1);
        return dartsThrown > 0 ? scored / dartsThrown : 0;
    }
    return 0;
}

// Number pad handlers
document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => {
        const num = btn.dataset.num;
        currentInput += num;
        document.getElementById('scoreInput').value = currentInput;
    });
});

// Quick score buttons
document.querySelectorAll('.quick-btn[data-score]').forEach(btn => {
    btn.addEventListener('click', () => {
        const score = parseInt(btn.dataset.score);
        submitScore(score);
    });
});

// Plus button (clear)
document.getElementById('plusBtn').addEventListener('click', () => {
    currentInput = '';
    document.getElementById('scoreInput').value = '';
});

// Submit button
document.getElementById('submitBtn').addEventListener('click', () => {
    if (currentInput) {
        const score = parseInt(currentInput);
        submitScore(score);
        currentInput = '';
        document.getElementById('scoreInput').value = '';
    }
});

// Enter key support
document.getElementById('scoreInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && currentInput) {
        const score = parseInt(currentInput);
        submitScore(score);
        currentInput = '';
        document.getElementById('scoreInput').value = '';
    }
});

// Bust button
document.getElementById('bustBtn').addEventListener('click', () => {
    sendMessage('bust');
    currentInput = '';
    document.getElementById('scoreInput').value = '';
});

// Plus button (clear/add)
document.getElementById('plusBtn').addEventListener('click', () => {
    currentInput = '';
    document.getElementById('scoreInput').value = '';
});

// Undo button
document.getElementById('undoBtn').addEventListener('click', () => {
    sendMessage('undo');
});

// Miss button
document.getElementById('missBtn').addEventListener('click', () => {
    sendMessage('miss');
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset the entire game?')) {
        sendMessage('reset');
    }
});

// Player name changes
document.getElementById('homeName').addEventListener('change', (e) => {
    sendMessage('updatePlayer', { player: 'home', name: e.target.value });
});

document.getElementById('awayName').addEventListener('change', (e) => {
    sendMessage('updatePlayer', { player: 'away', name: e.target.value });
});

// Game format change
document.getElementById('gameFormat').addEventListener('change', (e) => {
    if (confirm('Changing game format will reset the game. Continue?')) {
        sendMessage('changeFormat', { format: e.target.value });
    }
});

function submitScore(score) {
    console.log('Submitting score:', score);
    if (score >= 0 && score <= 180) {
        sendMessage('score', { value: score });
        console.log('Score sent to server');
    } else {
        alert('Invalid score. Must be between 0 and 180.');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Number keys
    if (e.key >= '0' && e.key <= '9') {
        currentInput += e.key;
        document.getElementById('scoreInput').value = currentInput;
    }
    
    // Backspace
    if (e.key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
        document.getElementById('scoreInput').value = currentInput;
    }
    
    // Escape to clear
    if (e.key === 'Escape') {
        currentInput = '';
        document.getElementById('scoreInput').value = '';
    }
});

// Initialize
connectWebSocket();
