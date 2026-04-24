/**
 * Initializes the time-based trigger for daily event scanning.
 * Runs once between 8 AM and 9 AM daily.
 */
function setupDailyTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkDailyEvents") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("checkDailyEvents").timeBased().everyDays(1).atHour(8).create();
}

/**
 * Main engine for scanning User and Client sheets for dates.
 * Blueprint Checkpoint: Triggers logNotification() for system alerts.
 */
function checkDailyEvents() {
  var today = new Date();
  var currentMonth = today.getMonth(); 
  var currentDate = today.getDate();

  checkUserEvents(currentMonth, currentDate);
  checkClientEvents(currentMonth, currentDate);
}

/**
 * Helper to validate Date objects.
 * @param {Date} d - The date to check.
 * @return {boolean}
 */
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}