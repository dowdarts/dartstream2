// guest-auth.js - Optional Authentication System
// Allows apps to work without login, with stats reserved for authenticated users

const GuestAuth = {
    supabaseClient: null,
    currentUser: null,
    isGuestMode: false,
    guestId: null,
    
    /**
     * Initialize authentication system
     * Auto-detects if user is logged in or uses guest mode
     */
    async initialize(supabaseClient) {
        console.log('🔐 GuestAuth initializing...');
        
        this.supabaseClient = supabaseClient;
        
        // Check if user has an active session
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Error checking session:', error);
                this.enterGuestMode();
                return false;
            }
            
            if (session && session.user) {
                // User is logged in
                this.currentUser = session.user;
                this.isGuestMode = false;
                console.log('✅ User authenticated:', session.user.email);
                return true;
            } else {
                // No session - use guest mode
                this.enterGuestMode();
                return false;
            }
        } catch (error) {
            console.error('❌ Error initializing auth:', error);
            this.enterGuestMode();
            return false;
        }
    },
    
    /**
     * Enter guest mode (no authentication)
     */
    enterGuestMode() {
        console.log('👤 Entering guest mode...');
        this.isGuestMode = true;
        this.guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('✅ Guest mode enabled:', this.guestId);
    },
    
    /**
     * Get current user ID (guest or authenticated)
     */
    getUserId() {
        if (this.currentUser) {
            return this.currentUser.id;
        }
        return this.guestId;
    },
    
    /**
     * Get current user email or null
     */
    getUserEmail() {
        if (this.currentUser) {
            return this.currentUser.email;
        }
        return null;
    },
    
    /**
     * Check if user is authenticated (not guest)
     */
    isAuthenticated() {
        return this.currentUser !== null && !this.isGuestMode;
    },
    
    /**
     * Check if in guest mode
     */
    isGuest() {
        return this.isGuestMode;
    },
    
    /**
     * Get auth status object
     */
    getStatus() {
        return {
            isAuthenticated: this.isAuthenticated(),
            isGuest: this.isGuest(),
            userId: this.getUserId(),
            email: this.getUserEmail(),
            user: this.currentUser
        };
    },
    
    /**
     * Log out (switch from authenticated to guest)
     */
    async logout() {
        try {
            if (this.supabaseClient && this.currentUser) {
                await this.supabaseClient.auth.signOut();
                console.log('✅ User logged out');
            }
            this.currentUser = null;
            this.enterGuestMode();
            return true;
        } catch (error) {
            console.error('❌ Error logging out:', error);
            this.enterGuestMode();
            return false;
        }
    },
    
    /**
     * Check if stats are available (only for authenticated users)
     */
    canAccessStats() {
        return this.isAuthenticated();
    },
    
    /**
     * Get stats availability message
     */
    getStatsMessage() {
        if (this.isAuthenticated()) {
            return '✅ Account stats available';
        }
        return '📊 Create an account to save and view your statistics';
    }
};

// Auto-initialize when Supabase is ready
function initializeGuestAuth() {
    const checkInterval = setInterval(async () => {
        if (window.supabaseClient) {
            clearInterval(checkInterval);
            await GuestAuth.initialize(window.supabaseClient);
            window.dispatchEvent(new CustomEvent('guestAuthReady', { 
                detail: GuestAuth.getStatus() 
            }));
            console.log('✅ GuestAuth ready');
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.supabaseClient) {
            console.warn('⚠️ Supabase not loaded, using guest mode');
            GuestAuth.enterGuestMode();
            window.dispatchEvent(new CustomEvent('guestAuthReady', { 
                detail: GuestAuth.getStatus() 
            }));
        }
    }, 10000);
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGuestAuth);
} else {
    initializeGuestAuth();
}

console.log('📦 guest-auth.js loaded');
