// Configuration - Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbm4_QdTd5xlVn6JiMnSgq6yWDqTRA1SgKN7xkBG_Z6LkFYTVnSNhwOnFAPbeOZv37/exec';

// DOM elements
const homepage = document.getElementById('homepage');
const rsvpPage = document.getElementById('rsvp-page');
const rsvpBtn = document.getElementById('rsvp-btn');
const backBtn = document.getElementById('back-btn');
const rsvpForm = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const newRsvpBtn = document.getElementById('new-rsvp-btn');
const additionalNotesField = document.getElementById('additional-notes');

// New for dynamic guests
const guestCountSelect = document.getElementById('guest-count');
const guestDetailsContainer = document.getElementById('guest-details-container');

// Store food preferences for each guest (key: guest number)
let guestFoodPreferences = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    addRealTimeValidation();
});

function initializeEventListeners() {
    // RSVP button click - navigate to form
    if (rsvpBtn) rsvpBtn.addEventListener('click', showRsvpForm);
    
    // Back button click - return to homepage
    if (backBtn) backBtn.addEventListener('click', showHomepage);
    
    // Form submission
    if (rsvpForm) rsvpForm.addEventListener('submit', handleFormSubmission);
    
    // New RSVP button click - reset form and show it again
    if (newRsvpBtn) newRsvpBtn.addEventListener('click', resetAndShowForm);

    // Guest count dropdown
    if (guestCountSelect) {
        guestCountSelect.addEventListener('change', handleGuestCountChange);
    }

    // Food preference button clicks (event delegation)
    if (guestDetailsContainer) {
        guestDetailsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('food-btn')) {
                const guestNum = e.target.getAttribute('data-guest');
                const food = e.target.getAttribute('data-food');

                // Remove selection from both buttons for this guest
                const buttons = guestDetailsContainer.querySelectorAll(`.food-btn[data-guest="${guestNum}"]`);
                buttons.forEach(btn => btn.classList.remove('selected-veg', 'selected-nonveg'));

                // Add selection style
                if (food === 'vegetarian') {
                    e.target.classList.add('selected-veg');
                } else {
                    e.target.classList.add('selected-nonveg');
                }

                // Store selection
                guestFoodPreferences[guestNum] = food;
            }
        });
    }
}

function showRsvpForm() {
    transitionToPage(rsvpPage);
}

function showHomepage() {
    transitionToPage(homepage);
}

function transitionToPage(targetPage) {
    // Remove active class from all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    // Add active class to target page with slight delay for smooth transition
    setTimeout(() => {
        targetPage.classList.add('active');
    }, 100);
}

function handleGuestCountChange() {
    const count = parseInt(guestCountSelect.value, 10);
    guestDetailsContainer.innerHTML = '';
    guestFoodPreferences = {};
    if (!count) return;

    for (let i = 1; i <= count; i++) {
        const guestDiv = document.createElement('div');
        guestDiv.className = 'form-group guest-detail';

        guestDiv.innerHTML = `
            <label>Guest ${i} Name *</label>
            <input type="text" name="guestName${i}" required placeholder="Guest ${i} Name" />

            <div class="button-group" style="margin-top: 0.5rem;">
                <button type="button" class="food-btn" data-guest="${i}" data-food="vegetarian">Vegetarian</button>
                <button type="button" class="food-btn" data-guest="${i}" data-food="non-vegetarian">Non-Vegetarian</button>
            </div>
        `;
        guestDetailsContainer.appendChild(guestDiv);
    }
}

async function handleFormSubmission(event) {
    event.preventDefault();

    const guestCount = parseInt(guestCountSelect.value, 10);
    let allValid = true;

    for (let i = 1; i <= guestCount; i++) {
        const nameInput = rsvpForm.querySelector(`input[name="guestName${i}"]`);
        const name = nameInput ? nameInput.value.trim() : '';
        const food = guestFoodPreferences[i];

        if (!name || !food) {
            allValid = false;
            if (nameInput) nameInput.style.borderColor = !name ? '#e74c3c' : '';
            alert(`Please enter name and select food preference for guest ${i}.`);
            break;
        } else {
            if (nameInput) nameInput.style.borderColor = '';
        }
    }

    if (!allValid) return;

    // Gather your form fields: send each guest's name and food preference as separate fields
    const formData = new FormData();
    formData.append('guest_count', guestCount);
    for (let i = 1; i <= guestCount; i++) {
        const nameInput = rsvpForm.querySelector(`input[name="guestName${i}"]`);
        formData.append(`guest_name_${i}`, nameInput.value.trim());
        formData.append(`food_preference_${i}`, guestFoodPreferences[i]);
    }
    formData.append('additional_notes', additionalNotesField ? additionalNotesField.value.trim() : '');

    showLoadingState(true);

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            showSuccessMessage();
        } else {
            throw new Error(result.error || 'Unknown server error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your RSVP. Please try again.');
    } finally {
        showLoadingState(false);
    }
}

function showLoadingState(isLoading) {
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const loadingSpinner = submitBtn ? submitBtn.querySelector('.loading-spinner') : null;
    
    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
        if (submitBtn) submitBtn.disabled = true;
    } else {
        if (btnText) btnText.style.display = 'inline-block';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

function showSuccessMessage() {
    // Hide the form and show success message
    if (rsvpForm) rsvpForm.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
}

function resetAndShowForm() {
    // Reset form
    if (rsvpForm) rsvpForm.reset();
    if (guestDetailsContainer) guestDetailsContainer.innerHTML = '';
    guestFoodPreferences = {};
    if (successMessage) successMessage.style.display = 'none';
    if (rsvpForm) rsvpForm.style.display = 'block';
    if (guestCountSelect) guestCountSelect.value = '';
}

// Add real-time validation feedback for guest names
function addRealTimeValidation() {
    if (!guestDetailsContainer) return;
    guestDetailsContainer.addEventListener('blur', function(e) {
        if (e.target && e.target.tagName === 'INPUT' && e.target.name.startsWith('guestName')) {
            const val = e.target.value.trim();
            if (val.length < 2) {
                e.target.style.borderColor = '#e74c3c';
            } else {
                e.target.style.borderColor = '';
            }
        }
    }, true);

    guestDetailsContainer.addEventListener('focus', function(e) {
        if (e.target && e.target.tagName === 'INPUT' && e.target.name.startsWith('guestName')) {
            e.target.style.borderColor = '';
        }
    }, true);
}

// Error handling for network issues
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
    alert('You appear to be offline. Please check your internet connection and try again.');
});
