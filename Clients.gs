/**
 * Fetches the summarized list of clients for the main table view.
 * Blueprint: Fetches essential columns including Account Manager for display.
 * @return {Array<Object>} List of client objects.
 */
function getClientsList() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var data = sheet.getDataRange().getValues();
    var clients = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[1]) continue; 
      
      clients.push({
        rowIndex: i, 
        companyName: row[1],
        brandName: row[2],
        website: row[4],
        pFirstName: row[6],
        pLastName: row[7],
        pEmail: row[8],
        pPhone: row[9],
        services: row[17], 
        status: row[29],
        acctMgr: row[30] // Optimized: Ensures AM appears in list view
      });
    }
    return clients;
  } catch(e) { 
    return [];
  }
}

/**
 * Fetches a detailed client record by its spreadsheet row index.
 * Blueprint: Sanitizes Date objects for safe frontend transport.
 * @param {number} rowIndex - The index of the row in the sheet.
 * @return {Object} The detailed client data or error object.
 */
function getClientById(rowIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    if (!sheet) return { error: "Sheet 'Clients' not found." };
    
    var data = sheet.getDataRange().getValues();
    var idx = parseInt(rowIndex, 10);
    if (isNaN(idx)) return { error: "Invalid Row index: " + rowIndex };
    
    var row = data[idx];
    if (!row) return { error: "Empty row at index " + idx };

    function safeVal(val) {
      if (val instanceof Date) return val.toISOString();
      return val === undefined ? "" : val;
    }
    
    return {
      rowIndex: idx,
      companyName: safeVal(row[1]), brandName: safeVal(row[2]), address: safeVal(row[3]), website: safeVal(row[4]), anniversary: safeVal(row[5]),
      pFirstName: safeVal(row[6]), pLastName: safeVal(row[7]), pEmail: safeVal(row[8]), pPhone: safeVal(row[9]), pAddress: safeVal(row[10]), 
      pBirthday: safeVal(row[11]), pPosition: safeVal(row[12]), addContacts: safeVal(row[13]), shipAddress: safeVal(row[14]), 
      retAddress: safeVal(row[15]), brandReg: safeVal(row[16]), services: safeVal(row[17]), monthlyVal: safeVal(row[18]),
      startDate: safeVal(row[19]), termCount: safeVal(row[20]), termUnit: safeVal(row[21]), expDate: safeVal(row[22]), 
      commRate: safeVal(row[23]), commBasis: safeVal(row[24]), ppcDate: safeVal(row[25]), dspDate: safeVal(row[26]), 
      salesNotes: safeVal(row[27]), brandCode: safeVal(row[28]), status: safeVal(row[29]) || "Active", acctMgr: safeVal(row[30]), 
      brandFolder: safeVal(row[31]), remarks: safeVal(row[32]), history: safeVal(row[33])
    };
  } catch(e) {
    return { error: "Backend crash: " + e.message };
  }
}

/**
 * Appends a new client record and triggers onboarding automations.
 * Blueprint Checkpoint: Triggers 'Client Welcome Email' and 'New Client Announcement'.
 * @param {Object} clientData - Data from the Add Client form.
 * @return {string} Success or Error message.
 */
function processNewClient(clientData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var newRow = new Array(34).fill("");

    newRow[0] = new Date(); // Timestamp
    newRow[1] = clientData.companyName;
    newRow[2] = clientData.brandName;
    newRow[3] = clientData.address;
    newRow[4] = clientData.website;
    newRow[6] = clientData.pFirstName;
    newRow[7] = clientData.pLastName;
    newRow[8] = clientData.pEmail;
    newRow[9] = clientData.pPhone;
    newRow[10] = clientData.pAddress;
    newRow[11] = clientData.pBirthday;
    newRow[12] = clientData.pPosition;
    newRow[13] = clientData.addContacts; // JSON string
    newRow[17] = clientData.services;
    newRow[18] = clientData.monthlyVal;
    newRow[19] = clientData.startDate;
    newRow[27] = clientData.salesNotes; 
    newRow[29] = "Onboarding";
    newRow[30] = "Unassigned";

    sheet.appendRow(newRow);

    // Automation Checkpoint: Email Triggers
    try {
      var clientDataMap = {
        "companyName": clientData.companyName || "",
        "brandName": clientData.brandName || "",
        "priFirstName": clientData.pFirstName || "",
        "priEmail": clientData.pEmail || "",
        "services": clientData.services || "",
        "monthlyContractValue": clientData.monthlyVal || "",
        "contractStartDate": clientData.startDate || "",
        "notes": clientData.salesNotes || ""
      };
      if (clientData.pEmail && typeof sendTriggerEmail === "function") {
        sendTriggerEmail("Client Welcome Email", clientData.pEmail, clientDataMap);
      }
      if (typeof sendTriggerEmail === "function") {
        sendTriggerEmail("New Client Announcement", "operations@yourbusiness.com", clientDataMap);
      }
    } catch(e) { console.error("Email Triggers failed: " + e.message); }

    return "Success! Client onboarded successfully.";
  } catch (error) { 
    return "Error: " + error.toString();
  }
}

/**
 * Updates an existing client and generates an auto-history log cell.
 * @param {Object} clientData - Updated fields from the Edit Client form.
 * @return {string} Success or Error message.
 */
function updateClientRecord(clientData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = parseInt(clientData.rowIndex, 10); 
    var oldRow = data[rowIndex]; 
    var newRow = [...oldRow]; 
    
    // Map fields [cite: 318-323]
    newRow[1] = clientData.companyName; newRow[2] = clientData.brandName;
    newRow[3] = clientData.address; newRow[4] = clientData.website;
    newRow[5] = clientData.anniversary; newRow[6] = clientData.pFirstName;
    newRow[7] = clientData.pLastName; newRow[8] = clientData.pEmail;
    newRow[9] = clientData.pPhone; newRow[10] = clientData.pAddress;
    newRow[11] = clientData.pBirthday; newRow[12] = clientData.pPosition;
    newRow[13] = clientData.addContacts; newRow[14] = clientData.shipAddress;
    newRow[15] = clientData.retAddress; newRow[16] = clientData.brandReg;
    newRow[18] = clientData.monthlyVal; newRow[19] = clientData.startDate;
    newRow[20] = clientData.termCount; newRow[21] = clientData.termUnit;
    newRow[22] = clientData.expDate; newRow[23] = clientData.commRate;
    newRow[24] = clientData.commBasis; newRow[25] = clientData.ppcDate;
    newRow[26] = clientData.dspDate; newRow[27] = clientData.salesNotes;
    newRow[28] = clientData.brandCode; newRow[29] = clientData.status;
    newRow[30] = clientData.acctMgr; newRow[31] = clientData.brandFolder;
    newRow[32] = clientData.remarks;

    // Blueprint Checkpoint: Auto-History Generator 
    var changes = [];
    for (var i = 1; i <= 32; i++) { 
      var oldVal = String(oldRow[i] || "").trim();
      var newVal = String(newRow[i] || "").trim();
      if (oldVal !== newVal) {
        changes.push({ field: headers[i], old: oldVal, new: newVal });
      }
    }
    if (changes.length > 0) {
      var historyArray = [];
      try { if (oldRow[33]) historyArray = JSON.parse(oldRow[33]); } catch (e) {} 
      historyArray.unshift({ timestamp: new Date().toISOString(), changes: changes });
      newRow[33] = JSON.stringify(historyArray);
      newRow[0] = new Date(); 
    }

    sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
    return "Success! Client updated.";
  } catch(e) {
    return "Error updating database: " + e.message;
  }
}