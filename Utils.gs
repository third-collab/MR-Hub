// --- CONFIG ---
var PROFILE_PHOTO_FOLDER_ID = '1f7xY7pTugJheMjzEUyoNFLVRltcaNqvo'; 

function uploadProfilePhoto(base64, filename) {
  try {
    var folder = DriveApp.getFolderById(PROFILE_PHOTO_FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/png', filename);
    var file = folder.createFile(blob);
    
    // Set file sharing to "Anyone with the link" so the image displays correctly on the dashboard
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    return "Error: " + e.message;
  }
}