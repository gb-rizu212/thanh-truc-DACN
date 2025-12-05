// productive.js
const express = require("express");
const router = express.Router();
const { promisePool } = require("../db");
const db = promisePool;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// ==================== Middleware ====================
// Middleware để lấy user từ token (đã có ở server_test.js)
// Đây chỉ là bảo vệ thêm nếu cần

// ==================== API Endpoints ====================

// 1. NOTES API (Journal & Notes)
router.get('/notes', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const type = req.query.type; // 'journal' hoặc 'note'
        
        let query = "SELECT * FROM notes WHERE user_id = ?";
        const params = [userId];
        
        if (type) {
            query += " AND type = ?";
            params.push(type);
        }
        
        query += " ORDER BY updated_at DESC";
        const [notes] = await db.query(query, params);
        
        res.json({ success: true, notes });
    } catch (error) {
        console.error('❌ Get notes failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/notes', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { title, content, type = 'note', mood, date } = req.body;
        
        const [result] = await db.query(
            "INSERT INTO notes (user_id, title, content, type, mood, date, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [userId, title, content, type, mood || null, date || new Date().toISOString().split('T')[0]]
        );
        
        res.json({ 
            success: true, 
            message: type === 'journal' ? "Đã lưu nhật ký" : "Đã lưu note",
            noteId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Save note failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.put('/notes/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const noteId = req.params.id;
        const { title, content, type, mood, date } = req.body;
        
        await db.query(
            "UPDATE notes SET title = ?, content = ?, type = ?, mood = ?, date = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
            [title, content, type || 'note', mood || null, date, noteId, userId]
        );
        
        res.json({ success: true, message: "Đã cập nhật" });
    } catch (error) {
        console.error('❌ Update note failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/notes/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const noteId = req.params.id;
        
        await db.query(
            "DELETE FROM notes WHERE id = ? AND user_id = ?",
            [noteId, userId]
        );
        
        res.json({ success: true, message: "Đã xóa" });
    } catch (error) {
        console.error('❌ Delete note failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 2. MOOD TRACKING API (Tâm trạng)
router.get('/mood-entries', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { date, month } = req.query;
        
        let query = "SELECT * FROM mood_entries WHERE user_id = ?";
        const params = [userId];
        
        if (date) {
            query += " AND date = ?";
            params.push(date);
        } else if (month) {
            // Format: YYYY-MM
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(month);
        }
        
        query += " ORDER BY date DESC";
        const [entries] = await db.query(query, params);
        
        // Convert to object format for calendar (giống localStorage)
        const moodData = {};
        entries.forEach(entry => {
            moodData[entry.date] = {
                mood: entry.mood,
                journal: entry.journal
            };
        });
        
        res.json({ success: true, entries, moodData });
    } catch (error) {
        console.error('❌ Get mood entries failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/mood-entries', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { date, mood, journal } = req.body;
        
        if (!date) {
            return res.status(400).json({ error: "Thiếu ngày" });
        }
        
        // Check if entry exists
        const [existing] = await db.query(
            "SELECT id FROM mood_entries WHERE user_id = ? AND date = ?",
            [userId, date]
        );
        
        if (existing.length > 0) {
            // Update existing
            await db.query(
                "UPDATE mood_entries SET mood = ?, journal = ?, updated_at = NOW() WHERE user_id = ? AND date = ?",
                [mood || null, journal || '', userId, date]
            );
        } else {
            // Insert new
            await db.query(
                "INSERT INTO mood_entries (user_id, date, mood, journal) VALUES (?, ?, ?, ?)",
                [userId, date, mood || null, journal || '']
            );
        }
        
        res.json({ success: true, message: "Đã lưu tâm trạng" });
    } catch (error) {
        console.error('❌ Save mood entry failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 3. TIMER API
router.get('/timer/presets', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const [presets] = await db.query(
            "SELECT * FROM timer_presets WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        res.json({ success: true, presets });
    } catch (error) {
        console.error('❌ Get timer presets failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/timer/presets', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { label, minutes } = req.body;
        
        if (!label || !minutes) {
            return res.status(400).json({ error: "Thiếu thông tin preset" });
        }
        
        const [result] = await db.query(
            "INSERT INTO timer_presets (user_id, label, minutes) VALUES (?, ?, ?)",
            [userId, label, minutes]
        );
        
        res.json({ 
            success: true, 
            message: "Đã lưu preset",
            presetId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Save timer preset failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/timer/presets/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const presetId = req.params.id;
        
        await db.query(
            "DELETE FROM timer_presets WHERE id = ? AND user_id = ?",
            [presetId, userId]
        );
        
        res.json({ success: true, message: "Đã xóa preset" });
    } catch (error) {
        console.error('❌ Delete timer preset failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// Timer history
router.get('/timer/history', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const [history] = await db.query(
            "SELECT * FROM timer_history WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50",
            [userId]
        );
        res.json({ success: true, history });
    } catch (error) {
        console.error('❌ Get timer history failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/timer/history', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { duration } = req.body; // duration in seconds
        
        if (!duration) {
            return res.status(400).json({ error: "Thiếu thời gian" });
        }
        
        const [result] = await db.query(
            "INSERT INTO timer_history (user_id, duration) VALUES (?, ?)",
            [userId, duration]
        );
        
        res.json({ 
            success: true, 
            message: "Đã lưu lịch sử timer",
            historyId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Save timer history failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 4. TASKS API
router.get('/tasks', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { completed } = req.query;
        
        let query = "SELECT * FROM tasks WHERE user_id = ?";
        const params = [userId];
        
        if (completed !== undefined) {
            query += " AND completed = ?";
            params.push(completed === 'true');
        }
        
        query += " ORDER BY created_at DESC";
        const [tasks] = await db.query(query, params);
        res.json({ success: true, tasks });
    } catch (error) {
        console.error('❌ Get tasks failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/tasks', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { title, notes, due_date, completed = false } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: "Thiếu tiêu đề task" });
        }
        
        const [result] = await db.query(
            "INSERT INTO tasks (user_id, title, notes, due_date, completed) VALUES (?, ?, ?, ?, ?)",
            [userId, title, notes || '', due_date || null, completed]
        );
        
        res.json({ 
            success: true, 
            message: "Đã tạo task",
            taskId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Create task failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.put('/tasks/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const taskId = req.params.id;
        const { title, notes, due_date, completed } = req.body;
        
        await db.query(
            "UPDATE tasks SET title = ?, notes = ?, due_date = ?, completed = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
            [title, notes || '', due_date || null, completed || false, taskId, userId]
        );
        
        res.json({ success: true, message: "Đã cập nhật task" });
    } catch (error) {
        console.error('❌ Update task failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/tasks/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const taskId = req.params.id;
        
        await db.query(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [taskId, userId]
        );
        
        res.json({ success: true, message: "Đã xóa task" });
    } catch (error) {
        console.error('❌ Delete task failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 5. CALENDAR EVENTS API
router.get('/calendar/events', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { date, month } = req.query;
        
        let query = "SELECT * FROM calendar_events WHERE user_id = ?";
        const params = [userId];
        
        if (date) {
            query += " AND date = ?";
            params.push(date);
        } else if (month) {
            query += " AND DATE_FORMAT(date, '%Y-%m') = ?";
            params.push(month);
        }
        
        query += " ORDER BY date, id";
        const [events] = await db.query(query, params);
        
        // Group by date for calendar display (giống localStorage)
        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.date]) {
                eventsByDate[event.date] = [];
            }
            eventsByDate[event.date].push({
                id: event.id,
                task: event.task
            });
        });
        
        res.json({ success: true, events, eventsByDate });
    } catch (error) {
        console.error('❌ Get calendar events failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/calendar/events', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { date, task } = req.body;
        
        if (!date || !task) {
            return res.status(400).json({ error: "Thiếu ngày hoặc nội dung" });
        }
        
        const [result] = await db.query(
            "INSERT INTO calendar_events (user_id, date, task) VALUES (?, ?, ?)",
            [userId, date, task]
        );
        
        res.json({ 
            success: true, 
            message: "Đã thêm event",
            eventId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Create calendar event failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/calendar/events/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const eventId = req.params.id;
        
        await db.query(
            "DELETE FROM calendar_events WHERE id = ? AND user_id = ?",
            [eventId, userId]
        );
        
        res.json({ success: true, message: "Đã xóa event" });
    } catch (error) {
        console.error('❌ Delete calendar event failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 6. MOTIVATION MEDIA API
router.get('/motivation/media', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const [media] = await db.query(
            "SELECT * FROM motivation_media WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        res.json({ success: true, media });
    } catch (error) {
        console.error('❌ Get motivation media failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// Helper function để lưu file
function saveBase64ToFile(base64Data, filename) {
    // Tạo thư mục uploads nếu chưa có
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // Xóa data:image/jpeg;base64, phần đầu
    const base64Image = base64Data.split(';base64,').pop();
    
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
    
    return filePath;
}

router.post('/motivation/media', upload.single('file'), async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        
        if (!req.file && !req.body.dataUrl) {
            return res.status(400).json({ error: "Không có file hoặc dataUrl" });
        }
        
        let dataUrl, fileType, fileName;
        
        if (req.file) {
            // Nếu upload qua form
            const file = req.file;
            const fileData = fs.readFileSync(file.path);
            const base64Data = fileData.toString('base64');
            dataUrl = `data:${file.mimetype};base64,${base64Data}`;
            fileType = file.mimetype.startsWith('video') ? 'video' : 'image';
            fileName = req.body.name || file.originalname;
            
            // Xóa file tạm
            fs.unlinkSync(file.path);
        } else {
            // Nếu gửi base64 trực tiếp
            dataUrl = req.body.dataUrl;
            fileType = req.body.type || 'image';
            fileName = req.body.name || `media_${Date.now()}`;
        }
        
        const [result] = await db.query(
            "INSERT INTO motivation_media (user_id, type, data_url, name) VALUES (?, ?, ?, ?)",
            [userId, fileType, dataUrl, fileName]
        );
        
        res.json({ 
            success: true, 
            message: "Đã upload media",
            mediaId: result.insertId 
        });
    } catch (error) {
        console.error('❌ Upload motivation media failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete('/motivation/media/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const mediaId = req.params.id;
        
        await db.query(
            "DELETE FROM motivation_media WHERE id = ? AND user_id = ?",
            [mediaId, userId]
        );
        
        res.json({ success: true, message: "Đã xóa media" });
    } catch (error) {
        console.error('❌ Delete motivation media failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 7. STUDY SESSIONS API (cho office_room)
router.get('/study-sessions', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const [sessions] = await db.query(
            "SELECT * FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", 
            [userId]
        );
        
        // Tính tổng thời gian học
        const [totalResult] = await db.query(
            "SELECT SUM(duration) as total_minutes FROM study_sessions WHERE user_id = ?",
            [userId]
        );
        
        res.json({ 
            success: true, 
            sessions,
            total_minutes: totalResult[0].total_minutes || 0
        });
    } catch (error) {
        console.error('❌ Get study sessions failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

router.post('/study-sessions', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { duration, xp_earned } = req.body;
        
        const [result] = await db.query(
            "INSERT INTO study_sessions (user_id, duration, xp_earned) VALUES (?, ?, ?)",
            [userId, duration, xp_earned || 0]
        );
        
        res.json({ success: true, message: "Đã lưu session học tập" });
    } catch (error) {
        console.error('❌ Save study session failed:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// 8. MIGRATION API - Để chuyển dữ liệu từ localStorage sang database
router.post('/migrate/localstorage', async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : 1;
        const { data, type } = req.body;
        
        if (!data || !type) {
            return res.status(400).json({ error: "Thiếu dữ liệu hoặc loại" });
        }
        
        let migratedCount = 0;
        
        switch(type) {
            case 'notes':
                // data là mảng các notes từ localStorage
                for (const note of data) {
                    await db.query(
                        "INSERT INTO notes (user_id, title, content, type, mood, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                            userId, 
                            note.title || 'Không tiêu đề',
                            note.content || '',
                            note.type || 'note',
                            note.mood || null,
                            note.date || new Date().toISOString().split('T')[0],
                            new Date(note.createdAt || Date.now()),
                            new Date(note.updatedAt || Date.now())
                        ]
                    );
                    migratedCount++;
                }
                break;
                
            case 'mood_entries':
                // data là object { date: { mood, journal } }
                for (const [date, entry] of Object.entries(data)) {
                    await db.query(
                        "INSERT INTO mood_entries (user_id, date, mood, journal) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE mood = VALUES(mood), journal = VALUES(journal)",
                        [userId, date, entry.mood || null, entry.journal || '']
                    );
                    migratedCount++;
                }
                break;
                
            case 'tasks':
                for (const task of data) {
                    await db.query(
                        "INSERT INTO tasks (user_id, title, notes, due_date, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [
                            userId,
                            task.title,
                            task.notes || '',
                            task.due_date || null,
                            task.completed || false,
                            new Date(task.createdAt || Date.now()),
                            new Date(task.updatedAt || Date.now())
                        ]
                    );
                    migratedCount++;
                }
                break;
        }
        
        res.json({ 
            success: true, 
            message: `Đã migrate ${migratedCount} bản ghi từ localStorage`,
            migratedCount 
        });
    } catch (error) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({ error: "Migration error" });
    }
});

module.exports = router;