/**
 * Installation Module - Backend
 * Standardized under SparkHub Architecture Blueprint.
 * * CORE RESPONSIBILITIES:
 * - Provides entry points for UI-based and manual (bootstrap) installation.
 * - Automated setup of the folder hierarchy within the Google Drive Root Folder.
 * - Initialization of the Main and Notification Databases with required headers.
 * - Capture of initial system properties (Admin Email, System Name, Environment).
 */

/**
 * UI INSTALLATION HANDLER
 * Triggered by the Installation Wizard in Index.html.
 * @param {Object} data - Contains rootId and sysName from the form.
 * @return {string} Success string with reload URL or error message.
 */
function performUiInstallation(data) {
  try {
    var props = PropertiesService.getScriptProperties();
    
    // 1. Set initial properties from the Wizard
    props.setProperty('ROOT_FOLDER_ID', data.rootId);
    props.setProperty('SYSTEM_NAME', data.sysName || 'SparkHub');
    
    // 2. Automatically set the installer as the system Admin
    var adminEmail = Session.getActiveUser().getEmail();
    props.setProperty('ADMIN_EMAIL', adminEmail);
    
    // 3. Execute core installation logic (Folders & Databases)
    runInstallation();
    
    // 4. Set environment to Sandbox to finalize the process
    props.setProperty('ENVIRONMENT', 'Sandbox');
    
    // Return formatted success string for the frontend to parse
    return "Success|" + ScriptApp.getService().getUrl();
    
  } catch (e) {
    console.error("UI Installation Error: " + e.message);
    return "Error: " + e.message;
  }
}

/**
 * BOOTSTRAP FUNCTION
 * Use this in the Apps Script editor if you need to manually initialize 
 * or fix a "Root Folder not set" error.
 */
function bootstrapSystem() {
  var manualId = "PASTE_YOUR_FOLDER_ID_HERE"; // Replace this with your actual Folder ID
  
  if (manualId === "PASTE_YOUR_FOLDER_ID_HERE" || !manualId) {
    throw new Error("Please paste your Google Drive Folder ID into the 'manualId' variable inside the script before running.");
  }

  console.log("Step 1: Manually initializing Root Folder ID...");
  PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', manualId);
  
  console.log("Step 2: Launching full installation...");
  runInstallation();
  
  // Set default environment if missing
  if (!PropertiesService.getScriptProperties().getProperty('ENVIRONMENT')) {
    PropertiesService.getScriptProperties().setProperty('ENVIRONMENT', 'Sandbox');
  }
}

/**
 * Main execution logic. 
 * Orchestrates the creation of the storage hierarchy and databases.
 */
function runInstallation() {
  var settings = getSystemSettings();
  var rootId = settings.rootFolderId;
  
  if (!rootId) {
    throw new Error("INSTALLATION HALTED: Root Folder ID not found.");
  }
  
  try {
    var rootFolder = DriveApp.getFolderById(rootId);
    console.log("Starting Installation in Root Folder: " + rootFolder.getName());

    // 1. Create/Locate the primary "System Assets" container
    var assetsFolder = getOrCreateFolder(rootFolder, "System Assets");

    // 2. Install core module storage partitions
    installSettingsFolders(assetsFolder);
    installUsersFolders(assetsFolder);
    installTemplatesFolders(assetsFolder);
    
    // 3. Initialize the Databases
    setupDatabase(rootFolder, "Main");
    setupDatabase(rootFolder, "Notification");
    
    console.log("SUCCESS: SparkHub core infrastructure is ready.");
    
  } catch (e) {
    console.error("INSTALLATION ERROR: " + e.message);
    throw new Error("Installation failed. Error: " + e.message);
  }
}

/**
 * Sets up Settings module storage.
 * Path: Root > System Assets > Settings > Images
 */
function installSettingsFolders(assetsFolder) {
  var settingsParent = getOrCreateFolder(assetsFolder, "Settings");
  getOrCreateFolder(settingsParent, "Images");
  console.log("> Settings storage initialized (Settings > Images).");
}

/**
 * Sets up Users module storage.
 * Path: Root > System Assets > Users > Photos
 */
function installUsersFolders(assetsFolder) {
  var usersParent = getOrCreateFolder(assetsFolder, "Users");
  getOrCreateFolder(usersParent, "Photos");
  console.log("> Users storage initialized (Users > Photos).");
}

/**
 * Sets up Templates module storage.
 * Path: Root > System Assets > Templates > Documents / Emails
 */
function installTemplatesFolders(assetsFolder) {
  var templatesParent = getOrCreateFolder(assetsFolder, "Templates");
  getOrCreateFolder(templatesParent, "Documents");
  getOrCreateFolder(templatesParent, "Emails");
  console.log("> Templates storage initialized (Templates > Documents / Emails).");
}

/**
 * Creates the master Google Sheet databases and initializes headers.
 * Links the resulting IDs to Script Properties for system-wide access.
 */
function setupDatabase(rootFolder, type) {
  var dbName = (type === "Main") ? "SparkHub Database" : "SparkHub Notifications";
  var files = rootFolder.getFilesByName(dbName);
  var ss;

  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
    console.log("> Existing " + type + " Database found. Verifying sheets...");
  } else {
    ss = SpreadsheetApp.create(dbName);
    var file = DriveApp.getFileById(ss.getId());
    file.moveTo(rootFolder);
    console.log("> New " + type + " Database created in Root Folder.");
  }

  if (type === "Main") {
    // SparkHub 1.0 Core Sheet Schema
    var userHeaders = [
      "Timestamp", "Username", "Role", "Work Email", "First Name", "Last Name", 
      "Birthday", "Personal Email", "Phone", "Address", "Facebook URL", 
      "Profile Photo URL", "Position", "Employment Type", "Date Hired", "Status"
    ];
    
    var templateHeaders = [
      "ID", "Name", "Category", "Trigger", "Subject", "Body", "Status", "Wrapper"
    ];

    initializeSheet(ss, "Users", userHeaders);
    initializeSheet(ss, "Templates", templateHeaders);
    
    PropertiesService.getScriptProperties().setProperty('DATABASE_ID', ss.getId());
  } else {
    // Notification log sheet
    var logHeaders = ["Timestamp", "Module", "Event", "Message", "Recipient", "IsRead"];
    initializeSheet(ss, "Notifications", logHeaders);
    PropertiesService.getScriptProperties().setProperty('NOTIF_DATABASE_ID', ss.getId());
  }
}

/**
 * Helper: Locates a folder by name within a parent, or creates it if missing.
 * Automatically sets the folder to 'Anyone with link' viewer access for UI rendering.
 */
function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var newFolder = parent.createFolder(name);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return newFolder;
  }
}

/**
 * Helper: Ensures a specific sheet exists and contains the correct bold headers.
 */
function initializeSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  
  // Set headers only if the sheet is empty to avoid overwriting existing data
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length)
         .setValues([headers])
         .setFontWeight("bold")
         .setBackground("#F3F3F3");
    sheet.setFrozenRows(1);
  }
}