// sync_users.js
const { promisePool } = require('./db');
const db = promisePool;
const bcrypt = require('bcrypt');

async function syncMockUsers() {
    try {
        console.log('🔄 Syncing mock users to MySQL...');
        
        // Mock users từ server_test.js
        const mockUsers = [
            { username: 'test', password: 'test' }
        ];
        
        for (const user of mockUsers) {
            // Kiểm tra nếu user đã tồn tại
            const [existing] = await db.query(
                "SELECT id FROM users WHERE username = ?", 
                [user.username]
            );
            
            if (existing.length === 0) {
                // Tạo user mới
                // const hash = await bcrypt.hash(user.password, 10);
                const [result] = await db.query(
                    "INSERT INTO users (username, password) VALUES (?, ?)",
                    [user.username, hash]  // lưu plaintext
                );
                
                const userId = result.insertId;
                
                // Tạo pet cho user
                await db.query(`
                    INSERT INTO pets (user_id, name, hunger, happiness, health, energy, gold, xp, level, last_decay)
                    VALUES (?, 'Baby', 100, 100, 100, 100, 1000, 0, 1, NOW())
                `, [userId]);
                
                console.log(`✅ Created user: ${user.username} (ID: ${userId})`);
            } else {
                console.log(`⚠️ User already exists: ${user.username}`);
            }
        }
        
        console.log('✅ Sync completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncMockUsers();