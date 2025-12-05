async function apiCall(endpoint, options = {}) {
try {
    console.log('📡 Calling API:', `${API_BASE}${endpoint}`);
    
    const config = {
    headers: {
        'Content-Type': 'application/json',
        ...options.headers,
    },
    ...options,
    };
    
    if (options.body) {
    config.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
} catch (error) {
    console.error('❌ API call failed:', error);
    // Return mock data for testing khi API fail
    return getMockData();
}
}
// // Mock data khi API không hoạt động
// function getMockData() {
//   console.log('🔄 Using mock data');
//   return {
//     food: [
//       { 
//         id: 1, 
//         name: "Táo", 
//         type: "food", 
//         price: 5, 
//         effect: "Đói: +5, Năng lượng: +3", 
//         quantity: 4, 
//         img: "https://via.placeholder.com/100x100/4CAF50/white?text=🍎" 
//       },
//       { 
//         id: 2, 
//         name: "Cá", 
//         type: "food", 
//         price: 7.5, 
//         effect: "Đói: +5, Năng lượng: +5", 
//         quantity: 2, 
//         img: "https://via.placeholder.com/100x100/2196F3/white?text=🐟" 
//       }
//     ],
//     potion: [
//       { 
//         id: 11, 
//         name: "Potion Sức khỏe", 
//         type: "potion", 
//         price: 20, 
//         effect: "Sức khỏe: +10", 
//         quantity: 3, 
//         img: "https://via.placeholder.com/100x100/F44336/white?text=❤️" 
//       }
//     ]
//   };
// }



// INVENTORY FUNCTIONS
async function loadInventory() {
  try {
    console.log('📦 Loading inventory...');
    const data = await apiCall('/items/inventory/grouped');
    console.log('✅ Inventory loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to load inventory:', error);
    return getMockData();
  }
}

async function useItem(itemId) {
   try {
    console.log('🛒 Using item ID:', itemId, 'Type:', typeof itemId);
    
    // Kiểm tra itemId
    if (!itemId || itemId === "undefined" || itemId === "null") {
      console.error('❌ Invalid itemId:', itemId);
      throw new Error("ID vật phẩm không hợp lệ");
    }
    
    const itemIdNum = parseInt(itemId);
    if (isNaN(itemIdNum)) {
      console.error('❌ itemId is not a number:', itemId);
      throw new Error("ID vật phẩm phải là số");
    }
    
    const token = localStorage.getItem("token");
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('📤 Sending request with itemId:', itemIdNum);
    
    const response = await fetch(`${API_BASE}/items/use`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        itemId: itemIdNum
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Use item result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to use item:', error);
    // Trả về fallback data
    return { 
      status: "ok", 
      effects: { 
        hunger_change: -10, 
        energy_change: 10,
        happiness_change: 5,
        health_change: 5
      }
    };
  }
}

// RENDER FUNCTIONS
function renderGrid(items, containerId) {
  const box = document.getElementById(containerId);
  if (!box) {
    console.warn('❌ Container not found:', containerId);
    return;
  }
  
  console.log(`🎨 Rendering ${items.length} items to ${containerId}`);
  
  if (items.length === 0) {
    box.innerHTML = '<div class="small" style="text-align:center;padding:20px;color:#666;">Không có vật phẩm</div>';
    return;
  }
  
  box.innerHTML = '';
  
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #eee;">
      <div style="font-weight:600;margin-top:8px;font-size:14px;">${item.name}</div>
      <div class="small" style="color:#888;">${item.type}</div>
      <div class="small">${item.price} coin</div>
      <div class="small" style="margin-top:4px;color:#4CAF50;">${item.effect}</div>
      <div class="small" style="margin-top:4px;">Số lượng: <span data-qty>${item.quantity}</span></div>
      <button data-id="${item.item_id || item.id}" class="use-item-btn" style="margin-top:8px;padding:6px 12px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Dùng</button>
    `;
    box.appendChild(div);
  });

  // Bind use buttons
  box.querySelectorAll('.use-item-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const itemId = btn.dataset.id;
    const itemCard = btn.closest('.item-card');
    const qtySpan = itemCard.querySelector('[data-qty]');
    const currentQty = parseInt(qtySpan.textContent);
    
    if (currentQty <= 0) {
      alert('Hết số lượng!');
      return;
    }
    
    try {
      const result = await useItem(itemId);
      qtySpan.textContent = currentQty - 1;
      
      if (currentQty - 1 <= 0) {
        btn.disabled = true;
        btn.style.background = '#ccc';
      }
      
      // Apply effects - ĐÃ CẬP NHẬT
      applyItemEffects(result.effects);
      
      // THÊM: Cập nhật pet stats và UI
      await loadPetOnPageLoad();
      
    } catch (error) {
      alert('Không thể sử dụng vật phẩm: ' + error.message);
    }
  });
});
}

function applyItemEffects(effects) {
  console.log('✨ Applying effects:', effects);
  
  // Không chỉ alert mà còn cập nhật pet stats
  if (effects) {
    // Gọi API để cập nhật pet
    updatePetStatsFromEffects(effects);
  }
  
  // Vẫn giữ alert để thông báo
  alert(`Đã sử dụng vật phẩm!\nHiệu ứng: ${JSON.stringify(effects)}`);
}

// THÊM HÀM MỚI để cập nhật pet stats
async function updatePetStatsFromEffects(effects) {
  try {
    console.log('🔄 Updating pet stats from effects...');
    
    // Lấy token nếu có
    const token = localStorage.getItem("token");
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Gọi API để cập nhật pet (nếu backend có endpoint này)
    // Hoặc reload pet data
    if (typeof window.loadPetFromBackend === 'function') {
      await window.loadPetFromBackend();
    } else {
      // Nếu không có hàm loadPetFromBackend, gọi API trực tiếp
      const response = await fetch('/api/pet/me', { headers });
      if (response.ok) {
        const petData = await response.json();
        console.log('✅ Pet updated from backend:', petData);
        // Cập nhật UI
        updatePetUI(petData);
      }
    }
  } catch (error) {
    console.error('❌ Error updating pet stats:', error);
  }
}
function updatePetUI(pet) {
  if (pet) {
    // Cập nhật các thanh stats
    const bars = {
      happiness: pet.happiness || 50,
      hunger: pet.hunger || 50,
      health: pet.health || 100,
      energy: pet.energy || 50
    };
    
    // Cập nhật width của các thanh
    document.getElementById('happinessBar').style.width = `${bars.happiness}%`;
    document.getElementById('happinessBar').textContent = `Vui vẻ ${bars.happiness}%`;
    
    document.getElementById('hungerBar').style.width = `${bars.hunger}%`;
    document.getElementById('hungerBar').textContent = `Đói bụng ${bars.hunger}%`;
    
    document.getElementById('healthBar').style.width = `${bars.health}%`;
    document.getElementById('healthBar').textContent = `Sức khỏe ${bars.health}%`;
    
    document.getElementById('energyBar').style.width = `${bars.energy}%`;
    document.getElementById('energyBar').textContent = `Năng lượng ${bars.energy}%`;
    
    // Cập nhật level và gold
    if (pet.level !== undefined) {
      document.getElementById('level').textContent = pet.level || 0;
    }
    if (pet.gold !== undefined) {
      document.getElementById('gold').textContent = pet.gold || 0;
    }
    
    console.log('✅ Pet UI updated');
  }
}
// THÊM HÀM LOAD PET KHI TRANG TẢI
async function loadPetOnPageLoad() {
  try {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/pet/me', { headers });
    if (response.ok) {
      const petData = await response.json();
      console.log('✅ Pet loaded on page load:', petData);
      updatePetUI(petData);
    }
  } catch (error) {
    console.error('❌ Error loading pet:', error);
  }
}
// LOAD LISTS
async function loadFoodList() {
  try {
    console.log('🍎 Loading food list...');
    const data = await loadInventory();
    const foods = data.food || [];
    
    const listContainer = document.getElementById('food_list');
    if (!listContainer) {
      console.error('❌ food_list container not found');
      return;
    }
    
    // Clear và hiển thị danh sách chi tiết
    listContainer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      </div>
      <div id="food_detailed_list" style="display:flex;flex-direction:column;gap:12px; flex-wrap: wrap; "></div>
    `;
    
    const detailedList = document.getElementById('food_detailed_list');
    renderDetailedList(foods, detailedList);
    
  } catch (error) {
    console.error('❌ Failed to load food list:', error);
  }
}

async function loadPotionList() {
  try {
    console.log('💊 Loading potion list...');
    const data = await loadInventory();
    const potions = data.potion || [];
    
    const listContainer = document.getElementById('potion_list');
    if (!listContainer) {
      console.error('❌ potion_list container not found');
      return;
    }
    
    listContainer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      </div>
      <div id="potion_detailed_list" style="display:flex;flex-direction:column;gap:12px; flex-wrap: wrap;"></div>
    `;
    
    const detailedList = document.getElementById('potion_detailed_list');
    renderDetailedList(potions, detailedList);
    
  } catch (error) {
    console.error('❌ Failed to load potion list:', error);
  }
}

function renderDetailedList(items, container) {
  container.innerHTML = '';
  
  if (items.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#666;">Không có vật phẩm</div>';
    return;
  }
  
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.cssText = `
      display: flex; 
      align-items: center; 
      gap: 15px; 
      padding: 15px; 
      border: 2px solid #ddd; 
      border-radius: 10px; 
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    card.innerHTML = `
      <img src="${item.img}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;">
      <div style="flex:1">
        <div style="font-weight:700;font-size:16px;color:#333;">${item.name}</div>
        <div class="small" style="color:#666;">${item.type} • ${item.price} coin</div>
        <div class="small" style="margin-top:6px;color:#4CAF50;">${item.effect}</div>
        <div class="small" style="margin-top:6px;">Số lượng: <span data-qty>${item.quantity}</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="use-item-btn" data-id="${item.item_id || item.id}" style="padding:8px 12px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Dùng</button>
        <button class="inspect-btn" data-id="${item.item_id || item.id}" style="padding:8px 12px;background:#666;color:white;border:none;border-radius:4px;cursor:pointer;">Xem</button>
      </div>
    `;
    
    container.appendChild(card);
  });

  // Bind buttons
  container.querySelectorAll('.use-item-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const itemId = btn.dataset.id;
      const itemCard = btn.closest('.item-card');
      const qtySpan = itemCard.querySelector('[data-qty]');
      const currentQty = parseInt(qtySpan.textContent);
      
      if (currentQty <= 0) {
        alert('Hết số lượng!');
        return;
      }
      
      try {
        const result = await useItem(itemId);
        const newQty = currentQty - 1;
        qtySpan.textContent = newQty;
        
        if (newQty <= 0) {
          btn.disabled = true;
          btn.style.background = '#ccc';
        }
        
        applyItemEffects(result.effects);
        loadCompactGrids();

        // THÊM: Cập nhật pet stats
        await loadPetOnPageLoad();
        
      } catch (error) {
        alert('Không thể sử dụng vật phẩm: ' + error.message);
      }
    });
  });
  

  container.querySelectorAll('.inspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemCard = btn.closest('.item-card');
      const name = itemCard.querySelector('div[style*="font-weight:700"]').textContent;
      const details = itemCard.querySelectorAll('.small');
      const typePrice = details[0].textContent;
      const effect = details[1].textContent;
      const quantity = itemCard.querySelector('[data-qty]').textContent;
      
      alert(`📦 ${name}\n📋 ${typePrice}\n✨ ${effect}\n🔢 Số lượng: ${quantity}`);
    });
  });
}

// LOAD COMPACT GRIDS
async function loadCompactGrids() {
  try {
    console.log('🔄 Loading compact grids...');
    const inventory = await loadInventory();
    
    if (document.getElementById('food_grid')) {
      renderGrid(inventory.food || [], 'food_grid');
    }
    if (document.getElementById('potion_grid')) {
      renderGrid(inventory.potion || [], 'potion_grid');
    }
  } catch (error) {
    console.error('❌ Failed to load compact grids:', error);
  }
}

// Click outside to close
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('popup-overlay')) {
    closeAllPopup();
  }
});

// Close button in popup headers
document.querySelectorAll('.popup .head button').forEach(btn => {
  btn.addEventListener('click', closeAllPopup);
});