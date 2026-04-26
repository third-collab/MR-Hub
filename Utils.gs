/**
 * Utility Module - Backend
 * Standardized under MR Hub Architecture Blueprint.
 * Handles: File uploads, subfolder management, and global template helpers.
 */

/**
 * Server-side helper to include separate HTML files into the master template.
 * This allows for a modular code structure while maintaining a single-page app.
 * @param {string} filename - The name of the HTML file to include.
 * @return {string} The raw HTML content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Dynamically retrieves a subfolder within the configured Root Folder.
 * If the subfolder does not exist, it creates it and sets permissions.
 * @param {string} subfolderName - The name of the folder to locate (e.g., "User Photos").
 * @return {GoogleAppsScript.Drive.Folder} The Drive folder object.
 */
function getSystemSubfolder(subfolderName) {
  var settings = getSystemSettings();
  var rootId = settings.rootFolderId;
  
  if (!rootId) {
    throw new Error("System Configuration Error: Root Folder is not set in Settings.");
  }
  
  var rootFolder = DriveApp.getFolderById(rootId);
  var folders = rootFolder.getFoldersByName(subfolderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    // Automatically create the folder if missing and set public viewing for UI rendering
    var newFolder = rootFolder.createFolder(subfolderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}

/**
 * Decodes a base64 image string and saves it as a file in the system's "User Photos" folder.
 * Sets sharing permissions to 'Anyone with link' so the UI can display the photo.
 * @param {string} base64 - The encoded image data from the file input.
 * @param {string} filename - The target name for the file.
 * @return {string} The direct web URL of the uploaded image or an error message.
 */
function uploadProfilePhoto(base64, filename) {
  try {
    // Locate the target destination folder dynamically under the Root Folder
    var folder = getSystemSubfolder("User Photos");
    
    // Strip base64 header if present (e.g., "data:image/png;base64,")
    var base64Data = base64.split(',')[1] || base64;
    
    // Decode and create the blob
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, 'image/png', filename);
    
    // Create the file
    var file = folder.createFile(blob);
    
    // Blueprint Standard: Set permissions so the hub can render the image via thumbnail or URL
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
    
  } catch (e) {
    console.error("Upload error in Utils.gs: " + e.message);
    return "Error: " + e.message;
  }
}