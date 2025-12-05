// Timer logic cho office_room
let timerInterval = null;
let totalSeconds = 60; // Đổi thành 60 giây (1 phút) để test
let isRunning = false;
let currentPreset = null;

// Đảm bảo DOM đã load
document.addEventListener('DOMContentLoaded', function() {
    // Timer elements
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const minutesInput = document.getElementById('minutes-input');
    const timerDisplay = document.getElementById('timer-display');
    
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTimer);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    if (minutesInput) {
        minutesInput.addEventListener('change', updateTimerFromInput);
    }
    
    // Đặt mặc định 1 phút để test
    if (minutesInput) {
        minutesInput.value = 1;
        totalSeconds = 60;
        updateTimerDisplay();
    }
    
    // Load timer presets
    loadTimerPresets();
    loadTimerHistory();
});

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    updateTimerButtons();
    
    timerInterval = setInterval(() => {
        totalSeconds--;
        updateTimerDisplay();
        
        if (totalSeconds <= 0) {
            finishTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
    updateTimerButtons();
}

function resetTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    const minutes = parseInt(document.getElementById('minutes-input').value) || 1;
    totalSeconds = minutes * 60;
    updateTimerDisplay();
    updateTimerButtons();
}

function updateTimerFromInput() {
    const minutes = parseInt(document.getElementById('minutes-input').value) || 1;
    totalSeconds = minutes * 60;
    if (!isRunning) {
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const display = document.getElementById('timer-display');
    if (display) {
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update progress ring
    const totalTime = parseInt(document.getElementById('minutes-input').value) * 60;
    const progress = 565.48 * (1 - totalSeconds / totalTime);
    const ring = document.querySelector('.progress-ring-circle-filled');
    if (ring) {
        ring.style.strokeDashoffset = 565.48 - progress;
    }
}

function updateTimerButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    if (startBtn) {
        startBtn.disabled = isRunning;
        startBtn.style.opacity = isRunning ? '0.5' : '1';
    }
    if (pauseBtn) {
        pauseBtn.disabled = !isRunning;
        pauseBtn.style.opacity = !isRunning ? '0.5' : '1';
    }
}

async function finishTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    
    const minutesStudied = parseInt(document.getElementById('minutes-input').value);
    
    // Gọi API để nhận phần thưởng
    try {
        const token = localStorage.getItem("token");
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        
        console.log('🕐 Timer completed, calling API...');
        
        const response = await fetch(window.API_BASE + '/timer/complete', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ 
                duration: minutesStudied 
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Save to history
            saveTimerHistory(minutesStudied);
            
            // Show notification với phần thưởng
            if (minutesStudied >= 1) { // Đổi thành 1 phút để test
                alert(`🎉 Hoàn thành ${minutesStudied} phút tập trung!\n\nPhần thưởng:\n+${result.rewards.energy} Năng lượng\n+${result.rewards.gold} Vàng\n+${result.rewards.xp} EXP`);
            } else {
                alert(`✅ Hoàn thành ${minutesStudied} phút tập trung!`);
            }
            
            // Reset timer
            resetTimer();
            
            // Update pet stats trên giao diện
            if (window.loadPetFromBackend) {
                window.loadPetFromBackend();
            }
            
            // Cập nhật vàng và exp trên topbar
            updateTopbarStats(result.stats);
            
        } else {
            const error = await response.json();
            console.error('❌ API Error:', error);
            alert("Đã hoàn thành timer nhưng có lỗi khi cập nhật pet: " + (error.error || "Lỗi không xác định"));
            resetTimer();
        }
    } catch (error) {
        console.error("Error finishing timer:", error);
        alert("Đã hoàn thành timer nhưng có lỗi kết nối đến server!");
        resetTimer();
    }
}

function updateTopbarStats(stats) {
    // Cập nhật vàng
    const goldElement = document.getElementById('gold');
    if (goldElement && stats.gold !== undefined) {
        goldElement.textContent = stats.gold;
    }
    
    // Cập nhật level/exp nếu có
    const levelElement = document.getElementById('level');
    if (levelElement && stats.level !== undefined) {
        levelElement.textContent = stats.level;
    }
}

function saveTimerHistory(duration) {
    const historyList = document.getElementById('timer-history-list');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const li = document.createElement('div');
    li.className = 'history-item';
    li.innerHTML = `<span>${timeStr}</span> - <strong>${duration} phút</strong>`;
    
    if (historyList) {
        historyList.insertBefore(li, historyList.firstChild);
        
        // Giới hạn 10 mục
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }
    
    // Lưu vào localStorage
    const history = JSON.parse(localStorage.getItem('timer-history') || '[]');
    history.unshift({
        time: now.toISOString(),
        duration: duration
    });
    localStorage.setItem('timer-history', JSON.stringify(history.slice(0, 10)));
}

function loadTimerHistory() {
    const historyList = document.getElementById('timer-history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('timer-history') || '[]');
    
    historyList.innerHTML = '';
    history.forEach(item => {
        const time = new Date(item.time);
        const timeStr = time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<span>${timeStr}</span> - <strong>${item.duration} phút</strong>`;
        historyList.appendChild(div);
    });
}

function loadTimerPresets() {
    const presetList = document.getElementById('preset-list');
    if (!presetList) return;
    
    const presets = JSON.parse(localStorage.getItem('timer-presets') || '[]');
    
    presetList.innerHTML = '';
    presets.forEach((preset, index) => {
        const div = document.createElement('div');
        div.className = 'preset-item';
        div.innerHTML = `
            <span>${preset.label} (${preset.minutes} phút)</span>
            <button onclick="loadPreset(${index})" style="margin-left:10px;padding:2px 8px;">Chọn</button>
            <button onclick="deletePreset(${index})" style="margin-left:5px;padding:2px 8px;background:#f44336;">X</button>
        `;
        presetList.appendChild(div);
    });
}

function loadPreset(index) {
    const presets = JSON.parse(localStorage.getItem('timer-presets') || '[]');
    if (presets[index]) {
        document.getElementById('minutes-input').value = presets[index].minutes;
        updateTimerFromInput();
    }
}

function deletePreset(index) {
    if (!confirm('Xóa preset này?')) return;
    
    const presets = JSON.parse(localStorage.getItem('timer-presets') || '[]');
    presets.splice(index, 1);
    localStorage.setItem('timer-presets', JSON.stringify(presets));
    loadTimerPresets();
}

// Gán sự kiện cho nút save preset
document.getElementById('save-preset')?.addEventListener('click', function() {
    const labelInput = document.getElementById('preset-label');
    const minutesInput = document.getElementById('minutes-input');
    
    if (!labelInput.value.trim()) {
        alert('Vui lòng nhập tên preset!');
        return;
    }
    
    const presets = JSON.parse(localStorage.getItem('timer-presets') || '[]');
    presets.push({
        label: labelInput.value,
        minutes: parseInt(minutesInput.value)
    });
    
    localStorage.setItem('timer-presets', JSON.stringify(presets));
    labelInput.value = '';
    loadTimerPresets();
});