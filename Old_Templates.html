/**
 * Templates Module - Backend
 * Standardized under MR Hub Architecture Blueprint.
 * Handles: CRUD operations for email and document templates.
 */

/**
 * Fetches all templates to display in the main management list view.
 * Standardizes the data for table rendering in the frontend.
 * @return {Array<Object>} List of summarized template records.
 */
function getTemplatesList() {
  try {
    var sheet = getMainDb().getSheetByName("Templates");
    var data = sheet.getDataRange().getValues();
    var templates = [];
    
    // Start at 1 to skip headers
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Structure: 0:Timestamp, 1:ID, 2:Name, 3:Type, 4:Module, 5:Trigger, 6:Subject, 7:Body, 8:Status, 9:Wrapper
      templates.push({
        rowIndex: i,
        templateId: row[1],
        templateName: row[2],
        type: row[3],
        targetModule: row[4],
        triggerEvent: row[5],
        status: row[8],
        wrapperType: row[9] || "Internal"
      });
    }
    return templates;
  } catch (e) {
    console.error("Error in getTemplatesList: " + e.message);
    return [];
  }
}

/**
 * Fetches a single template record by its spreadsheet row index.
 * Used for populating Edit forms and Read-Only previews.
 * @param {number} rowIndex - The target row index in the sheet.
 * @return {Object|null} Detailed template data or null if not found.
 */
function getTemplateById(rowIndex) {
  try {
    var sheet = getMainDb().getSheetByName("Templates");
    var data = sheet.getDataRange().getValues();
    
    var idx = parseInt(rowIndex, 10);
    if (idx < 1 || idx >= data.length) return null;
    
    var rowData = data[idx];
    return {
      rowIndex: idx,
      templateId: rowData[1],
      templateName: rowData[2],
      type: rowData[3],
      targetModule: rowData[4],
      triggerEvent: rowData[5],
      subject: rowData[6] || "",
      bodyContent: rowData[7] || "",
      status: rowData[8],
      wrapperType: rowData[9] || "Internal"
    };
  } catch (e) {
    console.error("Error in getTemplateById: " + e.message);
    return null;
  }
}

/**
 * Appends a new template record to the spreadsheet.
 * Generates a unique ID based on the current timestamp.
 * @param {Object} obj - The template data object from the Add Form.
 * @return {string} Success message.
 */
function processNewTemplate(obj) {
  try {
    var sheet = getMainDb().getSheetByName("Templates");
    var timestamp = new Date();
    var uniqueId = "TMP-" + timestamp.getTime();
    
    sheet.appendRow([
      timestamp, 
      uniqueId, 
      obj.templateName, 
      obj.type, 
      obj.targetModule, 
      obj.triggerEvent, 
      obj.subject, 
      obj.bodyContent, 
      obj.status, 
      obj.wrapperType
    ]);
    return "Template created successfully with ID: " + uniqueId;
  } catch (e) {
    return "Error creating template: " + e.message;
  }
}

/**
 * Updates an existing template record in the spreadsheet.
 * @param {Object} obj - Updated template data including the rowIndex.
 * @return {string} Success confirmation message.
 */
function updateTemplateRecord(obj) {
  try {
    var sheet = getMainDb().getSheetByName("Templates");
    var row = parseInt(obj.rowIndex, 10) + 1; // Convert 0-index to 1-index
    
    // Updates columns C through J (indices 2 to 9)
    sheet.getRange(row, 3, 1, 8).setValues([[
      obj.templateName, 
      obj.type, 
      obj.targetModule, 
      obj.triggerEvent, 
      obj.subject, 
      obj.bodyContent, 
      obj.status, 
      obj.wrapperType 
    ]]);
    return "Template updated successfully.";
  } catch (e) {
    return "Error updating template: " + e.message;
  }
}