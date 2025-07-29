import { auth } from '../firebase/firebaseConfig.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class SPAAuthManager {
    constructor() {
        this.currentUser = null;
        this.whitelistedEmails = [
            'raffsun11@gmail.com',
            'raffu794@gmail.com',
            'me.monira@outlook.com'
        ];
        this.loginScreen = document.getElementById('loginScreen');
        this.mainApp = document.getElementById('mainApp');
        this.init();
    }

    init() {
        console.log('SPA Auth Manager initialized');
        this.setupLoginForm();
        this.setupLogoutButton();
        
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            this.handleAuthStateChange(user);
        });
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const eyeIcon = document.getElementById('eyeIcon');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                eyeIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        }
    }

    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        console.log('Login attempt for:', email);

        // Hide previous messages
        errorMessage.classList.add('hidden');

        // Show loading state
        loginButtonText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');

        try {
            // Check if email is whitelisted first
            if (!this.isEmailWhitelisted(email)) {
                throw new Error('Access denied. Your email is not authorized to use this application.');
            }

            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful for:', userCredential.user.email);

        } catch (error) {
            console.error('Login error:', error);
            
            // Show error message
            const errorText = document.getElementById('errorText');
            errorText.textContent = this.getErrorMessage(error.code || error.message);
            errorMessage.classList.remove('hidden');

            // Reset button state
            loginButtonText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    }

    async handleLogout() {
        try {
            console.log('Logging out user');
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            console.log('User is signed in:', user.email);
            
            // Check if user is authorized
            const isAuthorized = this.isEmailWhitelisted(user.email);
            console.log('User authorized:', isAuthorized);
            
            if (isAuthorized) {
                // Show main app, hide login
                this.showMainApp();
            } else {
                // User is not authorized, sign them out
                console.log('User not authorized, signing out');
                signOut(auth);
                this.showError('Access denied. Your account is not authorized.');
            }
        } else {
            console.log('User is signed out');
            // Show login screen, hide main app
            this.showLoginScreen();
        }
    }

    showMainApp() {
        console.log('Showing main app');
        this.loginScreen.classList.add('hidden');
        this.mainApp.classList.remove('hidden');
        
        // Reset login form
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').classList.add('hidden');
        document.getElementById('loginButtonText').classList.remove('hidden');
        document.getElementById('loginSpinner').classList.add('hidden');
    }

    showLoginScreen() {
        console.log('Showing login screen');
        this.loginScreen.classList.remove('hidden');
        this.mainApp.classList.add('hidden');
    }

    showError(message) {
        const errorText = document.getElementById('errorText');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
        }
        
        // Reset button state
        document.getElementById('loginButtonText').classList.remove('hidden');
        document.getElementById('loginSpinner').classList.add('hidden');
    }

    isEmailWhitelisted(email) {
        return this.whitelistedEmails.includes(email.toLowerCase());
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please try again.'
        };

        return errorMessages[errorCode] || errorCode || 'An error occurred. Please try again.';
    }

    // Public method to get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Public method to check if user is authenticated and authorized
    isUserAuthorized() {
        if (!this.currentUser) return false;
        return this.isEmailWhitelisted(this.currentUser.email);
    }
}

// Initialize SPA auth manager
const spaAuthManager = new SPAAuthManager();

// Export for use in other modules
window.spaAuthManager = spaAuthManager;

