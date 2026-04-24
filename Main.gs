function doGet() {
  var role = getUserRole();
  var faviconUrl = 'https://static.wixstatic.com/media/b5f2cd_5833de54beb6448ba2ce8948280d9e77%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/b5f2cd_5833de54beb6448ba2ce8948280d9e77%7Emv2.png';
  
  // NEW: Intercept Inactive users before the app even loads
  if (role === 'Inactive') {
    var errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MR Hub - Access Denied</title>
        <style>
          body { background-color: #FDDD64; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .error-card { background: #FFFFFF; padding: 40px; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); border-bottom: 6px solid #C40004; text-align: center; max-width: 400px; margin: 20px; }
          .error-card h1 { color: #323232; margin-top: 0; font-size: 28px; }
          .error-card p { color: #323232; opacity: 0.8; line-height: 1.6; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="error-card">
          <img src="https://static.wixstatic.com/media/b5f2cd_5833de54beb6448ba2ce8948280d9e77%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/b5f2cd_5833de54beb6448ba2ce8948280d9e77%7Emv2.png" alt="MR Logo" style="height: 60px; margin-bottom: 20px; object-fit: contain;">
          <h1>Access Denied</h1>
          <p>Your account has been deactivated. You do not have permission to access the MR Hub. Please contact your administrator if you believe this is a mistake.</p>
        </div>
      </body>
      </html>
    `;
    return HtmlService.createHtmlOutput(errorHtml)
        .setTitle('MR Hub - Access Denied')
        .setFaviconUrl(faviconUrl)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Normal app load for active users
  var template = HtmlService.createTemplateFromFile('Index');
  template.userRole = role; 
  template.accountManagers = JSON.stringify(getAccountManagers()); 
  template.username = getLoggedInUsername();
  
  return template.evaluate()
      .setTitle('MR Hub')
      .setFaviconUrl(faviconUrl)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}