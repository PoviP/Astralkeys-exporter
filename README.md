# Astral Keys Monitor v3.0

A modern GUI application for monitoring World of Warcraft Astral Keys and uploading them to MongoDB.

## Setup

### 1. MongoDB Configuration

**Option A: Environment Variable (Recommended)**
```bash
# Set environment variable before running
set MONGODB_URI="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority"
```

**Option B: Config File**
1. Copy `config.example.json` to `config.json`
2. Edit `config.json` with your MongoDB connection string:
```json
{
  "mongodbUri": "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority",
  "astralKeysPath": "C:\\Program Files (x86)\\World of Warcraft\\_retail_\\WTF\\Account\\YOUR_ACCOUNT\\SavedVariables\\AstralKeys.lua"
}
```

### 2. WoW File Path
Update the `astralKeysPath` in your config to point to your AstralKeys.lua file:
```
C:\Program Files (x86)\World of Warcraft\_retail_\WTF\Account\YOUR_ACCOUNT\SavedVariables\AstralKeys.lua
```

## Features

- ✅ Modern GUI interface
- ✅ Real-time file monitoring
- ✅ MongoDB integration
- ✅ Auto-start with Windows
- ✅ System tray integration
- ✅ Multi-user data protection
- ✅ Timestamp-based updates
- ✅ Weekly reset filtering

## Usage

1. Run `AstralKeysMonitor-v3.0.exe`
2. Configure your MongoDB connection
3. Select your AstralKeys.lua file
4. Start monitoring
5. The app will automatically upload new keystone data

## Security Note

Never commit your `config.json` file with real credentials to version control. Use environment variables for production deployments. 