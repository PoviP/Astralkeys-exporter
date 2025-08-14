const { ipcRenderer } = require('electron');

// DOM elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const fileInfo = document.getElementById('file-info');
const currentFile = document.getElementById('current-file');
const settingsFilePath = document.getElementById('settings-file-path');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const selectFileBtn = document.getElementById('select-file-btn');
const testBtn = document.getElementById('test-btn');
const autostartToggle = document.getElementById('autostart-toggle');
const autostartMonitoringToggle = document.getElementById('autostart-monitoring-toggle');
const clearLogBtn = document.getElementById('clear-log-btn');
const logContainer = document.getElementById('log-container');
const mongodbUriInput = document.getElementById('mongodb-uri');
const saveMongodbBtn = document.getElementById('save-mongodb-btn');

// State
let isMonitoring = false;
let config = {};

// Initialize
async function initialize() {
    try {
        config = await ipcRenderer.invoke('get-config');
        updateUI();
        addLog('info', 'App initialized successfully');
    } catch (error) {
        addLog('error', `Failed to initialize: ${error.message}`);
    }
}

function updateUI() {
    // Update status
    if (isMonitoring) {
        statusDot.className = 'status-dot running';
        statusText.textContent = 'Running';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusDot.className = 'status-dot stopped';
        statusText.textContent = 'Stopped';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    // Update file info
    if (config.astralKeysPath) {
        currentFile.textContent = config.astralKeysPath;
        settingsFilePath.textContent = config.astralKeysPath;
        fileInfo.classList.remove('hidden');
    } else {
        currentFile.textContent = 'No file selected';
        settingsFilePath.textContent = 'No file selected';
        fileInfo.classList.add('hidden');
    }

    // Update MongoDB URI input
    mongodbUriInput.value = config.mongodbUri || '';

    // Update checkboxes
    autostartToggle.checked = config.autoStart || false;
    autostartMonitoringToggle.checked = config.autoStartMonitoring || false;
}

function addLog(type, message) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Event listeners
startBtn.addEventListener('click', async () => {
    try {
        addLog('info', 'Starting monitoring...');
        const success = await ipcRenderer.invoke('start-monitoring');
        if (success) {
            isMonitoring = true;
            updateUI();
            addLog('success', 'Monitoring started successfully');
        } else {
            addLog('error', 'Failed to start monitoring');
        }
    } catch (error) {
        addLog('error', `Error starting monitoring: ${error.message}`);
    }
});

stopBtn.addEventListener('click', async () => {
    try {
        addLog('info', 'Stopping monitoring...');
        await ipcRenderer.invoke('stop-monitoring');
        isMonitoring = false;
        updateUI();
        addLog('success', 'Monitoring stopped');
    } catch (error) {
        addLog('error', `Error stopping monitoring: ${error.message}`);
    }
});

selectFileBtn.addEventListener('click', async () => {
    try {
        addLog('info', 'Opening file dialog...');
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            config.astralKeysPath = filePath;
            updateUI();
            addLog('success', `File selected: ${filePath}`);
            
            // Test parse the file
            addLog('info', 'Testing file parsing...');
            const parseResult = await ipcRenderer.invoke('parse-file', filePath);
            if (parseResult.success) {
                addLog('success', `File parsed successfully: ${parseResult.count} entries found`);
                if (parseResult.sample && parseResult.sample.length > 0) {
                    addLog('info', `Sample entry: ${parseResult.sample[0].character_name} - ${parseResult.sample[0].key_level}`);
                }
            } else {
                addLog('error', `File parsing failed: ${parseResult.error}`);
            }
        }
    } catch (error) {
        addLog('error', `Error selecting file: ${error.message}`);
    }
});

testBtn.addEventListener('click', async () => {
    try {
        addLog('info', 'Testing MongoDB connection...');
        const result = await ipcRenderer.invoke('test-connection');
        if (result.success) {
            addLog('success', 'MongoDB connection successful');
        } else {
            addLog('error', `MongoDB connection failed: ${result.error}`);
        }
    } catch (error) {
        addLog('error', `Connection test error: ${error.message}`);
    }
});

autostartToggle.addEventListener('change', async (event) => {
    try {
        const enabled = event.target.checked;
        await ipcRenderer.invoke('set-autostart', enabled);
        config.autoStart = enabled;
        addLog('info', `Auto-start ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        addLog('error', `Error updating auto-start setting: ${error.message}`);
    }
});

autostartMonitoringToggle.addEventListener('change', async (event) => {
    try {
        const enabled = event.target.checked;
        await ipcRenderer.invoke('set-autostart-monitoring', enabled);
        config.autoStartMonitoring = enabled;
        addLog('info', `Auto-start monitoring ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        addLog('error', `Error updating auto-start monitoring setting: ${error.message}`);
    }
});

clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
    addLog('info', 'Log cleared');
});

saveMongodbBtn.addEventListener('click', async () => {
    try {
        const uri = mongodbUriInput.value.trim();
        if (!uri) {
            addLog('error', 'Please enter a MongoDB connection string');
            return;
        }
        
        addLog('info', 'Saving MongoDB connection string...');
        await ipcRenderer.invoke('set-mongodb-uri', uri);
        config.mongodbUri = uri;
        addLog('success', 'MongoDB connection string saved successfully');
        
        // Show restart confirmation dialog
        const restartNow = confirm('MongoDB connection string saved! The app needs to restart for the changes to take effect.\n\nClick "OK" to restart now, or "Cancel" to restart later.');
        
        if (restartNow) {
            addLog('info', 'Restarting app...');
            await ipcRenderer.invoke('restart-app');
        } else {
            addLog('info', 'Please restart the app manually for the MongoDB connection to take effect');
        }
        
    } catch (error) {
        addLog('error', `Error saving MongoDB connection: ${error.message}`);
    }
});

mongodbUriInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        saveMongodbBtn.click();
    }
});

// IPC event listeners
ipcRenderer.on('monitor-started', (event, data) => {
    isMonitoring = true;
    updateUI();
    addLog('success', `Monitoring started for: ${data.filePath}`);
});

ipcRenderer.on('monitor-stopped', () => {
    isMonitoring = false;
    updateUI();
    addLog('info', 'Monitoring stopped');
});

ipcRenderer.on('file-processed', (event, data) => {
    if (data.error) {
        addLog('error', `MongoDB Error: ${data.error}`);
        if (data.entriesCount > 0) {
            addLog('info', `Found ${data.entriesCount} entries but could not upload to database`);
        }
        return;
    }
    
    addLog('success', `Processed ${data.entriesCount} entries`);
    if (data.results) {
        const successCount = data.results.filter(r => r.success).length;
        const errorCount = data.results.filter(r => !r.success && r.action === 'error').length;
        const noChangeCount = data.results.filter(r => !r.success && r.action === 'no_change').length;
        const skippedOlderCount = data.results.filter(r => !r.success && r.action === 'skipped_older').length;
        const skippedNewerCount = data.results.filter(r => !r.success && r.action === 'skipped_newer_exists').length;
        const skippedOldWeekCount = data.results.filter(r => !r.success && r.action === 'skipped_old_week').length;
        
        if (errorCount > 0) {
            addLog('error', `Database operations: ${successCount} successful, ${errorCount} errors`);
        } else if (skippedNewerCount > 0) {
            addLog('info', `Database operations: ${successCount} successful, ${skippedNewerCount} skipped (newer data exists)`);
        } else if (skippedOldWeekCount > 0) {
            addLog('info', `Database operations: ${successCount} successful, ${skippedOldWeekCount} skipped (old week data)`);
        } else if (skippedOlderCount > 0) {
            addLog('info', `Database operations: ${successCount} successful, ${skippedOlderCount} unchanged`);
        } else if (noChangeCount > 0) {
            addLog('info', `Database operations: ${successCount} successful, ${noChangeCount} unchanged`);
        } else {
            addLog('success', `Database operations: ${successCount} successful`);
        }
        
        // Log detailed reasons for skipped items
        data.results.forEach(result => {
            if (!result.success && result.reason) {
                addLog('info', `${result.character}: ${result.reason}`);
            }
        });
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
