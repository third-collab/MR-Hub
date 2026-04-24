function getUserRole() {
  var email = Session.getActiveUser().getEmail();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet || !email) return 'Guest'; 

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // Look up user by Work Email (Now Column D / Index 3)
    if (data[i][3] && data[i][3].toString().toLowerCase() === email.toLowerCase()) {
      
      // Check Status (Now Column P / Index 15)
      if (data[i][15] && data[i][15].toString() === 'Inactive') {
        return 'Inactive';
      }
      
      // Return Role (Column C / Index 2)
      return data[i][2].toString(); 
    }
  }
  return 'Guest'; 
}

function getLoggedInUsername() {
  var email = Session.getActiveUser().getEmail();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet || !email) return email; 

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // Check Work Email (Now Column D / Index 3)
    if (data[i][3] && data[i][3].toString().toLowerCase() === email.toLowerCase()) {
      // Return Username (Column B / Index 1)
      return data[i][1].toString() || email; 
    }
  }
  return email; // Fallback just in case
}