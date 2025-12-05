 // Load shop items 
       async function loadShop() {
    try {
        console.log('🛍️ Loading shop...');
        const container = document.getElementById("shop-list");
        container.innerHTML = '<div class="loading">Đang tải cửa hàng...</div>';
        
        // SỬA: Dùng endpoint /api/items/shop/items thay vì /api/items/shop
        const res = await fetch("/api/items/shop/items");
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Shop data received:', data);
        
        container.innerHTML = "";
        
        if (data.success && data.items && Array.isArray(data.items)) {
            if (data.items.length === 0) {
                container.innerHTML = '<div class="empty-shop">Cửa hàng chưa có sản phẩm nào.</div>';
                return;
            }
            
            data.items.forEach(item => {
                const div = document.createElement("div");
                div.className = "shop-item";
                
                // Tạo ảnh placeholder base64 để tránh lỗi
                let imageHtml = '';
                if (item.image && !item.image.includes('http')) {
                    // Nếu là tên file, tạo placeholder màu
                    const color = item.type === 'food' ? '#4CAF50' : '#2196F3';
                    imageHtml = `
                        <div style="
                            width: 100px; 
                            height: 100px; 
                            background: ${color}; 
                            border-radius: 10px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            margin: 0 auto 10px auto;
                            color: white;
                            font-size: 40px;
                        ">
                            ${item.type === 'food' ? '🍎' : '💊'}
                        </div>
                    `;
                } else if (item.image) {
                    imageHtml = `<img src="${item.image}" alt="${item.name}" 
                         onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\\'width:100px;height:100px;background:#ccc;border-radius:10px;display:flex;align-items:center;justify-content:center\\'>❌</div>'">`;
                }
                
                // SỬA: Truy cập effects đúng cách
                let effectText = '';
                if (item.effects) {
                    const effects = [];
                    if (item.effects.hunger !== 0) 
                        effects.push(`Đói: ${item.effects.hunger > 0 ? '+' : ''}${item.effects.hunger}`);
                    if (item.effects.happiness !== 0) 
                        effects.push(`Vui: ${item.effects.happiness > 0 ? '+' : ''}${item.effects.happiness}`);
                    if (item.effects.health !== 0) 
                        effects.push(`SK: ${item.effects.health > 0 ? '+' : ''}${item.effects.health}`);
                    if (item.effects.energy !== 0) 
                        effects.push(`NL: ${item.effects.energy > 0 ? '+' : ''}${item.effects.energy}`);
                    effectText = effects.join(', ');
                }
                
                div.innerHTML = `
                    ${imageHtml}
                    <h3>${item.name || 'Không tên'}</h3>
                    <p style="font-size:12px;color:#666;margin:5px 0;">${effectText}</p>
                    <b>Giá: ${item.price || 0} gold</b>
                    <button onclick="buyItem(${item.id})">
                        Mua ngay
                    </button>
                `;
                container.appendChild(div);
            });
            
            console.log(`✅ Loaded ${data.items.length} items to shop`);
        } else {
            container.innerHTML = '<div class="error">Dữ liệu cửa hàng không hợp lệ.</div>';
        }
    } catch (error) {
        console.error("❌ Failed to load shop:", error);
        const container = document.getElementById("shop-list");
        container.innerHTML = `<div class="error">Lỗi tải cửa hàng: ${error.message}</div>`;
    }
}

        // Buy item - GIỮ NGUYÊN
        async function buyItem(itemId) {
            try {
                console.log('🛒 Buying item ID:', itemId);
                
                if (!confirm("Bạn có chắc muốn mua vật phẩm này?")) {
                    return;
                }
                
                const token = localStorage.getItem("token");
                const headers = {
                    "Content-Type": "application/json"
                };
                
                if (token) {
                    headers["Authorization"] = "Bearer " + token;
                }
                
                const res = await fetch("/api/items/shop/buy", {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ 
                        item_id: itemId, 
                        quantity: 1 
                    })
                });
                
                const result = await res.json();
                console.log('Buy result:', result);
                
                if (result.success) {
                    alert("✅ " + (result.message || "Mua thành công!"));
                    
                    // Cập nhật gold hiển thị
                    if (result.remaining_gold !== undefined) {
                        const goldElement = document.getElementById("gold");
                        if (goldElement) {
                            goldElement.innerText = result.remaining_gold;
                        }
                    }
                    
                    // Reload shop
                    loadShop();
                    
                    // Cập nhật pet stats nếu cần
                    updatePetStats();
                } else {
                    alert("❌ " + (result.error || "Không thể mua vật phẩm"));
                }
            } catch (error) {
                console.error("❌ Buy error:", error);
                alert("❌ Lỗi khi mua vật phẩm. Vui lòng thử lại sau.");
            }
        }

        // Hàm cập nhật pet stats
        async function updatePetStats() {
            try {
                const token = localStorage.getItem("token");
                const headers = {};
                if (token) headers["Authorization"] = "Bearer " + token;
                
                const res = await fetch("/api/pet/me", { headers });
                if (res.ok) {
                    const pet = await res.json();
                    // Cập nhật các chỉ số pet nếu cần
                }
            } catch (error) {
                console.error("Error updating pet stats:", error);
            }
        }

        // Test shop API khi trang load
        window.addEventListener("load", function() {
            console.log("🔄 Page loaded");
            
            // Test shop API sau 1 giây
            setTimeout(async () => {
                try {
                    console.log("🧪 Testing /api/items/shop endpoint...");
                    const response = await fetch("/api/items/shop");
                    console.log("Response status:", response.status);
                    const data = await response.json();
                    console.log(`✅ Shop API has ${data.items?.length || 0} items`);
                } catch (error) {
                    console.error("❌ Error testing shop API:", error);
                }
            }, 1000);
        });
		// Thêm hàm kiểm tra và cập nhật vàng
async function checkAndUpdateGold() {
    try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        
        const res = await fetch("/api/pet/me", { headers });
        if (res.ok) {
            const pet = await res.json();
            const goldElement = document.getElementById("gold");
            if (goldElement) {
                goldElement.innerText = pet.gold || 0;
                console.log(`💰 Gold updated: ${pet.gold}`);
                
                // Nếu gold là 0, thử fix
                if (pet.gold === 0 || pet.gold === '0') {
                    console.warn('⚠️ Gold is 0, attempting to fix...');
                    // Gọi API để sửa gold (có thể cần thêm endpoint)
                    await forceFixGold();
                }
            }
        }
    } catch (error) {
        console.error("Error checking gold:", error);
    }
}

// Hàm sửa gold (tạm thời dùng update trực tiếp)
async function forceFixGold() {
    try {
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        
        // Gọi một endpoint để sửa gold
        const res = await fetch("/api/pet/fix-gold", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ gold: 1000 })
        });
        
        if (res.ok) {
            console.log("✅ Gold fixed to 1000");
            location.reload(); // Tải lại trang
        }
    } catch (error) {
        console.error("Error fixing gold:", error);
    }
}

// Gọi hàm này khi trang load
window.addEventListener("load", function() {
    console.log("🔄 Page loaded, checking gold...");
    setTimeout(() => {
        checkAndUpdateGold();
    }, 500);
});

// Gọi hàm này sau mỗi lần mua hàng
async function buyItem(itemId) {
    try {
        console.log('🛒 Buying item ID:', itemId);
        
        if (!confirm("Bạn có chắc muốn mua vật phẩm này?")) {
            return;
        }
        
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json"
        };
        
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
        
        const res = await fetch("/api/items/shop/buy", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ 
                item_id: itemId, 
                quantity: 1 
            })
        });
        
        const result = await res.json();
        console.log('Buy result:', result);
        
        if (result.success) {
            alert("✅ " + (result.message || "Mua thành công!"));
            
            // Cập nhật gold hiển thị
            if (result.remaining_gold !== undefined) {
                document.getElementById("gold").innerText = result.remaining_gold;
            }
            
            // Reload shop
            loadShop();
            
            // Kiểm tra lại gold
            checkAndUpdateGold();
        } else {
            alert("❌ " + (result.error || "Không thể mua vật phẩm"));
            
            // Nếu lỗi do không đủ vàng, kiểm tra và cập nhật
            if (result.error.includes("gold") || result.error.includes("vàng")) {
                checkAndUpdateGold();
            }
        }
    } catch (error) {
        console.error("❌ Buy error:", error);
        alert("❌ Lỗi khi mua vật phẩm. Vui lòng thử lại sau.");
    }
}
// Tab system
function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Active corresponding tab button
    event.target.classList.add('active');
}

// Load storage data
async function loadStorageData() {
    try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) headers["Authorization"] = "Bearer " + token;
        
        // Load inventory from backend
        const invRes = await fetch("/api/items/inventory/grouped", { headers });
        if (invRes.ok) {
            const invData = await invRes.json();
            displayStorageItems(invData);
        }
    } catch (error) {
        console.error("Error loading storage:", error);
    }
}

function displayStorageItems(data) {
    // Display food
    const foodContainer = document.getElementById("storage-food");
    foodContainer.innerHTML = "";
    
    if (data.food && data.food.length > 0) {
        data.food.forEach(item => {
            const div = document.createElement("div");
            div.className = "storage-item";
            div.innerHTML = `
                <div style="font-size:30px;margin-bottom:5px;">🍎</div>
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:12px;color:#666;">Số lượng: ${item.quantity}</div>
                <button onclick="useItemFromStorage(${item.item_id || item.id})" 
                        style="margin-top:5px;padding:5px 10px;background:#4CAF50;color:white;border:none;border-radius:3px;font-size:12px;">
                    Dùng
                </button>
            `;
            foodContainer.appendChild(div);
        });
    } else {
        foodContainer.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Không có thức ăn</p>';
    }
    
    // Display potions
    const potionContainer = document.getElementById("storage-potion");
    potionContainer.innerHTML = "";
    
    if (data.potion && data.potion.length > 0) {
        data.potion.forEach(item => {
            const div = document.createElement("div");
            div.className = "storage-item";
            div.innerHTML = `
                <div style="font-size:30px;margin-bottom:5px;">💊</div>
                <div style="font-weight:bold;">${item.name}</div>
                <div style="font-size:12px;color:#666;">Số lượng: ${item.quantity}</div>
                <button onclick="useItemFromStorage(${item.item_id || item.id})" 
                        style="margin-top:5px;padding:5px 10px;background:#4CAF50;color:white;border:none;border-radius:3px;font-size:12px;">
                    Dùng
                </button>
            `;
            potionContainer.appendChild(div);
        });
    } else {
        potionContainer.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Không có thuốc</p>';
    }
}

async function useItemFromStorage(itemId) {
    if (!confirm("Dùng vật phẩm này?")) return;
    
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/items/use", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ itemId })
        });
        
        if (res.ok) {
            const result = await res.json();
            alert("✅ Đã dùng vật phẩm!");
            
            // Reload storage and pet stats
            loadStorageData();
            window.loadPetFromBackend();
        }
    } catch (error) {
        console.error("Error using item:", error);
    }
}


// Thêm vào home.html sau khi page loaded
window.addEventListener("load", function() {
    console.log("🔄 Page loaded, checking database connection...");
    
    // Kiểm tra user hiện tại
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(user => {
            console.log('👤 Current user:', user);
            
            // Nếu user không tồn tại, tạo mới
            if (user.error && user.error.includes("not found")) {
                console.warn('⚠️ User not in MySQL, attempting to fix...');
                // Gọi API để fix user
                fetch(`/auth/fix-user/${user.id || 1}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(fixRes => fixRes.json())
                .then(data => {
                    console.log('🔧 Fix result:', data);
                    location.reload();
                });
            }
        })
        .catch(err => {
            console.error('❌ Error checking user:', err);
        });
    }
});