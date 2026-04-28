/**
 * [SPARKHUB INTEGRITY HEADER: START]
 * FILE: Notifications.gs
 * VERSION: 1.1 (Standardized Database Handles + Registry Sync)
 * SYNC STATUS: Fully Synchronized with NotificationsData.html & Config.gs
 */

/**
 * Notifications Module - Backend
 * Standardized under SparkHub Architecture Blueprint.
 * * CORE RESPONSIBILITIES:
 * - Centralized logging for system events.
 * - Targeted notification retrieval for logged-in users.
 * - Real-time status tracking (Read/Unread).
 */

/**
 * Global entry point for recording system events.
 * Standardized handle: getNotifDb()
 * * @param {string} module - The source module (e.g., "Clients").
 * @param {string} event - The event category (e.g., "New Client").
 * @param {string} message - The human-readable notification text.
 * @param {string} recipient - The target username or "All".
 * @param {string} category - Specific filter category (e.g., "User Birthday").
 */
function logNotification(module, event, message, recipient, category) {
  try {
    var ss = getNotifDb();
    var sheet = ss.getSheetByName("Notifications");
    if (!sheet) return;

    sheet.appendRow([
      new Date(),
      module,
      event,
      message,
      recipient || "All",
      false, // IsRead (Boolean)
      category || event // Category fallback
    ]);
  } catch (e) {
    console.error("Critical: logNotification failed: " + e.message);
  }
}

/**
 * Fetches notifications for the current user.
 * Sanitizes dates for the frontend IntersectionObserver.
 * * @param {number} limit - Number of records to return.
 * @param {boolean} unreadOnly - Filter for unread items only.
 * @return {Array<Object>} List of notifications.
 */
function getMyNotifications(limit, unreadOnly) {
  try {
    var ss = getNotifDb();
    var sheet = ss.getSheetByName("Notifications");
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var username = getLoggedInUsername();
    var tz = ss.getSpreadsheetTimeZone();

    var results = data.map(function(row, index) {
      return {
        row: index + 2,
        timestamp: row[0],
        time: (row[0] instanceof Date) ? Utilities.formatDate(row[0], tz, "MMM dd, yyyy HH:mm") : String(row[0]),
        module: row[1],
        event: row[2],
        message: row[3],
        recipient: row[4],
        isRead: row[5] === true || row[5] === "TRUE",
        category: row[6] || row[2]
      };
    }).filter(function(n) {
      var isMe = (n.recipient === "All" || n.recipient === username);
      if (unreadOnly) return isMe && !n.isRead;
      return isMe;
    });

    // Return most recent first
    results.reverse();
    return results.slice(0, limit || 100);
  } catch (e) {
    console.error("getMyNotifications error: " + e.message);
    return [];
  }
}

/**
 * Updates the read status of a specific notification row.
 * @param {number} rowIndex - The row in the Notifications sheet.
 */
function markNotificationAsRead(rowIndex) {
  try {
    var sheet = getNotifDb().getSheetByName("Notifications");
    var idx = parseInt(rowIndex, 10);
    if (isNaN(idx)) return;
    
    // Column F (Index 6) is the IsRead boolean
    sheet.getRange(idx, 6).setValue(true);
  } catch (e) {
    console.error("markNotificationAsRead error: " + e.message);
  }
}

/**
 * Batch updates all unread notifications for the current user to 'Read'.
 */
function markAllMyNotificationsAsRead() {
  try {
    var ss = getNotifDb();
    var sheet = ss.getSheetByName("Notifications");
    var data = sheet.getDataRange().getValues();
    var username = getLoggedInUsername();

    for (var i = 1; i < data.length; i++) {
      var recipient = data[i][4];
      var isRead = data[i][5];
      if ((recipient === "All" || recipient === username) && (isRead === false || isRead === "FALSE")) {
        sheet.getRange(i + 1, 6).setValue(true);
      }
    }
    return "Success";
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * [SPARKHUB INTEGRITY ANCHOR: END]
 */