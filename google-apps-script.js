/**
 * Google Apps Script for Wedding RSVP Backend
 * This script receives RSVP form submissions and stores them in Google Sheets
 *
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Rename the first sheet to "RSVPs"
 * 3. Add headers in row 1: Timestamp, Submission ID, Guest Names, Food Preferences, Arrival Date, Arrival Time, Arrival Travel Method, Departure Date, Departure Time, Departure Travel Method, Additional Notes, Number of Guests
 * 4. Open Google Apps Script (script.google.com)
 * 5. Create a new project and paste this code
 * 6. Replace SPREADSHEET_ID with your Google Sheet ID
 * 7. Deploy as web app with execute permissions for "Anyone"
 * 8. Copy the web app URL and use it in your JavaScript file
 */

// Configuration - Replace with your Google Sheet ID
const SPREADSHEET_ID = '16v8sL3W90X1mDgaWjJ_AzrJ4Z5hYL6O6Wieyi080OcQ';
const SHEET_NAME      = 'RSVPs';

/**
 * Handle incoming POST requests from the wedding RSVP form
 */
function doPost(e) {
  try {
    // Parse the form data from the request
    const data = parseFormData(e.parameter);

    // Validate the incoming data
    const validationResult = validateSubmission(data);
    if (!validationResult.isValid) {
      return createResponse(false, validationResult.error);
    }

    // Add the RSVP to the spreadsheet
    const result = addRsvpToSheet(data);
    if (result.success) {
      return createResponse(true, 'RSVP submitted successfully', result.rowNumber);
    } else {
      return createResponse(false, result.error);
    }

  } catch (error) {
    console.error('Error processing RSVP submission:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handle preflight OPTIONS requests for CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Handle GET requests (for testing purposes)
 */
function doGet(e) {
  return createResponse(true, 'Wedding RSVP API is running');
}

/**
 * Parse form data from the request parameters
 */
function parseFormData(params) {
  const data = {
    guestCount           : parseInt(params.guest_count, 10) || 0,
    guests               : [],
    arrivalDate          : params.arrival_date || '',
    arrivalTime          : params.arrival_time || '',
    arrivalTravelMethod  : params.arrival_travel_method || '',
    departureDate        : params.departure_date || '',
    departureTime        : params.departure_time || '',
    departureTravelMethod: params.departure_travel_method || '',
    additionalNotes      : params.additional_notes || ''
  };

  // Parse guest data
  for (let i = 1; i <= data.guestCount; i++) {
    const name           = params[`guest_name_${i}`];
    const foodPreference = params[`food_preference_${i}`];

    if (name && foodPreference) {
      data.guests.push({
        name           : name.trim(),
        foodPreference : foodPreference
      });
    }
  }

  return data;
}

/**
 * Validate the RSVP submission data
 */
function validateSubmission(data) {
  if (!data.guestCount || data.guestCount < 1) {
    return { isValid: false, error: 'At least one guest is required' };
  }
  if (data.guests.length !== data.guestCount) {
    return { isValid: false, error: 'Missing guest information' };
  }
  // Validate each guest
  for (let guest of data.guests) {
    if (!guest.name || guest.name.length < 2) {
      return { isValid: false, error: 'All guest names must be at least 2 characters long' };
    }
    if (guest.name.length > 100) {
      return { isValid: false, error: 'Guest names must be less than 100 characters' };
    }
    if (guest.foodPreference !== 'vegetarian' && guest.foodPreference !== 'non-vegetarian') {
      return { isValid: false, error: 'Valid food preference is required for all guests' };
    }
  }
  // Validate all travel and time fields
  if (
    !data.arrivalDate || !data.arrivalTime || !data.arrivalTravelMethod ||
    !data.departureDate || !data.departureTime || !data.departureTravelMethod
  ) {
    return { isValid: false, error: 'All travel and timing fields are required' };
  }
  const arrivalDT = new Date(data.arrivalDate + "T" + data.arrivalTime);
  const departureDT = new Date(data.departureDate + "T" + data.departureTime);
  if (isNaN(arrivalDT.getTime()) || isNaN(departureDT.getTime())) {
    return { isValid: false, error: 'Invalid arrival/departure date or time format' };
  }
  if (departureDT <= arrivalDT) {
    return { isValid: false, error: 'Departure must be after arrival' };
  }
  return { isValid: true };
}

/**
 * Add the RSVP data to the Google Sheet
 */
function addRsvpToSheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      const headers = [
        'Timestamp',
        'Submission ID',
        'Guest Names',
        'Food Preferences',
        'Arrival Date',
        'Arrival Time',
        'Arrival Travel Method',
        'Departure Date',
        'Departure Time',
        'Departure Travel Method',
        'Additional Notes',
        'Number of Guests'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#f0f0f0');
    }

    // Prepare row data
    const timestamp    = new Date();
    const submissionId = generateSubmissionId();
    const guestNames   = data.guests.map(g => g.name).join(', ');
    const foodPrefs    = data.guests.map(g => `${g.name}: ${g.foodPreference}`).join(', ');
    const rowData = [
      timestamp,
      submissionId,
      guestNames,
      foodPrefs,
      data.arrivalDate,
      data.arrivalTime,
      data.arrivalTravelMethod,
      data.departureDate,
      data.departureTime,
      data.departureTravelMethod,
      data.additionalNotes || 'None',
      data.guestCount
    ];

    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    sheet.autoResizeColumns(1, rowData.length);

    return { success: true, rowNumber: newRow, submissionId: submissionId };
  } catch (error) {
    console.error('Error adding RSVP to sheet:', error);
    return { success: false, error: 'Failed to save RSVP: ' + error.message };
  }
}

/**
 * Create a standardized JSON response with CORS headers
 */
function createResponse(success, message, data = null) {
  const response = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) response.data = data;
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Generate a unique submission ID
 */
function generateSubmissionId() {
  return 'rsvp_' + Utilities.getUuid().substring(0, 8);
}

/**
 * Utility function to get RSVP statistics (can be called manually)
 */
function getRsvpStatistics() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return { error: 'RSVP sheet not found' };
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
    let totalGuests = 0, vegetarian = 0, nonVegetarian = 0;
    data.forEach(row => {
      const count = row[11] || 1;
      totalGuests += count;
      const prefs = row[3] || '';
      vegetarian   += (prefs.match(/vegetarian/g) || []).length;
      nonVegetarian += (prefs.match(/non-vegetarian/g) || []).length;
    });
    return { totalRsvps: data.length, totalGuests, vegetarian, nonVegetarian };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return { error: error.message };
  }
}
