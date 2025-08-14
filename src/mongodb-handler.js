const { MongoClient } = require('mongodb');

class MongoDBHandler {
  constructor(uri) {
    this.uri = uri;
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      if (!this.uri) {
        throw new Error('No MongoDB connection string configured. Please set up your MongoDB connection in config.json or MONGODB_URI environment variable.');
      }
      
      console.log('Attempting to connect to MongoDB...');
      console.log('Connection string (masked):', this.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db('character-showcase');
      this.collection = this.db.collection('astral-keys');
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      console.error('Full error details:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
    }
  }

  // Get current week number (WoW weekly reset)
  getCurrentWeek() {
    // WoW weekly reset is Tuesday at 9 AM server time
    // This is a simplified calculation - you might want to adjust based on your server
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.ceil(days / 7);
    return weekNumber;
  }

  // Check if data is from current week
  isCurrentWeek(weekNumber) {
    const currentWeek = this.getCurrentWeek();
    return weekNumber >= currentWeek;
  }

  async insertKeystones(keystones) {
    if (!this.collection) {
      console.error('MongoDB not connected');
      return false;
    }

    try {
      const results = [];
      const currentWeek = this.getCurrentWeek();
      
      for (const keystone of keystones) {
        try {
          // Check if data is from current week
          if (!this.isCurrentWeek(keystone.week)) {
            results.push({ 
              success: false, 
              action: 'skipped_old_week', 
              character: keystone.character_name,
              reason: `Week ${keystone.week} is older than current week ${currentWeek}`
            });
            continue;
          }

          // Create the document with the exact format you requested
          const document = {
            character_name: keystone.character_name,
            realm: keystone.realm,
            key_level: keystone.key_level,
            dungeon_id: keystone.dungeon_id,
            dungeon_name: keystone.dungeon_name,
            wow_timestamp: keystone.time_stamp,
            week: keystone.week,
            processed_at: new Date(),
            computer_name: require('os').hostname()
          };

          // Check if existing document has newer timestamp
          const existingDoc = await this.collection.findOne({
            character_name: keystone.character_name,
            realm: keystone.realm,
            dungeon_id: keystone.dungeon_id,
            week: keystone.week
          });

          if (existingDoc) {
            // Compare timestamps - only update if new data is newer
            if (keystone.time_stamp > existingDoc.wow_timestamp) {
              // New data is newer, update it
              const updateResult = await this.collection.updateOne(
                {
                  character_name: keystone.character_name,
                  realm: keystone.realm,
                  dungeon_id: keystone.dungeon_id,
                  week: keystone.week
                },
                { $set: document }
              );
              
              if (updateResult.modifiedCount > 0) {
                results.push({ success: true, action: 'updated', character: keystone.character_name });
              } else {
                results.push({ success: false, action: 'no_change', character: keystone.character_name });
              }
            } else {
              // Existing data is newer, don't update
              results.push({ 
                success: false, 
                action: 'skipped_newer_exists', 
                character: keystone.character_name,
                reason: `Existing data (timestamp: ${existingDoc.wow_timestamp}) is newer than new data (timestamp: ${keystone.time_stamp})`
              });
            }
          } else {
            // No existing document, insert new one
            const insertResult = await this.collection.insertOne(document);
            if (insertResult.insertedId) {
              results.push({ success: true, action: 'inserted', character: keystone.character_name });
            } else {
              results.push({ success: false, action: 'insert_failed', character: keystone.character_name });
            }
          }
        } catch (error) {
          console.error(`Error processing keystone for ${keystone.character_name}:`, error.message);
          results.push({ success: false, action: 'error', character: keystone.character_name, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error inserting keystones:', error.message);
      return false;
    }
  }

  async testConnection() {
    try {
      console.log('Testing MongoDB connection...');
      const connected = await this.connect();
      if (connected) {
        console.log('Connection test successful');
        await this.disconnect();
        return true;
      } else {
        console.log('Connection test failed');
        return false;
      }
    } catch (error) {
      console.error('Connection test failed:', error.message);
      console.error('Full test error:', error);
      return false;
    }
  }
}

module.exports = MongoDBHandler;
