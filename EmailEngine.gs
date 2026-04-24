function getWrapperContent(type) {
  var fileName = type + "Wrapper"; // Matches the filenames we created
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

/**
 * Merges the Wrapper and the Body Content for the Preview
 */
function getRenderedTemplatePreview(rowIndex) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  var rowData = data[rowIndex];
  
  var rawHtml = rowData[7] || "";
  var wrapperType = rowData[9] || "Internal"; 
  
  var wrapperHtml = getWrapperContent(wrapperType);
  var fullHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);
  
  // CRITICAL FIX: Swap the CID for the actual URL so the browser can see the image
  fullHtml = fullHtml.replace(/src="cid:logo"/g, 'src="https://i.imgur.com/nHCetrv.png"');
  
  return fullHtml;
}

/**
 * Helper to get the logo blob
 */
function getLogoBlob() {
  var logoUrl = "https://i.imgur.com/nHCetrv.png";
  return UrlFetchApp.fetch(logoUrl).getBlob().setName("logo");
}

/**
 * Sends an email based on the Trigger Event mapped in the Templates database.
 * @param {string} triggerName - E.g., "Client Welcome Email"
 * @param {string} toEmail - The recipient's email address
 * @param {object} dataMap - Dictionary matching your {{placeholders}}
 */
function sendTriggerEmail(triggerName, toEmail, dataMap) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  
  var subject = "";
  var templateFound = false;

  for (var i = 1; i < data.length; i++) {
    var rowTrigger = data[i][5];
    var rowStatus = data[i][8];
    
    if (rowTrigger === triggerName && rowStatus === "Active") {
      subject = data[i][6]; 
      rawHtml = data[i][7]; 
      templateFound = true;
      break;
    }
  }

  if (!templateFound) {
    console.log("No active template found for trigger: " + triggerName);
    return;
  }

  // Fetch Blob once for performance
  var logoBlob = getLogoBlob();

  var rawHtml = data[i][7];
  var wrapperType = data[i][9]; // Our new column!

  // 1. Get the Wrapper HTML
  var wrapperHtml = getWrapperContent(wrapperType);
  
  // 2. Inject Content
  var fullLayoutHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);

  // 2. Now run the placeholder swap over the ENTIRE layout
  var finalSubject = subject;
  var finalHtml = fullLayoutHtml;

  for (var key in dataMap) {
    var regex = new RegExp("\\{\\{" + key + "\\}\\}", "gi"); 
    var replacement = dataMap[key] || "";
    finalSubject = finalSubject.replace(regex, replacement);
    finalHtml = finalHtml.replace(regex, replacement);
  }

  // 3. Send the beautifully styled email
  MailApp.sendEmail({
    to: toEmail,
    subject: finalSubject,
    htmlBody: fullLayoutHtml,
    noReply: true,
    name: "MegaRhino",
    inlineImages: {
      logo: logoBlob // Maps 'cid:logo' in HTML to this image
    }
  });
}

/**
 * Fetches a specific template, applies dummy test data, and sends a test email.
 */
/**
 * Fetches a specific template, applies dummy test data, 
 * fetches the correct wrapper file, and sends a test email.
 */
function sendTestEmailAction(rowIndex, testEmail) {
  var sheet = getMainDb().getSheetByName("Templates");
  var data = sheet.getDataRange().getValues();
  
  if (rowIndex < 1 || rowIndex >= data.length) return "Error: Template not found.";
  
  var rowData = data[rowIndex];
  var subject = rowData[6] || "No Subject";
  var rawHtml = rowData[7] || "";
  var wrapperType = rowData[9] || "Internal"; // Matches column 9 (Column J)
  
  // 1. Get the Wrapper HTML from your files using the helper
  var wrapperHtml = getWrapperContent(wrapperType);
  
  // 2. Inject user content into the wrapper
  var fullLayoutHtml = wrapperHtml.replace("{{USER_MESSAGE_CONTENT}}", rawHtml);
  
  // 3. Define Dummy Data for testing
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

  // 4. Replace placeholders with dummy data
  var finalSubject = "[TEST] " + subject;
  var finalHtml = fullLayoutHtml;

  for (var key in dummyData) {
    var regex = new RegExp("\\{\\{" + key + "\\}\\}", "gi"); 
    finalSubject = finalSubject.replace(regex, dummyData[key]);
    finalHtml = finalHtml.replace(regex, dummyData[key]);
  }

  // 5. Send with CID logo attachment
  try {
    MailApp.sendEmail({
      to: testEmail,
      subject: finalSubject,
      htmlBody: finalHtml,
      noReply: true,
      name: "MegaRhino",
      inlineImages: {
        logo: getLogoBlob() // Uses your existing helper function
      }
    });
    return "Test email successfully sent to " + testEmail;
  } catch (e) {
    return "Failed to send test email: " + e.message;
  }
}