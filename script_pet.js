// script_pet.js - script chung cho các room
window.API_BASE = 'http://localhost:3000/api';
window.currentPet = null;

// Load pet khi trang load
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded");
    
    // Kiểm tra auth
    if (!window.checkAuth()) return;
    
    // Load pet từ backend
    window.loadPetFromBackend();
});

// Hàm load pet từ backend
window.loadPetFromBackend = async function() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE}/pet/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      window.currentPet = data;
      console.log('✅ Pet loaded from backend:', window.currentPet);
      
      // Cập nhật UI
      window.updatePetUI();
      
      // Lưu vào localStorage để dùng tạm
      localStorage.setItem('last_pet_data', JSON.stringify(data));
    } else {
      console.warn('⚠️ Cannot load pet from backend');
      // Fallback to localStorage
      const lastData = localStorage.getItem('last_pet_data');
      if (lastData) {
        window.currentPet = JSON.parse(lastData);
        window.updatePetUI();
      }
    }
  } catch (error) {
    console.error('❌ Error loading pet from backend:', error);
  }
}

// Cập nhật UI từ pet data
window.updatePetUI = function() {
  if (!window.currentPet) return;
  
  // Cập nhật thanh bar
  const happinessBar = document.getElementById("happinessBar");
  const hungerBar = document.getElementById("hungerBar");
  const healthBar = document.getElementById("healthBar");
  const energyBar = document.getElementById("energyBar");
  
  if (happinessBar) {
    happinessBar.style.width = Math.max(0, Math.min(100, window.currentPet.happiness)) + "%";
    happinessBar.textContent = Math.max(0, Math.min(100, window.currentPet.happiness)) + "% Vui vẻ";
  }
  if (hungerBar) {
    hungerBar.style.width = Math.max(0, Math.min(100, window.currentPet.hunger)) + "%";
    hungerBar.textContent = Math.max(0, Math.min(100, window.currentPet.hunger)) + "% Đói bụng";
  }
  if (healthBar) {
    healthBar.style.width = Math.max(0, Math.min(100, window.currentPet.health)) + "%";
    healthBar.textContent = Math.max(0, Math.min(100, window.currentPet.health)) + "% Sức khỏe";
  }
  if (energyBar) {
    energyBar.style.width = Math.max(0, Math.min(100, window.currentPet.energy)) + "%";
    energyBar.textContent = Math.max(0, Math.min(100, window.currentPet.energy)) + "% Năng lượng";
  }
  
  // Cập nhật thông tin khác
  const petName = document.getElementById("pet_name");
  const level = document.getElementById("level");
  const gold = document.getElementById("gold");
  
  if (petName) petName.textContent = window.currentPet.name || 'Baby';
  if (level) level.textContent = window.currentPet.level || 1;
  if (gold) gold.textContent = window.currentPet.gold || 0;
}

// Hàm thực hiện hành động
window.performPetAction = async function(action, data = {}) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE}/pet/action/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${action} successful:`, result);
      
      // Cập nhật pet data
      if (result.stats) {
        window.currentPet = { ...window.currentPet, ...result.stats };
        window.updatePetUI();
      }
      
      // Reload pet để có data mới nhất
      setTimeout(() => window.loadPetFromBackend(), 500);
      
      return result;
    } else {
      const error = await response.json();
      console.error(`❌ ${action} failed:`, error);
      alert(`Lỗi: ${error.error || 'Không thể thực hiện hành động'}`);
    }
  } catch (error) {
    console.error(`❌ ${action} error:`, error);
    alert('Lỗi kết nối đến server');
  }
}

// Các hàm hành động
window.feedPet = function() {
window.location.href = 'kitchen.html';}

window.focusPet = function() {
  window.location.href = 'office_room.html';
}

window.playPet = function() {
  window.location.href = 'games_room.html';
}

// Các hàm helper
window.checkAuth = function() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('🔐 No token found, redirecting to login');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Chuyển phòng
window.rooms = [
    "home.html",
    "office_room.html",
    "games_room.html",
    "kitchen.html",
    "bed_room.html",
    "pics_room.html"
];

window.getCurrentRoomIndex = function() {
    const path = window.location.pathname.split("/").pop();
    return window.rooms.indexOf(path);
}

window.plusSlides = function(n) {
    let i = window.getCurrentRoomIndex();
    if (i === -1) return;

    let nextRoom = i + n;
    if (nextRoom < 0) nextRoom = window.rooms.length - 1;
    if (nextRoom >= window.rooms.length) nextRoom = 0;

    window.location.href = window.rooms[nextRoom];
}