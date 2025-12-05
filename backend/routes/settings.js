// settings.js - API endpoints cho settings
const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");
const db = promisePool;

// router.get('/', async (req, res) => {
//     try {
//         const userId = req.user ? req.user.userId : 1;
        
//         const [settings] = await db.query(
//             "SELECT * FROM user_settings WHERE user_id = ?",
//             [userId]
//         );
        
//         if (settings.length > 0) {
//             res.json(settings[0]);
//         } else {
//             // Return default settings
//             res.json({
//                 theme: 'light',
//                 language: 'vi',
//                 notifications_enabled: true
//             });
//         }
//     } catch (error) {
//         console.error('❌ Get settings failed:', error);
//         res.status(500).json({ error: "Database error" });
//     }
// });

// router.put('/', async (req, res) => {
//     try {
//         const userId = req.user ? req.user.userId : 1;
//         const { theme, language, notifications_enabled } = req.body;
        
//         // Check if settings exist
//         const [existing] = await db.query(
//             "SELECT id FROM user_settings WHERE user_id = ?",
//             [userId]
//         );
        
//         if (existing.length > 0) {
//             // Update existing
//             await db.query(
//                 `UPDATE user_settings 
//                  SET theme = ?, language = ?, notifications_enabled = ?
//                  WHERE user_id = ?`,
//                 [theme || 'light', language || 'vi', notifications_enabled !== false, userId]
//             );
//         } else {
//             // Insert new
//             await db.query(
//                 `INSERT INTO user_settings (user_id, theme, language, notifications_enabled)
//                  VALUES (?, ?, ?, ?)`,
//                 [userId, theme || 'light', language || 'vi', notifications_enabled !== false]
//             );
//         }
        
//         res.json({ success: true, message: "Settings saved" });
//     } catch (error) {
//         console.error('❌ Save settings failed:', error);
//         res.status(500).json({ error: "Database error" });
//     }
// });

module.exports = router;