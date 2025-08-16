// Configuration - Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyv7TesoL2awMCy8yfhEPfzr_Frn99bv5cqkSqJ5sOYACdEED2uyKgzUd8fl1pdItgr/exec';

// DOM elements
const homepage                 = document.getElementById('homepage');
const rsvpPage                 = document.getElementById('rsvp-page');
const datesPage                = document.getElementById('dates-page');
const successPage              = document.getElementById('success-page');
const rsvpBtn                  = document.getElementById('rsvp-btn');
const backBtn                  = document.getElementById('back-btn');
const toDatesBtn               = document.getElementById('to-dates');
const backToGuests             = document.getElementById('back-to-guests');
const toSubmitBtn              = document.getElementById('to-submit');
const newRsvpBtn               = document.getElementById('new-rsvp-btn');
const rsvpForm                 = document.getElementById('rsvp-form');
const datesForm                = document.getElementById('dates-form');

// Travel & date fields
const arrivalDateFieldStep     = document.getElementById('arrival-date-step');
const arrivalTimeFieldStep     = document.getElementById('arrival-time-step');
const arrivalMethodSelect      = document.getElementById('travel-method-arrival');
const departureDateFieldStep   = document.getElementById('departure-date-step');
const departureTimeFieldStep   = document.getElementById('departure-time-step');
const departureMethodSelect    = document.getElementById('travel-method-departure');
const additionalNotesFieldStep = document.getElementById('additional-notes-step');

// Dynamic guests
const guestCountSelect         = document.getElementById('guest-count');
const guestDetailsContainer    = document.getElementById('guest-details-container');
let guestFoodPreferences       = {};

// Interim storage
let interimData = {
  guestCount: 0,
  guests: [],              // [{ name, foodPreference }]
  arrivalDate: '',
  arrivalTime: '',
  arrivalTravelMethod: '',
  departureDate: '',
  departureTime: '',
  departureTravelMethod: '',
  additionalNotes: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
});

function initializeEventListeners() {
  rsvpBtn.addEventListener('click', () => transitionToPage(rsvpPage));
  backBtn.addEventListener('click', () => transitionToPage(homepage));
  guestCountSelect.addEventListener('change', handleGuestCountChange);
  rsvpForm.addEventListener('submit', handleGuestSubmission);
  backToGuests.addEventListener('click', () => transitionToPage(rsvpPage));
  datesForm.addEventListener('submit', handleDatesSubmission);
  newRsvpBtn.addEventListener('click', resetAndShowForm);
}

function transitionToPage(targetPage) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  setTimeout(() => targetPage.classList.add('active'), 100);
}

function handleGuestCountChange() {
  const count = parseInt(guestCountSelect.value, 10);
  guestDetailsContainer.innerHTML = '';
  guestFoodPreferences = {};
  if (!count) return;
  for (let i = 1; i <= count; i++) {
    const div = document.createElement('div');
    div.className = 'form-group guest-detail';
    div.innerHTML = `
      <label>Guest ${i} Name *</label>
      <input type="text" name="guestName${i}" required />
      <div class="button-group">
        <button type="button" class="food-btn" data-guest="${i}" data-food="vegetarian">Vegetarian</button>
        <button type="button" class="food-btn" data-guest="${i}" data-food="non-vegetarian">Non-Vegetarian</button>
      </div>
    `;
    guestDetailsContainer.appendChild(div);
  }
  guestDetailsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('food-btn')) {
      const num = e.target.dataset.guest;
      const food = e.target.dataset.food;
      guestDetailsContainer.querySelectorAll(`.food-btn[data-guest="${num}"]`)
        .forEach(btn => btn.classList.remove('selected-veg', 'selected-nonveg'));
      e.target.classList.add(food === 'vegetarian' ? 'selected-veg' : 'selected-nonveg');
      guestFoodPreferences[num] = food;
    }
  });
}

function handleGuestSubmission(event) {
  event.preventDefault();
  const count = parseInt(guestCountSelect.value, 10);
  if (!count) return alert('Select number of guests.');
  interimData.guestCount = count;
  interimData.guests = [];
  for (let i = 1; i <= count; i++) {
    const name = rsvpForm[`guestName${i}`].value.trim();
    const food = guestFoodPreferences[i];
    if (!name || !food) return alert(`Complete info for guest ${i}.`);
    interimData.guests.push({ name, foodPreference: food });
  }
  transitionToPage(datesPage);
}

async function handleDatesSubmission(event) {
  event.preventDefault();
  // Validate travel & dates
  const arrDate = arrivalDateFieldStep.value;
  const arrTime = arrivalTimeFieldStep.value;
  const arrMethod = arrivalMethodSelect.value;
  const depDate = departureDateFieldStep.value;
  const depTime = departureTimeFieldStep.value;
  const depMethod = departureMethodSelect.value;
  if (!arrDate || !arrTime || !arrMethod || !depDate || !depTime || !depMethod) {
    return alert('Please complete all travel fields.');
  }
  if (new Date(`${depDate}T${depTime}`) <= new Date(`${arrDate}T${arrTime}`)) {
    return alert('Departure must be after arrival.');
  }

  // Store in interimData
  interimData.arrivalDate           = arrDate;
  interimData.arrivalTime           = arrTime;
  interimData.arrivalTravelMethod   = arrMethod;
  interimData.departureDate         = depDate;
  interimData.departureTime         = depTime;
  interimData.departureTravelMethod = depMethod;
  interimData.additionalNotes       = additionalNotesFieldStep.value.trim();

  // Build FormData
  const formData = new FormData();
  formData.append('guest_count', interimData.guestCount);
  interimData.guests.forEach((g, idx) => {
    formData.append(`guest_name_${idx+1}`, g.name);
    formData.append(`food_preference_${idx+1}`, g.foodPreference);
  });
  formData.append('arrival_date', interimData.arrivalDate);
  formData.append('arrival_time', interimData.arrivalTime);
  formData.append('arrival_travel_method', interimData.arrivalTravelMethod);
  formData.append('departure_date', interimData.departureDate);
  formData.append('departure_time', interimData.departureTime);
  formData.append('departure_travel_method', interimData.departureTravelMethod);
  formData.append('additional_notes', interimData.additionalNotes || '');

  // Transition and send
  transitionToPage(successPage);
  try {
    await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData });
  } catch (_) { /* ignore */ }
}

function resetAndShowForm() {
  interimData = {
    guestCount: 0, guests: [],
    arrivalDate: '', arrivalTime: '', arrivalTravelMethod: '',
    departureDate: '', departureTime: '', departureTravelMethod: '',
    additionalNotes: ''
  };
  rsvpForm.reset();
  datesForm.reset();
  guestDetailsContainer.innerHTML = '';
  guestFoodPreferences = {};
  transitionToPage(homepage);
}
