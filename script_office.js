// ==================== CALENDAR LOGIC ====================
let current = new Date();

function renderCalendar() {
    const year = current.getFullYear();
    const month = current.getMonth();

    document.getElementById("calendar-month").innerText = `${month + 1} / ${year}`;

    const body = document.getElementById("calendar-body");
    body.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let day = 1;
    let started = false;

    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");

        for (let j = 1; j <= 7; j++) {
            const cell = document.createElement("td");

            if (!started && j === (firstDay === 0 ? 7 : firstDay)) {
                started = true;
            }

            if (started && day <= daysInMonth) {
                cell.innerText = day;

                // highlight today
                let today = new Date();
                if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add("today");
                }

                // task count badge
                let key = `${year}-${month + 1}-${day}`;
                let tasks = JSON.parse(localStorage.getItem("calendar-" + key)) || [];

                if (tasks.length > 0) {
                    const badge = document.createElement("span");
                    badge.classList.add("task-badge");
                    badge.innerText = tasks.length;
                    cell.appendChild(badge);
                }

                cell.addEventListener("click", () => loadDayTasks(key));
                day++;
            }

            row.appendChild(cell);
        }
        body.appendChild(row);
    }
}

// Calendar navigation
document.getElementById("prev-month").onclick = () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
};

document.getElementById("next-month").onclick = () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
};

// ==================== TASKS LOGIC ====================
let selectedDate = "";

function loadDayTasks(key) {
    selectedDate = key;
    document.getElementById("selected-date-title").innerText = `Ngày ${key}`;

    const ul = document.getElementById("calendar-task-list");
    ul.innerHTML = "";

    let list = JSON.parse(localStorage.getItem("calendar-" + key)) || [];

    list.forEach((t, i) => {
        let li = document.createElement("li");
        li.innerText = t;
        
        let deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.onclick = () => deleteCalendarTask(key, i);
        
        li.appendChild(deleteBtn);
        ul.appendChild(li);
    });
}

function deleteCalendarTask(key, index) {
    let list = JSON.parse(localStorage.getItem("calendar-" + key)) || [];
    list.splice(index, 1);
    localStorage.setItem("calendar-" + key, JSON.stringify(list));
    loadDayTasks(key);
    renderCalendar();
}

document.getElementById("add-calendar-task").onclick = () => {
    if (!selectedDate) {
        alert("Vui lòng chọn ngày từ lịch!");
        return;
    }

    const inp = document.getElementById("calendar-task-input");
    const txt = inp.value.trim();
    if (txt === "") return;

    let list = JSON.parse(localStorage.getItem("calendar-" + selectedDate)) || [];
    list.push(txt);

    localStorage.setItem("calendar-" + selectedDate, JSON.stringify(list));

    inp.value = "";
    loadDayTasks(selectedDate);
    renderCalendar();
};

    // ==================== TASK LOGIC ĐƠN GIẢN ====================
let currentEditingTaskId = null;

// Mở popup tạo/chỉnh sửa task
function openTaskDetailPopup(task = null) {
    const popup = document.getElementById('task-detail-popup');
    const title = document.getElementById('task-detail-title');
    const deleteBtn = document.getElementById('delete-task-btn');
    
    if (task) {
        title.textContent = 'Chỉnh sửa Task';
        currentEditingTaskId = task.id;
        // Điền thông tin task vào form
        document.getElementById('task-title-input').value = task.title;
        document.getElementById('task-notes-input').value = task.notes || '';
        deleteBtn.style.display = 'block';
    } else {
        title.textContent = 'Tạo Task Mới';
        currentEditingTaskId = null;
        document.getElementById('task-detail-form').reset();
        deleteBtn.style.display = 'none';
    }
    
    popup.style.display = 'flex';
}

// Đóng popup task detail
function closeTaskDetailPopup() {
    document.getElementById('task-detail-popup').style.display = 'none';
}

// Lưu task
document.getElementById('task-detail-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveTask();
});

function saveTask() {
    const title = document.getElementById('task-title-input').value.trim();
    if (!title) {
        alert('Vui lòng nhập tiêu đề task!');
        return;
    }
    
    const notes = document.getElementById('task-notes-input').value.trim();
    
    const taskData = {
        id: currentEditingTaskId || Date.now(),
        title,
        notes,
        createdAt: new Date().toISOString()
    };
    
    // Lưu vào localStorage
    const tasks = JSON.parse(localStorage.getItem('simple-tasks')) || [];
    
    if (currentEditingTaskId) {
        // Cập nhật task có sẵn
        const index = tasks.findIndex(task => task.id === currentEditingTaskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
        }
    } else {
        // Thêm task mới
        tasks.push(taskData);
    }
    
    localStorage.setItem('simple-tasks', JSON.stringify(tasks));
    closeTaskDetailPopup();
    loadTasks();
}

// Xóa task hiện tại
function deleteCurrentTask() {
    if (currentEditingTaskId && confirm('Bạn có chắc muốn xóa task này?')) {
        const tasks = JSON.parse(localStorage.getItem('simple-tasks')) || [];
        const updatedTasks = tasks.filter(task => task.id !== currentEditingTaskId);
        localStorage.setItem('simple-tasks', JSON.stringify(updatedTasks));
        closeTaskDetailPopup();
        loadTasks();
    }
}

// Tải danh sách tasks
function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    const tasks = JSON.parse(localStorage.getItem('simple-tasks')) || [];
    
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-tasks">Chưa có task nào. Hãy thêm task mới!</div>';
        return;
    }
    
    // Sắp xếp tasks theo ngày tạo mới nhất
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.onclick = () => openTaskDetailPopup(task);
        
        taskElement.innerHTML = `
            <div class="task-title">${task.title}</div>
            ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
        `;
        
        tasksList.appendChild(taskElement);
    });
}

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', function() {
    // Gán sự kiện cho nút thêm task mới
    document.getElementById('add-task').addEventListener('click', function() {
        openTaskDetailPopup();
    });
    
    // Thêm task-detail-popup vào danh sách popupIds để quản lý đóng/mở
    popupIds.push("task-detail-popup");
    
    // Tải tasks khi mở popup task-calendar
    const taskCalendarButton = document.getElementById('task-calendar-button');
    if (taskCalendarButton) {
        taskCalendarButton.addEventListener('click', function() {
            setTimeout(loadTasks, 100);
        });
    }
});
// ==================== HISTORY LOGIC ====================
function loadHistory() {
    let hTask = document.getElementById("history-tasks");
    let hTimer = document.getElementById("history-timers");
    let hNote = document.getElementById("history-notes");

    hTask.innerHTML = "";
    hTimer.innerHTML = "";
    hNote.innerHTML = "";

    // tasks
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.filter(t => t.done).forEach(t => {
        let li = document.createElement("li");
        li.innerText = t.title;
        hTask.appendChild(li);
    });

    // timers
    let timers = JSON.parse(localStorage.getItem("timer")) || [];
    timers.forEach(t => {
        let li = document.createElement("li");
        li.innerText = `Hoàn thành ${t.duration} phút`;
        hTimer.appendChild(li);
    });

    // notes
    let notes = JSON.parse(localStorage.getItem("note")) || [];
    notes.forEach(n => {
        let li = document.createElement("li");
        li.innerText = n.title || "(Note không tiêu đề)";
        hNote.appendChild(li);
    });
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    renderCalendar();
    loadTasks();
    
    // Gán sự kiện cho nút history
    document.getElementById("history-button").addEventListener("click", loadHistory);
});