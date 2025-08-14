const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { AutoStartManager } = require('./autostart');

// Import our modules
const LuaParser = require('./lua-parser');
const DungeonMapper = require('./dungeon-mapper');
const MongoDBHandler = require('./mongodb-handler');
const FileMonitor = require('./file-monitor');

// Global variables
let mainWindow;
let tray;
let fileMonitor = null;
let mongoHandler = null;
let dungeonMapper = null;
let luaParser = null;
let autoStartManager;

// Load config
let config = {
  mongodbUri: process.env.MONGODB_URI || null,
  astralKeysPath: "C:\\Program Files (x86)\\World of Warcraft\\_retail_\\WTF\\Account\\YOUR_ACCOUNT\\SavedVariables\\AstralKeys.lua",
  autoStart: false,
  autoStartMonitoring: false,
  setupCompleted: false
};

// Load config from file
function loadConfig() {
  try {
    // First check for environment variable
    if (process.env.MONGODB_URI) {
      config.mongodbUri = process.env.MONGODB_URI;
    }
    
    // Then check for config.json file
    if (fs.existsSync('config.json')) {
      const configData = fs.readFileSync('config.json', 'utf8');
      const fileConfig = JSON.parse(configData);
      config = { ...config, ...fileConfig };
    }
    
    console.log('Config loaded successfully');
  } catch (error) {
    console.error('Error loading config:', error.message);
  }
}

// Save config to file
function saveConfig() {
  try {
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide window on close, show tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
          }
        }
      },
      {
        label: 'Start Monitoring',
        click: () => {
          startMonitoring();
        }
      },
      {
        label: 'Stop Monitoring',
        click: () => {
          stopMonitoring();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Astral Keys Monitor v3.0');
  } catch (error) {
    console.error('Error creating tray:', error.message);
  }
}

async function initializeComponents() {
  try {
    loadConfig(); // Load config first
    // Initialize components
    dungeonMapper = new DungeonMapper();
    luaParser = new LuaParser();
    mongoHandler = new MongoDBHandler(config.mongodbUri);
    autoStartManager = new AutoStartManager();
    
    console.log('Components initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing components:', error.message);
    return false;
  }
}

async function processAstralKeysFile(filePath) {
  try {
    console.log('Processing AstralKeys file:', filePath);
    
    // Parse the file
    const entries = luaParser.parseFile(filePath);
    console.log(`Found ${entries.length} entries`);
    
    if (entries.length === 0) {
      console.log('No entries found in file');
      return;
    }
    
    // Connect to MongoDB
    const connected = await mongoHandler.connect();
    if (!connected) {
      const errorMessage = !config.mongodbUri 
        ? 'MongoDB connection not configured. Please set up your MongoDB connection in config.json or MONGODB_URI environment variable.'
        : 'Failed to connect to MongoDB. Please check your connection string and network connection.';
      
      console.error(errorMessage);
      
      // Update UI with error
      if (mainWindow) {
        mainWindow.webContents.send('file-processed', {
          entriesCount: entries.length,
          error: errorMessage,
          results: []
        });
      }
      return;
    }
    
    // Process each entry
    const keystones = [];
    for (const entry of entries) {
      const dungeonName = dungeonMapper.getDungeonName(entry.dungeon_id);
      
      keystones.push({
        character_name: entry.character_name,
        realm: entry.realm,
        key_level: entry.key_level,
        dungeon_id: entry.dungeon_id,
        dungeon_name: dungeonName,
        time_stamp: entry.time_stamp,
        week: entry.week
      });
    }
  
    // Insert into MongoDB
    const results = await mongoHandler.insertKeystones(keystones);
    console.log('Database operation results:', results);
    
    // Disconnect from MongoDB
    await mongoHandler.disconnect();
    
    // Update UI
    if (mainWindow) {
      mainWindow.webContents.send('file-processed', {
        entriesCount: entries.length,
        results: results
      });
    }
    
  } catch (error) {
    console.error('Error processing AstralKeys file:', error.message);
    
    // Update UI with error
    if (mainWindow) {
      mainWindow.webContents.send('file-processed', {
        entriesCount: 0,
        error: error.message,
        results: []
      });
    }
  }
}


function startMonitoring() {
  if (!config.astralKeysPath) {
    console.log('No AstralKeys file path configured');
    return false;
  }
  
  if (fileMonitor && fileMonitor.isRunning()) {
    console.log('Monitoring is already running');
    return true;
  }
  
  try {
    fileMonitor = new FileMonitor(config.astralKeysPath, processAstralKeysFile);
    fileMonitor.start();
    
    if (mainWindow) {
      mainWindow.webContents.send('monitor-started', {
        filePath: config.astralKeysPath
      });
    }
    
    console.log('Monitoring started');
    return true;
  } catch (error) {
    console.error('Error starting monitoring:', error.message);
    return false;
  }
}

function stopMonitoring() {
  if (fileMonitor) {
    fileMonitor.stop();
    fileMonitor = null;
    
    if (mainWindow) {
      mainWindow.webContents.send('monitor-stopped');
    }
    
    console.log('Monitoring stopped');
  }
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Lua Files', extensions: ['lua'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    config.astralKeysPath = result.filePaths[0];
    saveConfig();
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('test-connection', async () => {
  try {
    if (!config.mongodbUri) {
      return {
        success: false,
        error: 'No MongoDB connection string configured. Please set up your MongoDB connection in config.json or MONGODB_URI environment variable.'
      };
    }
    const connected = await mongoHandler.testConnection();
    return {
      success: connected,
      error: connected ? null : 'Failed to connect to MongoDB. Please check your connection string and network connection.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('parse-file', async (event, filePath) => {
  try {
    const entries = luaParser.parseFile(filePath);
    return {
      success: true,
      count: entries.length,
      sample: entries.slice(0, 3) // Return first 3 entries as sample
    };
  } catch (error) {
    console.error('File parsing error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('start-monitoring', () => {
  return startMonitoring();
});

ipcMain.handle('stop-monitoring', () => {
  stopMonitoring();
  return true;
});

  ipcMain.handle('set-autostart', async (event, enabled) => {
    try {
      if (enabled) {
        await autoStartManager.enable();
      } else {
        await autoStartManager.disable();
      }
      config.autoStart = enabled;
      saveConfig();
      return true;
    } catch (error) {
      console.error('Autostart error:', error.message);
      return false;
    }
  });

  ipcMain.handle('set-autostart-monitoring', (event, enabled) => {
    config.autoStartMonitoring = enabled;
    saveConfig();
    return true;
  });

  ipcMain.handle('set-mongodb-uri', (event, uri) => {
    config.mongodbUri = uri;
    saveConfig();
    return true;
  });

  ipcMain.handle('restart-app', () => {
    console.log('Restarting app...');
    app.relaunch();
    app.exit(0);
    return true;
  });

// App lifecycle
app.whenReady().then(async () => {
  console.log('App ready, initializing...');
  
  const initialized = await initializeComponents();
  if (!initialized) {
    console.error('Failed to initialize components');
    app.quit();
    return;
  }
  
  createWindow();
  createTray();
  
  // Auto-start monitoring if configured
  if (config.autoStartMonitoring && config.astralKeysPath) {
    setTimeout(() => {
      startMonitoring();
    }, 2000); // Small delay to ensure UI is ready
  }
  
  console.log('App initialized successfully');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopMonitoring();
});
