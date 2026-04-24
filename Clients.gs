function getClientsList() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var data = sheet.getDataRange().getValues();
    var clients = [];
    
    // Start at 1 to skip headers
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
        acctMgr: row[30] // <--- THIS WAS THE MISSING PIECE
      });
    }
    return clients;
  } catch(e) { 
    return [];
  }
}

function getClientById(rowIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    if (!sheet) return { error: "Sheet 'Clients' not found." };
    
    var data = sheet.getDataRange().getValues();
    var idx = parseInt(rowIndex, 10);
    if (isNaN(idx)) return { error: "Row index is invalid or undefined: " + rowIndex };
    
    var row = data[idx];
    if (!row) return { error: "Row " + idx + " is completely empty in the spreadsheet." };

    // CRITICAL FIX: Formats raw Dates to strings so Google Apps Script doesn't crash and return 'null'
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

function processNewClient(clientData) {
  try {
    // 1. Save Data to Database
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");

    // Create an empty array for all 34 columns
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
    
    newRow[27] = clientData.salesNotes; // Quill HTML
    newRow[29] = "Onboarding";
    newRow[30] = "Unassigned";

    sheet.appendRow(newRow);

    var priContactFull = clientData.pFirstName + " " + clientData.pLastName;

    // 2. Trigger Email Automations (Using the updated JSON keys)
    try {
      var clientDataMap = {
        "companyName": clientData.companyName || "",
        "brandName": clientData.brandName || "",
        "priFirstName": clientData.pFirstName || "",
        "priContactFull": priContactFull || "",
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
    } catch(e) {
      return "Success! Client onboarded, but automated emails failed: " + e.message;
    }

    return "Success! Client onboarded successfully.";
  } catch (error) { 
    return "Error: " + error.toString();
  }
}

const COL_MAP = {
  timestamp: 0, companyName: 1, brandName: 2, address: 3, website: 4, anniversary: 5,
  pFirstName: 6, pLastName: 7, pEmail: 8, pPhone: 9, pAddress: 10, pBirthday: 11, pPosition: 12,
  addContacts: 13, shipAddress: 14, retAddress: 15, brandReg: 16, services: 17, monthlyVal: 18,
  startDate: 19, termCount: 20, termUnit: 21, expDate: 22, commRate: 23, commBasis: 24,
  ppcDate: 25, dspDate: 26, salesNotes: 27, brandCode: 28, status: 29, acctMgr: 30, brandFolder: 31,
  remarks: 32, history: 33
};

function updateClientRecord(clientData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = parseInt(clientData.rowIndex, 10); 
    var oldRow = data[rowIndex]; 
    
    var newRow = [...oldRow]; // Clone existing
    
    // Map all fields correctly from the frontend JSON
    newRow[1] = clientData.companyName;
    newRow[2] = clientData.brandName;
    newRow[3] = clientData.address;
    newRow[4] = clientData.website;
    newRow[5] = clientData.anniversary;
    
    newRow[6] = clientData.pFirstName;
    newRow[7] = clientData.pLastName;
    newRow[8] = clientData.pEmail;
    newRow[9] = clientData.pPhone;
    newRow[10] = clientData.pAddress;
    newRow[11] = clientData.pBirthday;
    newRow[12] = clientData.pPosition;
    
    newRow[13] = clientData.addContacts;
    newRow[14] = clientData.shipAddress;
    newRow[15] = clientData.retAddress;
    
    newRow[16] = clientData.brandReg;
    newRow[18] = clientData.monthlyVal;
    newRow[19] = clientData.startDate;
    newRow[20] = clientData.termCount;
    newRow[21] = clientData.termUnit;
    newRow[22] = clientData.expDate;
    newRow[23] = clientData.commRate;
    newRow[24] = clientData.commBasis;
    newRow[25] = clientData.ppcDate;
    newRow[26] = clientData.dspDate;

    newRow[27] = clientData.salesNotes;
    newRow[28] = clientData.brandCode;
    newRow[29] = clientData.status;
    newRow[30] = clientData.acctMgr;
    newRow[31] = clientData.brandFolder;
    newRow[32] = clientData.remarks;

    // === AUTO-HISTORY GENERATOR ===
    var changes = [];

    for (var i = 1; i <= 32; i++) { // Check cols 1 through 32 for changes
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
      newRow[0] = new Date(); // Update modified timestamp
    }

    sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
    return "Success! Client updated.";
  } catch(e) {
    return "Error updating database: " + e.message;
  }
}