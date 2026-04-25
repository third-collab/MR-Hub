/**
 * Entry point for the MR Hub Web Application.
 * Handles role-based access control and prepares the initial UI template with 
 * necessary global variables.
 * @return {HtmlService.HtmlOutput} The evaluated HTML template or a security 
 * interceptor screen.
 */
function doGet() {
  var role = getUserRole(); 
  var faviconUrl = 'https://i.imgur.com/nHCetrv.png';

  // SECURITY INTERCEPTOR: Block Inactive users immediately before loading the app
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
          <img src="https://i.imgur.com/nHCetrv.png" alt="MR Logo" style="height: 60px; margin-bottom: 20px; object-fit: contain;">
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

  // APP INITIALIZATION: Pass server-side variables to the frontend template
  var template = HtmlService.createTemplateFromFile('Index');
  template.userRole = role; 
  template.accountManagers = JSON.stringify(getAccountManagers());
  template.username = getLoggedInUsername();
  
  return template.evaluate()
      .setTitle('MR Hub')
      .setFaviconUrl(faviconUrl)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Server-side helper to include separate HTML files into the master template.
 * This allows for a modular code structure while maintaining a single-page app.
 * @param {string} filename - The name of the HTML file to include.
 * @return {string} The raw HTML content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}