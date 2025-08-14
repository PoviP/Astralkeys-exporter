const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

class FileMonitor {
  constructor(filePath, onFileChange) {
    this.filePath = filePath;
    this.onFileChange = onFileChange;
    this.watcher = null;
    this.isWatching = false;
  }

  start() {
    if (this.isWatching) {
      console.log('File monitor is already running');
      return;
    }

    try {
      console.log(`Starting file monitor for: ${this.filePath}`);
      
      this.watcher = chokidar.watch(this.filePath, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100
        }
      });

      this.watcher
        .on('add', (filePath) => {
          console.log(`File added: ${filePath}`);
          this.processFile(filePath);
        })
        .on('change', (filePath) => {
          console.log(`File changed: ${filePath}`);
          this.processFile(filePath);
        })
        .on('error', (error) => {
          console.error('File monitor error:', error.message);
        });

      this.isWatching = true;
      console.log('File monitor started successfully');
    } catch (error) {
      console.error('Error starting file monitor:', error.message);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      console.log('File monitor stopped');
    }
  }

  async processFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log('File does not exist:', filePath);
        return;
      }

      console.log('Processing file:', filePath);
      
      if (this.onFileChange) {
        await this.onFileChange(filePath);
      }
    } catch (error) {
      console.error('Error processing file:', error.message);
    }
  }

  isRunning() {
    return this.isWatching && this.watcher !== null;
  }
}

module.exports = FileMonitor;
