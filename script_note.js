// script_note.js
const NoteApp = (() => {
    // Chỉ khởi tạo khi DOM đã sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const foldersKey = 'note_folders';
        const notesKey = 'note_notes';
        let folders = db ? db.get(foldersKey, []) : [];
        let notes = db ? db.get(notesKey, []) : [];
        let currentNoteId = null;

        // Kiểm tra và lấy các phần tử DOM
        const editorToolbar = document.getElementById('editor-toolbar');
        if (editorToolbar) {
            editorToolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const cmd = btn.dataset.cmd;
                if (cmd) {
                    if (cmd === 'hiliteColor') {
                        document.execCommand('hiliteColor', false, 'yellow');
                    } else {
                        document.execCommand(cmd, false, null);
                    }
                    return;
                }
                // custom commands
                if (btn.id === 'btn-upper') {
                    transformSelectionToUpper();
                } else if (btn.id === 'btn-task') {
                    insertTaskList();
                } else if (btn.id === 'btn-save') {
                    saveCurrentNote();
                } else if (btn.id === 'btn-delete') {
                    deleteCurrentNote();
                }
            });
        }

// ... toàn bộ code script_note.js ...
    /* ---------------------------
	NOTES: folders + notes + editor
	Data model:
		folders: [{id, name}]
		notes: [{id, title, content, folderId, updatedAt}]
	--------------------------- */
	// const foldersKey = 'note_folders';
	// const notesKey = 'note_notes';

	// let folders = db.get(foldersKey, []);
	// let notes = db.get(notesKey, []);
	// let currentNoteId = null;

	// DOM
	const foldersArea = document.getElementById('folders-area');
	const notesArea = document.getElementById('notes-area');
	const createFolderBtn = document.getElementById('create-folder');
	const folderNameInput = document.getElementById('folder-name');
	const createNoteBtn = document.getElementById('create-note');
	const noteTitleInput = document.getElementById('note-title-input');
	const editorTitle = document.getElementById('editor-title');
	const editorContent = document.getElementById('editor-content');
	const btnSaveNote = document.getElementById('btn-save');
	const btnDeleteNote = document.getElementById('btn-delete');

	// toolbar formatting using document.execCommand (works for simple editor)
	document.getElementById('editor-toolbar').addEventListener('click', (e)=>{
	const btn = e.target.closest('button');
	if(!btn) return;
	const cmd = btn.dataset.cmd;
	if(cmd){
		if(cmd === 'hiliteColor'){
		document.execCommand('hiliteColor', false, 'yellow');
		} else {
		document.execCommand(cmd, false, null);
		}
		return;
	}
	// custom commands
	if(btn.id === 'btn-upper'){
		transformSelectionToUpper();
	} else if(btn.id === 'btn-task'){
		insertTaskList();
	} else if(btn.id === 'btn-save'){
		saveCurrentNote();
	} else if(btn.id === 'btn-delete'){
		deleteCurrentNote();
	}
	});

	// helpers: save/load UI lists
	function renderFolders(){
	foldersArea.innerHTML = '';
	const allBtn = document.createElement('div'); allBtn.className='small'; allBtn.style.padding='6px'; allBtn.style.cursor='pointer'; allBtn.innerText='• All'; 
	allBtn.onclick = ()=> renderNotesList(null);
	foldersArea.appendChild(allBtn);
	folders.forEach(f=>{
		const row = document.createElement('div'); row.style.padding='6px'; row.style.cursor='pointer';
		row.innerText = f.name;
		row.onclick = ()=> renderNotesList(f.id);
		const del = document.createElement('button'); del.textContent='X'; del.style.float='right'; del.onclick = (ev)=>{ ev.stopPropagation(); if(confirm('Xóa folder và chuyển note về None?')){ deleteFolder(f.id); } };
		row.appendChild(del);
		foldersArea.appendChild(row);
	});
	}
	function renderNotesList(folderId=null){
	notesArea.innerHTML = '';
	const filtered = notes.filter(n => folderId ? n.folderId === folderId : true).sort((a,b)=> b.updatedAt - a.updatedAt);
	filtered.forEach(n=>{
		const row = document.createElement('div'); row.style.padding='8px'; row.style.borderBottom='1px solid #eee';
		const t = document.createElement('div'); t.innerText = n.title || '(No title)'; t.style.fontWeight='600';
		const s = document.createElement('div'); s.className='small'; s.innerText = new Date(n.updatedAt).toLocaleString();
		row.appendChild(t); row.appendChild(s);
		const actions = document.createElement('div'); actions.style.float='right';
		const btnOpen = document.createElement('button'); btnOpen.textContent='Open'; btnOpen.onclick = ()=> openNote(n.id);
		const btnMove = document.createElement('button'); btnMove.textContent='Move'; btnMove.onclick = ()=> promptMoveToFolder(n.id);
		const btnDel = document.createElement('button'); btnDel.textContent='Del'; btnDel.style.background='#ef4444'; btnDel.style.color='white'; btnDel.onclick = ()=> { if(confirm('Xóa note?')){ deleteNote(n.id); } };
		actions.appendChild(btnOpen); actions.appendChild(btnMove); actions.appendChild(btnDel);
		row.appendChild(actions);
		notesArea.appendChild(row);
	});
	}

	// folder operations
	createFolderBtn.addEventListener('click', ()=>{
	const name = folderNameInput.value.trim();
	if(!name) { alert('Nhập tên folder'); return; }
	folders.push({ id: Date.now()+Math.random(), name });
	db.set(foldersKey, folders);
	folderNameInput.value='';
	renderFolders();
	});
	function deleteFolder(folderId){
	// move notes to folder null
	notes = notes.map(n => n.folderId === folderId ? {...n, folderId: null} : n);
	folders = folders.filter(f => f.id !== folderId);
	db.set(foldersKey, folders);
	db.set(notesKey, notes);
	renderFolders(); renderNotesList(null);
	}

	// note create
	createNoteBtn.addEventListener('click', ()=>{
	const title = noteTitleInput.value.trim() || 'New note';
	const n = { id: Date.now()+Math.random(), title, content:'', folderId:null, updatedAt: Date.now() };
	notes.unshift(n);
	db.set(notesKey, notes);
	noteTitleInput.value='';
	renderNotesList(null);
	});

	// open / edit note
	function openNote(id){
	const n = notes.find(x=>x.id===id);
	if(!n) return;
	currentNoteId = id;
	editorTitle.value = n.title;
	editorContent.innerHTML = n.content;
	document.getElementById('current-note-id').innerText = id;
	}
	function saveCurrentNote(){
	if(!currentNoteId){ alert('Chưa chọn note để lưu'); return; }
	const idx = notes.findIndex(x=>x.id===currentNoteId);
	if(idx <0) return;
	notes[idx].title = editorTitle.value;
	notes[idx].content = editorContent.innerHTML;
	notes[idx].updatedAt = Date.now();
	db.set(notesKey, notes);
	renderNotesList(null);
	alert('Đã lưu');
	}
	function deleteCurrentNote(){
	if(!currentNoteId){ alert('Chưa chọn note'); return; }
	if(!confirm('Xác nhận xóa note này?')) return;
	notes = notes.filter(n => n.id !== currentNoteId);
	db.set(notesKey, notes);
	currentNoteId = null;
	editorTitle.value=''; editorContent.innerHTML='';
	renderNotesList(null);
	}

	// move note to folder
	function promptMoveToFolder(noteId){
	const choices = ['(No folder)'].concat(folders.map(f=>f.name));
	const selection = prompt('Nhập tên folder đích (chính xác) hoặc để trống để bỏ thư mục:\n' + choices.join('\n'));
	if(selection === null) return;
	const folder = folders.find(f => f.name === selection);
	const idx = notes.findIndex(n=>n.id===noteId);
	if(idx <0) return;
	notes[idx].folderId = folder ? folder.id : null;
	notes[idx].updatedAt = Date.now();
	db.set(notesKey, notes);
	renderNotesList(null);
	}

	// delete note
	function deleteNote(id){
	notes = notes.filter(n => n.id !== id);
	db.set(notesKey, notes);
	renderNotesList(null);
	}

	// formatting helpers
	function transformSelectionToUpper(){
	const sel = window.getSelection();
	if(!sel.rangeCount) return;
	const range = sel.getRangeAt(0);
	const txt = range.toString();
	if(txt.length===0) return;
	const up = txt.toUpperCase();
	range.deleteContents();
	range.insertNode(document.createTextNode(up));
	}
	function insertTaskList(){
	const sel = window.getSelection();
	if(!sel.rangeCount) return;
	const range = sel.getRangeAt(0);
	// create ul with a checkbox li
	const ul = document.createElement('ul');
	const li = document.createElement('li');
	const cb = document.createElement('input'); cb.type='checkbox';
	li.appendChild(cb);
	const txt = document.createTextNode(' ');
	li.appendChild(txt);
	ul.appendChild(li);
	range.deleteContents();
	range.insertNode(ul);
	}

	// init notes UI
	(function initNotes(){
	folders = db.get(foldersKey, []);
	notes = db.get(notesKey, []);
	renderFolders();
	renderNotesList(null);
	})();

	/* when opening note popup, we want to close other popups; handled earlier
	Also allow clicking note-button to open popup (already wired)
	*/

	/* small UX: when clicking a note row, open it
	(we already have Open button)
	*/

	// support saving editor with Ctrl+S
	editorContent.addEventListener('keydown', (e)=>{
	if((e.ctrlKey || e.metaKey) && e.key === 's'){ e.preventDefault(); saveCurrentNote(); }
	});
   //======================================

   
return {
      renderFolders,
      renderNotesList,
      deleteFolder,
      openNote,
      saveCurrentNote,
      deleteCurrentNote,
      promptMoveToFolder,
      deleteNote,
      transformSelectionToUpper,
      insertTaskList,
      initNotes
   };

})()