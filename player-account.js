// Player Account Management
// Handles account creation, login, and linking with player library

console.log('Player Account system loaded');

// Account state
let currentAccount = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAccountSystem();
});

function initializeAccountSystem() {
    // Check if user is already logged in
    const savedAccount = localStorage.getItem('dartstream-account');
    if (savedAccount) {
        currentAccount = JSON.parse(savedAccount);
        showAccountDetails();
    }

    // Register form submit
    document.getElementById('register-btn').addEventListener('click', handleRegister);

    // Login form submit
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Toggle between forms
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
}

async function handleRegister() {
    const firstName = document.getElementById('register-firstname').value.trim();
    const lastName = document.getElementById('register-lastname').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();

    // Validate inputs
    if (!firstName || !lastName || !email) {
        showMessage('message-container', 'Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('message-container', 'Please enter a valid email address', 'error');
        return;
    }

    // Generate unique player ID (4-digit number)
    const playerId = generatePlayerId();

    // Create account object
    const account = {
        id: playerId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        createdAt: new Date().toISOString(),
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalDarts: 0,
            totalScore: 0,
            highestCheckout: 0,
            averages: []
        }
    };

    // Save to database/localStorage
    const result = await saveAccount(account);

    if (result.success) {
        currentAccount = account;
        localStorage.setItem('dartstream-account', JSON.stringify(account));
        showMessage('message-container', 'Account created successfully!', 'success');
        
        // Show account details after 1 second
        setTimeout(() => {
            showAccountDetails();
        }, 1000);
    } else {
        showMessage('message-container', result.message || 'Failed to create account', 'error');
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();

    if (!email) {
        showMessage('login-message-container', 'Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('login-message-container', 'Please enter a valid email address', 'error');
        return;
    }

    // Find account by email
    const account = await findAccountByEmail(email);

    if (account) {
        currentAccount = account;
        localStorage.setItem('dartstream-account', JSON.stringify(account));
        showMessage('login-message-container', 'Login successful!', 'success');
        
        setTimeout(() => {
            showAccountDetails();
        }, 1000);
    } else {
        showMessage('login-message-container', 'No account found with this email address', 'error');
    }
}

function handleLogout() {
    currentAccount = null;
    localStorage.removeItem('dartstream-account');
    document.getElementById('account-details').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    clearForm('register-form');
    clearForm('login-form');
}

function showAccountDetails() {
    if (!currentAccount) return;

    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('account-details').style.display = 'block';

    document.getElementById('account-firstname').value = currentAccount.firstName;
    document.getElementById('account-lastname').value = currentAccount.lastName;
    document.getElementById('account-email').value = currentAccount.email;
    document.getElementById('account-player-id').textContent = currentAccount.id;
}

// Helper: Generate unique 4-digit player ID
function generatePlayerId() {
    // Generate random 4-digit number
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Check if ID already exists
    const existingAccounts = getAllAccounts();
    const exists = existingAccounts.some(account => account.id === id);
    
    if (exists) {
        // Recursively generate new ID if duplicate
        return generatePlayerId();
    }
    
    return id;
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

// Database functions (using localStorage for now, can be migrated to Supabase)
async function saveAccount(account) {
    try {
        // Get existing accounts
        const accounts = getAllAccounts();
        
        // Check if email already exists
        const existingAccount = accounts.find(a => a.email === account.email);
        if (existingAccount) {
            return { success: false, message: 'An account with this email already exists' };
        }
        
        // Add new account
        accounts.push(account);
        
        // Save to localStorage
        localStorage.setItem('dartstream-accounts', JSON.stringify(accounts));
        
        return { success: true };
    } catch (error) {
        console.error('Error saving account:', error);
        return { success: false, message: 'Failed to save account' };
    }
}

async function findAccountByEmail(email) {
    const accounts = getAllAccounts();
    return accounts.find(account => account.email === email);
}

function getAllAccounts() {
    const accountsJson = localStorage.getItem('dartstream-accounts');
    return accountsJson ? JSON.parse(accountsJson) : [];
}

// Export function for linking player library
window.PlayerAccountSystem = {
    findAccountByEmail,
    getCurrentAccount: () => currentAccount,
    linkPlayerToAccount: async function(email, playerId) {
        const account = await findAccountByEmail(email);
        if (account && account.id === playerId) {
            return { success: true, account };
        }
        return { success: false, message: 'Email and Player ID do not match' };
    }
};

console.log('Player Account system initialized');
