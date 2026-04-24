/** * Database Spreadsheet IDs 
 */
var MAIN_DB_ID = "1MZgzUsoYfJgIBu40k-hJO2JCt2sI_lSFOeH4eeZCu9A"; 
var NOTIF_DB_ID = "1fy7o8odkCrrrv4S0iy67KT3Rsz9OwbCSgPCqoSwKoMw";

/**
 * Retrieves the spreadsheet object for the main database.
 * Use this instead of SpreadsheetApp.getActiveSpreadsheet().
 * @return {SpreadsheetApp.Spreadsheet}
 */
function getMainDb() {
  return SpreadsheetApp.openById(MAIN_DB_ID);
}

/**
 * Retrieves the spreadsheet object for the notifications database.
 * @return {SpreadsheetApp.Spreadsheet}
 */
function getNotifDb() {
  return SpreadsheetApp.openById(NOTIF_DB_ID);
}