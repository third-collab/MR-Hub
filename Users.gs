function processNewUser(obj) {
  var sheet = getMainDb().getSheetByName("Users");
  sheet.appendRow([
    new Date(), // A
    obj.username, obj.role, obj.workEmail, // B, C, D
    obj.firstName, obj.lastName, obj.birthday, obj.personalEmail, obj.phone, obj.address, obj.facebookUrl, obj.profilePhotoUrl, // E-L
    obj.position, obj.employmentType, obj.dateHired, obj.status // M, N, O, P
  ]);
  // Trigger the notification!
  logNotification("Users", "New User", "New Team Member Joined: " + obj.username, "All", "");
  return "Success! User created.";
}

function updateUserRecord(obj) {
  var sheet = getMainDb().getSheetByName("Users");
  // Update B through P (Columns 2-16)
  sheet.getRange(obj.rowIndex, 2, 1, 15).setValues([[
    obj.username, obj.role, obj.workEmail,
    obj.firstName, obj.lastName, obj.birthday, obj.personalEmail, obj.phone, obj.address, obj.facebookUrl, obj.profilePhotoUrl,
    obj.position, obj.employmentType, obj.dateHired, obj.status
  ]]);
  return "Success! User updated.";
}

function getUserById(rowIndex) {
  try {
    var sheet = getMainDb().getSheetByName("Users");
    // MAGIC FIX: getDisplayValues() forces everything into a safe String format
    var row = sheet.getRange(rowIndex, 1, 1, 16).getDisplayValues()[0];
    
    return {
      rowIndex: rowIndex,
      timestamp: row[0],
      username: row[1], 
      role: row[2], 
      workEmail: row[3],
      firstName: row[4], 
      lastName: row[5], 
      birthday: row[6], 
      personalEmail: row[7], 
      phone: row[8], 
      address: row[9], 
      facebookUrl: row[10], 
      profilePhotoUrl: row[11],
      position: row[12], 
      employmentType: row[13], 
      dateHired: row[14], 
      status: row[15]
    };
  } catch (e) {
    return { error: e.message };
  }
}

function getUsersList() {
  var sheet = getMainDb().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();
  data.shift(); // Remove headers
  
  return data.map(function(row, i) {
    return {
      rowIndex: i + 2,
      username: row[1],    // Column B
      role: row[2],        // Column C
      workEmail: row[3],   // Column D
      firstName: row[4],   // Column E
      lastName: row[5],    // Column F
      position: row[12],   // Column M
      status: row[15]      // Column P
    };
  });
}

function getAccountManagers() {
  var sheet = getMainDb().getSheetByName("Users");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var managers = [];
  
  for (var i = 1; i < data.length; i++) {
    // Username (Col B / 1), Position (Col M / 12), Status (Col P / 15)
    var username = data[i][1] ? data[i][1].toString().trim() : '';
    var position = data[i][12] ? data[i][12].toString().trim() : '';
    var status = data[i][15] ? data[i][15].toString().trim() : '';
    
    if (position === 'Account Manager' && status === 'Active') {
      if (username) managers.push(username); 
    }
  }
  return managers;
}