// console cho dễ phát hiện lỗi để kiểm tra
const { promisePool } = require('./db');
const db = promisePool;

async function checkAndFixData() {
    try {
        console.log('🔍 Kiểm tra dữ liệu database...\n');
        
        // 1. Kiểm tra users
        const [users] = await db.query("SELECT * FROM users");
        console.log(`👤 Users: ${users.length} người dùng`);
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Username: ${user.username}`);
        });
        
        // 2. Kiểm tra pets
        const [pets] = await db.query("SELECT * FROM pets");
        console.log(`\n🐾 Pets: ${pets.length} thú cưng`);
        pets.forEach(pet => {
            console.log(`  - ID: ${pet.id}, User ID: ${pet.user_id}, Name: ${pet.name}, Gold: ${pet.gold}`);
            console.log(`    Stats: Đói=${pet.hunger}, Vui=${pet.happiness}, SK=${pet.health}, NL=${pet.energy}`);
        });
        
        // 3. Kiểm tra items
        const [items] = await db.query("SELECT COUNT(*) as count FROM items");
        console.log(`\n🛒 Items: ${items[0].count} vật phẩm trong shop`);
        
        // 4. Kiểm tra inventory
        const [inventory] = await db.query(`
            SELECT i.name, inv.quantity 
            FROM inventory inv
            JOIN items i ON inv.item_id = i.id
            WHERE inv.user_id = 1
        `);
        console.log(`\n🎒 Inventory của user 1:`);
        if (inventory.length > 0) {
            inventory.forEach(item => {
                console.log(`  - ${item.name}: ${item.quantity} cái`);
            });
        } else {
            console.log('  - Trống');
        }
        
        // 5. Tự động fix nếu cần
        console.log('\n🔧 Kiểm tra và tự động fix...');
        
        // Kiểm tra user test
        if (users.length === 0) {
            console.log('⚠️ Không có user, đang tạo user test...');
            await db.query("INSERT INTO users (username, password) VALUES ('test', 'test')");
            console.log('✅ Đã tạo user test');
        }
        
        // Kiểm tra pet cho user 1
        const [user1Pet] = await db.query("SELECT * FROM pets WHERE user_id = 1");
        if (user1Pet.length === 0) {
            console.log('⚠️ Không có pet cho user 1, đang tạo...');
            await db.query(`
                INSERT INTO pets (user_id, name, hunger, happiness, health, energy, gold, xp, level, last_decay)
                VALUES (1, 'Baby', 100, 100, 100, 100, 1000, 0, 1, NOW())
            `);
            console.log('✅ Đã tạo pet cho user 1');
        }
        
        // Kiểm tra gold âm
        await db.query("UPDATE pets SET gold = 1000 WHERE gold < 0 OR gold IS NULL");
        console.log('✅ Đảm bảo gold không âm');
        
        // Kiểm tra stats vượt quá giới hạn
        await db.query(`
            UPDATE pets SET 
                hunger = GREATEST(0, LEAST(100, hunger)),
                happiness = GREATEST(0, LEAST(100, happiness)),
                health = GREATEST(0, LEAST(100, health)),
                energy = GREATEST(0, LEAST(100, energy))
        `);
        console.log('✅ Đảm bảo stats trong khoảng 0-100');
        
        console.log('\n✅ Kiểm tra và fix hoàn tất!');
        
        // Hiển thị kết quả cuối
        const [finalPets] = await db.query("SELECT * FROM pets WHERE user_id = 1");
        if (finalPets[0]) {
            console.log('\n📊 Kết quả cuối cùng:');
            console.log(`Pet: ${finalPets[0].name}`);
            console.log(`Gold: ${finalPets[0].gold}`);
            console.log(`Stats: Đói=${finalPets[0].hunger}, Vui=${finalPets[0].happiness}, SK=${finalPets[0].health}, NL=${finalPets[0].energy}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra data:', error);
        process.exit(1);
    }
}

checkAndFixData();