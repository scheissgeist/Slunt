/**
 * Cleanup script for relationships.json
 * Removes system messages and invalid entries
 */

const fs = require('fs').promises;
const path = require('path');

async function cleanupRelationships() {
  const filePath = path.join(__dirname, '..', 'data', 'relationships.json');
  
  try {
    console.log('🧹 Reading relationships.json...');
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    console.log(`📊 Original: ${parsed.relationships.length} relationships`);
    
    // Filter out invalid relationships
    const cleaned = parsed.relationships.filter(([key, rel]) => {
      if (!rel || !rel.users || rel.users.length < 2) {
        console.log(`❌ Removing invalid relationship: ${key}`);
        return false;
      }
      
      // Check if any user is a system message - more thorough check
      const hasSystemMessage = rel.users.some(u => 
        u && (
          u.includes('joined (aliases') || 
          u.includes(' joined (alias') ||
          u.includes('left (alias') ||
          u.includes(' left ') ||
          u.includes('(aliases') ||
          u === 'joined' ||
          u === 'left'
        )
      );
      
      if (hasSystemMessage) {
        console.log(`❌ Removing system message relationship: ${key} (users: ${rel.users.join(', ')})`);
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ Cleaned: ${cleaned.length} relationships`);
    console.log(`🗑️  Removed: ${parsed.relationships.length - cleaned.length} invalid entries`);
    
    // Save cleaned data
    const cleanedData = {
      ...parsed,
      relationships: cleaned,
      cleanedAt: Date.now()
    };
    
    // Backup original
    const backupPath = path.join(__dirname, '..', 'data', 'relationships.backup.json');
    console.log('💾 Creating backup...');
    await fs.writeFile(backupPath, data);
    
    // Write cleaned data
    console.log('💾 Writing cleaned data...');
    await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2));
    
    console.log('✅ Cleanup complete!');
    console.log(`📦 Backup saved to: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupRelationships();
