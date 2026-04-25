/**
 * Core engine for merging email wrappers with template content and sending 
 * automated notifications.
 */

/**
 * Helper to fetch the raw HTML content of a specific wrapper file.
 * @param {string} type - The wrapper filename prefix (e.g., 'Internal', 'External').
 * @return {string} The raw HTML content of the file.
 */
function getWrapperContent(type) {
  var fileName = type + "Wrapper"; 
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

/**
 * Merges the designated wrapper and body content for the UI template preview.
 * Includes a fix to swap CID references for public URLs so images render in browsers.
 * @param {number} rowIndex - The row index of the template in the spreadsheet.
 * @return {string} The fully rendered HTML string.
 */
function getRenderedTemplatePreview(rowIndex) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  var rowData = data[rowIndex];
  
  var rawHtml = rowData[7] || "";
  var wrapperType = rowData[9] || "Internal";
  
  var wrapperHtml = getWrapperContent(wrapperType);
  var fullHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);
  
  // Blueprint Fix: Replaces CID with actual URL so the browser preview shows the logo
  fullHtml = fullHtml.replace(/src="cid:logo"/g, 'src="https://i.imgur.com/nHCetrv.png"');
  return fullHtml;
}

/**
 * Helper to retrieve the standard system logo as a blob for email attachments.
 * @return {Blob} The logo image blob.
 */
function getLogoBlob() {
  var logoUrl = "https://i.imgur.com/nHCetrv.png";
  return UrlFetchApp.fetch(logoUrl).getBlob().setName("logo");
}

/**
 * Sends an automated email based on a Trigger Event mapped in the Templates database.
 * Merges user data into placeholders and attaches the system logo as an inline image.
 * @param {string} triggerName - The name of the trigger (e.g., "Client Welcome Email").
 * @param {string} toEmail - The recipient's email address.
 * @param {object} dataMap - Key-value pairs matching the {{placeholders}} in the template.
 */
function sendTriggerEmail(triggerName, toEmail, dataMap) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  
  var subject = "";
  var templateFound = false;
  var templateIdx = -1;

  for (var i = 1; i < data.length; i++) {
    var rowTrigger = data[i][5];
    var rowStatus = data[i][8];
    
    if (rowTrigger === triggerName && rowStatus === "Active") {
      subject = data[i][6];
      templateIdx = i;
      templateFound = true;
      break;
    }
  }

  if (!templateFound) {
    console.log("No active template found for trigger: " + triggerName);
    return;
  }

  var logoBlob = getLogoBlob();
  var rawHtml = data[templateIdx][7];
  var wrapperType = data[templateIdx][9]; 

  // 1. Prepare Layout
  var wrapperHtml = getWrapperContent(wrapperType);
  var fullLayoutHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);

  // 2. Perform Placeholder Swap over subject and body
  var finalSubject = subject;
  var finalHtml = fullLayoutHtml;
  
  for (var key in dataMap) {
    var regex = new RegExp("\\{\\{" + key + "\\}\\}", "gi");
    var replacement = dataMap[key] || "";
    finalSubject = finalSubject.replace(regex, replacement);
    finalHtml = finalHtml.replace(regex, replacement);
  }

  // 3. Dispatch Email
  MailApp.sendEmail({
    to: toEmail,
    subject: finalSubject,
    htmlBody: finalHtml,
    noReply: true,
    name: "MegaRhino",
    inlineImages: {
      logo: logoBlob 
    }
  });
}

/**
 * Fetches a template, applies comprehensive dummy test data, and sends a test email.
 * Used for verifying layout and placeholder rendering during template creation.
 * @param {number} rowIndex - The row index of the template to test.
 * @param {string} testEmail - The email address to receive the test.
 * @return {string} Status message indicating success or failure.
 */
function sendTestEmailAction(rowIndex, testEmail) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  
  if (rowIndex < 1 || rowIndex >= data.length) return "Error: Template not found.";
  
  var rowData = data[rowIndex];
  var subject = rowData[6] || "No Subject";
  var rawHtml = rowData[7] || "";
  var wrapperType = rowData[9] || "Internal";
  
  var wrapperHtml = getWrapperContent(wrapperType);
  var fullLayoutHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);

  // Define Standard Dummy Data for all possible placeholders
  var dummyData = {
    "companyName": "Acme Corp (Test)",
    "brandName": "Acme Brand",
    "address": "123 Test Ave, Suite 100",
    "website": "www.megarhino.com",
    "priFirstName": "John",
    "priLastName": "Doe",
    "priEmail": "john@example.com",
    "secFirstName": "Jane",
    "secLastName": "Smith",
    "secEmail": "jane@example.com",
    "terFirstName": "Bob",
    "terLastName": "Brown",
    "terEmail": "bob@example.com",
    "monthlyContractValue": "$2,500",
    "contractStartDate": "2026-05-01",
    "services": "SEO & Content Marketing",
    "notes": "This is a sample test note for preview purposes.",
    "userId": "USR-999",
    "username": "jdoe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "Account Manager",
    "birthday": "January 1st",
    "hireDate": "January 1, 2022"
  };

  var finalSubject = "[TEST] " + subject;
  var finalHtml = fullLayoutHtml;

  for (var key in dummyData) {
    var regex = new RegExp("\\{\\{" + key + "\\}\\}", "gi");
    finalSubject = finalSubject.replace(regex, dummyData[key]);
    finalHtml = finalHtml.replace(regex, dummyData[key]);
  }

  try {
    MailApp.sendEmail({
      to: testEmail,
      subject: finalSubject,
      htmlBody: finalHtml,
      noReply: true,
      name: "MegaRhino",
      inlineImages: {
        logo: getLogoBlob()
      }
    });
    return "Test email successfully sent to " + testEmail;
  } catch (e) {
    return "Failed to send test email: " + e.message;
  }
}