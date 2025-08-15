const fs = require('fs');
const path = require('path');
const os = require('os');

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
      const appDir = path.dirname(appPath);
      
      // Create a VBS script that runs the app hidden
      const vbsContent = `' Astral Keys Monitor - Auto Start
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${appDir.replace(/\\/g, '\\\\')}"
WshShell.Run """${appPath.replace(/\\/g, '\\\\')}""", 1, False`;

      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      fs.writeFileSync(vbsPath, vbsContent);

      console.log('Auto-start enabled. VBS file created at:', vbsPath);
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
      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      const batchPath = path.join(this.startupFolder, 'AstralKeysMonitor.bat');

      // Remove both VBS and batch files if they exist
      if (fs.existsSync(vbsPath)) {
        fs.unlinkSync(vbsPath);
        console.log('Auto-start disabled. VBS file removed:', vbsPath);
      }

      if (fs.existsSync(batchPath)) {
        fs.unlinkSync(batchPath);
        console.log('Auto-start disabled. Batch file removed:', batchPath);
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
      const vbsPath = path.join(this.startupFolder, 'AstralKeysMonitor.vbs');
      const batchPath = path.join(this.startupFolder, 'AstralKeysMonitor.bat');

      return fs.existsSync(vbsPath) || fs.existsSync(batchPath);
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
      
      if (fs.existsSync(vbsPath)) {
        const content = fs.readFileSync(vbsPath, 'utf8');
        
        // Check if the file needs updating (look for old Node.js command)
        if (content.includes('node src/main.js')) {
          const appPath = process.execPath;
          const appDir = path.dirname(appPath);
          
          const vbsContent = `' Astral Keys Monitor - Auto Start
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${appDir.replace(/\\/g, '\\\\')}"
WshShell.Run """${appPath.replace(/\\/g, '\\\\')}""", 0, False`;
          
          fs.writeFileSync(vbsPath, vbsContent);
          console.log('Updated existing auto-start file to use Electron app');
        }
      }
    } catch (error) {
      // Silently fail - this is not critical
      console.error('Error updating existing auto-start files:', error.message);
    }
  }
}

module.exports = { AutoStartManager };
