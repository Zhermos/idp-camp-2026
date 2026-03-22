/* ═══════════════════════════════════════════════════════
   IDP CAMP 2026 — DATA LAYER
   Firebase Realtime Database + Cloudinary Storage
   ═══════════════════════════════════════════════════════ */
'use strict';

// ── FIREBASE CONFIG ───────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBI9o11kr2Heh8j8SAeeN5xdDlKVv1l8qA",
  authDomain:        "idp-camp-2026.firebaseapp.com",
  databaseURL:       "https://idp-camp-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "idp-camp-2026",
  storageBucket:     "idp-camp-2026.firebasestorage.app",
  messagingSenderId: "117274878785",
  appId:             "1:117274878785:web:76a061c7f390ef9ceff7c0",
};

// ── CLOUDINARY CONFIG ─────────────────────────────────────
const CLOUDINARY = {
  cloudName:    'dplksxazw',
  uploadPreset: 'idp_camp',
  uploadUrl()   { return `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`; },
};

// ── FIREBASE INIT ─────────────────────────────────────────
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const _db = firebase.database();

const ref    = (path) => _db.ref(path);
const once   = (path) => ref(path).once('value').then(s => s.val());
const set    = (path, val) => ref(path).set(val);
const update = (path, val) => ref(path).update(val);
const remove = (path) => ref(path).remove();
const push   = (path, val) => ref(path).push(val);

function timestamp() {
  return new Date().toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
}
function isoNow() { return new Date().toISOString(); }

// ── DEFAULT DATA ──────────────────────────────────────────
const DEFAULT_TEAMS = [
  { id:'red',    name:'ทีมฮาเดส',   color:'#c0392b', score:0, icon:'🔴', deity:'Hades'    },
  { id:'green',  name:'ทีมอธีนา',   color:'#27ae60', score:0, icon:'🟢', deity:'Athena'   },
  { id:'yellow', name:'ทีมอะพอลโล', color:'#d4a017', score:0, icon:'🟡', deity:'Apollo'   },
  { id:'blue',   name:'ทีมโพไซดอน', color:'#2980b9', score:0, icon:'🔵', deity:'Poseidon' },
];

const DEFAULT_QUESTS = [
  { id:'q1', icon:'🕺', name:'เต้นไก่ย่าง',       desc:'เต้นไก่ย่างให้ครบ 3 รอบพร้อมทีม ถ่ายวิดีโอส่ง',  points:200, type:'main',  evidence:'video', active:true },
  { id:'q2', icon:'🎨', name:'วาดภาพทีม',          desc:'ระบายสีธงทีมให้สวยงาม ถ่ายรูปส่ง',                points:150, type:'main',  evidence:'image', active:true },
  { id:'q3', icon:'🧩', name:'ต่อ Puzzle',          desc:'ต่อ Puzzle ให้เสร็จภายใน 15 นาที',                 points:100, type:'side',  evidence:'image', active:true },
  { id:'q4', icon:'🎤', name:'ร้องเพลงประจำทีม',  desc:'ร้องเพลงของทีมพร้อมกัน ถ่ายคลิปส่ง',              points:180, type:'main',  evidence:'video', active:true },
  { id:'q5', icon:'📸', name:'ถ่ายรูปกับพี่สต๊าฟ',desc:'ถ่ายรูปกับพี่สต๊าฟ 5 คนขึ้นไป',                   points:50,  type:'side',  evidence:'image', active:true },
  { id:'q6', icon:'🍱', name:'รับประทานอาหารครบ',  desc:'รับประทานทุกมื้อพร้อมหน้า ถ่ายรูปหลักฐาน',         points:80,  type:'side',  evidence:'image', active:true },
  { id:'q7', icon:'⭐', name:'ช่วยงานสต๊าฟ',       desc:'อาสาช่วยงานพี่สต๊าฟ 1 ครั้งขึ้นไป',                points:120, type:'bonus', evidence:'image', active:true },
  { id:'q8', icon:'🎯', name:'เกมทายปริศนา',        desc:'ตอบคำถามปริศนาให้ได้ 5 ข้อขึ้นไป',                 points:100, type:'bonus', evidence:'image', active:true },
];

const DEFAULT_STAFF = [
  { id:'staff1', name:'พี่เอ็ม', pin:'1111', role:'staff' },
  { id:'staff2', name:'พี่เบล', pin:'2222', role:'staff' },
  { id:'admin1', name:'Admin',  pin:'9999', role:'admin' },
];

const DEFAULT_BADGES = [
  { id:'pioneer', emoji:'🏅', name:'ผู้บุกเบิก', desc:'ส่งงานชิ้นแรก',          condition:'firstSubmission' },
  { id:'artist',  emoji:'🎨', name:'ศิลปิน',     desc:'ผ่านภารกิจวาดภาพ',       condition:'quest', questId:'q2' },
  { id:'dancer',  emoji:'🕺', name:'นักเต้น',    desc:'ผ่านภารกิจเต้นไก่ย่าง',  condition:'quest', questId:'q1' },
  { id:'singer',  emoji:'🎤', name:'นักร้อง',    desc:'ผ่านภารกิจร้องเพลง',     condition:'quest', questId:'q4' },
  { id:'puzzler', emoji:'🧩', name:'นักปริศนา',  desc:'ผ่านภารกิจต่อ Puzzle',    condition:'quest', questId:'q3' },
  { id:'star',    emoji:'⭐', name:'ดาวค่าย',    desc:'ผ่านภารกิจครบ 5 ข้อ',    condition:'fiveQuests' },
  { id:'owl',     emoji:'🦉', name:'ผู้รู้',     desc:'ผ่านภารกิจโบนัสครบ',     condition:'allBonus' },
  { id:'thunder', emoji:'⚡', name:'เทพ',        desc:'อันดับ 1 ของทีม',         condition:'teamRank1' },
];

window.DEFAULT_BADGES = DEFAULT_BADGES;
window.DEFAULT_TEAMS  = DEFAULT_TEAMS;

// ── SESSION (localStorage — จำ identity บนอุปกรณ์นี้) ─────
const SESSION_KEY = 'idp_session_v1';

// ─────────────────────────────────────────────────────────
//  DB — PUBLIC API
// ---------------------------------------------------------
const DB = {

  // ── BOOTSTRAP ──
  async bootstrap() {
    const existing = await once('teams');
    if (!existing) {
      const teamsObj = {};
      DEFAULT_TEAMS.forEach(t => { teamsObj[t.id] = t; });
      await set('teams', teamsObj);

      const questsObj = {};
      DEFAULT_QUESTS.forEach(q => { questsObj[q.id] = q; });
      await set('quests', questsObj);

      const staffObj = {};
      DEFAULT_STAFF.forEach(s => { staffObj[s.id] = s; });
      await set('staff', staffObj);
    }
  },

  // ── TEAMS ──
  async getTeams() {
    const val = await once('teams');
    return val ? Object.values(val) : DEFAULT_TEAMS;
  },
  async getTeam(id) { return await once(`teams/${id}`); },
  async saveTeams(arr) {
    const obj = {};
    arr.forEach(t => { obj[t.id] = t; });
    await set('teams', obj);
  },
  async updateTeamScore(teamId, delta) {
    const t = await this.getTeam(teamId);
    if (t) await set(`teams/${teamId}/score`, Math.max(0, (t.score||0) + delta));
  },

  // ── QUESTS ──
  async getQuests() {
    const val = await once('quests');
    return val ? Object.values(val) : DEFAULT_QUESTS;
  },
  async saveQuests(arr) {
    const obj = {};
    arr.forEach(q => { obj[q.id] = q; });
    await set('quests', obj);
  },
  async addQuest(q) {
    const r = ref('quests').push();
    q.id = r.key;
    await set(`quests/${q.id}`, q);
    return q;
  },
  async deleteQuest(id) { await remove(`quests/${id}`); },

  // ── CAMPERS ──
  async getCampers() {
    const val = await once('campers');
    return val ? Object.values(val) : [];
  },
  async getCamper(id) { return await once(`campers/${id}`); },
  async upsertCamper(camper) { await set(`campers/${camper.id}`, camper); },
  async getCampersByTeam(teamId) {
    const all = await this.getCampers();
    return all.filter(c => c.teamId === teamId);
  },
  async updateCamperScore(camperId, delta) {
    const c = await this.getCamper(camperId);
    if (c) await set(`campers/${camperId}/score`, Math.max(0, (c.score||0) + delta));
  },
  async awardBadge(camperId, badgeId) {
    const badges = await once(`campers/${camperId}/badges`) || {};
    if (!badges[badgeId]) {
      await set(`campers/${camperId}/badges/${badgeId}`, true);
      return true;
    }
    return false;
  },

  // ── BADGE AUTO-AWARD ──
  async checkAndAwardBadges(camperId) {
    const camper       = await this.getCamper(camperId);
    if (!camper) return [];
    const allSubs      = await this.getCamperSubmissions(camperId);
    const approvedSubs = allSubs.filter(s => s.status === 'approved');
    const approvedIds  = new Set(approvedSubs.map(s => s.questId));
    const quests       = await this.getQuests();
    const bonusQuests  = quests.filter(q => q.type === 'bonus' && q.active);
    const allBonusDone = bonusQuests.length > 0 && bonusQuests.every(q => approvedIds.has(q.id));
    const teammates    = (await this.getCampersByTeam(camper.teamId)).sort((a,b)=>(b.score||0)-(a.score||0));
    const isRank1      = teammates.length > 0 && teammates[0].id === camperId && (camper.score||0) > 0;

    const awarded = [];
    for (const badge of DEFAULT_BADGES) {
      let earned = false;
      switch (badge.condition) {
        case 'firstSubmission': earned = approvedSubs.length >= 1; break;
        case 'quest':           earned = badge.questId && approvedIds.has(badge.questId); break;
        case 'fiveQuests':      earned = approvedSubs.length >= 5; break;
        case 'allBonus':        earned = allBonusDone; break;
        case 'teamRank1':       earned = isRank1; break;
      }
      if (earned && await this.awardBadge(camperId, badge.id)) awarded.push(badge);
    }
    return awarded;
  },

  // ── SUBMISSIONS ──
  async getSubmissions() {
    const val = await once('submissions');
    if (!val) return [];
    return Object.entries(val)
      .map(([id, s]) => ({ ...s, id }))
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async addSubmission(sub) {
    const r = ref('submissions').push();
    sub.id = r.key;
    sub.createdAt = isoNow();
    sub.status = 'pending';
    await set(`submissions/${sub.id}`, sub);
    return sub;
  },
  async updateSubmission(id, patch) { await update(`submissions/${id}`, patch); },
  async getPendingSubmissions() {
    const all = await this.getSubmissions();
    return all.filter(s => s.status === 'pending');
  },
  async getCamperSubmissions(camperId) {
    const all = await this.getSubmissions();
    return all.filter(s => s.camperId === camperId);
  },

  // ── CLOUDINARY UPLOAD ──
  // รับ File object → อัปโหลด → คืน { url, resourceType }
  async uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', CLOUDINARY.uploadUrl(), true);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url:          res.secure_url,
            resourceType: res.resource_type, // 'image' | 'video'
            publicId:     res.public_id,
            duration:     res.duration || null,
          });
        } else {
          reject(new Error('Upload failed: ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },

  // ── STAFF ──
  async getStaff() {
    const val = await once('staff');
    return val ? Object.values(val) : DEFAULT_STAFF;
  },
  async addStaff(member) {
    const r = ref('staff').push();
    member.id = r.key;
    await set(`staff/${member.id}`, member);
  },
  async removeStaff(id) { await remove(`staff/${id}`); },

  // ── ACTIVITIES ──
  async getActivities() {
    const val = await once('activities');
    if (!val) return [];
    return Object.values(val)
      .sort((a,b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 50);
  },
  async pushActivity(text) {
    await push('activities', { text, time: timestamp(), ts: isoNow() });
  },

  // ── REALTIME LISTENERS ──
  onTeamsChange(cb) {
    const r = ref('teams');
    const h = s => cb(s.val() ? Object.values(s.val()) : []);
    r.on('value', h);
    return () => r.off('value', h);
  },
  onActivitiesChange(cb) {
    const r = ref('activities');
    const h = s => {
      const val = s.val();
      cb(val ? Object.values(val).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,20) : []);
    };
    r.on('value', h);
    return () => r.off('value', h);
  },
  onSubmissionsChange(cb) {
    const r = ref('submissions');
    const h = s => {
      const val = s.val();
      cb(val ? Object.entries(val).map(([id,v])=>({...v,id})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)) : []);
    };
    r.on('value', h);
    return () => r.off('value', h);
  },
  onCamperChange(camperId, cb) {
    const r = ref(`campers/${camperId}`);
    r.on('value', s => cb(s.val()));
    return () => r.off('value');
  },

  // ── COUNTDOWN ──
  async getCountdown() { return await once('countdown') || { endTs: null, label: 'เหลือเวลา' }; },
  async setCountdown(h, m, label) {
    await set('countdown', { endTs: Date.now() + (h*3600+m*60)*1000, label: label||'เหลือเวลา' });
  },
  async clearCountdown() { await remove('countdown'); },
  async getCountdownRemaining() {
    const cd = await this.getCountdown();
    return cd.endTs ? Math.max(0, Math.floor((cd.endTs - Date.now()) / 1000)) : null;
  },
  onCountdownChange(cb) {
    const r = ref('countdown');
    r.on('value', s => cb(s.val() || { endTs: null, label: 'เหลือเวลา' }));
    return () => r.off('value');
  },

  // ── SESSION ──
  getSession() {
    try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  setSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} },
  clearSession() { localStorage.removeItem(SESSION_KEY); },

  // ── RESET ──
  async resetAll() {
    await Promise.all(['teams','quests','campers','submissions','activities','countdown','staff'].map(remove));
    await this.bootstrap();
  },
  async resetScoresOnly() {
    const [teams, campers] = await Promise.all([this.getTeams(), this.getCampers()]);
    await Promise.all([
      ...teams.map(t => set(`teams/${t.id}/score`, 0)),
      ...campers.map(c => update(`campers/${c.id}`, { score:0, badges:{} })),
      remove('submissions'),
      remove('activities'),
    ]);
  },

  // ── EXPORT CSV ──
  async exportCSV() {
    const [teams, campers, subs] = await Promise.all([this.getTeams(), this.getCampers(), this.getSubmissions()]);
    let csv = 'TEAM SCORES\nทีม,คะแนน\n';
    teams.sort((a,b)=>b.score-a.score).forEach(t => { csv += `${t.name},${t.score||0}\n`; });
    csv += '\nCAMPER SCORES\nชื่อ,ทีม,คะแนน,badges\n';
    campers.sort((a,b)=>(b.score||0)-(a.score||0)).forEach(c => {
      const team = teams.find(t=>t.id===c.teamId);
      const badges = c.badges ? Object.keys(c.badges).join('|') : '';
      csv += `${c.name},${team?.name||'-'},${c.score||0},${badges}\n`;
    });
    csv += '\nSUBMISSIONS\nภารกิจ,น้อง,ทีม,สถานะ,คะแนน,เวลา\n';
    subs.forEach(s => {
      const c = campers.find(x=>x.id===s.camperId);
      const t = teams.find(x=>x.id===s.teamId);
      csv += `${s.questName},${c?.name||'-'},${t?.name||'-'},${s.status},${s.points||0},${s.createdAt}\n`;
    });
    return csv;
  },
};

const QR = {
  base() { return `${location.origin}${location.pathname.replace(/[^/]*$/,'')}`; },
  camperUrl(teamId) { return this.base() + `camper.html?team=${teamId}`; },
  staffUrl()  { return this.base() + 'staff.html'; },
  adminUrl()  { return this.base() + 'admin.html'; },
};

// Auto bootstrap
DB.bootstrap().catch(e => console.error('Firebase bootstrap error:', e));
