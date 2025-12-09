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
    
    // Check if user is already logged in via Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        await loadAccountFromDatabase(session.user.id);
        showAccountDetails();
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
            .single();
        
        // If no data found (error.code === 'PGRST116'), ID is unique
        if (error && error.code === 'PGRST116') {
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

console.log('Player Account system initialized');

