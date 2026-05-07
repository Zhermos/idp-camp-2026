/* ═══════════════════════════════════════════════════════
   IDP CAMP 2026 — DATA LAYER
   Firebase Realtime DB + Firebase Auth (Google Sign-In)
   ═══════════════════════════════════════════════════════ */
'use strict';

const firebaseConfig = {
  apiKey:            "AIzaSyBI9o11kr2Heh8j8SAeeN5xdDlKVv1l8qA",
  authDomain:        "idp-camp-2026.firebaseapp.com",
  databaseURL:       "https://idp-camp-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "idp-camp-2026",
  storageBucket:     "idp-camp-2026.firebasestorage.app",
  messagingSenderId: "117274878785",
  appId:             "1:117274878785:web:76a061c7f390ef9ceff7c0",
};

const CLOUDINARY_CLOUD  = 'dplksxazw';
const CLOUDINARY_PRESET = 'idp_camp';

// ── Firebase init ──────────────────────────────────────
let _fbReady = false, _db = null, _auth = null;
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    _db    = firebase.database();
    _auth  = firebase.auth();
    _fbReady = true;
  }
} catch(e) { console.warn('Firebase init failed:', e); }

// ── Google Auth helpers ────────────────────────────────
const AUTH = {
  // Sign in with Google (redirect — works on GitHub Pages)
  signInWithGoogle() {
    if (!_auth) return Promise.reject('Firebase not ready');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return _auth.signInWithRedirect(provider);
  },

  // Call on page load to get redirect result
  getRedirectResult() {
    if (!_auth) return Promise.resolve(null);
    return _auth.getRedirectResult();
  },

  // Sign out
  signOut() {
    if (!_auth) return Promise.resolve();
    return _auth.signOut();
  },

  // Get current Firebase user (null if not signed in)
  currentUser() {
    return _auth ? _auth.currentUser : null;
  },

  // Listen for auth state changes
  onAuthStateChanged(cb) {
    if (!_auth) return;
    _auth.onAuthStateChanged(cb);
  },

  // Check if email is in staff whitelist (stored in Firebase DB)
  async isStaff(email) {
    if (!_db || !email) return false;
    try {
      const snap = await _db.ref('whitelist/staff/' + _emailKey(email)).once('value');
      return snap.exists();
    } catch { return false; }
  },

  // Check if email is admin
  async isAdmin(email) {
    if (!_db || !email) return false;
    try {
      const snap = await _db.ref('whitelist/admin/' + _emailKey(email)).once('value');
      return snap.exists();
    } catch { return false; }
  },

  // Add staff email to whitelist
  async addStaffEmail(email, name) {
    if (!_db) return;
    await _db.ref('whitelist/staff/' + _emailKey(email)).set({ email, name, addedAt: isoNow() });
  },

  // Add admin email to whitelist
  async addAdminEmail(email, name) {
    if (!_db) return;
    await _db.ref('whitelist/admin/' + _emailKey(email)).set({ email, name, addedAt: isoNow() });
  },

  // Remove from whitelist
  async removeStaffEmail(email) {
    if (!_db) return;
    await _db.ref('whitelist/staff/' + _emailKey(email)).remove();
  },
  async removeAdminEmail(email) {
    if (!_db) return;
    await _db.ref('whitelist/admin/' + _emailKey(email)).remove();
  },

  // Get all staff whitelist
  async getStaffWhitelist() {
    if (!_db) return [];
    const snap = await _db.ref('whitelist/staff').once('value');
    return snap.val() ? Object.values(snap.val()) : [];
  },

  // Get all admin whitelist
  async getAdminWhitelist() {
    if (!_db) return [];
    const snap = await _db.ref('whitelist/admin').once('value');
    return snap.val() ? Object.values(snap.val()) : [];
  },
};

// email → safe Firebase key (replace . with ,)
function _emailKey(email) { return email.replace(/\./g, ','); }

// ── Defaults ───────────────────────────────────────────
const DEFAULT_TEAMS = [
  { id:'red',    name:'Moira Conclave',     color:'#c0392b', score:0, icon:'🔴', deity:'Hades',    members:[] },
  { id:'green',  name:'Ares Exiles',        color:'#27ae60', score:0, icon:'🟢', deity:'Athena',   members:[] },
  { id:'yellow', name:'Promethean Arcanum', color:'#d4a017', score:0, icon:'🟡', deity:'Apollo',   members:[] },
  { id:'blue',   name:'Hubris Order',       color:'#2980b9', score:0, icon:'🔵', deity:'Poseidon', members:[] },
  { id:'purple', name:'Hermesian Veil',     color:'#9729b9', score:0, icon:'🟣', deity:'Hermes',   members:[] },
];

const DEFAULT_QUESTS = [
  { id:1, icon:'🕺', name:'เต้นไก่ย่าง',       desc:'เต้นไก่ย่างให้ครบ 3 รอบพร้อมทีม ถ่ายวิดีโอส่ง',   points:200, type:'main',  evidence:'video', active:true },
  { id:2, icon:'🎨', name:'วาดภาพทีม',          desc:'ระบายสีธงทีมให้สวยงาม ถ่ายรูปส่ง',                 points:150, type:'main',  evidence:'image', active:true },
  { id:3, icon:'🧩', name:'ต่อ Puzzle',          desc:'ต่อ Puzzle ให้เสร็จภายใน 15 นาที',                  points:100, type:'side',  evidence:'image', active:true },
  { id:4, icon:'🎤', name:'ร้องเพลงประจำทีม',  desc:'ร้องเพลงของทีมพร้อมกัน ถ่ายคลิปส่ง',               points:180, type:'main',  evidence:'video', active:true },
  { id:5, icon:'📸', name:'ถ่ายรูปกับพี่สต๊าฟ',desc:'ถ่ายรูปกับพี่สต๊าฟ 5 คนขึ้นไป',                    points:50,  type:'side',  evidence:'image', active:true },
  { id:6, icon:'🍱', name:'รับประทานอาหารครบ',  desc:'รับประทานทุกมื้อพร้อมหน้า ถ่ายรูปหลักฐาน',          points:80,  type:'side',  evidence:'image', active:true },
  { id:7, icon:'⭐', name:'ช่วยงานสต๊าฟ',       desc:'อาสาช่วยงานพี่สต๊าฟ 1 ครั้งขึ้นไป',                 points:120, type:'bonus', evidence:'image', active:true },
  { id:8, icon:'🎯', name:'เกมทายปริศนา',        desc:'ตอบคำถามปริศนาให้ได้ 5 ข้อขึ้นไป',                  points:100, type:'bonus', evidence:'image', active:true },
];

const DEFAULT_BADGES = [
  { id:'pioneer',  emoji:'🏅', name:'ผู้บุกเบิก',  desc:'ส่งงานชิ้นแรก',          questId:null, condition:'firstSubmission' },
  { id:'artist',   emoji:'🎨', name:'ศิลปิน',      desc:'ผ่านภารกิจวาดภาพ',       questId:2,    condition:'quest' },
  { id:'dancer',   emoji:'🕺', name:'นักเต้น',     desc:'ผ่านภารกิจเต้นไก่ย่าง',  questId:1,    condition:'quest' },
  { id:'singer',   emoji:'🎤', name:'นักร้อง',     desc:'ผ่านภารกิจร้องเพลง',     questId:4,    condition:'quest' },
  { id:'puzzler',  emoji:'🧩', name:'นักปริศนา',   desc:'ผ่านภารกิจต่อ Puzzle',    questId:3,    condition:'quest' },
  { id:'star',     emoji:'⭐', name:'ดาวค่าย',     desc:'ผ่านภารกิจครบ 5 ข้อ',    questId:null, condition:'fiveQuests' },
  { id:'owl',      emoji:'🦉', name:'ผู้รู้',      desc:'ผ่านภารกิจโบนัสครบ',     questId:null, condition:'allBonus' },
  { id:'thunder',  emoji:'⚡', name:'เทพ',         desc:'อันดับ 1 ของทีม',         questId:null, condition:'teamRank1' },
];

const KEYS = {
  teams:'idp_teams', quests:'idp_quests', campers:'idp_campers',
  submissions:'idp_submissions', staff:'idp_staff', activities:'idp_activities',
  countdown:'idp_countdown', session:'idp_session', nextId:'idp_nextid',
};

// ── Storage helpers ────────────────────────────────────
function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  if (_fbReady && _db) try { _db.ref('store/' + key).set(value); } catch(e) {}
}
function nextId() { const n = load(KEYS.nextId, 1000); save(KEYS.nextId, n+1); return n; }
function timestamp() { return new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' }); }
function isoNow() { return new Date().toISOString(); }

function _syncFromFirebase() {
  if (!_fbReady || !_db) return;
  [KEYS.teams, KEYS.quests, KEYS.campers, KEYS.submissions, KEYS.staff, KEYS.activities, KEYS.countdown].forEach(key => {
    _db.ref('store/' + key).once('value').then(snap => {
      const val = snap.val();
      if (val !== null && val !== undefined) localStorage.setItem(key, JSON.stringify(val));
    }).catch(() => {});
  });
}

function _listenFirebase() {
  if (!_fbReady || !_db) return;
  [KEYS.teams, KEYS.campers, KEYS.submissions, KEYS.activities, KEYS.countdown].forEach(key => {
    _db.ref('store/' + key).on('value', snap => {
      const val = snap.val();
      if (val !== null && val !== undefined) localStorage.setItem(key, JSON.stringify(val));
    });
  });
}

function uploadFile(file, onProgress, onDone, onError) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, true);
  if (onProgress) xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
  xhr.onload = () => { if (xhr.status === 200) { const r = JSON.parse(xhr.responseText); if(onDone) onDone(r.secure_url, r.resource_type); } else { if(onError) onError('Upload failed'); } };
  xhr.onerror = () => { if(onError) onError('Network error'); };
  xhr.send(fd);
}

// ── DB ─────────────────────────────────────────────────
const DB = {
  getTeams() { return load(KEYS.teams, DEFAULT_TEAMS); },
  saveTeams(t) { save(KEYS.teams, t); },
  getTeam(id) { return this.getTeams().find(t => t.id === id); },
  updateTeamScore(teamId, delta) {
    const teams = this.getTeams(), t = teams.find(t => t.id === teamId);
    if (t) { t.score = Math.max(0, t.score + delta); save(KEYS.teams, teams); }
  },
  getQuests() { return load(KEYS.quests, DEFAULT_QUESTS); },
  saveQuests(q) { save(KEYS.quests, q); },
  addQuest(q) { const qs = this.getQuests(); q.id = nextId(); qs.push(q); save(KEYS.quests, qs); return q; },
  deleteQuest(id) { save(KEYS.quests, this.getQuests().filter(q => q.id !== id)); },
  getCampers() { return load(KEYS.campers, []); },
  getCamper(id) { return this.getCampers().find(c => c.id === id); },
  upsertCamper(camper) {
    const cs = this.getCampers(), idx = cs.findIndex(c => c.id === camper.id);
    if (idx >= 0) cs[idx] = { ...cs[idx], ...camper }; else cs.push(camper);
    save(KEYS.campers, cs);
  },
  getCampersByTeam(teamId) { return this.getCampers().filter(c => c.teamId === teamId); },
  updateCamperScore(camperId, delta) {
    const cs = this.getCampers(), c = cs.find(c => c.id === camperId);
    if (c) { c.score = Math.max(0, (c.score||0) + delta); save(KEYS.campers, cs); }
  },
  awardBadge(camperId, badgeId) {
    const cs = this.getCampers(), c = cs.find(c => c.id === camperId);
    if (c) { if (!c.badges) c.badges = []; if (!c.badges.includes(badgeId)) { c.badges.push(badgeId); save(KEYS.campers, cs); return true; } }
    return false;
  },
  checkAndAwardBadges(camperId) {
    const camper = this.getCamper(camperId); if (!camper) return [];
    const approvedSubs = this.getCamperSubmissions(camperId).filter(s => s.status === 'approved');
    const approvedQuestIds = new Set(approvedSubs.map(s => s.questId));
    const bonusQuests = this.getQuests().filter(q => q.type === 'bonus' && q.active);
    const allBonusDone = bonusQuests.length > 0 && bonusQuests.every(q => approvedQuestIds.has(q.id));
    const teammates = this.getCampersByTeam(camper.teamId).sort((a,b) => (b.score||0) - (a.score||0));
    const isRank1 = teammates.length > 0 && teammates[0].id === camperId && (camper.score||0) > 0;
    const awarded = [];
    for (const badge of DEFAULT_BADGES) {
      let earned = false;
      switch (badge.condition) {
        case 'firstSubmission': earned = approvedSubs.length >= 1; break;
        case 'quest': earned = badge.questId != null && approvedQuestIds.has(badge.questId); break;
        case 'fiveQuests': earned = approvedSubs.length >= 5; break;
        case 'allBonus': earned = allBonusDone; break;
        case 'teamRank1': earned = isRank1; break;
      }
      if (earned && this.awardBadge(camperId, badge.id)) awarded.push(badge);
    }
    return awarded;
  },
  getSubmissions() { return load(KEYS.submissions, []); },
  addSubmission(sub) {
    const subs = this.getSubmissions();
    sub.id = nextId(); sub.createdAt = isoNow(); sub.status = 'pending';
    subs.unshift(sub); save(KEYS.submissions, subs); return sub;
  },
  updateSubmission(id, patch) {
    const subs = this.getSubmissions(), idx = subs.findIndex(s => s.id === id);
    if (idx >= 0) { subs[idx] = { ...subs[idx], ...patch }; save(KEYS.submissions, subs); }
  },
  getPendingSubmissions() { return this.getSubmissions().filter(s => s.status === 'pending'); },
  getCamperSubmissions(camperId) { return this.getSubmissions().filter(s => s.camperId === camperId); },
  getStaff() { return load(KEYS.staff, []); },
  saveStaff(s) { save(KEYS.staff, s); },
  getActivities() { return load(KEYS.activities, []); },
  pushActivity(text, teamId) {
    const a = this.getActivities(); a.unshift({ text, time: timestamp(), ts: isoNow(), teamId: teamId||null });
    if (a.length > 50) a.pop(); save(KEYS.activities, a);
  },
  getCountdown() { return load(KEYS.countdown, { endTs: null, label: 'เหลือเวลา' }); },
  setCountdown(h, m, label) { save(KEYS.countdown, { endTs: Date.now() + (h*3600+m*60)*1000, label: label||'เหลือเวลา' }); },
  getCountdownRemaining() { const {endTs} = this.getCountdown(); return endTs ? Math.max(0, Math.floor((endTs-Date.now())/1000)) : null; },

  // Session = UID-based (campers), stored in localStorage only
  getSession() { return load(KEYS.session, null); },
  setSession(s) { try { localStorage.setItem(KEYS.session, JSON.stringify(s)); } catch {} },
  clearSession() { localStorage.removeItem(KEYS.session); },

  resetAll() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); if(_fbReady&&_db) _db.ref('store').remove(); },
  resetScoresOnly() {
    save(KEYS.teams, DEFAULT_TEAMS.map(t => ({ ...t, score: 0 })));
    save(KEYS.submissions, []); save(KEYS.activities, []);
    save(KEYS.campers, this.getCampers().map(c => ({ ...c, score: 0, badges: [] })));
  },
  exportCSV() {
    const teams = this.getTeams(), campers = this.getCampers(), subs = this.getSubmissions();
    let csv = 'TEAM SCORES\nทีม,คะแนน\n';
    teams.sort((a,b)=>b.score-a.score).forEach(t => { csv += `${t.name},${t.score}\n`; });
    csv += '\nCAMPER SCORES\nชื่อ,ทีม,คะแนน,badges\n';
    campers.sort((a,b)=>(b.score||0)-(a.score||0)).forEach(c => {
      const team = teams.find(t=>t.id===c.teamId);
      csv += `${c.name},${team?.name||'-'},${c.score||0},${(c.badges||[]).join('|')}\n`;
    });
    csv += '\nSUBMISSIONS\nภารกิจ,น้อง,ทีม,สถานะ,คะแนน,เวลา\n';
    subs.forEach(s => {
      const c = campers.find(c=>c.id===s.camperId), team = teams.find(t=>t.id===s.teamId);
      csv += `${s.questName},${c?.name||'-'},${team?.name||'-'},${s.status},${s.points||0},${s.createdAt}\n`;
    });
    return csv;
  },
  uploadFile(file, onProgress, onDone, onError) { uploadFile(file, onProgress, onDone, onError); },
};

const QR = {
  camperUrl(teamId) { return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}camper.html?team=${teamId}`; },
  staffUrl() { return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}staff.html`; },
  adminUrl() { return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}admin.html`; },
};

(function bootstrap() {
  if (!localStorage.getItem(KEYS.teams))  save(KEYS.teams,  DEFAULT_TEAMS);
  if (!localStorage.getItem(KEYS.quests)) save(KEYS.quests, DEFAULT_QUESTS);
  _syncFromFirebase();
  setTimeout(_listenFirebase, 1500);
})();
