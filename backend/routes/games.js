const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");
const db = promisePool;

// Lấy high score cho game cụ thể
router.get("/high-score/:gameName", async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;
    const gameName = req.params.gameName;

    const [rows] = await db.query(
      "SELECT * FROM game_scores WHERE user_id = ? AND game_name = ?",
      [userId, gameName]
    );

    if (rows.length > 0) {
      res.json({ 
        success: true, 
        highScore: rows[0].high_score,
        lastScore: rows[0].last_play_score 
      });
    } else {
      // Tạo mới nếu chưa có
      await db.query(
        "INSERT INTO game_scores (user_id, game_name, high_score, last_play_score) VALUES (?, ?, 0, 0)",
        [userId, gameName]
      );
      res.json({ success: true, highScore: 0, lastScore: 0 });
    }
  } catch (error) {
    console.error('❌ Get high score failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Lưu điểm và cập nhật pet
router.post("/save-score", async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;
    const { gameName, score } = req.body;

    // 1. Lấy high score hiện tại
    const [rows] = await db.query(
      "SELECT * FROM game_scores WHERE user_id = ? AND game_name = ?",
      [userId, gameName]
    );

    let newHighScore = score;
    let isNewHighScore = false;

    if (rows.length > 0) {
      const currentHighScore = rows[0].high_score;
      isNewHighScore = score > currentHighScore;
      newHighScore = isNewHighScore ? score : currentHighScore;
      
      // Cập nhật score
      await db.query(
        "UPDATE game_scores SET high_score = ?, last_play_score = ?, updated_at = NOW() WHERE user_id = ? AND game_name = ?",
        [newHighScore, score, userId, gameName]
      );
    } else {
      // Tạo mới
      await db.query(
        "INSERT INTO game_scores (user_id, game_name, high_score, last_play_score) VALUES (?, ?, ?, ?)",
        [userId, gameName, score, score]
      );
      isNewHighScore = true;
    }

    // 2. Cập nhật pet stats (+10 happiness, -5 energy)
    const [petRows] = await db.query(
      "SELECT * FROM pets WHERE user_id = ?",
      [userId]
    );

    if (petRows.length > 0) {
      const pet = petRows[0];
      const newHappiness = Math.min(100, pet.happiness + 10);
      const newEnergy = Math.max(0, pet.energy - 5);

      await db.query(
        "UPDATE pets SET happiness = ?, energy = ? WHERE user_id = ?",
        [newHappiness, newEnergy, userId]
      );

      res.json({
        success: true,
        highScore: newHighScore,
        isNewHighScore,
        petUpdated: true,
        petStats: {
          happiness: newHappiness,
          energy: newEnergy
        }
      });
    } else {
      res.json({
        success: true,
        highScore: newHighScore,
        isNewHighScore,
        petUpdated: false
      });
    }

  } catch (error) {
    console.error('❌ Save score failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Lấy tất cả high scores của user
router.get("/all-scores", async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;

    const [rows] = await db.query(
      "SELECT game_name, high_score, last_play_score FROM game_scores WHERE user_id = ?",
      [userId]
    );

    const scores = {};
    rows.forEach(row => {
      scores[row.game_name] = {
        highScore: row.high_score,
        lastScore: row.last_play_score
      };
    });

    res.json({ success: true, scores });
  } catch (error) {
    console.error('❌ Get all scores failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;