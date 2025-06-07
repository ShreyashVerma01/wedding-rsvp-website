/**
 * Google Apps Script for Wedding RSVP Backend
 * This script receives RSVP form submissions and stores them in Google Sheets
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Rename the first sheet to "RSVP_Responses"
 * 3. Add headers in row 1: Timestamp, Submission ID, Guest Names, Food Preference, Additional Notes
 * 4. Open Google Apps Script (script.google.com)
 * 5. Create a new project and paste this code
 * 6. Replace SPREADSHEET_ID with your Google Sheet ID
 * 7. Deploy as web app with execute permissions for "Anyone"
 * 8. Copy the web app URL and use it in your JavaScript file
 */

// Configuration - Replace with your Google Sheet ID
const SPREADSHEET_ID = '16v8sL3W90X1mDgaWjJ_AzrJ4Z5hYL6O6Wieyi080OcQ';
const SHEET_NAME = 'RSVPs';

/**
 * Handle incoming POST requests from the wedding RSVP form
 */
function doPost(e) {
  try {
    // Parse the JSON data from the request
    const data = JSON.parse(e.postData.contents);
    
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
 * Handle GET requests (for testing purposes)
 */
function doGet(e) {
  return createResponse(true, 'Wedding RSVP API is running');
}

/**
 * Validate the RSVP submission data
 */
function validateSubmission(data) {
  // Check required fields
  if (!data.guestNames || data.guestNames.trim() === '') {
    return { isValid: false, error: 'Guest names are required' };
  }
  
  if (!data.foodPreference || (data.foodPreference !== 'vegetarian' && data.foodPreference !== 'non-vegetarian')) {
    return { isValid: false, error: 'Valid food preference is required' };
  }
  
  // Validate guest names format
  const nameList = data.guestNames.split('\n').filter(name => name.trim() !== '');
  if (nameList.length === 0) {
    return { isValid: false, error: 'At least one guest name is required' };
  }
  
  // Check for reasonable name lengths
  for (let name of nameList) {
    if (name.trim().length < 2 || name.trim().length > 100) {
      return { isValid: false, error: 'Guest names must be between 2 and 100 characters' };
    }
  }
  
  return { isValid: true };
}

/**
 * Add the RSVP data to the Google Sheet
 */
function addRsvpToSheet(data) {
  try {
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // Add headers
      const headers = ['Timestamp', 'Submission ID', 'Guest Names', 'Food Preference', 'Additional Notes', 'Number of Guests'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format the header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    // Prepare the row data
    const timestamp = new Date();
    const guestNames = data.guestNames.replace(/\n/g, ', '); // Convert newlines to commas for better display
    const numberOfGuests = data.guestNames.split('\n').filter(name => name.trim() !== '').length;
    
    const rowData = [
      timestamp,
      data.submissionId || generateSubmissionId(),
      guestNames,
      data.foodPreference,
      data.additionalNotes || 'None',
      numberOfGuests
    ];
    
    // Add the data to the next available row
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, rowData.length);
    
    // Optional: Send email notification (uncomment if needed)
    // sendEmailNotification(data, newRow);
    
    return { 
      success: true, 
      rowNumber: newRow,
      submissionId: rowData[1]
    };
    
  } catch (error) {
    console.error('Error adding RSVP to sheet:', error);
    return { 
      success: false, 
      error: 'Failed to save RSVP: ' + error.message 
    };
  }
}

/**
 * Create a standardized JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Handle preflight CORS requests
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
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
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { error: 'RSVP sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { 
        totalRsvps: 0,
        totalGuests: 0,
        vegetarian: 0,
        nonVegetarian: 0
      };
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    let totalGuests = 0;
    let vegetarian = 0;
    let nonVegetarian = 0;
    
    data.forEach(row => {
      const numberOfGuests = row[5] || 1; // Column F (Number of Guests)
      const foodPreference = row[3]; // Column D (Food Preference)
      
      totalGuests += numberOfGuests;
      
      if (foodPreference === 'vegetarian') {
        vegetarian += numberOfGuests;
      } else if (foodPreference === 'non-vegetarian') {
        nonVegetarian += numberOfGuests;
      }
    });
    
    return {
      totalRsvps: data.length,
      totalGuests: totalGuests,
      vegetarian: vegetarian,
      nonVegetarian: nonVegetarian
    };
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    return { error: error.message };
  }
}
