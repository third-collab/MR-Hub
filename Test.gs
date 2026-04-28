function printSystemSettings() {
  let systemSettingsForPrinting = getSystemSettings(),
      systemSettingsText = '';
  Object.keys(systemSettingsForPrinting).forEach(function(settingsKey) {
    systemSettingsText += settingsKey + ' : ' + systemSettingsForPrinting[settingsKey] + ' | ';
  });
  Logger.log(systemSettingsText);
}