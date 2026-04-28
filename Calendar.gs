/**
 * [SPARKHUB INTEGRITY HEADER: START]
 * FILE: Calendar.gs
 * VERSION: 1.0 (Core Logic)
 * SYNC STATUS: Synchronized with CalendarData.html
 */

/**
 * Calendar Module - Backend
 * Handles scheduling, event retrieval, and time-based logging.
 */

/**
 * Fetches all scheduled events from the 'Calendar' sheet.
 * Sanitizes dates to ISO strings for frontend compatibility.
 * @return {Array<Object>} List of event objects.
 */
function getCalendarEvents() {
  try {
    var sheet = getMainDb().getSheetByName("Calendar");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

    return data.map(function(row, i) {
      var dateVal = row[2];
      var dateStr = (dateVal instanceof Date) ? Utilities.formatDate(dateVal, tz, "yyyy-MM-dd") : String(dateVal);
      
      return {
        rowIndex: i + 2,
        timestamp: row[0],
        eventName: row[1],
        date: dateStr,
        startTime: row[3],
        endTime: row[4],
        description: row[5],
        assignedTo: row[6]
      };
    });
  } catch (e) {
    console.error("Calendar fetch error: " + e.message);
    return [];
  }
}

/**
 * Saves a new event to the database.
 * @param {Object} data - Event data from the UI.
 * @return {string} Confirmation message.
 */
function processNewEvent(data) {
  try {
    var sheet = getMainDb().getSheetByName("Calendar");
    sheet.appendRow([
      new Date(),
      data.eventName,
      data.date,
      data.startTime,
      data.endTime,
      data.description,
      data.assignedTo
    ]);
    
    logNotification("Calendar", "New Event", "Event Scheduled: " + data.eventName + " on " + data.date, data.assignedTo, "");
    return "Success! Event scheduled.";
  } catch (e) {
    return "Error: " + e.message;
  }
}

/**
 * [SPARKHUB INTEGRITY ANCHOR: END]
 */