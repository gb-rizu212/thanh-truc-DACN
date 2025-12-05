// server_test.js - SỬA LẠI PHẦN STATIC FILE SERVING
// THÊM VÀO ĐẦU server_test.js để debug chi tiết
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
// server_test.js - THÊM IMPORT DB
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
app.use(cors({
    origin: "/",
     credentials: true
}));

// ✅ Sửa import - lấy promisePool
const { promisePool } = require('./db');
const db = promisePool; // Đặt alias cho dễ dùng
// Import các router
const petRoutes = require('./routes/pet');
const itemsRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
// Import settings router
const settingsRoutes = require('./routes/settings');
// Middleware
app.use(express.json());
// THÊM middleware để log tất cả request
// Thêm sau app.use(express.json());
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Body:', req.body);
    }
    next();
});
app.use('.../assets', express.static('assets'));
// =============================
// MOCK DATA
// =============================
// const mockUsers = [
//   { id: 1, username: 'test', password: 'test', token: 'mock-token-123' }
// ];

// =============================
// AUTH MIDDLEWARE (CHO PHÉP TẤT CẢ FILE TĨNH)
// =============================
//  PUBLIC PATHS
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
    // Cho phép tất cả file tĩnh (CSS, JS, hình ảnh, v.v.)
    const ext = path.extname(req.path);
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.html', "off"];
    
    if (staticExtensions.includes(ext)) {
        return next();
    }
  // Bỏ qua auth cho các route công khai
  // Trong phần publicPaths, cập nhật:
    const publicPaths = [
  '/', '/auth/login', '/auth/signup', '/login.html',
  '/cleaning_room.html', '/home.html', '/office_room.html',
  '/games_room.html', '/kitchen.html', '/bed_room.html', '/pics_room.html', '/settings.html',
  '/api/items/inventory/grouped', '/api/pet/me', '/api/items/use',
  '/api/items/shop', '/api/items/shop/buy', '/api/items/shop/items', 
  '/auth/me', '/auth/update-username', '/auth/update-password', '/api/pet/update-name', '/api/settings', '/auth/delete-account',
];
  
  if (publicPaths.includes(req.path)) {
        return next();
    }
    
    // Kiểm tra token cho API routes
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
            // Xác thực token JWT
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Kiểm tra user có tồn tại trong MySQL không
            const [users] = await db.query("SELECT id, username FROM users WHERE id = ?", [decoded.userId]);
            
            if (users.length > 0) {
                req.user = { 
                    userId: decoded.userId, 
                    id: decoded.userId,
                    username: decoded.username 
                };
                console.log(`✅ Authenticated user: ${decoded.username} (ID: ${decoded.userId})`);
                return next();
            } else {
                console.log('❌ User not found in database:', decoded.userId);
                return res.status(401).json({ error: 'User not found' });
            }
        } catch (err) {
            console.log('❌ Invalid token:', err.message);
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
    
    console.log('❌ Unauthorized access to:', req.path);
    return res.status(401).json({ error: 'Unauthorized' });
};
app.use(authenticateToken);
// =============================
// AUTH ENDPOINTS (GIỮ NGUYÊN)
// =============================
// app.post('/auth/login', (req, res) => {
//   console.log('🔐 Login attempt:', req.body);
  
//   const { username, password } = req.body;
  
//   const user = mockUsers.find(u => u.username === username && u.password === password);
  
//   if (user) {
//     console.log('✅ Login successful for user:', username);
//     res.json({
//       token: user.token,
//       user: { id: user.id, username: user.username }
//     });
//   } else {
//     console.log('❌ Login failed for user:', username);
//     res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
//   }
// });

// app.post('/auth/signup', (req, res) => {
//   console.log('📝 Signup attempt:', req.body);
  
//   const { username, password } = req.body;
  
//   const existingUser = mockUsers.find(u => u.username === username);
//   if (existingUser) {
//     return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
//   }
  
//   const newUser = {
//     id: mockUsers.length + 1,
//     username,
//     password,
//     token: `mock-token-${Date.now()}`
//   };
  
//   mockUsers.push(newUser);
//   console.log('✅ New user created:', username);
  
//   res.json({
//     token: newUser.token,
//     user: { id: newUser.id, username: newUser.username }
//   });
// });
// //Thêm middleware để xử lý user cho các route cần authentication:

// // Thêm sau middleware auth nhưng trước các route

// app.use((req, res, next) => {
//   // Cho các API routes, thử parse token từ header
//   const authHeader = req.headers.authorization;
//   if (authHeader && authHeader.startsWith('Bearer ')) {
//     const token = authHeader.substring(7);
//     const user = mockUsers.find(u => u.token === token);
    
//     if (user) {
//       req.user = { userId: user.id, id: user.id };
//     }
//   }
  
//   // Nếu không có token, vẫn cho phép với user mặc định (cho testing)
//   if (!req.user && req.path.startsWith('/api/')) {
//     req.user = { userId: 1, id: 1 };  // User mặc định cho testing
//   }
  
//   next();
// });
// =============================
// API ENDPOINTS (GIỮ NGUYÊN)
// =============================

// Sử dụng các router
app.use('/api/pet', petRoutes);
app.use('/api/items', itemsRoutes);
app.use('/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// =============================
// STATIC FILE SERVING - SỬA QUAN TRỌNG
// =============================
const parentDir = path.join(__dirname, '..'); //để .. này là out ra thư mục ngoài

// Serve tất cả file tĩnh từ thư mục gốc
app.use(express.static(parentDir));

// Serve các file HTML cụ thể (fallback)
// Route fallback cho SPA hoặc HTML
app.get('/', (req, res) => {
    const file = path.join(parentDir, req.path);

    // Nếu file tồn tại → trả file
    if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
        return res.sendFile(file);
    }

    // Mặc định trả home.html
    return res.sendFile(path.join(parentDir, 'home.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(parentDir, 'login.html'));
});

// Serve các file HTML khác
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(parentDir, page);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// =============================
// START SERVER
// =============================
app.listen(port, () => {
  console.log(`🚀 Server chạy tại http://localhost:3000`);
  console.log(`📁 Serving files from: ${parentDir}`);
  console.log(`📊 Đang sử dụng mock data`);
});





// server_test.js - THÊM ENDPOINTS CHO NOTES
app.get('/api/notes', async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;
    const [notes] = await db.query(
      "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC", 
      [userId]
    );
    res.json({ success: true, notes });
  } catch (error) {
    console.error('❌ Get notes failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;
    const { title, content } = req.body;
    
    const [result] = await db.query(
      "INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)",
      [userId, title, content]
    );
    
    res.json({ 
      success: true, 
      message: "Đã lưu ghi chú",
      noteId: result.insertId 
    });
  } catch (error) {
    console.error('❌ Save note failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : 1;
    const noteId = req.params.id;
    
    await db.query(
      "DELETE FROM notes WHERE id = ? AND user_id = ?",
      [noteId, userId]
    );
    
    res.json({ success: true, message: "Đã xóa ghi chú" });
  } catch (error) {
    console.error('❌ Delete note failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Endpoint cho study sessions
app.get('/api/study-sessions', async (req, res) => {
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

app.post('/api/study-sessions', async (req, res) => {
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

// server_test.js - THÊM ENDPOINT CHO TIMER COMPLETE
app.post('/api/timer/complete', async (req, res) => {
  try {
    console.log('API called: /api/timer/complete', req.body);
    
    const userId = req.user ? req.user.userId : 1;
    const { duration } = req.body;
    
    // Lấy thông tin pet hiện tại
    const [petRows] = await db.query("SELECT * FROM pets WHERE user_id = ?", [userId]);
    if (petRows.length === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }
    const pet = petRows[0];
    
    // Tính phần thưởng dựa trên duration
    // Nếu duration >= 25 phút (hoặc 1 phút cho test) thì thưởng
    let rewards = {
      energy: 0,
      gold: 0,
      xp: 0
    };
    
    if (duration >= 1) { // Đổi thành 1 phút để test (thay vì 25)
      rewards = {
        energy: 10,
        gold: 20,
        xp: 10
      };
    }
    
    // Tính toán stats mới
    const newEnergy = Math.min(100, pet.energy + rewards.energy);
    const newGold = pet.gold + rewards.gold;
    const newXp = pet.xp + rewards.xp;
    
    // Kiểm tra level up
    let newLevel = pet.level;
    let remainingXp = newXp;
    while (remainingXp >= (newLevel * 100)) {
      remainingXp -= (newLevel * 100);
      newLevel++;
    }
    
    // Cập nhật pet trong database
    await db.query(
      `UPDATE pets SET energy = ?, gold = ?, xp = ?, level = ? WHERE user_id = ?`,
      [newEnergy, newGold, remainingXp, newLevel, userId]
    );
    
    console.log('✅ Timer completed and pet updated');
    
    // Lưu lịch sử timer
    await db.query(
      "INSERT INTO study_sessions (user_id, duration, xp_earned) VALUES (?, ?, ?)",
      [userId, duration, rewards.xp]
    );
    
    res.json({ 
      success: true,
      message: "Timer hoàn thành!",
      rewards: rewards,
      stats: {
        energy: newEnergy,
        gold: newGold,
        xp: remainingXp,
        level: newLevel
      }
    });
    
  } catch (error) {
    console.error('❌ Timer complete failed:', error);
    res.status(500).json({ error: "Database error" });
  }
});

// Tab system
function showTab(tabId) {
    // Ẩn tất cả tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Bỏ active tất cả tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hiện tab được chọn
    document.getElementById(tabId).classList.add('active');
    
    // Active tab button tương ứng
    event.target.classList.add('active');
}

// Load storage data
async function loadStorageData() {
    try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) headers["Authorization"] = "Bearer " + token;
        
        // Load inventory
        const invRes = await fetch("/api/items/inventory/grouped", { headers });
        if (invRes.ok) {
            const invData = await invRes.json();
            displayInventory(invData);
        }
        
        // Load pet stats
        const petRes = await fetch("/api/pet/me", { headers });
        if (petRes.ok) {
            const petData = await petRes.json();
            document.getElementById("current-gold").textContent = petData.gold || 0;
        }
    } catch (error) {
        console.error("Error loading storage:", error);
    }
}

function displayInventory(data) {
    // Hiển thị thức ăn
    const foodContainer = document.getElementById("storage-food");
    foodContainer.innerHTML = "";
    
    if (data.food && data.food.length > 0) {
        data.food.forEach(item => {
            const div = createItemCard(item, 'food');
            foodContainer.appendChild(div);
        });
        document.getElementById("food-count").textContent = data.food.length;
    } else {
        foodContainer.innerHTML = "<p class='empty'>Không có thức ăn</p>";
        document.getElementById("food-count").textContent = 0;
    }
    
    // Hiển thị thuốc
    const potionContainer = document.getElementById("storage-potion");
    potionContainer.innerHTML = "";
    
    if (data.potion && data.potion.length > 0) {
        data.potion.forEach(item => {
            const div = createItemCard(item, 'potion');
            potionContainer.appendChild(div);
        });
        document.getElementById("potion-count").textContent = data.potion.length;
    } else {
        potionContainer.innerHTML = "<p class='empty'>Không có thuốc</p>";
        document.getElementById("potion-count").textContent = 0;
    }
    
    // Tính tổng
    const totalItems = (data.food?.length || 0) + (data.potion?.length || 0);
    document.getElementById("total-items").textContent = totalItems;
}

function createItemCard(item, type) {
    const div = document.createElement("div");
    div.className = "inventory-item-card";
    
    const effects = [];
    if (item.hunger_change && item.hunger_change !== 0) 
        effects.push(`Đói: ${item.hunger_change > 0 ? '+' : ''}${item.hunger_change}`);
    if (item.happiness_change && item.happiness_change !== 0) 
        effects.push(`Vui: ${item.happiness_change > 0 ? '+' : ''}${item.happiness_change}`);
    if (item.health_change && item.health_change !== 0) 
        effects.push(`SK: ${item.health_change > 0 ? '+' : ''}${item.health_change}`);
    if (item.energy_change && item.energy_change !== 0) 
        effects.push(`NL: ${item.energy_change > 0 ? '+' : ''}${item.energy_change}`);
    
    div.innerHTML = `
        <div class="item-icon">${type === 'food' ? '🍎' : '💊'}</div>
        <div class="item-info">
            <strong>${item.name}</strong>
            <small>Số lượng: ${item.quantity}</small>
            <small>${effects.join(', ')}</small>
        </div>
        <button onclick="useStorageItem(${item.item_id || item.id}, '${type}')" class="use-btn">
            Dùng
        </button>
    `;
    
    return div;
}

async function useStorageItem(itemId, type) {
    if (!confirm(`Dùng vật phẩm này?`)) return;
    
    const result = await performPetAction('feed', { itemId });
    if (result && result.status === "ok") {
        alert("Đã dùng vật phẩm!");
        loadStorageData(); // Refresh
    }
}

// Load notes và study history
async function loadNotesAndStudy() {
    try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) headers["Authorization"] = "Bearer " + token;
        
        // Load notes
        const notesRes = await fetch("/api/notes", { headers });
        if (notesRes.ok) {
            const notesData = await notesRes.json();
            displayNotes(notesData.notes || []);
        }
        
        // Load study sessions
        const studyRes = await fetch("/api/study-sessions", { headers });
        if (studyRes.ok) {
            const studyData = await studyRes.json();
            displayStudyHistory(studyData);
        }
    } catch (error) {
        console.error("Error loading notes/study:", error);
    }
}

function displayNotes(notes) {
    const container = document.getElementById("notes-list");
    container.innerHTML = "";
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="empty">Chưa có ghi chú nào</p>';
        return;
    }
    
    notes.forEach(note => {
        const div = document.createElement("div");
        div.className = "note-item";
        div.innerHTML = `
            <div class="note-header">
                <strong>${note.title || 'Không tiêu đề'}</strong>
                <button onclick="deleteNote(${note.id})" class="delete-btn">🗑️</button>
            </div>
            <div class="note-content">${note.content || ''}</div>
            <div class="note-date">${new Date(note.updated_at).toLocaleString()}</div>
        `;
        container.appendChild(div);
    });
}

function displayStudyHistory(data) {
    document.getElementById("total-study-time").textContent = data.total_minutes || 0;
    document.getElementById("study-sessions-count").textContent = data.sessions?.length || 0;
    
    const container = document.getElementById("study-history");
    container.innerHTML = "";
    
    if (!data.sessions || data.sessions.length === 0) {
        container.innerHTML = '<p class="empty">Chưa có buổi học nào</p>';
        return;
    }
    
    data.sessions.forEach(session => {
        const div = document.createElement("div");
        div.className = "study-session-item";
        div.innerHTML = `
            <div>⏱️ ${session.duration} phút</div>
            <div>⭐ +${session.xp_earned || 0} XP</div>
            <div>📅 ${new Date(session.created_at).toLocaleDateString()}</div>
        `;
        container.appendChild(div);
    });
}

async function saveNote() {
    const title = document.getElementById("note-title").value.trim();
    const content = document.getElementById("note-content").value.trim();
    
    if (!content) {
        alert("Vui lòng nhập nội dung");
        return;
    }
    
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/notes", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title || "Không tiêu đề",
                content: content
            })
        });
        
        if (res.ok) {
            alert("Đã lưu ghi chú!");
            document.getElementById("note-title").value = "";
            document.getElementById("note-content").value = "";
            loadNotesAndStudy();
        }
    } catch (error) {
        console.error("Error saving note:", error);
    }
}

async function deleteNote(noteId) {
    if (!confirm("Xóa ghi chú này?")) return;
    
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/notes/${noteId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (res.ok) {
            alert("Đã xóa ghi chú");
            loadNotesAndStudy();
        }
    } catch (error) {
        console.error("Error deleting note:", error);
    }
}


