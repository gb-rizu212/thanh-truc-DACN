/* ---------------------------
Motivation: upload + show + random non-repeat sequencing
Data model in localStorage:
    mot_media = [{id, type:'image'|'video', dataUrl, name}]
--------------------------- */
const motFilesInput = document.getElementById('mot-files');
const motAddBtn = document.getElementById('mot-add');
const motClearBtn = document.getElementById('mot-clear');
const motList = document.getElementById('mot-list');
const motMediaWrap = document.getElementById('mot-media-wrap');
const motPrevBtn = document.getElementById('mot-prev');
const motNextBtn = document.getElementById('mot-next');
const motPrevIdxBtn = document.getElementById('mot-prev-idx');
const motNextIdxBtn = document.getElementById('mot-next-idx');
const motRandomNewBtn = document.getElementById('mot-randomize');

let mot_media = db.get('mot_media', []);

// Sequence state for random non-repeat:
let mot_sequence = []; // shuffled indices
let mot_seqPos = 0;    // current pointer

function saveMot(){
db.set('mot_media', mot_media);
renderMotList();
}
function renderMotList(){
motList.innerHTML = '';
mot_media.forEach((m, idx) => {
    const row = document.createElement('div'); row.className='media-item';
    const left = document.createElement('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.gap='8px';
    const thumb = document.createElement(m.type==='video' ? 'video' : 'img'); thumb.className='small-thumb';
    thumb.src = m.dataUrl;
    thumb.alt = m.name || ('media-'+idx);
    thumb.setAttribute('muted',''); thumb.setAttribute('playsinline','');
    left.appendChild(thumb);
    const name = document.createElement('div'); name.style.flex='1'; name.innerText = m.name || `#${idx+1}`;
    left.appendChild(name);
    row.appendChild(left);

    const actions = document.createElement('div');
    const btnView = document.createElement('button'); btnView.textContent='View'; btnView.onclick = ()=> { showMotIndex(idx); };
    const btnRemove = document.createElement('button'); btnRemove.textContent='Delete'; btnRemove.style.background='#ef4444'; btnRemove.style.color='white';
    btnRemove.onclick = ()=> { if(confirm('Xóa media này?')){ mot_media.splice(idx,1); saveMot(); ensureSequenceAfterChange(); } };
    actions.appendChild(btnView); actions.appendChild(btnRemove);
    row.appendChild(actions);
    motList.appendChild(row);
});
}

// helper: load file to DataURL
function fileToDataUrl(file){ return new Promise((res, rej)=>{
const r = new FileReader();
r.onload = ()=> res(r.result);
r.onerror = (e)=> rej(e);
r.readAsDataURL(file);
}); }

motAddBtn.addEventListener('click', async ()=>{
const files = motFilesInput.files;
if(!files || files.length===0){ alert('Chọn file trước đã'); return; }
for(const f of files){
    const url = await fileToDataUrl(f);
    const type = f.type.startsWith('video') ? 'video' : 'image';
    mot_media.push({ id: Date.now() + Math.random(), type, dataUrl: url, name: f.name });
    // avoid blocking UI for many files: small pause (not strictly necessary)
}
saveMot();
motFilesInput.value = '';
// reset sequence to include new ones
createNewSequence();
});

// clear all
motClearBtn.addEventListener('click', ()=>{
if(confirm('Xóa tất cả media?')){ mot_media = []; saveMot(); createNewSequence(); motMediaWrap.innerHTML=''; }
});

// render shown media
function renderCurrentMediaBySequence(){
if(mot_sequence.length===0){ motMediaWrap.innerHTML = '<div class="small">Không có media nào — hãy thêm.</div>'; return; }
if(mot_seqPos <0) mot_seqPos = 0;
if(mot_seqPos >= mot_sequence.length) mot_seqPos = mot_sequence.length-1;
const idx = mot_sequence[mot_seqPos];
showMedia(mot_media[idx]);
updateListSelection(idx);
}

// show by index direct
function showMotIndex(idx){
// ensure index is part of sequence: bring pointer to that index
// if not present (sequence outdated), recreate sequence
if(!mot_sequence.includes(idx)) createNewSequence();
mot_seqPos = mot_sequence.indexOf(idx);
renderCurrentMediaBySequence();
}

function showMedia(item){
motMediaWrap.innerHTML = '';
if(!item) return;
if(item.type === 'video'){
    const v = document.createElement('video');
    v.src = item.dataUrl; v.controls = true; v.autoplay = true; v.loop = false; v.style.maxHeight='100%';
    motMediaWrap.appendChild(v);
} else {
    const img = document.createElement('img'); img.src = item.dataUrl; img.alt = item.name;
    motMediaWrap.appendChild(img);
}
}

// next / prev in sequence
motNextBtn.addEventListener('click', ()=>{
if(mot_sequence.length===0) return;
mot_seqPos++;
if(mot_seqPos >= mot_sequence.length) { // reached end -> regenerate a fresh sequence (non-repeat cycle done)
    createNewSequence();
    mot_seqPos = 0;
}
renderCurrentMediaBySequence();
});
motPrevBtn.addEventListener('click', ()=>{
if(mot_sequence.length===0) return;
mot_seqPos--;
if(mot_seqPos < 0) mot_seqPos = mot_sequence.length - 1;
renderCurrentMediaBySequence();
});

// left/right index buttons: move to previous/next index in current raw array order (not sequence)
motPrevIdxBtn.addEventListener('click', ()=>{
if(mot_media.length===0) return;
// find current real index
const cur = mot_sequence[mot_seqPos] ?? 0;
const prev = (cur - 1 + mot_media.length) % mot_media.length;
showMotIndex(prev);
});
motNextIdxBtn.addEventListener('click', ()=>{
if(mot_media.length===0) return;
const cur = mot_sequence[mot_seqPos] ?? 0;
const next = (cur + 1) % mot_media.length;
showMotIndex(next);
});

// Randomize: create new random order (new shuffle)
motRandomNewBtn.addEventListener('click', ()=> { createNewSequence(); renderCurrentMediaBySequence(); });

// build shuffled sequence
function createNewSequence(){
mot_sequence = mot_media.map((_,i)=>i);
// Durstenfeld shuffle
for(let i=mot_sequence.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [mot_sequence[i], mot_sequence[j]] = [mot_sequence[j], mot_sequence[i]];
}
mot_seqPos = 0;
// if no media, clear viewer
if(mot_sequence.length===0) motMediaWrap.innerHTML = '<div class="small">Không có media.</div>';
saveSequenceState();
}
function saveSequenceState(){
// persist sequence & pos to resume session
localStorage.setItem('mot_sequence', JSON.stringify(mot_sequence));
localStorage.setItem('mot_seqPos', mot_seqPos);
}
function loadSequenceState(){
const s = db.get('mot_sequence', null);
const p = db.get('mot_seqPos', 0);
if(Array.isArray(s) && s.length===mot_media.length){
    mot_sequence = s; mot_seqPos = p;
} else {
    createNewSequence();
}
}

// highlight selected small thumb in list
function updateListSelection(realIndex){
Array.from(motList.children).forEach((r, idx) => r.style.background = (idx===realIndex ? '#eef6ff' : 'transparent'));
}

/* init motivation */
(function initMot(){
mot_media = db.get('mot_media', []);
renderMotList();
// load sequence if exists; if mismatch length -> create new
const savedSeq = db.get('mot_sequence', null);
if(savedSeq && Array.isArray(savedSeq) && savedSeq.length === mot_media.length){
    mot_sequence = savedSeq;
    mot_seqPos = db.get('mot_seqPos',0) || 0;
} else {
    createNewSequence();
}
renderCurrentMediaBySequence();
})();

// ensure sequence when media array changes
function ensureSequenceAfterChange(){
if(mot_sequence.length !== mot_media.length){
    createNewSequence();
} else {
    saveSequenceState();
}
}
