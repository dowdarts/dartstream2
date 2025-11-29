import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// CORS for Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static files (for production build)
app.use(express.static('dist'));
app.use(express.json());

// Game state
let gameState = {
  home: {
    name: 'Home',
    score: 501,
    remaining: 501,
    sets: 0,
    legs: 0
  },
  away: {
    name: 'Away',
    score: 501,
    remaining: 501,
    sets: 0,
    legs: 0
  },
  currentTurn: 'home',
  turnNumber: 1,
  currentThrow: 1,
  throws: {
    turn1: 0,
    turn3: 0,
    turn5: 0
  },
  satellite: 8068,
  gameFormat: '501' // Can be 301, 501, 701, etc.
};

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  // Send current game state to new client
  ws.send(JSON.stringify({
    type: 'state',
    data: gameState
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

function handleMessage(data) {
  console.log('Received message:', data);
  switch(data.type) {
    case 'score':
      updateScore(data.value);
      break;
    case 'undo':
      undoLastScore();
      break;
    case 'miss':
      recordMiss();
      break;
    case 'bust':
      recordBust();
      break;
    case 'reset':
      resetGame();
      break;
    case 'updatePlayer':
      updatePlayerName(data.player, data.name);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

function updateScore(points) {
  console.log(`Updating score: ${points} for ${gameState.currentTurn}`);
  const player = gameState.currentTurn === 'home' ? gameState.home : gameState.away;
  const newRemaining = player.remaining - points;
  
  console.log(`Current: ${player.remaining}, New: ${newRemaining}`);
  
  // Check for bust (below 0 or exactly 1)
  if (newRemaining < 0 || newRemaining === 1) {
    console.log('BUST!');
    recordBust();
    return;
  }
  
  // Check for valid checkout (must finish on double)
  if (newRemaining === 0) {
    console.log('Winner!');
    // Winner! (In full implementation, check for double out rule)
    player.remaining = 0;
    player.legs++;
    broadcast();
    setTimeout(() => {
      // Start new leg
      resetLeg();
    }, 2000);
    return;
  }
  
  player.remaining = newRemaining;
  
  // Update throw display
  if (gameState.currentThrow === 1) {
    gameState.throws.turn1 = points;
  } else if (gameState.currentThrow === 2) {
    gameState.throws.turn3 = points;
  } else if (gameState.currentThrow === 3) {
    gameState.throws.turn5 = points;
  }
  
  gameState.currentThrow++;
  
  // Switch turns after 3 throws
  if (gameState.currentThrow > 3) {
    switchTurn();
  }
  
  console.log('Broadcasting updated state');
  broadcast();
}

function recordMiss() {
  gameState.currentThrow++;
  
  if (gameState.currentThrow > 3) {
    switchTurn();
  }
  
  broadcast();
}

function recordBust() {
  // Reset throw values
  gameState.throws.turn1 = 0;
  gameState.throws.turn3 = 0;
  gameState.throws.turn5 = 0;
  
  switchTurn();
  broadcast();
}

function switchTurn() {
  gameState.currentTurn = gameState.currentTurn === 'home' ? 'away' : 'home';
  gameState.currentThrow = 1;
  gameState.throws.turn1 = 0;
  gameState.throws.turn3 = 0;
  gameState.throws.turn5 = 0;
  
  if (gameState.currentTurn === 'home') {
    gameState.turnNumber++;
  }
}

function undoLastScore() {
  // Simple undo - just restore previous state
  // In full implementation, maintain history stack
  broadcast();
}

function resetLeg() {
  const startingScore = parseInt(gameState.gameFormat);
  gameState.home.remaining = startingScore;
  gameState.away.remaining = startingScore;
  gameState.currentThrow = 1;
  gameState.throws = { turn1: 0, turn3: 0, turn5: 0 };
  gameState.turnNumber = 1;
  broadcast();
}

function resetGame() {
  const startingScore = parseInt(gameState.gameFormat);
  gameState = {
    home: {
      name: 'Home',
      score: startingScore,
      remaining: startingScore,
      sets: 0,
      legs: 0
    },
    away: {
      name: 'Away',
      score: startingScore,
      remaining: startingScore,
      sets: 0,
      legs: 0
    },
    currentTurn: 'home',
    turnNumber: 1,
    currentThrow: 1,
    throws: {
      turn1: 0,
      turn3: 0,
      turn5: 0
    },
    satellite: 8068,
    gameFormat: '501'
  };
  broadcast();
}

function updatePlayerName(player, name) {
  if (player === 'home') {
    gameState.home.name = name;
  } else {
    gameState.away.name = name;
  }
  broadcast();
}

function broadcast() {
  const message = JSON.stringify({
    type: 'state',
    data: gameState
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on http://localhost:${PORT}`);
  console.log(`Vite dev server: http://localhost:5173`);
  console.log(`TV Viewer: http://localhost:5173/viewer.html`);
});
