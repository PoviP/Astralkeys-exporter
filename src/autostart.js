const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class AutoStartManager {
  constructor() {
    this.startupFolder = this.getStartupFolder();
  }

  getStartupFolder() {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    }
    return null;
  }

  async enable() {
    if (process.platform !== 'win32') {
      throw new Error('Auto-start is only supported on Windows');
    }

    try {
      // Ensure startup folder exists
      if (!fs.existsSync(this.startupFolder)) {
        fs.mkdirSync(this.startupFolder, { recursive: true });
      }

      // Get the path to the current executable
      const appPath = process.execPath;
      const shortcutPath = path.join(this.startupFolder, 'Astral Keys Monitor.lnk');
      
      // Create Windows shortcut using PowerShell with proper escaping
      const psCommand = `$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}'); $Shortcut.TargetPath = '${appPath.replace(/\\/g, '\\\\')}'; $Shortcut.WorkingDirectory = '${path.dirname(appPath).replace(/\\/g, '\\\\')}'; $Shortcut.WindowStyle = 7; $Shortcut.Save()`;
      
      execSync(`powershell -Command "${psCommand}"`, { stdio: 'pipe' });

      console.log('Auto-start enabled. Shortcut created at:', shortcutPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to enable auto-start: ${error.message}`);
    }
  }

  async disable() {
    if (process.platform !== 'win32') {
      throw new Error('Auto-start is only supported on Windows');
    }

    try {
      const shortcutPath = path.join(this.startupFolder, 'Astral Keys Monitor.lnk');
      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      const batchPath = path.join(this.startupFolder, 'AstralKeysMonitor.bat');

      // Remove shortcut if it exists
      if (fs.existsSync(shortcutPath)) {
        fs.unlinkSync(shortcutPath);
        console.log('Auto-start disabled. Shortcut removed:', shortcutPath);
      }

      // Also clean up any old VBS or batch files if they exist
      if (fs.existsSync(vbsPath)) {
        fs.unlinkSync(vbsPath);
        console.log('Auto-start disabled. Old VBS file removed:', vbsPath);
      }

      if (fs.existsSync(batchPath)) {
        fs.unlinkSync(batchPath);
        console.log('Auto-start disabled. Old batch file removed:', batchPath);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to disable auto-start: ${error.message}`);
    }
  }

  async isEnabled() {
    if (process.platform !== 'win32') {
      return false;
    }

    try {
      const shortcutPath = path.join(this.startupFolder, 'Astral Keys Monitor.lnk');
      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      const batchPath = path.join(this.startupFolder, 'AstralKeysMonitor.bat');

      // Check for any of the autostart methods
      return fs.existsSync(shortcutPath) || fs.existsSync(vbsPath) || fs.existsSync(batchPath);
    } catch (error) {
      return false;
    }
  }

  async updateExistingFiles() {
    if (process.platform !== 'win32') {
      return;
    }

    try {
      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      const batchPath = path.join(this.startupFolder, 'AstralKeysMonitor.bat');
      
      // If old VBS or batch files exist, replace them with a shortcut
      if (fs.existsSync(vbsPath) || fs.existsSync(batchPath)) {
        console.log('Found old autostart files, replacing with shortcut...');
        
        // Remove old files
        if (fs.existsSync(vbsPath)) {
          fs.unlinkSync(vbsPath);
        }
        if (fs.existsSync(batchPath)) {
          fs.unlinkSync(batchPath);
        }
        
        // Create new shortcut
        await this.enable();
        console.log('Updated autostart to use shortcut method');
      }
    } catch (error) {
      // Silently fail - this is not critical
      console.error('Error updating existing auto-start files:', error.message);
    }
  }
}

module.exports = { AutoStartManager };
