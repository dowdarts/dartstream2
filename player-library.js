// ===== PLAYER LIBRARY MODULE =====
// Handles all player database interactions and library management

export const PlayerLibraryModule = {
    playerLibrary: [],
    
    // Get PlayerDB from global scope (loaded by supabase-config.js)
    getPlayerDB() {
        return window.PlayerDB;
    },
    
    // Initialize player library from Supabase
    async initialize() {
        console.log('Starting player library initialization...');
        
        // First, try to load from localStorage for instant display
        const cachedPlayers = localStorage.getItem('playerLibrary');
        if (cachedPlayers) {
            try {
                this.playerLibrary = JSON.parse(cachedPlayers);
                console.log('Loaded players from localStorage:', this.playerLibrary.length);
            } catch (error) {
                console.error('Error parsing cached players:', error);
                this.playerLibrary = [];
            }
        }
        
        // Then sync with Supabase in the background
        try {
            console.log('Fetching players from Supabase...');
            const PlayerDB = this.getPlayerDB();
            const players = await PlayerDB.getAllPlayers();
            console.log('Players fetched from Supabase:', players);
            
            if (players.length > 0) {
                this.playerLibrary = players;
                // Save to localStorage
                localStorage.setItem('playerLibrary', JSON.stringify(players));
                console.log('Synced players with Supabase:', players.length);
            } else {
                console.log('No players in database, adding defaults...');
                // If no players in database, add default players
                const defaultPlayers = [
                    { firstName: 'Kayla', lastName: 'Melanson' },
                    { firstName: 'mark', lastName: 'roberts' },
                    { firstName: 'Matthew', lastName: 'Dow' }
                ];
                
                const PlayerDB = this.getPlayerDB();
                for (const player of defaultPlayers) {
                    await PlayerDB.addPlayer(player.firstName, player.lastName);
                }
                
                // Fetch again after adding defaults
                const refreshedPlayers = await PlayerDB.getAllPlayers();
                this.playerLibrary = refreshedPlayers;
                localStorage.setItem('playerLibrary', JSON.stringify(refreshedPlayers));
                console.log('Added and loaded default players:', refreshedPlayers.length);
            }
        } catch (error) {
            console.error('Error initializing player library from Supabase:', error);
            if (this.playerLibrary.length === 0) {
                console.warn('Using empty library due to Supabase error');
            } else {
                console.log('Using cached players due to Supabase error');
            }
        }
        
        return this.playerLibrary;
    },
    
    // Add a new player
    async addPlayer(firstName, lastName, nationality = null) {
        try {
            const PlayerDB = this.getPlayerDB();
            await PlayerDB.addPlayer(firstName, lastName, nationality);
            await this.refreshFromDatabase();
            return { success: true };
        } catch (error) {
            console.error('Error adding player:', error);
            return { success: false, error };
        }
    },
    
    // Update an existing player
    async updatePlayer(playerId, firstName, lastName, nationality = null) {
        try {
            const PlayerDB = this.getPlayerDB();
            await PlayerDB.updatePlayer(playerId, firstName, lastName, nationality);
            await this.refreshFromDatabase();
            return { success: true };
        } catch (error) {
            console.error('Error updating player:', error);
            return { success: false, error };
        }
    },
    
    // Delete players by IDs
    async deletePlayers(playerIds) {
        try {
            const PlayerDB = this.getPlayerDB();
            await PlayerDB.deletePlayers(playerIds);
            await this.refreshFromDatabase();
            return { success: true };
        } catch (error) {
            console.error('Error deleting players:', error);
            return { success: false, error };
        }
    },
    
    // Refresh library from database
    async refreshFromDatabase() {
        try {
            const PlayerDB = this.getPlayerDB();
            const players = await PlayerDB.getAllPlayers();
            this.playerLibrary = players;
            localStorage.setItem('playerLibrary', JSON.stringify(players));
            return players;
        } catch (error) {
            console.error('Error refreshing player library:', error);
            throw error;
        }
    },
    
    // Get all players
    getAllPlayers() {
        return this.playerLibrary;
    },
    
    // Find player by name
    findPlayerByName(firstName, lastName) {
        return this.playerLibrary.find(p => 
            p.firstName === firstName && p.lastName === lastName
        );
    }
};
