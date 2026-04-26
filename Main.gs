/**
 * Entry point for the SparkHub Web Application.
 * Standardized under SparkHub Architecture Blueprint.
 * Handles environment detection, role-based access control, dynamic branding, and theming.
 * @return {HtmlService.HtmlOutput} The evaluated HTML template or a security screen.
 */
function doGet() {
  var props = PropertiesService.getScriptProperties();
  var env = props.getProperty('ENVIRONMENT');
  var userEmail = Session.getActiveUser().getEmail();
  
  // 1. INSTALLATION CHECK
  var isInstalled = (env !== null && env !== "");
  
  // Fetch dynamic branding/settings
  var settings = getSystemSettings();
  var sysName = settings.systemName;
  var logoId = settings.systemLogoId;
  
  // Uses the fast-loading SVG for the web app UI
  var appFallback = settings.appFallbackLogo;
  var displayLogoUrl = logoId ? settings.systemLogoUrl : appFallback;

  // 2. APP INITIALIZATION
  var template = HtmlService.createTemplateFromFile('Index');
  template.isInstalled = isInstalled;
  template.userEmail = userEmail;
  template.systemName = sysName;
  template.systemLogoUrl = displayLogoUrl;
  template.appFallbackLogo = appFallback;
  
  // Inject Dynamic Theme Variables
  template.themePrimary = settings.themePrimary;
  template.themeAccent = settings.themeAccent;
  template.themeDark = settings.themeDark;

  if (isInstalled) {
    var role = getUserRole(); 
    if (role === 'Inactive') {
      return serveAccessDeniedScreen(sysName, displayLogoUrl, appFallback, logoId, settings.systemLogoUrl, settings.themeDark, settings.themePrimary);
    }
    template.userRole = role; 
    template.accountManagers = JSON.stringify(getAccountManagers());
    template.username = getLoggedInUsername();
  } else {
    template.userRole = "Administrator";
    template.accountManagers = "[]";
    template.username = userEmail.split('@')[0];
  }
  
  var htmlOutput = template.evaluate()
      .setTitle(sysName)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  // Dynamic Favicon setup
  if (logoId) {
    htmlOutput.setFaviconUrl(settings.systemLogoUrl + "&ext=.png");
  } else {
    htmlOutput.setFaviconUrl(appFallback);
  }
  
  return htmlOutput;
}

/**
 * Serves a static HTML error page when a user's account is deactivated.
 */
function serveAccessDeniedScreen(sysName, displayLogoUrl, appFallback, logoId, systemLogoUrl, themeDark, themePrimary) {
  var errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${sysName} - Access Denied</title>
      <style>
        body { background-color: ${themeDark}; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: white; }
        .error-card { background: #FFFFFF; padding: 48px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); text-align: center; max-width: 420px; border-top: 8px solid ${themePrimary}; color: ${themeDark}; }
        .error-card h1 { margin-top: 0; font-size: 24px; font-weight: 800; }
        .error-card p { opacity: 0.7; line-height: 1.6; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="error-card">
        <img src="${displayLogoUrl}" alt="${sysName} Logo" style="height: 64px; margin-bottom: 24px; object-fit: contain;">
        <h1>Access Denied</h1>
        <p>Your account has been deactivated. You do not have permission to access ${sysName}. Please contact your administrator if you believe this is a mistake.</p>
      </div>
    </body>
    </html>
  `;
  
  var output = HtmlService.createHtmlOutput(errorHtml)
      .setTitle(sysName + ' - Access Denied')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  if (logoId) {
    output.setFaviconUrl(systemLogoUrl + "&ext=.png");
  } else {
    output.setFaviconUrl(appFallback);
  }
  
  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}