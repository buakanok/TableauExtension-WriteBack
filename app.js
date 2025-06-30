// IMPORTANT: Replace this with the Web App URL you got after deploying your Google Apps Script
const WEB_APP_URL = "https://cors-anywhere-ewo5.onrender.com/https://script.google.com/macros/s/AKfycbyA0k1W4pwzpsteKfQ_3puhHTTQt1LMJzaOu1uqC1fdI6zkVum8fiEpqOW8RM5_8fd96A/exec";

// UI Elements (remain the same as before)
const loadingMessage = document.getElementById('loadingMessage');
const successMessage = document.getElementById('successMessage'); 
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('comment');
const categorySelect = document.getElementById('category');
const submitButton = commentForm ? commentForm.querySelector('button[type="submit"]') : null;

// Function to show a message (loading, success, or error)
function showMessage(element, message, type = 'info') {
    hideAllMessages(); // Hide all messages first to ensure only one is visible
    if (element) {
        element.classList.remove('hidden');
        if (type === 'error' && errorText) {
            errorText.textContent = message;
        } else if (element.querySelector('p:last-child')) {
            element.querySelector('p:last-child').textContent = message;
        }
    }
}

// Function to hide all message divs
function hideAllMessages() {
    if (loadingMessage) loadingMessage.classList.add('hidden');
    if (successMessage) successMessage.classList.add('hidden');
    if (errorMessage) errorMessage.classList.add('hidden');
}

// Main initialization function for Tableau Extension
async function initializeTableauExtension() {
    showMessage(loadingMessage, 'Initializing Tableau Extension...');

    try {
        await tableau.extensions.initializeAsync();
        console.log('Tableau Extension Initialized!');
        hideAllMessages(); // Hide loading message on success

        // Set up form submission handler
        if (commentForm) {
            commentForm.addEventListener('submit', handleCommentSubmit);
            console.log('Comment form event listener attached.');
        } else {
            console.error('Comment form element not found. Check ID "commentForm".');
            showMessage(errorMessage, 'Form elements not found in HTML. Check IDs.', 'error');
        }

    } catch (error) {
        console.error('Tableau Extension Initialization failed:', error);
        showMessage(errorMessage, `Initialization failed: ${error.message}. Check console for details.`, 'error');
        if (submitButton) submitButton.disabled = true; // Disable button on error
    }
}

async function handleCommentSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    if (WEB_APP_URL === "YOUR_RENDER_CORS_PROXY_URL_HERE/YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        showMessage(errorMessage, "Error: Please replace the placeholder URL in app.js with your actual deployed URLs.", 'error');
        return;
    }

    const commentText = commentInput.value.trim();
    const category = categorySelect.value;
    const userId = tableau.extensions.ExtensionMode.viewing; 

    if (!commentText) {
        showMessage(errorMessage, 'Comment cannot be empty. Please enter some text.', 'error');
        return;
    }

    if (submitButton) submitButton.disabled = true;
    showMessage(loadingMessage, 'Submitting comment...');

    try {
        const dataToSend = {
            userId: userId,
            comment: commentText,
            category: category
        };

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        // --- CRITICAL CHANGE HERE ---
        if (!response.ok) {
            // Only attempt to read text if response is NOT OK (i.e., an error from server)
            const errorResponseText = await response.text(); 
            console.error("Server raw error response:", errorResponseText);
            throw new Error(`Server responded with status ${response.status}. See console for details.`);
        }

        // If response is OK, DO NOT parse it as JSON if it might be empty or non-JSON.
        // Instead, assume success if response.ok is true.
        console.log('Comment successfully written to Google Sheet (assuming success from 200 OK status).');

        // Direct success handling if response.ok
        commentInput.value = '';
        categorySelect.value = 'General';
        showMessage(successMessage, 'Comment submitted successfully!');
        setTimeout(hideAllMessages, 3000);

        // --- END CRITICAL CHANGE ---

    } catch (error) {
        console.error('Error submitting comment to Google Sheet:', error);
        showMessage(errorMessage, `Failed to submit comment: ${error.message}. Check console for details.`, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }

}

// Ensure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeTableauExtension);