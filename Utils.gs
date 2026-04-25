/**
 * Utility Module - Backend
 * Standardized under MR Hub Architecture Blueprint.
 * Handles: File uploads to Google Drive, data decoding, and system-wide helpers.
 */

/**
 * Global Folder ID for User Profile Photos.
 * Ensure the system account has 'Editor' access to this folder.
 */
var PROFILE_PHOTO_FOLDER_ID = '1f7xY7pTugJheMjzEUyoNFLVRltcaNqvo'; 

/**
 * Decodes a base64 image string and saves it as a file in Google Drive.
 * Sets sharing permissions to 'Anyone with link' so the UI can display the photo.
 * @param {string} base64 - The encoded image data from the file input.
 * @param {string} filename - The target name for the file (usually the username).
 * @return {string} The public web URL of the uploaded image or an error message.
 */
function uploadProfilePhoto(base64, filename) {
  try {
    // 1. Locate the target destination folder
    var folder = DriveApp.getFolderById(PROFILE_PHOTO_FOLDER_ID);
    
    // 2. Strip base64 header if present (e.g., "data:image/png;base64,")
    var base64Data = base64.split(',')[1] || base64;
    
    // 3. Decode and create the blob
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, 'image/png', filename);
    
    // 4. Create the file in the designated folder
    var file = folder.createFile(blob);
    
    // 5. Blueprint Standard: Set permissions so the hub can render the image
    // This allows the image to be accessed via its URL in <img> tags.
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the direct URL for storage in the Users database
    return file.getUrl();
    
  } catch (e) {
    console.error("Upload error: " + e.message);
    return "Error: " + e.message;
  }
}