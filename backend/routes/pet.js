// pet.js - ĐÃ SỬA LẠI
const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");  // ✅ Import đúng
const db = promisePool;  // ✅ Gán alias


// SỬA ENDPOINT /me ĐỂ ÁP DỤNG DECAY
router.get("/me", async (req, res) => {
  try {
    console.log('API called: /api/pet/me');
    const userId = req.user ? req.user.userId : 1;
    // Kiểm tra user có tồn tại không
        const [userRows] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
        
        if (userRows.length === 0) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ error: "User not found" });
        }
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    if (petRows.length === 0) {
      console.log('⚠️ No pet found for user:', userId, '- Creating new pet...');
      try {
          // Tạo pet mới với gold = 1000
          const [newPet] = await db.query(
              "INSERT INTO pets (user_id, name, hunger, happiness, health, energy, gold, xp, level, last_decay) VALUES (?, 'Baby', 100, 100, 100, 100, 1000, 0, 1, NOW())",
              [userId]
          );
          
          console.log('✅ Created new pet with ID:', newPet.insertId);
          
          // Lấy lại pet vừa tạo
          const [createdPetRows] = await db.query("SELECT * FROM pets WHERE id = ?", [newPet.insertId]);
          const petData = createdPetRows[0];
          console.log('✅ Pet created successfully:', petData);
          return res.json(petData);
      } catch (createError) {
          console.error('❌ Failed to create pet:', createError);
          return res.status(500).json({ error: "Failed to create pet" });
      }
    }
    
    let petData = petRows[0];
    console.log('✅ Pet loaded from MySQL before decay:', petData);
    
    // Áp dụng decay
    petData = await applyDecay(petData);
    
    console.log('✅ Pet after decay:', petData);
    res.json(petData);
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/feed", async (req, res) => {
  try {
    console.log('API called: /api/pet/feed', req.body);
    
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
    
    console.log('✅ Pet fed and updated in MySQL');
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

router.post("/play", (req, res) => {
  console.log('API called: /api/pet/play', req.body);
  res.json({ 
    status: "ok",
    hunger: 82,
    happiness: 85,
    energy: 77
  });
});

router.post("/study", (req, res) => {
  console.log('API called: /api/pet/study', req.body);
  res.json({ 
    status: "ok",
    happiness: 78,
    energy: 72,
    hunger: 83
  });
});

// Các endpoint action
router.post("/action/feed", async (req, res) => {
  try {
    console.log('API called: /api/pet/action/feed', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { itemId } = req.body;
    
    if (itemId) {
      // Nếu có itemId, sử dụng item
      const [itemRows] = await db.query("SELECT * FROM items WHERE id = ?", [itemId]);
      if (itemRows.length === 0) {
        return res.status(400).json({ error: "Item not found" });
      }
      const item = itemRows[0];
      
      // Lấy pet
      const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
      if (petRows.length === 0) {
        return res.status(404).json({ error: "Pet not found" });
      }
      const pet = petRows[0];
      
      // Tính stats mới
      const newHunger = Math.max(0, Math.min(100, pet.hunger + (item.hunger_change || 0)));
      const newHappiness = Math.max(0, Math.min(100, pet.happiness + (item.happiness_change || 0)));
      const newHealth = Math.max(0, Math.min(100, pet.health + (item.health_change || 0)));
      const newEnergy = Math.max(0, Math.min(100, pet.energy + (item.energy_change || 0)));
      
      // Cập nhật pet
      await db.query(
        `UPDATE pets SET hunger = ?, happiness = ?, health = ?, energy = ? WHERE user_id = ?`,
        [newHunger, newHappiness, newHealth, newEnergy, userId]
      );
      
      // Trừ item trong inventory
      await db.query(
        `UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0`,
        [userId, itemId]
      );
      
      console.log('✅ Pet fed with item');
      return res.json({ 
        status: "ok",
        message: "Đã cho pet ăn",
        stats: {
          hunger: newHunger,
          happiness: newHappiness,
          health: newHealth,
          energy: newEnergy
        }
      });
    } else {
      // Cho ăn cơ bản (không dùng item)
      const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
      if (petRows.length === 0) {
        return res.status(404).json({ error: "Pet not found" });
      }
      const pet = petRows[0];
      
      const newHunger = Math.max(0, pet.hunger - 15);
      const newHappiness = Math.min(100, pet.happiness + 5);
      
      await db.query(
        `UPDATE pets SET hunger = ?, happiness = ? WHERE user_id = ?`,
        [newHunger, newHappiness, userId]
      );
      
      console.log('✅ Pet fed (basic)');
      return res.json({ 
        status: "ok",
        message: "Đã cho pet ăn",
        stats: {
          hunger: newHunger,
          happiness: newHappiness,
          health: pet.health,
          energy: pet.energy
        }
      });
    }
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/action/study", async (req, res) => {
  try {
    console.log('API called: /api/pet/action/study', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { duration = 25, completed = true } = req.body;
    
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    if (petRows.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    const pet = petRows[0];
    
    // Tính toán hiệu ứng
    const energyLoss = Math.min(10 + Math.floor(duration / 5), 30);
    const xpGain = Math.floor(duration / 5) + (completed ? 10 : 0);
    const happinessLoss = Math.floor(duration / 15);
    const hungerGain = Math.floor(duration / 10);
    
    const newEnergy = Math.max(0, pet.energy - energyLoss);
    const newHappiness = Math.max(0, pet.happiness - happinessLoss);
    const newHunger = Math.min(100, pet.hunger + hungerGain);
    const newXp = pet.xp + xpGain;
    
    // Kiểm tra level up
    let newLevel = pet.level;
    let remainingXp = newXp;
    while (remainingXp >= (newLevel * 100)) {
      remainingXp -= (newLevel * 100);
      newLevel++;
    }
    
    await db.query(
      `UPDATE pets SET energy = ?, happiness = ?, hunger = ?, xp = ?, level = ? WHERE user_id = ?`,
      [newEnergy, newHappiness, newHunger, remainingXp, newLevel, userId]
    );
    
    console.log('✅ Study completed');
    return res.json({ 
      status: "ok",
      message: "Học tập hoàn thành",
      xp_gain: xpGain,
      level_up: newLevel > pet.level,
      stats: {
        energy: newEnergy,
        happiness: newHappiness,
        hunger: newHunger,
        xp: remainingXp,
        level: newLevel
      }
    });
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/action/play", async (req, res) => {
  try {
    console.log('API called: /api/pet/action/play', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { game_type = "default", score = 0 } = req.body;
    
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    if (petRows.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    const pet = petRows[0];
    
    // Tính toán dựa trên game
    let xpGain = 5;
    let happinessGain = 10;
    let energyLoss = 15;
    let hungerGain = 5;
    
    if (game_type === "quiz") {
      xpGain = Math.floor(score / 10);
      happinessGain = Math.floor(score / 20) + 5;
    } else if (game_type === "memory") {
      xpGain = Math.floor(score / 5);
      happinessGain = Math.floor(score / 10) + 8;
    }
    
    const newHappiness = Math.min(100, pet.happiness + happinessGain);
    const newEnergy = Math.max(0, pet.energy - energyLoss);
    const newHunger = Math.min(100, pet.hunger + hungerGain);
    const newXp = pet.xp + xpGain;
    
    // Kiểm tra level up
    let newLevel = pet.level;
    let remainingXp = newXp;
    while (remainingXp >= (newLevel * 100)) {
      remainingXp -= (newLevel * 100);
      newLevel++;
    }
    
    await db.query(
      `UPDATE pets SET happiness = ?, energy = ?, hunger = ?, xp = ?, level = ? WHERE user_id = ?`,
      [newHappiness, newEnergy, newHunger, remainingXp, newLevel, userId]
    );
    
    console.log('✅ Play completed');
    return res.json({ 
      status: "ok",
      message: "Chơi game hoàn thành",
      xp_gain: xpGain,
      level_up: newLevel > pet.level,
      stats: {
        happiness: newHappiness,
        energy: newEnergy,
        hunger: newHunger,
        xp: remainingXp,
        level: newLevel
      }
    });
    
  } catch (error) {
    console.error('❌ MySQL query failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Endpoint fix gold
router.post("/fix-gold", async (req, res) => {
  try {
    console.log('API called: /api/pet/fix-gold', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { gold = 1000 } = req.body;
    
    // Cập nhật gold của pet
    const [result] = await db.query(
      "UPDATE pets SET gold = ? WHERE user_id = ?",
      [gold, userId]
    );
    
    console.log(`✅ Gold fixed to ${gold} for user ${userId}`);
    
    res.json({
      success: true,
      message: `Đã cập nhật vàng thành ${gold}`,
      gold: gold
    });
    
  } catch (error) {
    console.error('❌ Fix gold failed:', error);
    res.status(500).json({ 
      success: false, 
      error: "Không thể sửa vàng" 
    });
  }
});

router.put('/update-name', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { name } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: "Pet name cannot be empty" });
        }
        
        await db.query(
            "UPDATE pets SET name = ? WHERE user_id = ?",
            [name.trim(), userId]
        );
        
        res.json({ success: true, message: "Pet name updated" });
    } catch (error) {
        console.error('❌ Update pet name failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});
// THÊM HÀM NÀY VÀO pet.js
async function applyDecay(petData) {
  try {
    const now = new Date();
    const lastDecay = new Date(petData.last_decay);
    const minutesPassed = (now - lastDecay) / (1000 * 60 ); // đổi thành phút
    
      if (minutesPassed >= 1) { // Mỗi 1 phút decay 1 lần
      const decayRate = Math.floor(minutesPassed); // Số lần decay (mỗi lần 1 phút)

      // Tính toán decay
      const hungerDecay = decayRate * 2; // Đói tăng
      const happinessDecay = decayRate * 1; // Vui vẻ giảm
      const energyDecay = decayRate * 3; // Năng lượng giảm

      
      petData.hunger = Math.min(100, petData.hunger + hungerDecay);
      petData.happiness = Math.max(0, petData.happiness - happinessDecay);
      petData.energy = Math.max(0, petData.energy - energyDecay);
      
      // Sức khỏe giảm nếu đói hoặc không vui
      if (petData.hunger > 80 || petData.happiness < 20) {
        petData.health = Math.max(0, petData.health - (decayRate * 0.5));
      }
      
      // Cập nhật thời gian decay cuối cùng
      await db.query(
        "UPDATE pets SET hunger = ?, happiness = ?, energy = ?, health = ?, last_decay = NOW() WHERE id = ?",
        [petData.hunger, petData.happiness, petData.energy, petData.health, petData.id]
      );
    }
    
    return petData;
  } catch (error) {
    console.error('❌ Decay calculation error:', error);
    return petData;
  }
}



module.exports = router;