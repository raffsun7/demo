import { auth, db } from '../firebase/firebaseConfig.js';
import { 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.whitelistedEmails = [
            'raffsun11@gmail.com',
            'raffu794@gmail.com',
            'me.monira@outlook.com'
        ];
        this.init();
    }

    init() {
        // Check if we're on login page or main app
        if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
            this.initLoginPage();
        } else {
            this.initMainApp();
        }

        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.handleAuthStateChange(user);
        });
    }

    initLoginPage() {
        // Login form elements
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const eyeIcon = document.getElementById('eyeIcon');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        // Forgot password elements
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        const closeForgotModal = document.getElementById('closeForgotModal');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const cancelReset = document.getElementById('cancelReset');

        // Event listeners
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

        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', () => {
                forgotPasswordModal.classList.remove('hidden');
            });
        }

        if (closeForgotModal || cancelReset) {
            const closeModal = () => {
                forgotPasswordModal.classList.add('hidden');
                document.getElementById('resetEmail').value = '';
                document.getElementById('resetMessage').classList.add('hidden');
            };
            
            closeForgotModal?.addEventListener('click', closeModal);
            cancelReset?.addEventListener('click', closeModal);
        }

        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }
    }

    initMainApp() {
        // Add logout functionality to main app
        this.addLogoutButton();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        // Hide previous messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        // Show loading state
        loginButtonText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');

        try {
            // Check if email is whitelisted
            if (!this.isEmailWhitelisted(email)) {
                throw new Error('Access denied. Your email is not authorized to use this application.');
            }

            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Verify user is still whitelisted (double-check)
            const isAuthorized = this.isEmailWhitelisted(user.email);
            if (!isAuthorized) {
                await signOut(auth);
                throw new Error('Access denied. Your account is not authorized.');
            }

            // Show success message
            successMessage.classList.remove('hidden');
            
            // Redirect to main app after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

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

    async handlePasswordReset(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        const resetMessage = document.getElementById('resetMessage');

        try {
            // Check if email is whitelisted
            if (!this.isEmailWhitelisted(email)) {
                throw new Error('Email not found in authorized users list.');
            }

            await sendPasswordResetEmail(auth, email);
            
            resetMessage.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
            resetMessage.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Password reset email sent successfully!';
            resetMessage.classList.remove('hidden');

        } catch (error) {
            console.error('Password reset error:', error);
            
            resetMessage.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg';
            resetMessage.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${this.getErrorMessage(error.code || error.message)}`;
            resetMessage.classList.remove('hidden');
        }
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            
            // Check if user is authorized
            const isAuthorized = this.isEmailWhitelisted(user.email);
            console.log('User authorized:', isAuthorized);
            
            if (isAuthorized) {
                // User is authorized
                if (window.location.pathname.includes('login.html')) {
                    // Redirect to main app if on login page
                    console.log('Redirecting to main app');
                    window.location.href = 'index.html';
                }
                // If already on main app, do nothing
            } else {
                // User is not authorized
                console.log('User not authorized, signing out');
                signOut(auth);
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
            }
        } else {
            // User is signed out
            console.log('User signed out');
            if (!window.location.pathname.includes('login.html')) {
                // Redirect to login if not on login page
                window.location.href = 'login.html';
            }
        }
    }

    isEmailWhitelisted(email) {
        return this.whitelistedEmails.includes(email.toLowerCase());
    }

    addLogoutButton() {
        // Find the dark mode toggle button and add logout button next to it
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-600 hover:text-red-700';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt text-lg"></i>';
            logoutBtn.title = 'Sign Out';
            
            logoutBtn.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });

            darkModeToggle.parentNode.insertBefore(logoutBtn, darkModeToggle);
        }
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
    async isUserAuthorized() {
        if (!this.currentUser) return false;
        return this.isEmailWhitelisted(this.currentUser.email);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
window.authManager = authManager;

