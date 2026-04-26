/**
 * Settings Module - Backend
 * Standardized under SparkHub Architecture Blueprint.
 * Handles retrieving and saving global system settings using Apps Script Properties.
 */

/**
 * Retrieves global environment, branding, storage, and database settings.
 * Includes the fallback URL and the Root Folder ID.
 * @return {Object} Dictionary with settings variables.
 */
function getSystemSettings() {
  try {
    var props = PropertiesService.getScriptProperties();
    var logoId = props.getProperty('SYSTEM_LOGO_ID');
    
    // Generate a viewable thumbnail URL if an ID exists
    var logoUrl = logoId ? ("https://drive.google.com/thumbnail?id=" + logoId + "&sz=w500") : "";
    
    return {
      environment: props.getProperty('ENVIRONMENT') || 'Production',
      adminEmail: props.getProperty('ADMIN_EMAIL') || '',
      systemName: props.getProperty('SYSTEM_NAME') || 'SparkHub',
      systemLogoUrl: logoUrl,
      systemLogoId: logoId || '',
      fallbackLogoUrl: props.getProperty('FALLBACK_LOGO_URL') || 'https://i.imgur.com/nHCetrv.png',
      rootFolderId: props.getProperty('ROOT_FOLDER_ID') || '',
      mainDbId: props.getProperty('DATABASE_ID') || ''
    };
  } catch(e) {
    return { 
      environment: 'Production', 
      adminEmail: '', 
      systemName: 'SparkHub', 
      systemLogoUrl: '', 
      systemLogoId: '', 
      fallbackLogoUrl: 'https://i.imgur.com/nHCetrv.png',
      rootFolderId: '',
      mainDbId: ''
    };
  }
}

/**
 * Validates a Google Sheet ID to ensure it contains the required Hub architecture.
 * Checks for "Users" and "Templates" sheets and verifying specific header counts.
 * @param {string} id - The ID of the Google Sheet to validate.
 * @return {boolean} True if valid.
 */
function validateDatabase(id) {
  try {
    var ss = SpreadsheetApp.openById(id);
    var usersSheet = ss.getSheetByName("Users");
    var templatesSheet = ss.getSheetByName("Templates");
    
    if (!usersSheet || !templatesSheet) {
      throw new Error("Invalid Database: Missing 'Users' or 'Templates' sheets.");
    }
    
    // Verify Users Header Count (Must have 16 columns)
    if (usersSheet.getLastColumn() < 16) {
      throw new Error("Invalid Database: 'Users' sheet does not meet the 16-column architecture requirement.");
    }
    
    return true;
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Saves environment overrides globally across the entire system.
 * Performs validation if the Main Database ID is being changed.
 * @param {Object} settings - Object containing updated setting values from the UI.
 * @return {string} Status message.
 */
function saveSystemSettings(settings) {
  try {
    var props = PropertiesService.getScriptProperties();
    var currentDbId = props.getProperty('DATABASE_ID');
    
    // 1. Validation Logic: Check if DB ID changed and validate the new file
    if (settings.mainDbId && settings.mainDbId !== currentDbId) {
      validateDatabase(settings.mainDbId);
    }
    
    // 2. Persist Properties
    props.setProperty('ENVIRONMENT', settings.environment);
    props.setProperty('ADMIN_EMAIL', settings.adminEmail);
    props.setProperty('SYSTEM_NAME', settings.systemName);
    props.setProperty('FALLBACK_LOGO_URL', settings.fallbackLogoUrl);
    props.setProperty('ROOT_FOLDER_ID', settings.rootFolderId);
    props.setProperty('DATABASE_ID', settings.mainDbId);
    
    // Only update the Logo ID if a new one was actually uploaded
    if (settings.systemLogoId) {
      props.setProperty('SYSTEM_LOGO_ID', settings.systemLogoId);
    }
    
    return "Settings updated successfully.";
  } catch (e) {
    return "Error updating settings: " + e.message;
  }
}

/**
 * Uploads the custom system logo to Drive and returns the file ID.
 * Refined Path: Root Folder > System Assets > Settings > Images.
 * Utilizes the getSystemSubfolder helper from Utils.gs for multi-level navigation.
 * @param {string} base64 - The encoded image data.
 * @param {string} filename - The target filename.
 * @return {Object} The file ID and URL, or an error object.
 */
function uploadSystemLogo(base64, filename) {
  try {
    // 1. Traverse the hierarchy: System Assets -> Settings -> Images
    var assetsFolder = getSystemSubfolder("System Assets");
    
    // Locate the "Settings" folder inside "System Assets"
    var settingsFolders = assetsFolder.getFoldersByName("Settings");
    var settingsFolder = settingsFolders.hasNext() ? settingsFolders.next() : assetsFolder.createFolder("Settings");
    
    // Locate the "Images" folder inside "Settings"
    var imageFolders = settingsFolder.getFoldersByName("Images");
    var imagesFolder = imageFolders.hasNext() ? imageFolders.next() : settingsFolder.createFolder("Images");
    
    // 2. Process and Save the file
    var base64Data = base64.split(',')[1] || base64;
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, 'image/png', filename);
    var file = imagesFolder.createFile(blob);
    
    // 3. Ensure the hub can display the logo via thumbnail URL
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { url: file.getUrl(), id: file.getId() };
    
  } catch (e) { 
    console.error("Settings Logo Upload Error: " + e.message);
    return { error: "Error uploading logo: " + e.message }; 
  }
}