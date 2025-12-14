// Player Account Management
// Handles account creation, login, and linking with player library
// Uses Supabase Auth for authentication and database for storage

console.log('Player Account system loaded');

// Import Supabase client
const { createClient } = supabase;

// Initialize Supabase client
let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    
    const supabaseUrl = 'https://kswwbqumgsdissnwuiab.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd3dicXVtZ3NkaXNzbnd1aWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODMwNTIsImV4cCI6MjA4MDA1OTA1Mn0.b-z8JqL1dBYJcrrzSt7u6VAaFAtTOl1vqqtFFgHkJ50';
    
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
}

// Account state
let currentAccount = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAccountSystem();
});

async function initializeAccountSystem() {
    const supabase = getSupabaseClient();
    
    // Check URL parameters for action
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    // Wait for GuestAuth to initialize
    await new Promise(resolve => {
        if (window.GuestAuth && window.GuestAuth.isAuthenticated !== undefined) {
            resolve();
        } else {
            window.addEventListener('guestAuthReady', resolve, { once: true });
            setTimeout(resolve, 3000); // Fallback timeout
        }
    });
    
    // Check if user is authenticated via GuestAuth
    if (window.GuestAuth && window.GuestAuth.isAuthenticated()) {
        // User is logged in
        await loadAccountFromDatabase(window.GuestAuth.currentUser.id);
        showAccountDetails();
    } else {
        // User is in guest mode or not logged in
        if (window.GuestAuth && window.GuestAuth.isGuest()) {
            // Show guest mode banner
            document.getElementById('guestModeBanner').style.display = 'block';
        }
        
        // Show login form
        if (action === 'register') {
            showRegisterForm();
        } else {
            // Default to login form (including when action=login)
            showLoginForm();
        }
    }

    // Register form submit
    document.getElementById('register-btn').addEventListener('click', handleRegister);

    // Login form submit
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Forgot password
    document.getElementById('forgot-password-link').addEventListener('click', showForgotPasswordForm);
    document.getElementById('forgot-password-btn').addEventListener('click', handleForgotPassword);
    document.getElementById('back-to-login').addEventListener('click', showLoginForm);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Link to library
    document.getElementById('link-to-library-btn').addEventListener('click', handleLinkToLibrary);

    // Toggle between forms
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('message-container').innerHTML = '';
        document.getElementById('login-message-container').innerHTML = '';
    });

    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('message-container').innerHTML = '';
        document.getElementById('login-message-container').innerHTML = '';
    });
}

async function handleRegister() {
    const firstName = document.getElementById('register-firstname').value.trim();
    const lastName = document.getElementById('register-lastname').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // Validate inputs
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showMessage('message-container', 'Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('message-container', 'Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('message-container', 'Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('message-container', 'Passwords do not match. Please try again.', 'error');
        return;
    }

    try {
        const supabase = getSupabaseClient();
        
        // Sign up with Supabase Auth (trigger will auto-create player_accounts record)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('User creation failed');
        }

        // Check if email confirmation is required
        if (authData.session === null) {
            showMessage('message-container', 'Please check your email to confirm your account before logging in.', 'success');
            setTimeout(() => {
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
            }, 3000);
            return;
        }

        // Wait a moment for the trigger to create the player_accounts record
        await new Promise(resolve => setTimeout(resolve, 500));

        // Load the account data that was created by the trigger
        await loadAccountFromDatabase(authData.user.id);
        
        // Check if account is already linked (in case they complete setup immediately)
        const { data: accountData } = await supabase
            .from('player_accounts')
            .select('account_linked_player_id, first_name, last_name')
            .eq('user_id', authData.user.id)
            .maybeSingle();
        
        if (accountData && accountData.account_linked_player_id) {
            // Account is set up and linked - redirect to home
            const userName = `${accountData.first_name} ${accountData.last_name}`;
            showMessage('message-container', 'Account created successfully!', 'success');
            setTimeout(() => {
                alert(`Welcome, ${userName}!`);
                window.location.href = 'https://dowdarts.github.io/dartstream2/';
            }, 1000);
            return;
        }

        showMessage('message-container', 'Account created successfully!', 'success');
        
        // Show account details after 1 second
        setTimeout(() => {
            showAccountDetails();
        }, 1000);
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('message-container', error.message || 'Failed to create account', 'error');
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage('login-message-container', 'Please enter email and password', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('login-message-container', 'Please enter a valid email address', 'error');
        return;
    }

    try {
        const supabase = getSupabaseClient();
        
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // Load account from database
        await loadAccountFromDatabase(authData.user.id);
        
        // Check if account is already linked to player library
        const { data: accountData } = await supabase
            .from('player_accounts')
            .select('account_linked_player_id, first_name, last_name')
            .eq('user_id', authData.user.id)
            .maybeSingle();
        
        if (accountData && accountData.account_linked_player_id) {
            // Account is already set up and linked - redirect to home
            const userName = `${accountData.first_name} ${accountData.last_name}`;
            alert(`Welcome back, ${userName}!`);
            window.location.href = 'https://dowdarts.github.io/dartstream2/';
            return;
        }

        showMessage('login-message-container', 'Login successful!', 'success');
        
        setTimeout(() => {
            showAccountDetails();
        }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-message-container', error.message || 'Login failed', 'error');
    }
}

async function handleLogout() {
    try {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        
        currentAccount = null;
        document.getElementById('account-details').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        clearForm('register-form');
        clearForm('login-form');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function loadAccountFromDatabase(userId) {
    try {
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
            .from('player_accounts')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

        if (error) throw error;

        // If no account exists, create one manually (fallback if trigger didn't fire)
        if (!data) {
            console.log('No account found, creating manually...');
            const { data: { user } } = await supabase.auth.getUser();
            
            const playerId = await generatePlayerId();
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            const email = user.email;

            const { data: newAccount, error: insertError } = await supabase
                .from('player_accounts')
                .insert({
                    user_id: userId,
                    player_id: playerId,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    stats: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        totalDarts: 0,
                        totalScore: 0,
                        highestCheckout: 0,
                        averages: []
                    }
                })
                .select()
                .single();

            if (insertError) throw insertError;

            currentAccount = {
                id: newAccount.player_id,
                firstName: newAccount.first_name,
                lastName: newAccount.last_name,
                email: newAccount.email,
                userId: newAccount.user_id,
                stats: newAccount.stats
            };
        } else {
            currentAccount = {
                id: data.player_id,
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                userId: data.user_id,
                stats: data.stats || {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalDarts: 0,
                    totalScore: 0,
                    highestCheckout: 0,
                    averages: []
                }
            };
        }
    } catch (error) {
        console.error('Error loading account:', error);
        throw error;
    }
}

function showAccountDetails() {
    if (!currentAccount) return;

    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('account-details').style.display = 'block';

    document.getElementById('account-firstname').value = currentAccount.firstName;
    document.getElementById('account-lastname').value = currentAccount.lastName;
    document.getElementById('account-email').value = currentAccount.email;
    document.getElementById('account-player-id').textContent = currentAccount.id;

    // Check if account is already linked to a player in the library
    checkLinkingStatus();
    
    // Load and display stats
    loadPlayerStats();
}

async function loadPlayerStats() {
    try {
        const supabase = getSupabaseClient();
        
        // Get current session to ensure we have the user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            document.getElementById('lifetime-stats-section').style.display = 'none';
            return;
        }
        
        // Get the linked player ID
        const { data: accountData, error: accountError } = await supabase
            .from('player_accounts')
            .select('account_linked_player_id, lifetime_stats')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (accountError) throw accountError;

        if (!accountData || !accountData.account_linked_player_id) {
            // No linked player, hide stats section and show account form
            document.getElementById('lifetime-stats-section').style.display = 'none';
            document.getElementById('account-form-section').style.display = 'block';
            document.getElementById('account-details').style.display = 'block';
            return;
        }

        // Account is linked - hide form fields/buttons but show stats
        document.getElementById('account-form-section').style.display = 'none';
        document.getElementById('account-details').style.display = 'block';
        document.getElementById('lifetime-stats-section').style.display = 'block';

        // Display lifetime stats
        const stats = accountData.lifetime_stats || {};
        
        // Match Summary
        const totalMatches = stats.total_matches || 0;
        const totalWins = stats.total_wins || 0;
        const totalLosses = totalMatches - totalWins;
        
        document.getElementById('stat-total-matches').textContent = totalMatches;
        document.getElementById('stat-wins').textContent = totalWins;
        document.getElementById('stat-losses').textContent = totalLosses;
        
        const winRate = totalMatches > 0 
            ? Math.round((totalWins / totalMatches) * 100) 
            : 0;
        document.getElementById('stat-win-rate').textContent = winRate + '%';
        
        // Performance Stats
        document.getElementById('stat-average').textContent = (stats.average_3dart || 0).toFixed(2);
        document.getElementById('stat-highest-checkout').textContent = stats.highest_checkout || 0;
        document.getElementById('stat-total-darts').textContent = stats.total_darts_thrown || 0;
        document.getElementById('stat-total-score').textContent = stats.total_score || 0;
        
        // Legs Performance
        const legsWon = stats.total_legs_won || 0;
        const legsLost = stats.total_legs_lost || 0;
        const totalLegs = legsWon + legsLost;
        
        document.getElementById('stat-legs-won').textContent = legsWon;
        document.getElementById('stat-legs-lost').textContent = legsLost;
        document.getElementById('stat-total-legs').textContent = totalLegs;
        
        const legWinRate = totalLegs > 0 
            ? Math.round((legsWon / totalLegs) * 100) 
            : 0;
        document.getElementById('stat-leg-win-rate').textContent = legWinRate + '%';
        
        // Achievement Stats
        document.getElementById('stat-180s').textContent = stats.total_180s || 0;
        document.getElementById('stat-171s').textContent = stats.total_171s || 0;
        document.getElementById('stat-95s').textContent = stats.total_95s || 0;
        document.getElementById('stat-100-plus').textContent = stats.total_100_plus || 0;
        document.getElementById('stat-120-plus').textContent = stats.total_120_plus || 0;
        document.getElementById('stat-140-plus').textContent = stats.total_140_plus || 0;
        document.getElementById('stat-160-plus').textContent = stats.total_160_plus || 0;

        // Display recent matches
        const recentMatches = stats.recent_matches || [];
        const matchesList = document.getElementById('recent-matches-list');
        
        if (recentMatches.length === 0) {
            matchesList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">No matches recorded yet. Start playing to see your stats!</p>';
        } else {
            matchesList.innerHTML = recentMatches.map(match => {
                const matchDate = new Date(match.date).toLocaleDateString();
                const resultClass = match.won ? 'win' : 'loss';
                const resultText = match.won ? 'WIN' : 'LOSS';
                const matchId = match.match_id || '';
                
                return `
                    <div class="match-item ${resultClass}" onclick="viewMatchSummary('${matchId}')" style="cursor: pointer;">
                        <div class="match-header">
                            <span class="match-opponent">vs ${match.opponent || 'Unknown'}</span>
                            <span class="match-result ${resultClass}">${resultText}</span>
                        </div>
                        <div class="match-details">
                            <span>${matchDate}</span>
                            <span>Score: ${match.score || 'N/A'}</span>
                            <span>Avg: ${(match.average || 0).toFixed(2)}</span>
                        </div>
                        <div style="text-align: center; margin-top: 5px; font-size: 11px; color: #94a3b8;">
                            👁️ Click to view detailed match summary
                        </div>
                    </div>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error loading player stats:', error);
    }
}

async function checkLinkingStatus() {
    try {
        const supabase = getSupabaseClient();
        
        // Get current session to ensure we have the user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Check if this account has a linked player
        const { data, error } = await supabase
            .from('player_accounts')
            .select('account_linked_player_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (error) throw error;

        const statusDiv = document.getElementById('linking-status');
        const linkButton = document.getElementById('link-to-library-btn');

        if (data && data.account_linked_player_id) {
            // Account is linked
            statusDiv.innerHTML = '✅ Your account is linked to the scoring app player library!';
            statusDiv.style.backgroundColor = '#d4edda';
            statusDiv.style.color = '#155724';
            linkButton.textContent = 'Update Player Card';
            linkButton.classList.remove('submit-btn');
            linkButton.classList.add('submit-btn', 'secondary');
        } else {
            // Not linked yet
            statusDiv.innerHTML = 'ℹ️ Add your account to the scoring app to track your stats across all matches.';
            statusDiv.style.backgroundColor = '#d1ecf1';
            statusDiv.style.color = '#0c5460';
            linkButton.textContent = 'Add Your Account to Scoring App';
            linkButton.classList.remove('secondary');
        }

    } catch (error) {
        console.error('Error checking linking status:', error);
    }
}

async function handleLinkToLibrary() {
    try {
        const supabase = getSupabaseClient();
        
        // Get current session to ensure we have the user ID
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showLinkingMessage('No active session. Please log in again.', 'error');
            return;
        }
        
        // Get updated values from the form
        const firstName = document.getElementById('account-firstname').value.trim();
        const lastName = document.getElementById('account-lastname').value.trim();
        const email = document.getElementById('account-email').value.trim().toLowerCase();

        if (!firstName || !lastName || !email) {
            showLinkingMessage('Please fill in all fields', 'error');
            return;
        }

        showLinkingMessage('Creating/updating your player card...', 'info');

        // Check if account already has a linked player
        const { data: accountData, error: accountError } = await supabase
            .from('player_accounts')
            .select('account_linked_player_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (accountError) throw accountError;

        let playerLibraryId = accountData?.account_linked_player_id;

        if (playerLibraryId) {
            // Update existing player in library
            const { error: updateError } = await supabase
                .from('players')
                .update({
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('id', playerLibraryId);

            if (updateError) throw updateError;

            showLinkingMessage('✅ Your player card has been updated!', 'success');

        } else {
            // Create new player in library
            const { data: newPlayer, error: insertError } = await supabase
                .from('players')
                .insert({
                    first_name: firstName,
                    last_name: lastName
                })
                .select()
                .single();

            if (insertError) throw insertError;

            playerLibraryId = newPlayer.id;

            // Link the player to this account
            const { error: linkError } = await supabase
                .from('player_accounts')
                .update({ account_linked_player_id: playerLibraryId })
                .eq('user_id', session.user.id);

            if (linkError) throw linkError;

            // Update the account info in player_accounts
            const { error: updateAccountError } = await supabase
                .from('player_accounts')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    email: email
                })
                .eq('user_id', session.user.id);

            if (updateAccountError) throw updateAccountError;

            showLinkingMessage('✅ Your player card has been created and linked to your account!', 'success');
            
            // Redirect to home after successful linking
            setTimeout(() => {
                const userName = `${firstName} ${lastName}`;
                alert(`Welcome, ${userName}! Your account is now set up.`);
                window.location.href = 'https://dowdarts.github.io/dartstream2/';
            }, 2000);
            return;
        }

        // Refresh the linking status
        setTimeout(() => {
            checkLinkingStatus();
        }, 2000);

    } catch (error) {
        console.error('Error linking to library:', error);
        showLinkingMessage('❌ Error: ' + error.message, 'error');
    }
}

function showLinkingMessage(message, type) {
    const statusDiv = document.getElementById('linking-status');
    statusDiv.innerHTML = message;
    
    if (type === 'success') {
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#f8d7da';
        statusDiv.style.color = '#721c24';
    } else {
        statusDiv.style.backgroundColor = '#d1ecf1';
        statusDiv.style.color = '#0c5460';
    }
}

function showForgotPasswordForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('account-details').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
    clearForm('forgot-password-account-form');
}

function showLoginForm() {
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('account-details').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

async function handleForgotPassword() {
    const email = document.getElementById('forgot-password-email').value.trim().toLowerCase();

    if (!email) {
        showMessage('forgot-password-message-container', 'Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('forgot-password-message-container', 'Please enter a valid email address', 'error');
        return;
    }

    try {
        const supabase = getSupabaseClient();
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/player-account.html'
        });

        if (error) throw error;

        showMessage('forgot-password-message-container', 'Password reset link sent! Check your email.', 'success');
        
        setTimeout(() => {
            showLoginForm();
        }, 3000);
    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('forgot-password-message-container', error.message || 'Failed to send reset link', 'error');
    }
}

// Helper: Generate unique 4-digit player ID
async function generatePlayerId() {
    const supabase = getSupabaseClient();
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        // Generate random 4-digit number
        const id = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Check if ID already exists in database
        const { data, error } = await supabase
            .from('player_accounts')
            .select('player_id')
            .eq('player_id', id)
            .maybeSingle(); // Use maybeSingle() to handle 0 rows gracefully
        
        // If no data found, ID is unique
        if (!data && !error) {
            return id;
        }
        
        attempts++;
    }
    
    // Fallback to timestamp-based ID if random generation fails
    return Date.now().toString().slice(-4);
}

// Helper: Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper: Show message
function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="${type}-message">
            ${message}
        </div>
    `;

    // Clear message after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Helper: Clear form
function clearForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        if (!input.classList.contains('readonly')) {
            input.value = '';
        }
    });
}

// Export function for linking player library
window.PlayerAccountSystem = {
    getSupabaseClient,
    getCurrentAccount: () => currentAccount,
    linkPlayerToAccount: async function(email, playerId) {
        try {
            const supabase = getSupabaseClient();
            
            // Find account by email and player_id in database
            const { data, error } = await supabase
                .from('player_accounts')
                .select('*')
                .eq('email', email.toLowerCase())
                .eq('player_id', playerId)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, message: 'Email and Player ID do not match any account' };
                }
                throw error;
            }
            
            if (data) {
                return { 
                    success: true, 
                    account: {
                        id: data.player_id,
                        firstName: data.first_name,
                        lastName: data.last_name,
                        email: data.email
                    }
                };
            }
            
            return { success: false, message: 'Email and Player ID do not match' };
        } catch (error) {
            console.error('Error linking account:', error);
            return { success: false, message: 'Failed to verify account' };
        }
    }
};

// View detailed match summary - make it globally accessible
window.viewMatchSummary = function(matchId) {
    if (!matchId) {
        alert('Match data not available');
        return;
    }
    window.location.href = `match-summary.html?match_id=${matchId}`;
};

console.log('Player Account system initialized');

