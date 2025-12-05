// items.js - ĐÃ SỬA LẠI
const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");  // ✅ Import đúng
const db = promisePool;  // ✅ Gán alias

// List items (public)
router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM items");
  res.json(rows);
});

// Get inventory grouped by type
router.get("/inventory/grouped", async (req, res) => {
  try {
    console.log('API called: /api/items/inventory/grouped');
    const userId = req.user ? req.user.userId : 1;

    const sql = `
        SELECT 
            inventory.item_id,
            items.name,
            items.type,
            items.hunger_change,
            items.happiness_change,
            items.health_change,
            items.energy_change,
            items.price,
            items.img,
            SUM(inventory.quantity) AS quantity
        FROM inventory
        JOIN items ON inventory.item_id = items.id
        WHERE inventory.user_id = ?
        GROUP BY inventory.item_id
    `;
    const [inventoryRows] = await db.query(sql, [userId]);
    
    // Nhóm theo type
    const grouped = {
      food: inventoryRows.filter(item => item.type === 'food'),
      potion: inventoryRows.filter(item => item.type === 'potion'),
    };
    
    console.log(`📊 Loaded from MySQL: ${grouped.food.length} food, ${grouped.potion.length} potion`);
    res.json(grouped);
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    // Fallback data
    const mockData = {
      food: [
        { 
          id: 1, 
          name: "Táo", 
          type: "food", 
          price: 5, 
          effect: "Đói: +5, Năng lượng: +3", 
          quantity: 4, 
          img: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNENBRjUwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPuKZvummmTwvdGV4dD4KPC9zdmc+" 
        }
      ],
      potion: [
        { 
          id: 11, 
          name: "Potion Sức khỏe", 
          type: "potion", 
          price: 20, 
          effect: "Sức khỏe: +10", 
          quantity: 3, 
          img: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Y0NDMzNiIvPgo8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIj7imb48L3RleHQ+Cjwvc3ZnPg==" 
        }
      ]
    };
    
    console.log('📊 Sending mock data with food and potion items');
    res.json(mockData);
  }
});

// Use item
router.post("/use", async (req, res) => {
  try {
    console.log('API called: /api/items/use', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: "Missing itemId" });
    }
    
    // Lấy thông tin item
    const [itemRows] = await db.query("SELECT * FROM items WHERE id = ?", [itemId]);
    if (itemRows.length === 0) {
      return res.status(400).json({ error: "Item not found" });
    }
    const item = itemRows[0];
    
    // Lấy thông tin pet hiện tại
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    if (petRows.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    const pet = petRows[0];
    
    // Tính toán stats mới
    const newHunger = Math.max(0, Math.min(100, pet.hunger + (item.hunger_change || 0)));
    const newHappiness = Math.max(0, Math.min(100, pet.happiness + (item.happiness_change || 0)));
    const newHealth = Math.max(0, Math.min(100, pet.health + (item.health_change || 0)));
    const newEnergy = Math.max(0, Math.min(100, pet.energy + (item.energy_change || 0)));
    
    // Cập nhật pet trong database
    await db.query(
      `UPDATE pets SET hunger = ?, happiness = ?, health = ?, energy = ? WHERE user_id = ?`,
      [newHunger, newHappiness, newHealth, newEnergy, userId]
    );
    
    // Giảm số lượng item trong inventory
    await db.query(
      `UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0`,
      [userId, itemId]
    );
    
    console.log('✅ Item used and updated in MySQL');
    res.json({ 
      status: "ok",
      effects: {
        hunger_change: item.hunger_change || 0,
        happiness_change: item.happiness_change || 0,
        health_change: item.health_change || 0,
        energy_change: item.energy_change || 0
      }
    });
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Shop endpoints
router.get("/shop", async (req, res) => {
  try {
    console.log('API called: /api/items/shop');
    const sql = `
        SELECT 
            id, 
            name, 
            price, 
            img as image
        FROM items 
        WHERE price > 0 
        ORDER BY price ASC
    `;
    const [results] = await db.query(sql);
    
    console.log(`✅ Found ${results.length} items in shop`);
    
    const formattedItems = results.map(item => ({
      id: item.id || 0,
      name: item.name || 'Không tên',
      price: item.price || 0,
      image: item.image || 'placeholder.png'
    }));
    
    res.json({ 
      success: true,
      items: formattedItems 
    });
  } catch (err) {
    console.error("❌ MySQL shop failed:", err);
    
    // Fallback data
    const mockItems = [
      {
        id: 1,
        name: "Cheri",
        price: 5,
        image: "cherry.png",
      }
    ];
    res.json({ 
      success: true,
      items: mockItems 
    });
  }
});

router.post("/shop/buy", async (req, res) => {
  try {
    console.log('API called: /api/items/shop/buy', req.body);
    
    const userId = req.user ? req.user.id : 1;
    const { item_id, quantity = 1 } = req.body;
    
    console.log(`🛒 User ${userId} buying item ${item_id}, quantity ${quantity}`);

    if (!item_id) {
      return res.status(400).json({ 
        success: false,
        error: "Thiếu item_id" 
      });
    }

    // 1. Kiểm tra item có tồn tại
    const [itemRows] = await db.query("SELECT * FROM items WHERE id = ?", [item_id]);
    
    if (itemRows.length === 0) {
      console.log(`❌ Item ${item_id} not found in items table`);
      return res.status(404).json({ 
        success: false,
        error: "Vật phẩm không tồn tại" 
      });
    }
    
    const item = itemRows[0];
    const totalCost = item.price * quantity;
    
    // 2. Kiểm tra pet có đủ gold không
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    
    if (petRows.length === 0) {
      console.log(`❌ Pet not found for user ${userId}`);
      return res.status(404).json({ 
        success: false,
        error: "Không tìm thấy pet" 
      });
    }
    
    const pet = petRows[0];
    
    if (pet.gold < totalCost) {
      console.log(`❌ Not enough gold: ${pet.gold} < ${totalCost}`);
      return res.status(400).json({ 
        success: false,
        error: "Không đủ gold",
        current_gold: pet.gold,
        required_gold: totalCost
      });
    }

    // 3. Trừ gold của pet
    await db.query("UPDATE pets SET gold = gold - ? WHERE user_id = ?", [totalCost, userId]);
    
    // 4. Thêm hoặc tăng số lượng trong inventory
    const updateInventorySQL = `
        INSERT INTO inventory (user_id, item_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
    
    await db.query(updateInventorySQL, [userId, item_id, quantity]);
    
    res.json({ 
      success: true, 
      message: "Mua vật phẩm thành công!",
      item: {
        id: item.id,
        name: item.name,
        quantity: quantity
      },
      gold_spent: totalCost,
      remaining_gold: pet.gold - totalCost
    });
    
  } catch (err) {
    console.error("❌ Error buying item:", err);
    res.status(500).json({ 
      success: false, 
      error: "Lỗi database",
      details: err.message 
    });
  }
});

// Get shop items with full details
router.get("/shop/items", async (req, res) => {
  try {
    console.log('API called: /api/items/shop/items');
    const sql = `
        SELECT 
            id, 
            name, 
            type,
            hunger_change,
            happiness_change,
            health_change,
            energy_change,
            price, 
            img as image
        FROM items 
        WHERE price > 0 
        ORDER BY price ASC
    `;
    const [results] = await db.query(sql);
    
    console.log(`✅ Found ${results.length} items in shop`);
    
    const formattedItems = results.map(item => ({
      id: item.id || 0,
      name: item.name || 'Không tên',
      type: item.type || 'food',
      price: item.price || 0,
      image: item.image || 'placeholder.png',
      effects: {
        hunger: item.hunger_change || 0,
        happiness: item.happiness_change || 0,
        health: item.health_change || 0,
        energy: item.energy_change || 0
      }
    }));
    
    res.json({ 
      success: true,
      items: formattedItems 
    });
  } catch (err) {
    console.error("❌ MySQL shop failed:", err);
    res.status(500).json({ 
      success: false,
      error: "Database error" 
    });
  }
});

module.exports = router;