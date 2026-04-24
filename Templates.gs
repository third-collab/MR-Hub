/**
 * Fetches all templates to display in the list view
 */
function getTemplatesList() {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  var templates = [];
  
  // Assuming row 0 is headers, we start at i = 1
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    templates.push({
      rowIndex: i,
      templateId: row[1],
      templateName: row[2],
      type: row[3],
      targetModule: row[4],
      triggerEvent: row[5],
      // We don't necessarily need body or subject for the list view to save memory
      status: row[8],
      wrapperType: row[9] || "Internal" // <-- THIS IS THE MISSING PIECE
    });
  }
  return templates;
}

/**
 * Fetches a single template by its row index for the Edit form
 */
function getTemplateById(rowIndex) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  if (rowIndex < 1 || rowIndex >= data.length) return null;
  
  var rowData = data[rowIndex];
  
  return {
    rowIndex: rowIndex,
    templateId: rowData[1],
    templateName: rowData[2],
    type: rowData[3],
    targetModule: rowData[4],
    triggerEvent: rowData[5],
    subject: rowData[6] || "",
    bodyContent: rowData[7] || "",
    status: rowData[8],
    wrapperType: rowData[9] || "Internal" // Added this to pass the wrapper
  };
}

// Update the arrays in getTemplatesList, getTemplateById, processNewTemplate, and updateTemplateRecord
// Example for processNewTemplate:
function processNewTemplate(obj) {
  var sheet = getMainDb().getSheetByName("Templates");
  sheet.appendRow([
    new Date(), "TMP-" + new Date().getTime(), obj.templateName, obj.type, 
    obj.targetModule, obj.triggerEvent, obj.subject, obj.bodyContent, obj.status, obj.wrapperType
  ]);
}

function updateTemplateRecord(obj) {
  var sheet = getMainDb().getSheetByName("Templates");
  var row = parseInt(obj.rowIndex) + 1; 
  
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
  
  // Return a readable string instead of a boolean!
  return "Template updated successfully."; 
}