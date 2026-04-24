function logNotification(module, category, message, shownTo, hiddenFrom) {
  var sheet = getNotifDb().getSheetByName("Notifications");
  var timestamp = new Date();
  
  // Appends the new 7-column structure
  sheet.appendRow([timestamp, module, category, message, shownTo, hiddenFrom, ""]);
}

function getMyNotifications(limit, isPopup) {
  var maxLimit = limit || 10; 
  var username = getLoggedInUsername(); 
  var sheet = getNotifDb().getSheetByName("Notifications");
  
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return []; 
  
  var myNotifs = [];
  
  // Calculate the date 14 days ago
  var twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  for (var i = data.length - 1; i >= 1; i--) {
    var rowIndex = i + 1; 
    var timeString = data[i][0];
    var timestamp = new Date(timeString);

    // ONLY apply the 14-day rule if this request came from the Popup
    if (isPopup && timestamp && timestamp < twoWeeksAgo) continue;

    var module = data[i][1];
    var category = data[i][2];     
    var message = data[i][3];      
    var shownTo = data[i][4];      
    var hiddenFrom = data[i][5];   
    var readBy = data[i][6] || ""; 

    var isShown = (shownTo === "All" || shownTo === username);
    var isHidden = (hiddenFrom === "All" || hiddenFrom === username);

    if (isShown && !isHidden) {
      var hasRead = readBy.split(',').map(function(s) { return s.trim(); }).includes(username);
      
      myNotifs.push({
        row: rowIndex,
        time: timeString, 
        module: module,
        category: category, 
        message: message,
        isRead: hasRead
      });
    }

    if (myNotifs.length >= maxLimit) break; 
  }

  return myNotifs;
}

function markNotificationAsRead(rowIndex) {
  var username = getLoggedInUsername();
  var sheet = getNotifDb().getSheetByName("Notifications");
  
  // Shifted to Column 7 (G)
  var readCell = sheet.getRange(rowIndex, 7); 
  var currentRead = readCell.getValue().toString();
  
  if (!currentRead.includes(username)) {
    var newRead = currentRead === "" ? username : currentRead + ", " + username;
    readCell.setValue(newRead);
  }
}