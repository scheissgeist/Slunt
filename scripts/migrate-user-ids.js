/**
 * Migration Script: Add platform prefixes to user IDs
 * Converts legacy user IDs to new format (platform:username)
 *
 * Run with: node scripts/migrate-user-ids.js
 */

const fs = require('fs');
const path = require('path');
const UserIdentification = require('../src/services/UserIdentification');

console.log('🔄 User ID Migration Script');
console.log('============================\n');

const dataDir = path.join(__dirname, '../data');
const backupDir = path.join(__dirname, '../data/migration-backup');

// Files that contain user IDs
const filesToMigrate = [
  'memory_long_term.json',
  'peer_influence.json',
  'relationships.json',
  'gossip_mill.json',
  'contradictions.json',
  'personality_infection.json',
  'collective_unconscious.json',
  'gold_system.json',
  'user_reputation.json'
];

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

let totalFiles = 0;
let migratedFiles = 0;
let totalUsers = 0;
let migratedUsers = 0;

for (const filename of filesToMigrate) {
  const filePath = path.join(dataDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped ${filename} (does not exist)`);
    continue;
  }

  totalFiles++;

  try {
    console.log(`\n📄 Processing ${filename}...`);

    // Backup original file
    const backupPath = path.join(backupDir, filename);
    fs.copyFileSync(filePath, backupPath);
    console.log(`   ✅ Backed up to ${backupPath}`);

    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Detect default platform based on filename
    let defaultPlatform = 'unknown';
    if (filename.includes('discord')) defaultPlatform = 'discord';
    else if (filename.includes('twitch')) defaultPlatform = 'twitch';
    else if (filename.includes('coolhole')) defaultPlatform = 'coolhole';

    // Migrate data structure
    let migrated = data;
    let userCount = 0;

    if (Array.isArray(data)) {
      // Array of objects with userId field
      migrated = data.map(item => {
        if (item.userId && !UserIdentification.isPrefixed(item.userId)) {
          item.userId = UserIdentification.createUserId(defaultPlatform, item.userId);
          userCount++;
        }
        if (item.username && !item.userId) {
          item.userId = UserIdentification.createUserId(defaultPlatform, item.username);
          userCount++;
        }
        return item;
      });
    } else if (typeof data === 'object') {
      // Object with user IDs as keys
      migrated = {};
      for (const [key, value] of Object.entries(data)) {
        const newKey = UserIdentification.isPrefixed(key)
          ? key
          : UserIdentification.createUserId(defaultPlatform, key);

        if (newKey !== key) {
          userCount++;
        }

        // Also migrate nested user IDs
        if (typeof value === 'object' && value !== null) {
          if (value.userId && !UserIdentification.isPrefixed(value.userId)) {
            value.userId = UserIdentification.createUserId(defaultPlatform, value.userId);
          }
          if (value.users && Array.isArray(value.users)) {
            value.users = value.users.map(user =>
              UserIdentification.isPrefixed(user)
                ? user
                : UserIdentification.createUserId(defaultPlatform, user)
            );
          }
        }

        migrated[newKey] = value;
      }
    }

    // Write migrated data
    fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2));

    console.log(`   ✅ Migrated ${userCount} user IDs`);
    console.log(`   ✅ Saved to ${filePath}`);

    migratedFiles++;
    totalUsers += userCount;
    migratedUsers += userCount;

  } catch (error) {
    console.error(`   ❌ Error migrating ${filename}:`, error.message);
  }
}

console.log('\n============================');
console.log('Migration Complete!\n');
console.log(`📊 Statistics:`);
console.log(`   Files processed: ${totalFiles}`);
console.log(`   Files migrated: ${migratedFiles}`);
console.log(`   User IDs migrated: ${migratedUsers}`);
console.log(`\n💾 Backups saved to: ${backupDir}`);
console.log(`\n✅ You can now use platform-prefixed user IDs!`);
console.log(`   Example: discord:alice, twitch:bob, coolhole:charlie\n`);
