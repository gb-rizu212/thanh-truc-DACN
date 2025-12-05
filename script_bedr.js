     document.addEventListener('DOMContentLoaded', function() {
                // Định nghĩa biến toàn cục cho tất cả trang
                window.API_BASE = 'http://localhost:3000/api';
                
                const db = {
                    get(key, defaultVal) {
                        const raw = localStorage.getItem(key);
                        if (!raw) return defaultVal;
                        try { return JSON.parse(raw); }
                        catch { return defaultVal; }
                    },
                    set(key, value) {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                };

                // POPUP IDS
                const popupIds = ["settings", "nap", "sleep", "mood_track", "journal"];

                function closeAllPopup() {
                     console.log('🔒 Closing all popups');
                    popupIds.forEach(id => {
                        const p = document.getElementById(id);
                        if (p) {
                            p.style.display = "none";
                            p.classList.remove('active');
                            p.setAttribute('aria-hidden','true');
                        }
                    });
                }

                function togglePopup(id) {
                    const popup = document.getElementById(id);
                    if (!popup) return;

                    const isVisible = popup.style.display === "flex";

                    closeAllPopup();

                    if (!isVisible) popup.style.display = "flex";
                }

                // Assign buttons - Kiểm tra phần tử tồn tại trước
                const settingsBtn = document.getElementById("settings-button");
                const napBtn = document.getElementById("nap-button");
                const sleepBtn = document.getElementById("sleep-button");
                const moodBtn = document.getElementById("mood_track-button");
                const journalBtn = document.getElementById("journal-button");
                
                if (settingsBtn) settingsBtn.onclick = () => togglePopup("settings");
                if (napBtn) napBtn.onclick = () => togglePopup("nap");
                if (sleepBtn) sleepBtn.onclick = () => togglePopup("sleep");
                if (moodBtn) moodBtn.onclick = () => togglePopup("mood_track");
                if (journalBtn) journalBtn.onclick = () => togglePopup("journal");

                // Click outside popup to close
                document.addEventListener("click", (e) => {
                    if (e.target.closest(".popup") || e.target.closest(".nav") || e.target.closest(".nav-button") ) return;
                    closeAllPopup();
                });

                // Thuật toán sắp xếp nhanh (QuickSort)
                function quickSort(arr, compare) {
                    if (arr.length <= 1) return arr;
                    const pivot = arr[0];
                    const left = [];
                    const right = [];
                    for (let i = 1; i < arr.length; i++) {
                        if (compare(arr[i], pivot) < 0) {
                            left.push(arr[i]);
                        } else {
                            right.push(arr[i]);
                        }
                    }
                    return [...quickSort(left, compare), pivot, ...quickSort(right, compare)];
                }

                function getComparator(sortBy) {
                    switch (sortBy) {
                        case 'dateAsc':
                            return (a, b) => a.date.localeCompare(b.date);
                        case 'mood':
                            const moodOrder = { '😭':1, '😠':2, '😑':3, '😌':4, '☺️':5 };
                            const moodValue = (mood) => moodOrder[mood] || 6;
                            return (a, b) => moodValue(a.mood) - moodValue(b.mood);
                        case 'lengthAsc':
                            return (a, b) => (a.content || '').length - (b.content || '').length;
                        case 'lengthDesc':
                            return (a, b) => (b.content || '').length - (a.content || '').length;
                        case 'dateDesc':
                        default:
                            return (a, b) => b.date.localeCompare(a.date);
                    }
                }

                // Lịch và Mood Tracking
                const moodKey = "mood_calendar_data";
                let dayData = db.get(moodKey, {});

                function fmtDateObj(d) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }

                function initCalendar() {
                    const calendarSmall = document.getElementById('calendar_small');
                    if (!calendarSmall) return;
                    
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const first = new Date(year, month, 1);
                    const last = new Date(year, month + 1, 0);
                    const start = first.getDay();

                    let html = `<div style="text-align:center;margin-bottom:8px;font-weight:600">${month+1}/${year}</div>`;
                    html += '<div class="mini-calendar">';

                    // Ngày trống đầu tuần
                    for (let i = 0; i < start; i++) html += '<div></div>';

                    // Các ngày trong tháng
                    for (let d = 1; d <= last.getDate(); d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const mood = dayData[dateStr]?.mood || '';
                        const today = d === now.getDate();
                        
                        html += `<div class="day-cell ${today ? 'today' : ''}" data-date="${dateStr}">
                                    <div>${d}</div>
                                    <div style="font-size:20px">${mood}</div>
                                </div>`;
                    }

                    html += '</div>';
                    calendarSmall.innerHTML = html;

                    // Gắn sự kiện click
                    document.querySelectorAll('#calendar_small .day-cell').forEach(el => {
                        el.addEventListener('click', () => {
                            const dateStr = el.dataset.date;
                            openDay(dateStr);
                        });
                    });

                    renderMoodHistory();
                    renderDayJournalList();
                }

                function renderMoodHistory() {
                    const container = document.getElementById('mood_history');
                    if (!container) return;
                    
                    container.innerHTML = '';
                    const groups = {};
                    
                    Object.keys(dayData).forEach(d => {
                        const m = dayData[d].mood || 'none';
                        if (!groups[m]) groups[m] = [];
                        groups[m].push({date: d, journal: dayData[d].journal});
                    });

                    Object.keys(groups).forEach(m => {
                        const div = document.createElement('div');
                        div.style.marginBottom = '6px';
                        div.innerHTML = `
                            <details>
                                <summary>${m || '(no mood)'} — ${groups[m].length} ngày</summary>
                                <div style="padding-left:6px">
                                    ${groups[m].map(x => `
                                        <div style='padding:6px;border-bottom:1px dashed #eee'>
                                            <strong>${x.date}</strong>
                                            <div class='small'>${x.journal ? x.journal.substring(0,80) : '<i>không ghi chú</i>'}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </details>`;
                        container.appendChild(div);
                    });
                }

                let currentOpenDate = fmtDateObj(new Date());

                function openDay(dateStr) {
                    currentOpenDate = dateStr;
                    const dayTitle = document.getElementById('day_title');
                    if (dayTitle) dayTitle.innerText = 'Ngày ' + dateStr;
                    
                    const d = dayData[dateStr] || {};
                    
                    // Set mood active
                    document.querySelectorAll('#right_mood_selector span').forEach(s => {
                        s.classList.toggle('active', s.dataset.mood === d.mood);
                    });
                    
                    const dayText = document.getElementById('day_text');
                    if (dayText) dayText.value = d.journal || '';
                }

                // Gắn sự kiện cho mood selector
                document.querySelectorAll('#right_mood_selector span').forEach(sp => {
                    sp.addEventListener('click', () => {
                        document.querySelectorAll('#right_mood_selector span').forEach(s => s.classList.remove('active'));
                        sp.classList.add('active');
                    });
                });

                // Lưu ngày
                const saveDayBtn = document.getElementById('save_day');
                if (saveDayBtn) {
                    saveDayBtn.addEventListener('click', () => {
                        const selected = document.querySelector('#right_mood_selector .active');
                        const mood = selected ? selected.dataset.mood : '';
                        const text = document.getElementById('day_text').value;
                        
                        dayData[currentOpenDate] = { mood, journal: text };
                        db.set(moodKey, dayData);
                        initCalendar();
                        alert('Đã lưu ngày ' + currentOpenDate);
                    });
                }

                // Mở journal từ ngày
                const openJournalBtn = document.getElementById('open_journal_from_day');
                if (openJournalBtn) {
                    openJournalBtn.addEventListener('click', () => {
                        togglePopup('journal');
                        const d = dayData[currentOpenDate] || {};
                        document.getElementById('journal_date').value = currentOpenDate;
                        document.getElementById('journal_mood').value = d.mood || '';
                        document.getElementById('journal_title').value = 'Nhật ký ' + currentOpenDate;
                        document.getElementById('editor-content').innerHTML = d.journal || '';
                    });
                }

                // Nhật ký
                const notesKey = 'simple_notes_v1';
                let notes = db.get(notesKey, []);
                let currentNoteId = null;

                function renderNotesList() {
                    const area = document.getElementById('notes_area');
                    if (!area) return;
                    
                    area.innerHTML = '';
                    
                    const sortSelect = document.getElementById('sort-select');
                    const sortBy = sortSelect ? sortSelect.value : 'dateDesc';
                    const comparator = getComparator(sortBy);
                    const sortedNotes = quickSort(notes, comparator);

                    sortedNotes.forEach(n => {
                        const div = document.createElement('div');
                        div.className = 'journal-card';
                        div.innerHTML = `
                            <div style='display:flex;justify-content:space-between;align-items:center'>
                                <div>
                                    <strong>${n.title || '(No title)'}</strong>
                                    <div class='small'>${n.date} ${n.mood ? '• ' + n.mood : ''}</div>
                                </div>
                                <div>
                                    <button data-id='${n.id}' class='open-note'>Mở</button>
                                </div>
                            </div>`;
                        area.appendChild(div);
                    });

                    document.querySelectorAll('.open-note').forEach(b => {
                        b.addEventListener('click', () => {
                            const id = b.dataset.id;
                            openNoteById(id);
                        });
                    });
                }

                function openNoteById(id) {
                    const n = notes.find(x => x.id == id);
                    if (!n) return;
                    
                    currentNoteId = n.id;
                    document.getElementById('journal_date').value = n.date;
                    document.getElementById('journal_title').value = n.title;
                    document.getElementById('journal_mood').value = n.mood || '';
                    document.getElementById('editor-content').innerHTML = n.content || '';
                }

                // Tạo note mới
                const createQuickBtn = document.getElementById('create_quick');
                if (createQuickBtn) {
                    createQuickBtn.addEventListener('click', () => {
                        document.getElementById('journal_date').value = fmtDateObj(new Date());
                        document.getElementById('journal_title').value = '';
                        document.getElementById('journal_mood').value = '';
                        document.getElementById('editor-content').innerHTML = '';
                        currentNoteId = null;
                    });
                }

                // Toolbar editor
                const editorToolbar = document.getElementById('editor-toolbar');
                if (editorToolbar) {
                    editorToolbar.addEventListener('click', (e) => {
                        const btn = e.target.closest('button');
                        if (!btn) return;
                        
                        const cmd = btn.dataset.cmd;
                        if (cmd) {
                            document.execCommand(cmd, false, null);
                            return;
                        }
                        
                        if (btn.id === 'btn-task') {
                            insertTaskList();
                        } else if (btn.id === 'btn-save') {
                            saveCurrentNote();
                        } else if (btn.id === 'btn-delete') {
                            if (!currentNoteId) {
                                alert('Chưa chọn note');
                                return;
                            }
                            if (confirm('Xóa note?')) {
                                notes = notes.filter(n => n.id !== currentNoteId);
                                db.set(notesKey, notes);
                                currentNoteId = null;
                                renderNotesList();
                                document.getElementById('editor-content').innerHTML = '';
                            }
                        }
                    });
                }

                function insertTaskList() {
                    const sel = window.getSelection();
                    if (!sel.rangeCount) {
                        document.getElementById('editor-content').innerHTML += '<ul><li><input type="checkbox"> &nbsp;</li></ul>';
                        return;
                    }
                    const range = sel.getRangeAt(0);
                    const ul = document.createElement('ul');
                    const li = document.createElement('li');
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    li.appendChild(cb);
                    li.appendChild(document.createTextNode(' Task...'));
                    ul.appendChild(li);
                    range.deleteContents();
                    range.insertNode(ul);
                }

                function saveCurrentNote() {
                    const date = document.getElementById('journal_date').value || fmtDateObj(new Date());
                    const title = document.getElementById('journal_title').value.trim() || ('Nhật ký ' + date);
                    const mood = document.getElementById('journal_mood').value || '';
                    const content = document.getElementById('editor-content').innerHTML;
                    
                    if (currentNoteId) {
                        const idx = notes.findIndex(n => n.id === currentNoteId);
                        if (idx >= 0) {
                            notes[idx].date = date;
                            notes[idx].title = title;
                            notes[idx].mood = mood;
                            notes[idx].content = content;
                            notes[idx].updatedAt = Date.now();
                        }
                    } else {
                        const n = {
                            id: Date.now() + Math.random(),
                            date,
                            title,
                            mood,
                            content,
                            updatedAt: Date.now()
                        };
                        notes.push(n);
                        currentNoteId = n.id;
                    }
                    
                    db.set(notesKey, notes);
                    renderNotesList();
                    alert('Đã lưu journal');
                }

                function renderDayJournalList() {
                    const box = document.getElementById('day_journal_list');
                    if (!box) return;
                    
                    box.innerHTML = '';
                    const entries = Object.keys(dayData).sort((a, b) => b.localeCompare(a));
                    
                    entries.forEach(d => {
                        const item = document.createElement('div');
                        item.className = 'journal-card';
                        item.innerHTML = `
                            <div style='display:flex;justify-content:space-between;align-items:center'>
                                <div>
                                    <strong>${d}</strong>
                                    <div class='small'>mood: ${dayData[d].mood || '(—)'}</div>
                                </div>
                                <div>
                                    <button onclick="copyDayToJournal('${d}')">Sao chép vào Journal</button>
                                </div>
                            </div>`;
                        box.appendChild(item);
                    });
                }

                function copyDayToJournal(d) {
                    const data = dayData[d];
                    document.getElementById('journal_date').value = d;
                    document.getElementById('journal_title').value = 'Nhật ký ' + d;
                    document.getElementById('journal_mood').value = data?.mood || '';
                    document.getElementById('editor-content').innerHTML = data?.journal || '';
                    togglePopup('journal');
                }

                // Sắp xếp
                const sortSelect = document.getElementById('sort-select');
                if (sortSelect) {
                    sortSelect.addEventListener('change', renderNotesList);
                }

                // Khởi tạo
                initCalendar();
                renderNotesList();
                
                // Mở ngày hiện tại
                openDay(fmtDateObj(new Date()));
            });

            // Xử lý copyDayToJournal từ inline onclick
            window.copyDayToJournal = function(d) {
                const data = dayData[d];
                document.getElementById('journal_date').value = d;
                document.getElementById('journal_title').value = 'Nhật ký ' + d;
                document.getElementById('journal_mood').value = data?.mood || '';
                document.getElementById('editor-content').innerHTML = data?.journal || '';
                togglePopup('journal');
            };