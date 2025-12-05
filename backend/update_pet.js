// update_pet.js
const { promisePool } = require('./db');
const db = promisePool;

async function updatePet(userId, updates) {
    try {
        console.log('🔄 Cập nhật pet...');
        
        // Cập nhật pet
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
            if (key !== 'user_id' && key !== 'id') {
                updateFields.push(`${key} = ?`);
                updateValues.push(updates[key]);
            }
        });
        
        updateValues.push(userId);
        
        const sql = `UPDATE pets SET ${updateFields.join(', ')} WHERE user_id = ?`;
        
        await db.query(sql, updateValues);
        
        console.log(`✅ Đã cập nhật pet cho user ${userId}:`);
        console.log(updates);
        
        // Hiển thị kết quả
        const [pet] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
        if (pet[0]) {
            console.log('\n📊 Pet sau khi cập nhật:');
            console.log(`- Name: ${pet[0].name}`);
            console.log(`- Gold: ${pet[0].gold}`);
            console.log(`- Stats: Đói=${pet[0].hunger}, Vui=${pet[0].happiness}, SK=${pet[0].health}, NL=${pet[0].energy}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi cập nhật pet:', error);
        process.exit(1);
    }
}

// Ví dụ sử dụng: node update_pet.js 1 '{"gold": 5000, "hunger": 50}'
const userId = process.argv[2] || 1;
let updates = {};
try {
    updates = JSON.parse(process.argv[3] || '{}');
} catch (e) {
    updates = {};
}

// Mặc định nếu không có tham số
if (Object.keys(updates).length === 0) {
    updates = {
        name: 'Baby',
        hunger: 100,
        happiness: 100,
        health: 100,
        energy: 100,
        gold: 1000
    };
}

updatePet(userId, updates);