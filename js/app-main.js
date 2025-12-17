// ===== MAIN APP ORCHESTRATOR =====
// Coordinates all modules: player library, game setup, and scoring app

import { PlayerLibraryModule } from './';
import { GameSetupModule } from './';
import { ScoringAppModule } from './';

// Wait for Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        console.log('Checking for PlayerDB...');
        if (window.PlayerDB) {
            console.log('PlayerDB found immediately!');
            resolve();
        } else {
            // Check every 100ms for Supabase to load, max 5 seconds
            let attempts = 0;
            const maxAttempts = 50;
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`Waiting for PlayerDB... attempt ${attempts}/${maxAttempts}`);
                if (window.PlayerDB) {
                    console.log('PlayerDB found!');
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout waiting for Supabase to load'));
                }
            }, 100);
        }
    });
}

// Main App Controller
window.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, waiting for Supabase...');
    
    // Wait for Supabase config to load
    try {
        await waitForSupabase();
        console.log('Supabase ready, initializing DartStream app...');
    } catch (error) {
        console.error('Failed to load Supabase:', error);
        alert('Failed to initialize database. Please refresh the page.');
        return;
    }
    
    // Step 1: Initialize player library
    console.log('Loading player library...');
    await PlayerLibraryModule.initialize();
    
    // Step 2: Initialize game setup module
    console.log('Initializing game setup...');
    GameSetupModule.initialize();
    
    // Step 3: Show initial screen
    showScreen('game-mode-screen');
    
    // Step 4: Attach start game handler
    const startGameBtn = document.getElementById('start-game-btn');
    console.log('Start game button found:', startGameBtn);
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            console.log('Start game button clicked!');
            const gameConfig = GameSetupModule.startGame();
            
            console.log('Game config returned:', gameConfig);
            
            if (gameConfig) {
                console.log('Starting game with config:', gameConfig);
                
                // Initialize scoring app with game configuration
                ScoringAppModule.initialize(gameConfig);
                
                // Show game screen
                showScreen('game-screen');
            } else {
                console.error('No game config returned - check player selection');
            }
        });
        console.log('Start game handler attached successfully');
    } else {
        console.error('Start game button not found!');
    }
    
    console.log('App initialized successfully!');
});

// Utility: Show screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId)?.classList.add('active');
}
