/**
 * Notifications Module - Backend
 * Standardized under MR Hub Architecture Blueprint.
 * Handles: Logging notifications, user-specific retrieval, and "read" status updates.
 */

/**
 * Records a new system notification in the dedicated Notifications database.
 * Uses the 7-column structure: Timestamp, Module, Category, Message, ShownTo, HiddenFrom, ReadBy.
 * * @param {string} module - The source module (e.g., "Users", "Clients").
 * @param {string} category - The event category (e.g., "New User", "Anniversary").
 * @param {string} message - The text content of the notification.
 * @param {string} shownTo - Username or "All" for visibility.
 * @param {string} hiddenFrom - Username or "All" for exclusion.
 */
function logNotification(module, category, message, shownTo, hiddenFrom) {
  var sheet = getNotifDb().getSheetByName("Notifications"); 
  var timestamp = new Date();
  
  // Appends row to the external Notifications spreadsheet
  sheet.appendRow([
    timestamp, 
    module, 
    category, 
    message, 
    shownTo, 
    hiddenFrom, 
    "" // ReadBy column starts empty
  ]); 
}

/**
 * Retrieves notifications relevant to the current user.
 * Applies logic to filter by 'ShownTo' and 'HiddenFrom' permissions.
 * * @param {number} limit - Maximum number of records to return.
 * @param {boolean} isPopup - If true, restricts results to the last 14 days (header alerts).
 * @return {Array<Object>} Array of processed notification objects for the frontend.
 */
function getMyNotifications(limit, isPopup) {
  var maxLimit = limit || 10; 
  var username = getLoggedInUsername(); 
  var sheet = getNotifDb().getSheetByName("Notifications"); 
  var data = sheet.getDataRange().getDisplayValues(); 
  
  if (data.length <= 1) return []; 
  
  var myNotifs = [];
  var twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); 

  // Process rows in reverse order (newest first)
  for (var i = data.length - 1; i >= 1; i--) {
    var rowIndex = i + 1;
    var timeString = data[i][0];
    var timestamp = new Date(timeString);

    // Recency check for the header popup to keep it performant
    if (isPopup && timestamp && timestamp < twoWeeksAgo) continue;

    var module = data[i][1];
    var category = data[i][2];     
    var message = data[i][3];      
    var shownTo = data[i][4];      
    var hiddenFrom = data[i][5];
    var readBy = data[i][6] || ""; 

    // Visibility Logic
    var isShown = (shownTo === "All" || shownTo === username); 
    var isHidden = (hiddenFrom === "All" || hiddenFrom === username); 

    if (isShown && !isHidden) {
      // Check if user has already read this via comma-separated string match
      var readArray = readBy.split(',').map(function(s) { return s.trim(); });
      var hasRead = readArray.includes(username);
      
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

/**
 * Marks a notification as read by appending the current username to the 'ReadBy' column.
 * Ensures the username is only added once to the comma-separated list.
 * * @param {number} rowIndex - The spreadsheet row index of the target notification.
 */
function markNotificationAsRead(rowIndex) {
  var username = getLoggedInUsername(); 
  var sheet = getNotifDb().getSheetByName("Notifications"); 
  var readCell = sheet.getRange(rowIndex, 7); // Column G
  var currentRead = readCell.getValue().toString();

  if (!currentRead.includes(username)) {
    var newRead = currentRead === "" ? username : currentRead + ", " + username; 
    readCell.setValue(newRead);
  }
}