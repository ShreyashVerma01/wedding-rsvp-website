/**
 * Wedding RSVP Configuration
 * 
 * Edit the values below to customize your wedding RSVP website
 * After editing, follow the README.md instructions to integrate these values
 */

const WEDDING_CONFIG = {
    // Couple Information
    coupleName: "John & Jane",
    
    // Wedding Details
    weddingDate: "June 15, 2025",
    weddingTime: "4:00 PM",
    weddingVenue: "Garden Valley Resort",
    
    // Website Settings
    pageTitle: "Wedding RSVP - Kaustubh & Isha",
    
    // Google Integration (to be filled after Google Apps Script setup)
    googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycbxbm4_QdTd5xlVn6JiMnSgq6yWDqTRA1SgKN7xkBG_Z6LkFYTVnSNhwOnFAPbeOZv37/exec",
    googleSpreadsheetId: "16v8sL3W90X1mDgaWjJ_AzrJ4Z5hYL6O6Wieyi080OcQ",
    
    // Form Text Customization
    formTexts: {
      welcomeMessage: "We'd love to celebrate with you!",
      welcomeSubtext: "Please let us know if you can attend",
      guestNamesLabel: "Guest Names *",
      guestNamesPlaceholder: "Please enter the names of all guests attending (one per line)",
      foodPreferenceLabel: "Food Preference *",
      additionalNotesLabel: "Additional Notes",
      additionalNotesPlaceholder: "Any dietary restrictions, allergies, or special requests?",
      successTitle: "Thank you for your RSVP!",
      successMessage: "We can't wait to celebrate with you on our special day."
    },
    
    // Color Customization (CSS values)
    colors: {
      primary: "#667eea",
      secondary: "#764ba2",
      textPrimary: "#2c3e50",
      textSecondary: "#7f8c8d",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    },
    
    // Email Notification Settings (optional)
    emailNotifications: {
      enabled: false,
      recipientEmail: "your-email@example.com"
    }
  };
  