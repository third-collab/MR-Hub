/**
 * Helper to deep-diff two JSON arrays and return human-readable field-level changes.
 * This correctly tracks exact edits to Phone, Email, Name, Address, etc., 
 * and handles drag/drop reorders silently.
 */
function diffJson(oldJson, newJson, headerName, type) {
  var oldArr = [];
  var newArr = [];
  try { oldArr = JSON.parse(oldJson || "[]"); } catch(e){}
  try { newArr = JSON.parse(newJson || "[]"); } catch(e){}
  
  var changes = [];

  var fieldLabels = {
    firstName: "First Name", lastName: "Last Name", email: "Email", phone: "Phone", 
    position: "Position", birthday: "Birthday", address: "Address",
    contactName: "Contact Name", street: "Street", city: "City", state: "State", 
    countryCode: "Country Code", remarks: "Remarks", content: "Content"
  };

  // Helper to establish the identifying "name" for the audit log subject
  function getItemName(item) {
    if (type === 'contacts') return [item.firstName, item.lastName].filter(Boolean).join(" ") || "Contact";
    if (type === 'addresses') return item.contactName || "Address";
    if (type === 'opnotes') return item.content ? (item.content.substring(0, 30) + "...") : "Note";
    return "Item";
  }

  // Deep comparison ignoring metadata keys (editor, timestamp)
  function isExactMatch(o, n) {
    var allKeys = [];
    Object.keys(o).concat(Object.keys(n)).forEach(function(k) {
      if (k !== 'editor' && k !== 'timestamp' && allKeys.indexOf(k) === -1) allKeys.push(k);
    });
    for (var i = 0; i < allKeys.length; i++) {
      var oVal = String(o[allKeys[i]] || "").trim();
      var nVal = String(n[allKeys[i]] || "").trim();
      if (oVal !== nVal) return false;
    }
    return true;
  }

  var unmatchedOld = [];
  var unmatchedNew = [...newArr];

  // 1. Find exact matches first (This allows drag/drop reorders to be silently ignored)
  for (var i = 0; i < oldArr.length; i++) {
    var o = oldArr[i];
    var matchIdx = -1;
    for (var j = 0; j < unmatchedNew.length; j++) {
      if (isExactMatch(o, unmatchedNew[j])) {
        matchIdx = j;
        break;
      }
    }
    if (matchIdx > -1) {
      unmatchedNew.splice(matchIdx, 1); // remove identical matched item
    } else {
      unmatchedOld.push(o);
    }
  }

  // 2. Process remaining unmatched items (Tracks in-place edits and additions/removals)
  var maxLen = Math.max(unmatchedOld.length, unmatchedNew.length);
  for (var i = 0; i < maxLen; i++) {
    var o = unmatchedOld[i];
    var n = unmatchedNew[i];
    
    // Operational Notes Logic
    if (type === 'opnotes') {
      if (o && !n) changes.push({ field: headerName, old: o.content, new: "Removed" });
      else if (!o && n) changes.push({ field: headerName, old: "", new: "Added: " + n.content });
      else if (o && n && o.content !== n.content) {
         changes.push({ field: headerName + " (Content)", old: o.content, new: n.content });
      }
      continue;
    }

    // Dynamic Context Name (e.g., "Shipping Addresses - Paul Luz")
    var name = n ? getItemName(n) : getItemName(o);
    var itemContext = headerName + " - " + name;

    if (o && !n) {
      // Entire block was deleted
      changes.push({ field: itemContext, old: "Present", new: "Removed" });
    } else if (!o && n) {
      // Completely new block was added
      changes.push({ field: itemContext, old: "None", new: "Added" });
    } else if (o && n) {
      // Existing block was edited. Diff properties cleanly.
      var uProps = [];
      Object.keys(o).concat(Object.keys(n)).forEach(function(p) {
        if(uProps.indexOf(p) === -1) uProps.push(p);
      });
      
      uProps.forEach(function(prop) {
        if (prop === 'editor' || prop === 'timestamp') return; // Skip metadata
        var oVal = String(o[prop] || "").trim();
        var nVal = String(n[prop] || "").trim();
        
        if (oVal !== nVal) {
          var label = fieldLabels[prop] || prop;
          changes.push({ 
            field: itemContext + " (" + label + ")", 
            old: oVal, 
            new: nVal 
          });
        }
      });
    }
  }
  return changes;
}

/**
 * Fetches the summarized list of clients for the main table view.
 * Standardizes data for the frontend to include identifying indexes and Account Manager details.
 * @return {Array<Object>} List of client objects with essential display fields.
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
        status: row[34], 
        acctMgr: row[35] 
      });
    }
    return clients;
  } catch(e) { 
    return [];
  }
}

/**
 * Fetches all details for a specific client by their spreadsheet row index.
 * Sanitizes raw Date objects to ISO strings to prevent data transport errors.
 * @param {number} rowIndex The row index in the spreadsheet.
 * @return {Object} Detailed client record or error object.
 */
function getClientById(rowIndex) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    if (!sheet) return { error: "Sheet 'Clients' not found." };
    
    var data = sheet.getDataRange().getValues();
    var idx = parseInt(rowIndex, 10);
    if (isNaN(idx)) return { error: "Row index is invalid or undefined: " + rowIndex };
    
    var row = data[idx];
    if (!row) return { error: "Row " + idx + " is completely empty in the spreadsheet." };

    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

    function safeVal(val) {
      if (val instanceof Date) return Utilities.formatDate(val, tz, "yyyy-MM-dd");
      return val === undefined ? "" : val;
    }
    
    return {
      rowIndex: idx,
      companyName: safeVal(row[1]), 
      brandName: safeVal(row[2]), 
      address: safeVal(row[3]), 
      website: safeVal(row[4]), 
      anniversary: safeVal(row[5]),
      pFirstName: safeVal(row[6]), 
      pLastName: safeVal(row[7]), 
      pEmail: safeVal(row[8]), 
      pPhone: safeVal(row[9]), 
      pAddress: safeVal(row[10]), 
      pBirthday: safeVal(row[11]), 
      pPosition: safeVal(row[12]), 
      addContacts: safeVal(row[13]), 
      shipAddress: safeVal(row[14]), 
      retAddress: safeVal(row[15]), 
      brandReg: safeVal(row[16]), 
      services: safeVal(row[17]), 
      monthlyVal: safeVal(row[18]),
      origStartDate: safeVal(row[19]),
      currentStartDate: safeVal(row[20]),
      termCount: safeVal(row[21]),
      termUnit: safeVal(row[22]),
      origExpDate: safeVal(row[23]),
      currentExpDate: safeVal(row[24]),
      origEndDate: safeVal(row[25]),
      latestEndDate: safeVal(row[26]),
      commRate: safeVal(row[27]),
      commBasis: safeVal(row[28]),
      ppcDate: safeVal(row[29]),
      dspDate: safeVal(row[30]),
      handoverNotes: safeVal(row[31]),    
      operationalNotes: safeVal(row[32]), 
      brandCode: safeVal(row[33]),
      status: safeVal(row[34]) || "Active",
      acctMgr: safeVal(row[35]),
      brandFolder: safeVal(row[36]),
      remarks: safeVal(row[37]),
      history: safeVal(row[38])           
    };
  } catch(e) {
    return { error: "Backend crash: " + e.message };
  }
}

/**
 * Creates a new client record and triggers automated onboarding notifications.
 * @param {Object} clientData The data object collected from the Add Client form.
 * @return {string} Confirmation or error message.
 */
function processNewClient(clientData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var newRow = new Array(39).fill("");

    newRow[0] = new Date(); 
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
    newRow[13] = clientData.addContacts; 
    newRow[16] = clientData.brandReg; 
    newRow[17] = clientData.services;
    newRow[18] = clientData.monthlyVal;
    
    newRow[19] = clientData.startDate; 
    newRow[20] = clientData.startDate; 
    newRow[21] = clientData.termCount; 
    newRow[22] = clientData.termUnit;  
    newRow[23] = clientData.expDate;   
    newRow[24] = clientData.expDate;   
    
    newRow[31] = clientData.handoverNotes; 
    newRow[34] = "Onboarding"; 
    newRow[35] = "Unassigned"; 

    sheet.appendRow(newRow);

    // DIRECT NOTIFICATION CALL (Safeguards removed to guarantee execution)
    var brand = clientData.brandName || clientData.companyName;
    try { 
      logNotification("Clients", "New Client", "A new client (" + brand + ") was added.", "All", ""); 
    } catch(e) {
      console.error("Failed to log notification: " + e.message);
    }

    // DIRECT EMAIL CALL (Safeguards removed to guarantee execution)
    var priContactFull = clientData.pFirstName + " " + clientData.pLastName;
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
        "notes": clientData.handoverNotes || ""
      };

      if (clientData.pEmail) {
        sendTriggerEmail("Client Welcome Email", clientData.pEmail, clientDataMap);
      }
      
      sendTriggerEmail("New Client Announcement", "operations@yourbusiness.com", clientDataMap);
      
    } catch(e) {
      return "Success! Client onboarded, but automated emails failed. Ensure 'Client Welcome Email' template is Active. Error: " + e.message;
    }

    return "Success! Client onboarded successfully.";
  } catch (error) { 
    return "Error: " + error.toString();
  }
}

/**
 * Updates an existing client record and generates an automated history log and smart notifications.
 * @param {Object} clientData The updated client object including the rowIndex.
 * @return {string} Confirmation or error message.
 */
function updateClientRecord(clientData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clients");
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = parseInt(clientData.rowIndex, 10); 
    var oldRow = data[rowIndex]; 
    
    var newRow = [...oldRow]; 
    while(newRow.length < 39) { newRow.push(""); } 

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
    newRow[17] = clientData.services; 
    newRow[18] = clientData.monthlyVal;

    newRow[19] = oldRow[19]; 
    newRow[20] = clientData.currentStartDate; 
    newRow[21] = clientData.termCount;
    newRow[22] = clientData.termUnit;
    newRow[23] = oldRow[23]; 
    newRow[24] = clientData.currentExpDate;   

    var origEndRaw = oldRow[25]; 
    if (!origEndRaw || String(origEndRaw).trim() === "") {
      newRow[25] = clientData.endDate;
      newRow[26] = clientData.endDate;
    } else {
      newRow[25] = oldRow[25]; 
      newRow[26] = clientData.endDate;
    }

    newRow[27] = clientData.commRate;
    newRow[28] = clientData.commBasis;
    newRow[29] = clientData.ppcDate;
    newRow[30] = clientData.dspDate;
    newRow[31] = clientData.handoverNotes;     
    newRow[32] = clientData.operationalNotes;  
    newRow[33] = clientData.brandCode;         
    newRow[34] = clientData.status;            
    newRow[35] = clientData.acctMgr;           
    newRow[36] = clientData.brandFolder;       
    newRow[37] = clientData.remarks;           

    // Notification flags
    var notifyContactUpdated = false;
    var notifyContractUpdated = false;
    var notifyShipAddress = false;
    var notifyRetAddress = false;
    var notifyOpNoteAdded = false;
    var notifyOpNoteUpdated = false;

    // Contract Info fields mapping (excluding 17:Services, 20:Current Start Date)
    var contractIndexes = [16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]; 

    // Map which columns are JSON to trigger the deep field-level diff engine
    var jsonColumnsMap = {
      13: 'contacts',
      14: 'addresses',
      15: 'addresses',
      32: 'opnotes'
    };

    var changes = [];
    for (var i = 1; i <= 37; i++) { 
      var oldValRaw = oldRow[i];
      var newValRaw = newRow[i];
      
      var oldVal = (oldValRaw instanceof Date) ? Utilities.formatDate(oldValRaw, tz, "yyyy-MM-dd") : String(oldValRaw || "").trim();
      var newVal = (newValRaw instanceof Date) ? Utilities.formatDate(newValRaw, tz, "yyyy-MM-dd") : String(newValRaw || "").trim();
      
      if (oldVal !== newVal) {
        var headerName = headers[i] || "Column " + (i+1);
        
        if (jsonColumnsMap[i]) {
          var jChanges = diffJson(oldVal, newVal, headerName, jsonColumnsMap[i]);
          changes = changes.concat(jChanges);
          
          // Set notification flags based on JSON changes
          if (i === 13 && jChanges.length > 0) notifyContactUpdated = true;
          if (i === 14 && jChanges.length > 0) notifyShipAddress = true;
          if (i === 15 && jChanges.length > 0) notifyRetAddress = true;
          if (i === 32 && jChanges.length > 0) {
             jChanges.forEach(function(c) {
                if (c.new && String(c.new).startsWith("Added:")) notifyOpNoteAdded = true;
                else if (c.new !== "Removed") notifyOpNoteUpdated = true;
             });
          }
        } else {
          // Standard text column comparison
          changes.push({ field: headerName, old: oldVal, new: newVal });
          
          if (i >= 6 && i <= 12) notifyContactUpdated = true;
          if (contractIndexes.includes(i)) notifyContractUpdated = true;
        }
      }
    }

    if (changes.length > 0) {
      var historyArray = [];
      try { if (oldRow[38]) historyArray = JSON.parse(oldRow[38]); } catch (e) {} 
      
      historyArray.unshift({ 
        timestamp: new Date().toISOString(), 
        editor: clientData.editor || "Unknown User",
        changes: changes 
      });
      newRow[38] = JSON.stringify(historyArray);
      newRow[0] = new Date(); 
      
      // -- DIRECT DISPATCH SYSTEM NOTIFICATIONS --
      try {
        var brand = clientData.brandName || clientData.companyName;
        
        // 1. Status Checks (Paused, Inactive/Offboarded, Resumed, Rejoined)
        var oldStatus = String(oldRow[34]).trim() || "Active";
        var newStatus = String(newRow[34]).trim();
        if (oldStatus !== newStatus) {
          if (newStatus === "Paused") logNotification("Clients", "Client Paused", brand + " has paused their services.", "All", "");
          else if (newStatus === "Inactive") logNotification("Clients", "Client Offboarded", brand + " is now inactive (offboarded).", "All", "");
          else if (oldStatus === "Inactive" && newStatus !== "Inactive") logNotification("Clients", "Client Rejoins", brand + " has rejoined (" + newStatus + ").", "All", "");
          else if (oldStatus === "Paused" && newStatus !== "Paused") logNotification("Clients", "Client Resumes", brand + " has resumed their services (" + newStatus + ").", "All", "");
        }

        // 2. Services Changed
        if (String(oldRow[17]).trim() !== String(newRow[17]).trim()) logNotification("Clients", "Services Changed", "The services of a client changed (" + brand + ").", "All", "");

        // 3. Account Manager Assigned
        if (String(oldRow[35]).trim() !== String(newRow[35]).trim()) logNotification("Clients", "Account Manager Assigned", "A new account manager was assigned to " + brand + ".", "All", "");

        // 4. Brand Folder Changed
        if (String(oldRow[36]).trim() !== String(newRow[36]).trim()) logNotification("Clients", "Brand Folder Changed", "The brand folder was changed for " + brand + ".", "All", "");

        // 5. Flag-based Aggregated Updates
        if (notifyOpNoteAdded) logNotification("Clients", "New Operational Note", "A new operational note was added for " + brand + ".", "All", "");
        if (notifyOpNoteUpdated) logNotification("Clients", "Operational Note Updated", "An operational note was updated for " + brand + ".", "All", "");
        if (notifyShipAddress) logNotification("Clients", "Shipping Address Updated", "A shipping address was added or updated for " + brand + ".", "All", "");
        if (notifyRetAddress) logNotification("Clients", "Return Address Updated", "A return address was added or updated for " + brand + ".", "All", "");
        if (notifyContactUpdated) logNotification("Clients", "Contact Info Updated", "A client's contact information was updated (" + brand + ").", "All", "");
        if (notifyContractUpdated) logNotification("Clients", "Contract Info Updated", "Contract information was updated for " + brand + ".", "All", "");
        
      } catch(e) { 
        console.error("Failed to process notifications: " + e.message);
      }
    }

    sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
    return "Success! Client updated.";
  } catch(e) {
    return "Error updating database: " + e.message;
  }
}