/**
 * GLOBAL DATABASE IDs
 * These unique identifiers link the MR Hub application to its respective 
 * Google Sheet databases.
 */
var MAIN_DB_ID = "1MZgzUsoYfJgIBu40k-hJO2JCt2sI_lSFOeH4eeZCu9A"; 
var NOTIF_DB_ID = "1fy7o8odkCrrrv4S0iy67KT3Rsz9OwbCSgPCqoSwKoMw";

/**
 * Helper function to retrieve the main spreadsheet database object.
 * Use this instead of SpreadsheetApp.getActiveSpreadsheet() to ensure 
 * consistent database targeting.
 * * @return {SpreadsheetApp.Spreadsheet} The main database spreadsheet object.
 */
function getMainDb() {
  return SpreadsheetApp.openById(MAIN_DB_ID);
}

/**
 * Helper function to retrieve the notification spreadsheet database object.
 * * @return {SpreadsheetApp.Spreadsheet} The notification database spreadsheet object.
 */
function getNotifDb() {
  return SpreadsheetApp.openById(NOTIF_DB_ID);
}