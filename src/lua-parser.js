const fs = require('fs');

class LuaParser {
  parse(content) {
    try {
      console.log('Raw file content length:', content.length);
      console.log('First 500 characters:', content.substring(0, 500));
      
      // Find the start of AstralKeys table
      const astralKeysStart = content.indexOf('AstralKeys = {');
      if (astralKeysStart === -1) {
        console.log('AstralKeys table not found');
        return [];
      }
      
      // Find the matching closing brace for the entire AstralKeys table
      let braceCount = 0;
      let inTable = false;
      let tableContent = '';
      let endIndex = astralKeysStart;
      
      for (let i = astralKeysStart; i < content.length; i++) {
        const char = content[i];
        
        if (char === '{') {
          if (!inTable) {
            inTable = true;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (inTable && braceCount === 0) {
            endIndex = i;
            break;
          }
        }
        
        if (inTable) {
          tableContent += char;
        }
      }
      
      console.log('Extracted table content length:', tableContent.length);
      console.log('Table content preview:', tableContent.substring(0, 300));
      
      const entries = this.extractEntries(tableContent);
      console.log('Extracted entries count:', entries.length);
      
      return entries.map(entry => this.parseEntry(entry)).filter(Boolean);
    } catch (error) {
      console.error('Error parsing Lua content:', error.message);
      return [];
    }
  }

  extractEntries(content) {
    const entries = [];
    let currentEntry = '';
    let braceCount = 0;
    let inEntry = false;
    let skipFirstBrace = true; // Skip the outer table brace

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        if (skipFirstBrace) {
          skipFirstBrace = false;
          continue; // Skip the first brace (outer table)
        }
        
        if (!inEntry) {
          inEntry = true;
          braceCount = 1;
          currentEntry = '{';
        } else {
          currentEntry += char;
          braceCount++;
        }
      } else if (char === '}') {
        if (inEntry) {
          currentEntry += char;
          braceCount--;
          
          if (braceCount === 0) {
            entries.push(currentEntry);
            currentEntry = '';
            inEntry = false;
          }
        }
      } else if (inEntry) {
        currentEntry += char;
      }
    }

    console.log('Found', entries.length, 'potential entries');
    if (entries.length > 0) {
      console.log('First entry preview:', entries[0].substring(0, 200));
    }

    return entries;
  }

  parseEntry(entryContent) {
    try {
      console.log('Parsing entry:', entryContent.substring(0, 100));
      
      // Try different patterns for unit/character name
      let unitMatch = entryContent.match(/\["unit"\]\s*=\s*"([^"]+)"/);
      if (!unitMatch) {
        unitMatch = entryContent.match(/unit\s*=\s*"([^"]+)"/);
      }
      if (!unitMatch) {
        unitMatch = entryContent.match(/unit\s*=\s*'([^']+)'/);
      }
      
      if (!unitMatch) {
        console.log('No unit found in entry');
        return null;
      }
      
      const unit = unitMatch[1];
      const [characterName, realm] = unit.split('-');
      
      // Try different patterns for key_level
      let keyLevelMatch = entryContent.match(/\["key_level"\]\s*=\s*(\d+)/);
      if (!keyLevelMatch) {
        keyLevelMatch = entryContent.match(/key_level\s*=\s*(\d+)/);
      }
      const keyLevel = keyLevelMatch ? parseInt(keyLevelMatch[1]) : 0;
      
      // Try different patterns for dungeon_id
      let dungeonIdMatch = entryContent.match(/\["dungeon_id"\]\s*=\s*(\d+)/);
      if (!dungeonIdMatch) {
        dungeonIdMatch = entryContent.match(/dungeon_id\s*=\s*(\d+)/);
      }
      const dungeonId = dungeonIdMatch ? parseInt(dungeonIdMatch[1]) : 0;
      
      // Try different patterns for time_stamp
      let timeStampMatch = entryContent.match(/\["time_stamp"\]\s*=\s*(\d+)/);
      if (!timeStampMatch) {
        timeStampMatch = entryContent.match(/time_stamp\s*=\s*(\d+)/);
      }
      const timeStamp = timeStampMatch ? parseInt(timeStampMatch[1]) : 0;
      
      // Try different patterns for week
      let weekMatch = entryContent.match(/\["week"\]\s*=\s*(\d+)/);
      if (!weekMatch) {
        weekMatch = entryContent.match(/week\s*=\s*(\d+)/);
      }
      const week = weekMatch ? parseInt(weekMatch[1]) : 0;

      const result = {
        unit,
        character_name: characterName || '',
        realm: realm || '',
        key_level: keyLevel,
        dungeon_id: dungeonId,
        time_stamp: timeStamp,
        week: week
      };
      
      console.log('Parsed entry:', result);
      return result;
    } catch (error) {
      console.error('Error parsing entry:', error.message);
      return null;
    }
  }

  parseFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.parse(content);
    } catch (error) {
      console.error('Error reading file:', error.message);
      return [];
    }
  }
}

module.exports = LuaParser;
