// auth.js
const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");  // ✅ Import đúng
const db = promisePool;  // ✅ Gán alias
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing" });

    const [exists] = await db.query("SELECT id FROM users WHERE username=?", [username]);
    if (exists.length) return res.status(400).json({ error: "User exists" });

    // Không hash, lưu trực tiếp
    const [result] = await db.query("INSERT INTO users (username,password) VALUES (?,?)", [username, password]);
    const userId = result.insertId;

    // tạo pet mặc định cho user
    await db.query(`
      INSERT INTO pets (user_id, name, hunger, happiness, health, energy, gold, xp, level, last_decay)
      VALUES (?, 'Pet', 100,100,100,100, 0, 0, 1, NOW())
    `, [userId]);

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ status: "ok", token, userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE username=?", [username]);
    if (rows.length === 0) return res.status(400).json({ error: "Invalid" });

    const user = rows[0];
    // So sánh trực tiếp, không dùng bcrypt
    if (password !== user.password) {
      return res.status(400).json({ error: "Invalid" });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ status: "ok", token, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// API endpoints cho settings
router.get('/me', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const [users] = await db.query(
            "SELECT id, username, created_at FROM users WHERE id = ?",
            [userId]
        );
        
        if (users.length > 0) {
            res.json(users[0]);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.error('❌ Get user info failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.put('/update-password', async (req, res) => {
    try {
      console.log('🔐 Update password attempt:', req.body);
        const userId = req.user ? req.user.userId : 1;
        const { current, new: newPassword } = req.body;
        
        if (!current || !newPassword) {
          console.log('❌ Missing fields:', { current, newPassword });
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        // Lấy user hiện tại
        const [users] = await db.query(
            "SELECT password FROM users WHERE id = ?",
            [userId]
        );
        
        if (users.length === 0) {
          console.log('❌ User not found:', userId);
            return res.status(404).json({ error: "User not found" });
        }
        
        const user = users[0];
        
        // Kiểm tra mật khẩu hiện tại (so sánh trực tiếp vì không hash)
        if (current !== user.password) {
          console.log('❌ Current password incorrect');
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Cập nhật mật khẩu mới (lưu trực tiếp, không hash)
        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [newPassword, userId]
        );
        console.log('✅ Password updated for user:', userId);
        res.json({ success: true, message: "Password updated" });
    } catch (error) {
        console.error('❌ Update password failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});


    
router.put('/update-password', async (req, res) => {
    try {
      console.log('🔐 Update password attempt:', req.body);
        const userId = req.user ? req.user.userId : 1;
        const { current, new: newPassword } = req.body;
        
        if (!current || !newPassword) {
          console.log('❌ Missing fields:', { current, newPassword });
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        // Lấy user hiện tại
        const [users] = await db.query(
            "SELECT password FROM users WHERE id = ?",
            [userId]
        );
        
        if (users.length === 0) {
          console.log('❌ User not found:', userId);
            return res.status(404).json({ error: "User not found" });
        }
        
        const user = users[0];
        
        // Kiểm tra mật khẩu hiện tại
        const ok = await bcrypt.compare(current, user.password);
        if (!ok) {
          console.log('❌ Current password incorrect');
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Mã hóa mật khẩu mới
        const hash = await bcrypt.hash(newPassword, 10);
        
        // Cập nhật mật khẩu
        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hash, userId]
        );
        console.log('✅ Password updated for user:', userId);
        res.json({ success: true, message: "Password updated" });
    } catch (error) {
        console.error('❌ Update password failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/delete-account', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        
        // Delete user and all related data (cascade delete should handle this)
        await db.query("DELETE FROM users WHERE id = ?", [userId]);
        
        res.json({ success: true, message: "Account deleted" });
    } catch (error) {
        console.error('❌ Delete account failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// Thêm vào auth.js sau các endpoint khác
router.post('/fix-user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Kiểm tra user có tồn tại không
        const [users] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Kiểm tra pet có tồn tại không
        const [pets] = await db.query("SELECT id FROM pets WHERE user_id = ?", [userId]);
        
        if (pets.length === 0) {
            // Tạo pet nếu chưa có
            await db.query(`
                INSERT INTO pets (user_id, name, hunger, happiness, health, energy, gold, xp, level, last_decay)
                VALUES (?, 'Baby', 100, 100, 100, 100, 1000, 0, 1, NOW())
            `, [userId]);
            
            return res.json({ 
                success: true, 
                message: "Pet created successfully",
                userId: userId 
            });
        }
        
        res.json({ 
            success: true, 
            message: "User and pet already exist",
            userId: userId 
        });
        
    } catch (error) {
        console.error('❌ Fix user failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router;
