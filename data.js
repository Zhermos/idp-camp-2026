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
  // Sign in with Google (popup)
  signInWithGoogle() {
    if (!_auth) return Promise.reject('Firebase not ready');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return _auth.signInWithPopup(provider);
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
  { id:'red',    name:'Ares Exiles',     color:'#c0392b', score:0, icon:'🔴', deity:'Ares',    members:[] },
  { id:'green',  name:'Hermesian Veil',        color:'#27ae60', score:0, icon:'🟢', deity:'Hermesian',   members:[] },
  { id:'yellow', name:'Hubris Order', color:'#d4a017', score:0, icon:'🟡', deity:'Hubris',   members:[] },
  { id:'blue',   name:'Promethean Arcanum',       color:'#2980b9', score:0, icon:'🔵', deity:'Promethean', members:[] },
  { id:'purple', name:'Moira Conclave',     color:'#9729b9', score:0, icon:'🟣', deity:'Moira',   members:[] },
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

const DEFAULT_STAFF = [
  { id:'staff1', name:'พี่เนธ', pin:'1111', role:'staff' },
  { id:'staff2', name:'พี่น้ำ', pin:'2222', role:'staff' },
  { id:'admin1', name:'ปุน',  pin:'9999', role:'admin' },
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
  getCountdown() { return load(KEYS.countdown, { endTs: null, label: 'เหลือเวลา', isPaused: false, remainingSecs: 0 }); },
  setCountdown(h, m, label) { 
    const secs = (h*3600+m*60);
    save(KEYS.countdown, { 
      endTs: Date.now() + secs*1000, 
      label: label||'เหลือเวลา',
      isPaused: false,
      remainingSecs: secs
    }); 
  },
  getCountdownRemaining() { 
    const { endTs, isPaused, remainingSecs } = this.getCountdown();
    if (isPaused) return remainingSecs;
    return endTs ? Math.max(0, Math.floor((endTs-Date.now())/1000)) : null;
  },
  pauseCountdown() {
    const data = this.getCountdown();
    if (data.isPaused || !data.endTs) return;
    const remaining = Math.max(0, Math.floor((data.endTs - Date.now()) / 1000));
    data.isPaused = true;
    data.remainingSecs = remaining;
    data.endTs = null;
    save(KEYS.countdown, data);
  },
  resumeCountdown() {
    const data = this.getCountdown();
    if (!data.isPaused) return;
    data.isPaused = false;
    data.endTs = Date.now() + (data.remainingSecs * 1000);
    save(KEYS.countdown, data);
  },
  clearCountdown() {
    save(KEYS.countdown, { endTs: null, label: 'เหลือเวลา', isPaused: false, remainingSecs: 0 });
  },

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
  if (load(KEYS.teams, []).length === 0)    save(KEYS.teams,  DEFAULT_TEAMS);
  if (load(KEYS.quests, []).length === 0)   save(KEYS.quests, DEFAULT_QUESTS);
  if (load(KEYS.staff, []).length === 0)    save(KEYS.staff,  DEFAULT_STAFF);
  _syncFromFirebase();
  setTimeout(_listenFirebase, 1000);
})();

// Helper: รอ Firebase sync เสร็จก่อน (ใช้ใน camper boot)
function waitForSync(ms = 1500) {
  return new Promise(r => setTimeout(r, ms));
}

/* ═══════════════════════════════════════════════════════
   TARTARUS DECK — CARD SYSTEM
   ═══════════════════════════════════════════════════════ */

// ── Card Definitions ───────────────────────────────────
const CARD_ABILITIES = {
  steal:      { id:'steal',      icon:'⚡', name:'Steal',        desc:'ขโมยคะแนนจากทีมเป้าหมาย',                   needsTarget:true,  rarity:'common'    },
  aegis:      { id:'aegis',      icon:'🛡️', name:'Aegis Shield',  desc:'ป้องกันการโจมตี 1 ครั้ง',                   needsTarget:false, rarity:'rare'      },
  reflect:    { id:'reflect',    icon:'🔄', name:'Reflect',       desc:'สะท้อนการโจมตีกลับ 2 เท่า (ใช้ตอนโดนโจมตี)',needsTarget:false, rarity:'legendary' },
  multiplier: { id:'multiplier', icon:'🔥', name:'Multiplier',    desc:'คูณคะแนนภารกิจถัดไป x2',                    needsTarget:false, rarity:'legendary' },
  freeze:     { id:'freeze',     icon:'❄️', name:'Freeze',        desc:'หยุดการส่งงานของทีมเป้าหมาย 3 นาที',         needsTarget:true,  rarity:'legendary' },
};

const CARD_RARITIES = {
  common:    { label:'Common',    color:'#b0b8c1', glow:'rgba(176,184,193,.4)',  maxHold:5 },
  rare:      { label:'Rare',      color:'#4a90d9', glow:'rgba(74,144,217,.5)',   maxHold:4 },
  legendary: { label:'Legendary', color:'#e4be6e', glow:'rgba(228,190,110,.6)', maxHold:3 },
};

// KEYS เพิ่มเติม
KEYS.cards          = 'idp_cards';
KEYS.cardEvents     = 'idp_card_events';
KEYS.cardMasterOn   = 'idp_card_master';

// ── Card DB ────────────────────────────────────────────
const CARDS = {

  // Master switch
  isMasterOn() { return load(KEYS.cardMasterOn, false); },
  setMaster(on) {
    save(KEYS.cardMasterOn, on);
    if (_fbReady && _db) _db.ref('cards/master').set(on);
  },

  // สร้างการ์ดใหม่ (admin)
  createCard(ability, points, rarity, note, usageType) {
    const code = _genCode();
    const card = { 
      id: 'card_' + nextId(), 
      code, 
      ability, 
      points: points||100, 
      rarity: rarity||'common', 
      note: note||'', 
      usageType: usageType||'direct', // 'direct' หรือ 'vote'
      usedBy: null, 
      usedAt: null, 
      createdAt: isoNow() 
    };
    if (_fbReady && _db) _db.ref('cards/deck/' + card.id).set(card);
    return card;
  },

  // ลบการ์ด (admin)
  async deleteCard(cardId) {
    if (!_fbReady || !_db) return;
    // อ่านข้อมูลก่อนเพื่อดูว่าใครถืออยู่
    const snap = await _db.ref('cards/deck/' + cardId).once('value');
    const card = snap.val();
    if (card && card.usedBy) {
      await _db.ref(`cards/hand/${card.usedBy}/${cardId}`).remove();
    }
    // เช็คว่ามีการโหวตที่ใช้การ์ดใบนี้อยู่ไหม ถ้ามีให้ลบออก
    const teamsSnap = await _db.ref('cards/votes').once('value');
    const allVotes = teamsSnap.val() || {};
    for (const teamId in allVotes) {
      for (const voteId in allVotes[teamId]) {
        if (allVotes[teamId][voteId].card.id === cardId) {
          await _db.ref(`cards/votes/${teamId}/${voteId}`).remove();
        }
      }
    }
    // ลบจาก deck
    await _db.ref('cards/deck/' + cardId).remove();
  },

  // ดึงการ์ดทั้งหมด (admin)
  async getAllCards() {
    if (!_fbReady || !_db) return [];
    const snap = await _db.ref('cards/deck').once('value');
    return snap.val() ? Object.values(snap.val()) : [];
  },

  // Redeem ด้วย code
  async redeemCard(code, camperId, camperName, teamId) {
    if (!_fbReady || !_db) return { ok:false, msg:'Firebase ไม่พร้อม' };
    if (!this.isMasterOn()) return { ok:false, msg:'ระบบการ์ดยังไม่เปิด' };

    // หาการ์ดจาก code
    const snap = await _db.ref('cards/deck').orderByChild('code').equalTo(code.toUpperCase()).once('value');
    if (!snap.exists()) return { ok:false, msg:'ไม่พบรหัสนี้' };
    const [key, card] = Object.entries(snap.val())[0];
    if (card.usedBy) return { ok:false, msg:'รหัสนี้ถูกใช้แล้ว' };

    // เช็คจำนวนการ์ดที่ถือ
    const myCards = await this.getCamperCards(camperId);
    const maxHold = CARD_RARITIES[card.rarity]?.maxHold || 5;
    if (myCards.length >= maxHold) return { ok:false, msg:`ถือการ์ดได้สูงสุด ${maxHold} ใบ` };

    // Mark ว่าใช้แล้ว + เพิ่มให้ camper
    await _db.ref('cards/deck/' + key).update({ usedBy: camperId, usedAt: isoNow() });
    await _db.ref(`cards/hand/${camperId}/${card.id}`).set({ ...card, ownedAt: isoNow() });
    return { ok:true, card };
  },

  // ดึงการ์ดในมือของ camper
  async getCamperCards(camperId) {
    if (!_fbReady || !_db) return [];
    const snap = await _db.ref(`cards/hand/${camperId}`).once('value');
    return snap.val() ? Object.values(snap.val()) : [];
  },

  // ใช้การ์ด
  async activateCard(cardId, camperId, camperName, fromTeamId, targetTeamId) {
    if (!_fbReady || !_db) return { ok:false, msg:'Firebase ไม่พร้อม' };
    if (!this.isMasterOn()) return { ok:false, msg:'ระบบการ์ดยังไม่เปิด' };

    const snap = await _db.ref(`cards/hand/${camperId}/${cardId}`).once('value');
    if (!snap.exists()) return { ok:false, msg:'ไม่พบการ์ดนี้ในมือ' };
    const card = snap.val();
    const ability = CARD_ABILITIES[card.ability];
    if (!ability) return { ok:false, msg:'ไม่รู้จัก ability นี้' };

    const fromTeam = DB.getTeam(fromTeamId);
    const targetTeam = targetTeamId ? DB.getTeam(targetTeamId) : null;
    let resultMsg = '';

    switch(card.ability) {
      case 'steal': {
        if (!targetTeamId) return { ok:false, msg:'ต้องเลือกทีมเป้าหมาย' };
        // เช็ค aegis
        const aegis = await this._checkAegis(targetTeamId);
        if (aegis) {
          await this._consumeAegis(targetTeamId);
          resultMsg = `🛡️ ${targetTeam?.name} ป้องกันด้วย Aegis Shield!`;
          await this._pushCardEvent({ type:'aegis_block', fromTeamId, targetTeamId, cardId, camperName, msg: resultMsg });
          break;
        }
        DB.updateTeamScore(targetTeamId, -card.points);
        DB.updateTeamScore(fromTeamId, card.points);
        resultMsg = `⚡ ${camperName} ขโมย ${card.points} pt จาก ${targetTeam?.name}!`;
        await this._pushCardEvent({ type:'steal', fromTeamId, targetTeamId, cardId, camperName, points: card.points, msg: resultMsg });
        break;
      }
      case 'aegis': {
        // เก็บ aegis shield ไว้ที่ทีม
        await _db.ref(`cards/buffs/${fromTeamId}/aegis`).set({ active:true, cardId, setBy: camperName, setAt: isoNow() });
        resultMsg = `🛡️ ${fromTeam?.name} เปิดใช้ Aegis Shield!`;
        await this._pushCardEvent({ type:'aegis', fromTeamId, cardId, camperName, msg: resultMsg });
        break;
      }
      case 'reflect': {
        await _db.ref(`cards/buffs/${fromTeamId}/reflect`).set({ active:true, cardId, setBy: camperName, setAt: isoNow(), expiresAt: Date.now() + 2*60*1000 });
        resultMsg = `🔄 ${fromTeam?.name} เปิดใช้ Reflect! (2 นาที)`;
        await this._pushCardEvent({ type:'reflect', fromTeamId, cardId, camperName, msg: resultMsg });
        break;
      }
      case 'multiplier': {
        await _db.ref(`cards/buffs/${fromTeamId}/multiplier`).set({ active:true, multiplier:2, cardId, setBy: camperName, setAt: isoNow() });
        resultMsg = `🔥 ${fromTeam?.name} ได้ Multiplier x2 สำหรับภารกิจถัดไป!`;
        await this._pushCardEvent({ type:'multiplier', fromTeamId, cardId, camperName, multiplier:2, msg: resultMsg });
        break;
      }
      case 'freeze': {
        if (!targetTeamId) return { ok:false, msg:'ต้องเลือกทีมเป้าหมาย' };
        const aegis2 = await this._checkAegis(targetTeamId);
        if (aegis2) {
          await this._consumeAegis(targetTeamId);
          resultMsg = `🛡️ ${targetTeam?.name} ป้องกัน Freeze ด้วย Aegis!`;
          await this._pushCardEvent({ type:'aegis_block', fromTeamId, targetTeamId, cardId, camperName, msg: resultMsg });
          break;
        }
        const expiresAt = Date.now() + 3*60*1000;
        await _db.ref(`cards/buffs/${targetTeamId}/freeze`).set({ active:true, cardId, frozenBy: camperName, fromTeamId, expiresAt });
        resultMsg = `❄️ ${camperName} แช่แข็ง ${targetTeam?.name} 3 นาที!`;
        await this._pushCardEvent({ type:'freeze', fromTeamId, targetTeamId, cardId, camperName, expiresAt, msg: resultMsg });
        break;
      }
    }

    // ลบการ์ดออกจากมือ
    await _db.ref(`cards/hand/${camperId}/${cardId}`).remove();
    DB.pushActivity(`🎴 ${resultMsg}`);
    return { ok:true, msg: resultMsg };
  },

  // เช็คว่าทีมมี aegis ไหม
  async _checkAegis(teamId) {
    const snap = await _db.ref(`cards/buffs/${teamId}/aegis`).once('value');
    return snap.val()?.active === true;
  },
  async _consumeAegis(teamId) {
    await _db.ref(`cards/buffs/${teamId}/aegis`).remove();
  },

  // เช็ค freeze สำหรับ camper
  async isTeamFrozen(teamId) {
    if (!_fbReady || !_db) return false;
    const snap = await _db.ref(`cards/buffs/${teamId}/freeze`).once('value');
    const f = snap.val();
    if (!f?.active) return false;
    if (Date.now() > f.expiresAt) { await _db.ref(`cards/buffs/${teamId}/freeze`).remove(); return false; }
    return true;
  },

  // เช็ค multiplier
  async getMultiplier(teamId) {
    if (!_fbReady || !_db) return 1;
    const snap = await _db.ref(`cards/buffs/${teamId}/multiplier`).once('value');
    return snap.val()?.active ? (snap.val().multiplier||2) : 1;
  },
  async consumeMultiplier(teamId) {
    if (_fbReady && _db) await _db.ref(`cards/buffs/${teamId}/multiplier`).remove();
  },

  // Push card event ไปที่ Firebase (real-time alert)
  async _pushCardEvent(event) {
    if (!_fbReady || !_db) return;
    event.id = 'ev_' + Date.now();
    event.ts = isoNow();
    await _db.ref('cards/events/' + event.id).set(event);
    // เก็บแค่ 50 events ล่าสุด
    const snap = await _db.ref('cards/events').orderByChild('ts').limitToFirst(1).once('value');
  },

  // Listen card events (camper ใช้เพื่อรับ real-time alert)
  listenEvents(teamId, callback) {
    if (!_fbReady || !_db) return;
    _db.ref('cards/events').orderByChild('ts').limitToLast(1).on('child_added', snap => {
      const ev = snap.val();
      if (!ev) return;
      // แจ้งเตือนถ้า event เกี่ยวกับทีมนี้ และเกิดขึ้นหลังจาก listen
      if (ev.targetTeamId === teamId || ev.fromTeamId === teamId) callback(ev);
    });
  },

  // Listen master switch
  listenMaster(callback) {
    if (!_fbReady || !_db) return;
    _db.ref('cards/master').on('value', snap => callback(snap.val() === true));
  },

  // ดึง log events ทั้งหมด (admin)
  async getEventLog() {
    if (!_fbReady || !_db) return [];
    const snap = await _db.ref('cards/events').orderByChild('ts').limitToLast(50).once('value');
    return snap.val() ? Object.values(snap.val()).reverse() : [];
  },

  // ดึง buffs ของทุกทีม (admin dashboard)
  async getAllBuffs() {
    if (!_fbReady || !_db) return {};
    const snap = await _db.ref('cards/buffs').once('value');
    return snap.val() || {};
  },

  // ลบ buff เฉพาะทีม (admin)
  async removeBuff(teamId, buffType) {
    if (_fbReady && _db) await _db.ref(`cards/buffs/${teamId}/${buffType}`).remove();
  },

  // ── VOTING SYSTEM ────────────────────────────────────

  async getVoteConfig() {
    const snap = await _db.ref('cards/voteConfig').once('value');
    return snap.val() || { target: 3, timeout: 5 }; // default 3 คน 5 นาที
  },

  async setVoteConfig(config) {
    if (_fbReady && _db) await _db.ref('cards/voteConfig').set(config);
  },

  async startVote(cardId, camperId, camperName, teamId, targetTeamId) {
    if (!_fbReady || !_db) return { ok:false, msg:'Firebase ไม่พร้อม' };
    
    // เช็คว่ามีการโหวตค้างอยู่ไหม
    const existing = await _db.ref(`cards/votes/${teamId}`).once('value');
    if (existing.exists()) return { ok:false, msg:'มีการโหวตอื่นกำลังดำเนินการอยู่' };

    const snap = await _db.ref(`cards/hand/${camperId}/${cardId}`).once('value');
    const card = snap.val();
    if (!card) return { ok:false, msg:'ไม่พบการ์ดในมือ' };

    const config = await this.getVoteConfig();
    const voteId = 'vote_' + Date.now();
    const expiresAt = Date.now() + (config.timeout * 60 * 1000);

    const vote = {
      id: voteId,
      card,
      camperId,
      camperName,
      teamId,
      targetTeamId: targetTeamId || null,
      approvals: { [camperId]: true },
      count: 1,
      target: config.target,
      expiresAt,
      createdAt: isoNow(),
      status: 'pending'
    };

    await _db.ref(`cards/votes/${teamId}/${voteId}`).set(vote);
    
    // แจ้งเตือนเพื่อนในทีม
    await this._pushCardEvent({ 
      type: 'vote_start', 
      fromTeamId: teamId, 
      cardId, 
      camperName, 
      msg: `🗳️ ${camperName} ต้องการใช้การ์ด ${CARD_ABILITIES[card.ability]?.name}! ต้องการ ${config.target} โหวต (${config.timeout} นาที)` 
    });

    return { ok:true, voteId };
  },

  async approveVote(teamId, voteId, camperId, camperName) {
    if (!_fbReady || !_db) return;
    const ref = _db.ref(`cards/votes/${teamId}/${voteId}`);
    const snap = await ref.once('value');
    if (!snap.exists()) return;
    const vote = snap.val();
    if (vote.status !== 'pending') return;
    
    // เช็คเวลาหมดอายุ
    if (Date.now() > vote.expiresAt) {
      vote.status = 'expired';
      await ref.set(vote);
      setTimeout(() => ref.remove(), 3000);
      return { status: 'expired' };
    }

    if (vote.approvals[camperId]) return;

    vote.approvals[camperId] = true;
    vote.count = Object.keys(vote.approvals).length;

    if (vote.count >= vote.target) {
      vote.status = 'completed';
      await ref.set(vote);
      // Execute card!
      const result = await this.activateCard(vote.card.id, vote.camperId, vote.camperName, vote.teamId, vote.targetTeamId);
      // ลบโหวตหลังจากสำเร็จ (หรือเก็บไว้ซักพัก)
      setTimeout(() => ref.remove(), 2000);
      return { status: 'completed', result };
    } else {
      await ref.set(vote);
      return { status: 'pending', count: vote.count };
    }
  },

  listenVotes(teamId, callback) {
    if (!_fbReady || !_db) return;
    _db.ref(`cards/votes/${teamId}`).on('value', snap => {
      if (!snap.exists()) { callback(null); return; }
      const votes = Object.values(snap.val());
      const vote = votes[0];
      // เช็คการหมดอายุที่ฝั่ง client ด้วย
      if (vote && vote.status === 'pending' && Date.now() > vote.expiresAt) {
        callback(null);
        return;
      }
      callback(vote || null);
    });
  },
};

// helper สร้าง code 6 หลัก
function _genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i=0; i<6; i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}
