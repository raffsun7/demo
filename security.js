// security.js
// This file handles the PIN-based authentication for the application.

// Define the default PIN for accessing the gallery.
const DEFAULT_PIN = "060703";

// --- DOM Element Creation for PIN Modal ---
// Create the main modal overlay div.
const pinModal = document.createElement('div');
pinModal.id = 'pin-modal'; // Assign an ID for styling and selection
pinModal.className = 'modal-overlay'; // Use existing modal-overlay styles

// Populate the modal with its content, including a form for PIN entry.
// Added autocomplete="off" to the form and the input field.
pinModal.innerHTML = `
    <div class="modal-content">
        <h2>Enter PIN to Access</h2>
        <form id="pin-form" autocomplete="off">
            <div class="form-group">
                <label for="pin-input">PIN:</label>
                <input type="password" id="pin-input" placeholder="Enter your PIN" required maxlength="6" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
            </div>
            <button type="submit" id="submit-pin-btn">Enter</button>
            <p id="pin-error-message" style="color: red; margin-top: 10px;"></p>
        </form>
    </div>
`;

// Append the newly created PIN modal to the document body.
// This ensures it's part of the DOM when the page loads.
document.body.appendChild(pinModal);

// Get references to the specific elements within the PIN modal.
const pinInput = document.getElementById('pin-input');
const pinForm = document.getElementById('pin-form');
const pinErrorMessage = document.getElementById('pin-error-message');

// --- Exported Functions ---

/**
 * Displays the PIN entry modal.
 */
export const showPinModal = () => {
    pinModal.classList.add('active'); // Activate the modal's visibility
    pinInput.value = ''; // Clear any previously entered PIN
    pinErrorMessage.textContent = ''; // Clear any previous error messages
    pinInput.focus(); // Automatically focus on the input field for convenience
};

/**
 * Hides the PIN entry modal.
 */
export const hidePinModal = () => {
    pinModal.classList.remove('active'); // Deactivate the modal's visibility
};

/**
 * Checks if the user is currently authenticated.
 * With no sessionStorage, this will always return false on a fresh load,
 * forcing the PIN modal to appear every time.
 * @returns {boolean} True if authenticated, false otherwise.
 */
export const isAuthenticated = () => {
    // Authentication is only true if the PIN has just been successfully entered
    // within the current page load. There is no persistent "authenticated" state.
    // For "every time visit or refresh", we effectively always start as not authenticated.
    return false; // Always return false to force PIN on every load/refresh
};

/**
 * Attempts to authenticate the user with the provided PIN.
 * @param {string} pin The PIN entered by the user.
 * @returns {boolean} True if authentication is successful, false otherwise.
 */
export const authenticate = (pin) => {
    if (pin === DEFAULT_PIN) {
        return true;
    } else {
        return false;
    }
};

// --- Event Listener for PIN Form Submission ---
pinForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    const enteredPin = pinInput.value; // Get the PIN entered by the user

    if (authenticate(enteredPin)) {
        hidePinModal(); // Hide the PIN modal on successful authentication
        // Dispatch a custom event to notify ui.js that authentication is successful.
        // This allows ui.js to proceed with rendering the main application content.
        const event = new CustomEvent('authenticated');
        document.dispatchEvent(event);
    } else {
        pinErrorMessage.textContent = "Invalid PIN. Please try again."; // Display error message
        pinInput.value = ''; // Clear the input field for another attempt
    }
});

// Optional: Close modal if clicking outside (consistent with other modals)
// For security, you might choose to remove this if you want the PIN modal
// to *only* be dismissible by entering the correct PIN.
pinModal.addEventListener('click', (e) => {
    if (e.target === pinModal) {
        // If the click is on the overlay itself, not the content,
        // it will not close the modal, ensuring PIN entry is required.
    }
});