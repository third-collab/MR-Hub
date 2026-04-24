// GLOBAL DATABASE IDs
var MAIN_DB_ID = "1MZgzUsoYfJgIBu40k-hJO2JCt2sI_lSFOeH4eeZCu9A"; 
var NOTIF_DB_ID = "1fy7o8odkCrrrv4S0iy67KT3Rsz9OwbCSgPCqoSwKoMw";

/**
 * HELPER FUNCTIONS
 * Use these instead of getActiveSpreadsheet() across your entire app.
 */
function getMainDb() {
  return SpreadsheetApp.openById(MAIN_DB_ID);
}

function getNotifDb() {
  return SpreadsheetApp.openById(NOTIF_DB_ID);
}