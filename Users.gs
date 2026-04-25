/**
 * Users Module - Backend
 * Standardized under MR Hub Architecture Blueprint.
 * Handles: Staff profiles, role assignments, and directory management.
 */

/**
 * Processes and saves a new user record in the 'Users' sheet.
 * Standardizes the 16-column structure and logs a system notification.
 * @param {Object} obj - The user data object from the Add User form.
 * @return {string} Success confirmation message.
 */
function processNewUser(obj) {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    
    // Structure: Timestamp, Username, Role, Work Email, First Name, Last Name, 
    // Birthday, Personal Email, Phone, Address, Facebook, Photo, Position, 
    // Emp Type, Date Hired, Status
    sheet.appendRow([
      new Date(), 
      obj.username, 
      obj.role, 
      obj.workEmail, 
      obj.firstName, 
      obj.lastName, 
      obj.birthday, 
      obj.personalEmail, 
      obj.phone, 
      obj.address, 
      obj.facebookUrl, 
      obj.profilePhotoUrl, 
      obj.position, 
      obj.employmentType, 
      obj.dateHired, 
      obj.status 
    ]);

    // Blueprint Integration: Mandatory logNotification call for team awareness
    logNotification("Users", "New User", "New Team Member Joined: " + obj.username, "All", "");
    
    return "Success! User created.";
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * Updates an existing user record in the spreadsheet.
 * Overwrites columns B through P based on the provided rowIndex.
 * @param {Object} obj - Data object including the spreadsheet rowIndex.
 * @return {string} Success confirmation message.
 */
function updateUserRecord(obj) {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    // rowIndex is 1-based from the frontend, but sheet indices are 1-based. 
    // If rowIndex represents the data array index, we adjust for header.
    var row = parseInt(obj.rowIndex);
    
    sheet.getRange(row, 2, 1, 15).setValues([[
      obj.username, 
      obj.role, 
      obj.workEmail, 
      obj.firstName, 
      obj.lastName, 
      obj.birthday, 
      obj.personalEmail, 
      obj.phone, 
      obj.address, 
      obj.facebookUrl, 
      obj.profilePhotoUrl, 
      obj.position, 
      obj.employmentType, 
      obj.dateHired, 
      obj.status
    ]]);
    return "Success! User updated.";
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * Retrieves full details for a specific user.
 * @param {number} rowIndex - The spreadsheet row index.
 * @return {Object} Detailed user data or error object.
 */
function getUserById(rowIndex) {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    var rowData = sheet.getRange(rowIndex, 1, 1, 16).getDisplayValues()[0];
    
    return {
      rowIndex: rowIndex, 
      username: rowData[1], 
      role: rowData[2], 
      workEmail: rowData[3],
      firstName: rowData[4], 
      lastName: rowData[5], 
      birthday: rowData[6], 
      personalEmail: rowData[7], 
      phone: rowData[8], 
      address: rowData[9], 
      facebookUrl: rowData[10], 
      profilePhotoUrl: rowData[11],
      position: rowData[12], 
      employmentType: rowData[13], 
      dateHired: rowData[14], 
      status: rowData[15]
    };
  } catch (e) { 
    return { error: e.message }; 
  }
}

/** * Fetches a summarized list of all users for the management table.
 * @return {Array<Object>} Array of user summaries.
 */
function getUsersList() {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    var data = sheet.getDataRange().getValues();
    // Remove header row
    data.shift(); 
    
    return data.map(function(row, i) {
      return { 
        rowIndex: i + 2, // Header is row 1, so index 0 is row 2
        username: row[1], 
        role: row[2], 
        workEmail: row[3], 
        firstName: row[4], 
        lastName: row[5], 
        position: row[12], 
        status: row[15] 
      };
    });
  } catch (e) {
    return [];
  }
}

/** * Fetches a list of usernames for users whose position is 'Account Manager' and status is 'Active'.
 * Used to populate dropdown menus across the system.
 * @return {Array<string>} List of active Account Manager usernames.
 */
function getAccountManagers() {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var managers = [];
    
    for (var i = 1; i < data.length; i++) {
      var pos = data[i][12] ? data[i][12].toString().trim() : "";
      var stat = data[i][15] ? data[i][15].toString().trim() : "";
      
      if (pos === 'Account Manager' && stat === 'Active') {
        managers.push(data[i][1].toString().trim());
      }
    }
    return managers;
  } catch (e) {
    return [];
  }
}