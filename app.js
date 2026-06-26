import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// --- DYNAMIC CLASS GENERATOR ---
const VOCATION_DATA = {
    'vanguard': { trackers: ['Guard Stance Tracker'], features: ['Vanguard Features', 'Defensive Techniques'], equip: ['Primary Weapon'] },
    'warrior': { trackers: ['Battle Surge Tracker'], features: ['Combat Techniques'], equip: ['Weapon Loadout'] },
    'heartbound': { trackers: ['Script Slots', 'Concords'], features: ['Scriptcasting'], equip: ['Heart Focus'] },
    'peacekeeper': { trackers: ['Marked Targets Tracker'], features: ['Authority Features'], equip: ['Badge/Emblem'] },
    'scavenger': { trackers: ['Salvage Cache'], features: ['Improvised Equipment'], equip: ['Scavenging Tools'] },
    'nomad': { trackers: ['Survival Resources', 'Companion Tracker'], features: ['Travel Features'], equip: ['Travel Gear'] },
    'warden': { trackers: ['Companion Tracker'], features: ['Nature Features'], equip: ['Warden Tools'] },
    'chronicler': { trackers: ['Inspiration Tracker'], features: ['Recorded Knowledge'], equip: ['Journal'] },
    'orator': { trackers: ['Script Slots'], features: ['Scriptcasting Focus'], equip: ['Focus Item'] },
    'scriptweaver': { trackers: ['Script Slots'], features: ['Scriptcasting Patterns'], equip: ['Script Focus'] },
    'wartouched': { trackers: ['Core Energy Tracker'], features: ['Transformation Abilities'], equip: ['Core Relic'] },
    'archivist': { trackers: ['Script Slots'], features: ['Archive Codex'], equip: ['Archive Tools'] },
    'fabricator': { trackers: ['Script Slots', 'Construct Tracker'], features: ['Fabrication Toolkit'], equip: ['Fabrication Tools'] }
};

window.currentRenderedClass = null;
window.getVocationAliases = () => {
    const t = campaignSettings?.terms || {};
    return {
        'vanguard': (t.class_vanguard || 'vanguard').toLowerCase(), 'warrior': (t.class_warrior || 'warrior').toLowerCase(),
        'peacekeeper': (t.class_peacekeeper || 'peacekeeper').toLowerCase(), 'scavenger': (t.class_scavenger || 'scavenger').toLowerCase(),
        'heartbound': (t.class_heartbound || 'heartbound').toLowerCase(), 'nomad': (t.class_nomad || 'nomad').toLowerCase(),
        'warden': (t.class_warden || 'wilderness warden').toLowerCase(), 'chronicler': (t.class_chronicler || 'chronicler').toLowerCase(),
        'orator': (t.class_orator || 'orator').toLowerCase(), 'scriptweaver': (t.class_scriptweaver || 'scriptweaver').toLowerCase(),
        'wartouched': (t.class_wartouched || 'war-touched').toLowerCase(), 'archivist': (t.class_archivist || 'archivist').toLowerCase(),
        'fabricator': (t.class_fabricator || 'fabricator').toLowerCase()
    };
};

window.getHitDie = (className) => {
    if (!className) return 8; const c = className.toLowerCase(); const aliases = window.getVocationAliases();
    if (c.includes(aliases['vanguard'])) return 12;
    if (c.includes(aliases['warrior']) || c.includes(aliases['heartbound']) || c.includes(aliases['nomad'])) return 10;
    if (c.includes(aliases['scriptweaver']) || c.includes(aliases['archivist'])) return 6;
    return 8; 
};

// FIREBASE INITIALIZATION
const firebaseConfig = { apiKey: "AIzaSyCKRN5dfi4og69_D8ZAvV1BQfwCK_f2uis", authDomain: "dndcampaigns-f3d48.firebaseapp.com", projectId: "dndcampaigns-f3d48", storageBucket: "dndcampaigns-f3d48.firebasestorage.app", messagingSenderId: "1074491536795", appId: "1:1074491536795:web:56211729489be776d79d3e" };
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);

// GLOBALS
const urlParams = new URLSearchParams(window.location.search); 
let appId = urlParams.get('id') || urlParams.get('campaignId');
if (!appId && (window.location.href.startsWith('blob:') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) appId = "demo_campaign";

let characters = [], parties = [], vocationsData = [], codexScripts = [];
let currentUser = null, activeCharId = null, activeRole = 'player', rollMode = 'normal', autoSaveTimer = null;
let lastGeneratedScores = [], sessionRerollUsed = false, activeManagePartyId = null, activeMoveLvl = null, editingMoveIndex = null;
let campaignSettings = { terms: {} };
let luStep = 0; let luChosenClass = ''; let luIsNewClass = false; let luHpGained = 0;


// ==========================================
// 1. MISSING STUB FUNCTIONS (To prevent crashes)
// Add your specific logic into these blocks later.
// ==========================================

window.showToast = (msg) => {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerText = msg;
        toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, 3000);
    } else {
        console.log("TOAST:", msg);
    }
};

window.renderDashboard = () => {
    const container = document.getElementById('party-view-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (characters.length === 0) {
        container.innerHTML = '<p class="text-gray-400 font-serif italic">No characters found in the database. Create one!</p>';
        return;
    }
    
    // Simple placeholder card logic
    characters.forEach(char => {
        container.innerHTML += `
            <div class="card p-4 mb-4 rounded border border-gray-600 cursor-pointer" onclick="console.log('Open character', '${char.id}')">
                <h3 class="text-gold font-bold">${char.name || 'Unknown Adventurer'}</h3>
                <p class="text-xs text-gray-400">Level ${char.level || 1} ${char.class || ''}</p>
            </div>
        `;
    });
};

window.createChar = async (type) => {
    console.log("Creating new character of type:", type);
    window.showToast(`Creating new ${type}...`);
    // Add Firestore addDoc logic here
};

window.closeSheet = () => {
    document.getElementById('sheet-screen').classList.add('hidden-view');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    activeCharId = null;
};

window.syncSheetData = () => {
    console.log("Syncing sheet data for character ID:", activeCharId);
    // Add logic to populate input fields based on the active character
};

window.saveCurrentCharacter = async (force = false) => {
    console.log("Saving character data to Firebase...");
    if (force) window.showToast("Character Synced!");
};

window.calcMods = () => {
    console.log("Calculating modifiers...");
};

window.openSettingsModal = () => console.log("Opening settings modal...");
window.openMulticlassModal = () => console.log("Opening multiclass modal...");
window.updateLevelDependencies = (val) => console.log("Updating dependencies for level", val);
window.openScoreGenModal = () => console.log("Opening score gen modal...");
window.rollIndividualInitiative = () => console.log("Rolling initiative...");
window.openHpAdjustmentModal = () => console.log("Opening HP adjustment modal...");
window.rest = (type) => console.log(`Taking a ${type} rest...`);
window.rollDeathSave = () => console.log("Rolling death save...");
window.toggleDS = (type, num) => console.log(`Toggling death save: ${type} ${num}`);
window.handleComaToggle = (checked) => console.log(`Coma status: ${checked}`);
window.switchSheetTab = (tab) => {
    console.log(`Switching to tab: ${tab}`);
    // Hide all tabs, show the active one, update tab button classes
};
window.addAttackItem = () => console.log("Adding new attack item...");
window.addLanguageItem = () => console.log("Adding new language...");
window.switchSubFilter = (filter) => console.log(`Switching sub-filter to: ${filter}`);
window.applyTerminology = (terms) => console.log("Applying campaign terminology...", terms);
window.claimCharacter = () => console.log("Claiming character...");
window.updateCharStatus = (status) => console.log("Updating status to", status);
window.sendDmWhisper = () => console.log("Sending DM whisper...");
window.toggleSheetUnlock = (checked) => console.log("Toggling sheet unlock:", checked);


// ==========================================
// 2. EXISTING LOGIC (From your original file)
// ==========================================

window.routeTo = (page) => { try { let targetUrl = page; if (appId && appId !== "demo_campaign") targetUrl += `?id=${appId}`; window.location.href = targetUrl; } catch (e) { window.showToast("Navigation blocked."); } };

window.autoCalcHP = (force = false) => {
    const char = characters.find(c => c.id === activeCharId); if (!char) return;
    const conMod = Math.floor(((parseInt(document.querySelector('[data-key="con"]')?.value) || 10) - 10) / 2);
    let totalHp = 0; let hdParts = [];
    let classes = char.classes || []; if (classes.length === 0) { classes = [{name: document.getElementById('class-input')?.value || '', level: parseInt(document.querySelector('[data-key="level"]')?.value) || 1}]; }
    classes.forEach((cls, idx) => {
        const hd = window.getHitDie(cls.name); const lvl = parseInt(cls.level) || 1; if (lvl > 0) hdParts.push(`${lvl}d${hd}`);
        for (let i = 0; i < lvl; i++) { if (idx === 0 && i === 0) totalHp += (hd + conMod); else totalHp += (Math.floor(hd / 2) + 1 + conMod); }
    });
    const hdString = hdParts.join(' + ') || '1d8'; const hdInput = document.querySelector('[data-key="hd"]');
    if (hdInput && (force || hdInput.value === '1d8' || hdInput.value === '')) hdInput.value = hdString;
    const maxHpInput = document.querySelector('[data-key="hpMax"]');
    if (maxHpInput) {
        if (force || parseInt(maxHpInput.value) === 10) {
            maxHpInput.value = totalHp; const curHpInput = document.querySelector('[data-key="hpCurrent"]');
            if (curHpInput && (force || parseInt(curHpInput.value) === 10)) curHpInput.value = totalHp;
        }
    }
    if (force) { window.saveCurrentCharacter(); window.showToast(`Max HP set to ${totalHp}`); }
};

window.updateClassSpecifics = () => {
    const inputVal = (document.getElementById('class-input')?.value || '').toLowerCase();
    let matchedClasses = []; const aliases = window.getVocationAliases();
    for (const k in VOCATION_DATA) { if (inputVal.includes(aliases[k])) matchedClasses.push(k); }
    const matchKey = matchedClasses.sort().join(','); if (matchKey === window.currentRenderedClass) return; window.currentRenderedClass = matchKey;
    const tCard = document.getElementById('dynamic-class-trackers-card'); const tContent = document.getElementById('dynamic-class-trackers-content');
    const fSection = document.getElementById('dynamic-class-features-section'); const fContent = document.getElementById('dynamic-class-features-content');
    const eSection = document.getElementById('dynamic-class-equip-section'); const eContent = document.getElementById('dynamic-class-equip-content');
    if (matchedClasses.length === 0) { if(tCard) tCard.classList.add('hidden'); if(fSection) fSection.classList.add('hidden'); if(eSection) eSection.classList.add('hidden'); return; }
    let allTrackers = [], allFeatures = [], allEquip = [];
    matchedClasses.forEach(mC => { const data = VOCATION_DATA[mC]; allTrackers = [...new Set([...allTrackers, ...data.trackers])]; allFeatures = [...new Set([...allFeatures, ...data.features])]; allEquip = [...new Set([...allEquip, ...data.equip])]; });
    if (tCard && tContent && allTrackers.length > 0) { tCard.classList.remove('hidden'); tContent.innerHTML = allTrackers.map(t => `<div class="flex justify-between items-center mb-2"><label class="tiny-label mt-0">${t}</label><input type="text" data-key="tracker_${t.replace(/[^a-zA-Z0-9]/g,'_')}" class="w-16 bg-transparent border-b border-dashed border-gray-400 text-center font-bold text-lg" placeholder="0"></div>`).join(''); }
    if (fSection && fContent && allFeatures.length > 0) { fSection.classList.remove('hidden'); fContent.innerHTML = allFeatures.map(f => `<div class="trait-section"><label class="trait-title">${f}</label><textarea data-key="feature_${f.replace(/[^a-zA-Z0-9]/g,'_')}" class="trait-input-area font-serif" placeholder="+ Add details..."></textarea></div>`).join(''); }
    if (eSection && eContent && allEquip.length > 0) { eSection.classList.remove('hidden'); eContent.innerHTML = allEquip.map(e => `<div><label class="prof-label mb-1">${e}</label><textarea data-key="equip_${e.replace(/[^a-zA-Z0-9]/g,'_')}" class="w-full bg-white/40 border border-gold/30 p-2 rounded text-[12px] h-16 font-serif" placeholder="Items..."></textarea></div>`).join(''); }
    if (activeCharId && characters) {
        const char = characters.find(c => c.id === activeCharId);
        if (char) {
            const canEdit = (currentUser && char.owner === currentUser.username) || char.owner === 'DM' || activeRole === 'dm';
            document.querySelectorAll('#dynamic-class-trackers-card [data-key], #dynamic-class-features-section [data-key], #dynamic-class-equip-section [data-key]').forEach(el => { el.value = char[el.dataset.key] !== undefined ? char[el.dataset.key] : ""; el.readOnly = !canEdit; el.disabled = !canEdit; });
        }
    }
};

window.openLevelUpModal = () => {
    const char = characters.find(c => c.id === activeCharId); if (!char) return;
    luStep = 0; luChosenClass = ''; luIsNewClass = false; luHpGained = 0;
    if (!char.classes || char.classes.length === 0) { let primaryClass = char.class ? char.class.replace(/\s+\d+$/, '').trim() : 'Adventurer'; char.classes = [{name: primaryClass, level: parseInt(char.level) || 3}]; }
    document.getElementById('level-up-modal').classList.remove('hidden'); window.renderLuStep();
};
window.closeLevelUpModal = () => document.getElementById('level-up-modal').classList.add('hidden');

window.renderLuStep = () => {
    const char = characters.find(c => c.id === activeCharId); const content = document.getElementById('lu-content-area'); const nextBtn = document.getElementById('lu-next-btn');
    for(let i=0; i<4; i++) { const dot = document.getElementById(`lu-dot-${i}`); if(dot) dot.className = i === luStep ? "w-3 h-3 rounded-full bg-gold shadow-[0_0_10px_#c5a059]" : (i < luStep ? "w-3 h-3 rounded-full bg-[#f59e0b] opacity-50" : "w-3 h-3 rounded-full bg-gray-700"); }
    if (luStep === 0) {
        let classes = char.classes || [];
        let optionsHtml = classes.map((c, i) => `<label class="flex items-center gap-4 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gold hover:bg-white/5 w-full text-left"><input type="radio" name="lu-class-choice" value="${c.name}" class="w-5 h-5 accent-gold" ${i===0 ? 'checked' : ''} onchange="window.selectLuClass('${c.name}', false)"><div><div class="font-heading font-black text-gold uppercase tracking-widest text-sm">${c.name}</div><div class="text-xs text-gray-400 font-serif">Advance to Level ${parseInt(c.level) + 1}</div></div></label>`).join('');
        let multiOptions = Object.keys(VOCATION_DATA).map(k => { const termName = campaignSettings?.terms?.[`class_${k}`] || k; if (classes.some(c => c.name.toLowerCase() === termName.toLowerCase())) return ''; return `<option value="${termName}">${termName}</option>`; }).join('');
        optionsHtml += `<label class="flex items-center gap-4 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gold hover:bg-white/5 w-full text-left mt-4"><input type="radio" name="lu-class-choice" value="multiclass" class="w-5 h-5 accent-gold" onchange="window.selectLuClass('multiclass', true)"><div class="flex-grow"><div class="font-heading font-black text-gray-300 uppercase tracking-widest text-sm">Forge a New Path</div><div class="text-xs text-gray-400 font-serif mb-2">Multiclass into a new Vocation</div><select id="lu-new-class-select" class="w-full bg-black/50 text-gold border p-2 border-gray-600 hidden" onchange="window.updateMulticlassChoice(this.value)"><option value="">Select Vocation...</option>${multiOptions}</select></div></label>`;
        content.innerHTML = `<div class="lu-screen"><h3 class="font-heading text-2xl text-parchment font-black uppercase tracking-widest mb-2">Choose Path</h3><p class="text-gray-400 font-serif italic text-xs mb-6 text-center max-w-sm">How will your hidden power manifest?</p><div class="flex flex-col gap-3 w-full max-w-sm">${optionsHtml}</div></div>`;
        if (nextBtn) nextBtn.innerHTML = `Continue <i class="fa-solid fa-chevron-right ml-2"></i>`;
        luChosenClass = classes.length > 0 ? classes[0].name : 'Adventurer'; luIsNewClass = false;
    } else if (luStep === 1) {
        const conMod = Math.floor(((parseInt(char.con) || 10) - 10) / 2); const hdSize = window.getHitDie(luChosenClass); const avgHp = Math.floor(hdSize / 2) + 1;
        content.innerHTML = `<div class="lu-screen"><h3 class="font-heading text-2xl text-parchment font-black uppercase tracking-widest mb-2">Vitality Surge</h3><p class="text-gray-400 font-serif italic text-xs mb-8 text-center max-w-sm">Resilience swells within you.</p><div class="grid grid-cols-2 gap-4 w-full max-w-sm"><div class="border border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-black/40 hover:border-gold" onclick="window.luSetHpMethod('avg')"><input type="radio" name="lu-hp-method" value="avg" id="lu-hp-avg" class="hidden" checked><div class="text-4xl font-black text-gold font-heading mb-1">${avgHp + conMod}</div><div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-heading text-center">Average (+${avgHp + conMod})</div></div><div class="border border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-black/40 hover:border-gold" onclick="window.luSetHpMethod('roll')"><input type="radio" name="lu-hp-method" value="roll" id="lu-hp-roll" class="hidden"><div id="lu-roll-display" class="text-4xl font-black text-blood font-heading mb-1">?</div><div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-heading text-center">Roll (1d${hdSize}+CON)</div><button id="lu-roll-btn" onclick="event.stopPropagation(); window.luRollHp(${hdSize}, ${conMod})" class="mt-2 bg-blood text-white text-[9px] px-3 py-1 rounded font-black hidden shadow">ROLL</button></div></div></div>`;
        if (nextBtn) nextBtn.innerHTML = `Continue <i class="fa-solid fa-chevron-right ml-2"></i>`; luHpGained = avgHp + conMod;
    } else if (luStep === 2) {
        const totalLevel = (parseInt(char.level) || 3) + 1; const isASI = [4, 8, 12, 16, 19].includes(totalLevel); const isProfBoost = [5, 9, 13, 17].includes(totalLevel);
        let targetLevel = !luIsNewClass ? ((char.classes || []).find(c => c.name === luChosenClass) ? parseInt((char.classes || []).find(c => c.name === luChosenClass).level) + 1 : 1) : 1;
        content.innerHTML = `<div class="lu-screen"><h3 class="font-heading text-2xl text-parchment font-black uppercase tracking-widest mb-2">New Perks</h3><p class="text-gray-400 font-serif italic text-xs mb-6">Unlocking traits for <span class="text-gold font-bold">${luChosenClass} Lvl ${targetLevel}</span></p><div class="bg-black/30 border border-gray-600 p-4 rounded space-y-3 w-full max-w-sm text-left"><div class="flex gap-3 text-xs font-serif text-gray-300"><div>⚔️</div><div><b>Verify Ledger:</b> Check the handbook for upcoming capability upgrades.</div></div>${isASI ? `<div class="flex gap-3 text-xs font-serif text-gray-300 border-t border-gray-700 pt-2"><div>⭐</div><div><b>ASI Available:</b> Boost one stat by +2, two stats by +1, or pick a Feat!</div></div>`:''}${isProfBoost ? `<div class="flex gap-3 text-xs font-serif text-gray-300 border-t border-gray-700 pt-2"><div>🎯</div><div><b>Proficiency Boost:</b> Your core task scaling increases.</div></div>`:''}</div></div>`;
        if (nextBtn) nextBtn.innerHTML = `Ascend <i class="fa-solid fa-arrow-up ml-2"></i>`;
    } else if (luStep === 3) { window.applyLevelUp(); }
};

window.selectLuClass = (val, isNew) => { const el = document.getElementById('lu-new-class-select'); if(isNew){ el.classList.remove('hidden'); luChosenClass = el.value; luIsNewClass = true; } else { el.classList.add('hidden'); luChosenClass = val; luIsNewClass = false; } };
window.updateMulticlassChoice = (val) => luChosenClass = val;
window.luSetHpMethod = (method) => {
    document.getElementById('lu-hp-avg').checked = method === 'avg'; document.getElementById('lu-hp-roll').checked = method === 'roll';
    const btn = document.getElementById('lu-roll-btn');
    if (method === 'roll') { btn.classList.remove('hidden'); document.getElementById('lu-next-btn').disabled = true; document.getElementById('lu-next-btn').classList.add('opacity-50'); }
    else { btn.classList.add('hidden'); const char = characters.find(c => c.id === activeCharId); const conMod = Math.floor(((parseInt(char.con) || 10) - 10) / 2); luHpGained = Math.floor(window.getHitDie(luChosenClass) / 2) + 1 + conMod; document.getElementById('lu-next-btn').disabled = false; document.getElementById('lu-next-btn').classList.remove('opacity-50'); }
};

window.luRollHp = (hdSize, conMod) => { luHpGained = Math.max(1, getRoll(hdSize) + conMod); const display = document.getElementById('lu-roll-display'); display.textContent = luHpGained; display.className = "text-5xl font-black text-gold font-heading animate-bounce"; document.getElementById('lu-roll-btn').classList.add('hidden'); document.getElementById('lu-next-btn').disabled = false; document.getElementById('lu-next-btn').classList.remove('opacity-50'); };

window.applyLevelUp = async () => {
    const char = characters.find(c => c.id === activeCharId); if (!char) return;
    let classes = char.classes || []; if (classes.length === 0 && char.class) { let name = char.class.replace(/\s+\d+$/, '').trim(); classes = [{name, level: parseInt(char.level) || 3}]; }
    if (luIsNewClass) classes.push({name: luChosenClass, level: 1}); else { let tgt = classes.find(c => c.name === luChosenClass); if(tgt) tgt.level = parseInt(tgt.level) + 1; else classes.push({name: luChosenClass, level: 1}); }
    const totalLevel = classes.reduce((sum, c) => sum + parseInt(c.level), 0); const b = totalLevel >= 17 ? 6 : totalLevel >= 13 ? 5 : totalLevel >= 9 ? 4 : totalLevel >= 5 ? 3 : 2;
    const newClassString = classes.map(c => `${c.name} ${c.level}`).join(' / ');
    let updates = { level: totalLevel, classes: classes, class: newClassString, pendingLevelUp: false, profBonus: b };
    const newMax = (parseInt(char.hpMax) || 0) + luHpGained; updates.hpMax = newMax; updates.hpCurrent = (parseInt(char.hpCurrent) || 0) + luHpGained; updates.hdCurrent = (parseInt(char.hdCurrent) || 0) + 1;
    let hdParts = []; classes.forEach(cls => { const hd = window.getHitDie(cls.name); if(parseInt(cls.level) > 0) hdParts.push(`${cls.level}d${hd}`); }); updates.hd = hdParts.join(' + ') || '1d8';
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', activeCharId), updates);
    char.level = totalLevel; char.classes = classes; char.class = newClassString; char.profBonus = b; char.pendingLevelUp = false; char.hpMax = newMax; char.hpCurrent = updates.hpCurrent; char.hdCurrent = updates.hdCurrent; char.hd = updates.hd;
    const keys = {'level': totalLevel, 'profBonus': b, 'class': newClassString, 'hpMax': newMax, 'hpCurrent': updates.hpCurrent, 'hdCurrent': updates.hdCurrent, 'hd': updates.hd};
    Object.keys(keys).forEach(k => { const el = document.querySelector(`[data-key="${k}"]`); if(el) el.value = keys[k]; });
    window.calcMods(); document.getElementById('level-up-modal').classList.add('hidden'); window.triggerLevelUpCelebration();
};

window.renderMovesGrid = () => { 
    const fg = document.getElementById('features-lvl-grid'), sg = document.getElementById('scripts-lvl-grid'); if(!fg || !sg) return; fg.innerHTML = ''; sg.innerHTML = '';
    const char = characters.find(c => c.id === activeCharId); const moves = char?.moves || []; let fLvl = Array.from({length: 20}, (_, i) => `Level ${i + 1}`);
    let classes = char?.classes || []; if(classes.length === 0 && char?.class) classes = [{name: char.class}];
    let maxScript = -1, hasTricks = false; const aliases = window.getVocationAliases();
    classes.forEach(c => { const n = (c.name || '').toLowerCase(); if (['warden', 'chronicler', 'orator', 'scriptweaver', 'wartouched', 'archivist'].some(vc => n.includes(aliases[vc]))){ maxScript = Math.max(maxScript, 9); hasTricks = true; } else if (n.includes(aliases['fabricator'])){ maxScript = Math.max(maxScript, 5); hasTricks = true; } else if (['heartbound', 'nomad'].some(vc => n.includes(aliases[vc]))) maxScript = Math.max(maxScript, 5); });
    let sLvl = []; if (maxScript === -1) sg.innerHTML = '<div class="col-span-full text-center py-8 text-xs text-555 font-heading uppercase tracking-widest border border-dashed border-gold rounded bg-white/20">This vocation does not utilize scripts.</div>';
    else { if(hasTricks) sLvl.push('Tricks (0)'); for(let i=1; i<=maxScript; i++) sLvl.push(`Level ${i}`); }
    const canEdit = activeRole === 'dm';
    const renderCards = (levels, type, container) => {
        levels.forEach(lvl => {
            const card = document.createElement('div'); card.className = "lvl-card"; const filtered = moves.filter(m => m.lvl === lvl && m.type === type);
            let html = `<div class="lvl-header">${lvl.toUpperCase()}</div><div class="flex-grow space-y-1">`;
            filtered.forEach(m => { const mIdx = moves.indexOf(m); html += `<div class="move-pill" onclick="window.openMoveModal('${lvl}', ${mIdx}, '${type}')"><span class="move-name">${m.name}</span><span class="move-roll">${m.roll || ''}</span></div>`; });
            if(canEdit) html += `</div><button onclick="window.openMoveModal('${lvl}', null, '${type}')" class="text-[9px] font-bold uppercase text-blood hover:text-ink text-center mt-2 font-heading">+ ADD</button>`; else html += `</div>`;
            card.innerHTML = html; container.appendChild(card);
        });
    };
    renderCards(fLvl, 'features', fg); if (maxScript !== -1) renderCards(sLvl, 'scriptcasting', sg);
};

window.openMoveModal = (lvl, idx = null, forceType = 'features') => { 
    activeMoveLvl = lvl; editingMoveIndex = idx; const char = characters.find(c => c.id === activeCharId); const moves = char?.moves || [];
    const m = idx !== null ? moves[idx] : null; const moveType = m ? m.type : forceType; const isScript = moveType === 'scriptcasting'; const canEdit = activeRole === 'dm';
    document.getElementById('move-import-btn').classList.toggle('hidden', !canEdit); document.getElementById('script-extra-fields').classList.toggle('hidden', !isScript); document.getElementById('script-scaling-field').classList.toggle('hidden', !isScript);
    document.getElementById('move-desc-label').textContent = isScript ? "Effect" : "Description"; document.getElementById('import-view').classList.add('hidden'); document.getElementById('modal-standard-view').classList.remove('hidden');
    document.getElementById('import-hint-text').textContent = isScript ? "Paste Script Data:" : "Paste Move/Feature Data:"; document.getElementById('move-type-hidden').value = moveType;
    if (idx !== null) { 
        document.getElementById('move-name-in').value = m.name || ''; document.getElementById('move-roll-in').value = m.roll || ''; document.getElementById('move-desc-in').value = m.desc || ''; document.getElementById('script-lvl-in').value = m.lvl || lvl;
        document.getElementById('script-school-in').value = m.school || ''; document.getElementById('script-type-in').value = m.sType || ''; document.getElementById('script-activation-in').value = m.activation || '';
        document.getElementById('script-range-in').value = m.range || ''; document.getElementById('script-comp-in').value = m.comp || ''; document.getElementById('script-duration-in').value = m.duration || ''; document.getElementById('script-scaling-in').value = m.scaling || '';
        document.getElementById('move-modal-title').textContent = (canEdit ? "Edit " : "View ") + (isScript ? "Script" : "Move"); document.getElementById('move-delete-btn').classList.toggle('hidden', !canEdit); 
    } else { 
        document.getElementById('move-name-in').value = ''; document.getElementById('move-roll-in').value = ''; document.getElementById('move-desc-in').value = ''; document.getElementById('script-lvl-in').value = lvl;
        document.getElementById('script-school-in').value = ''; document.getElementById('script-type-in').value = ''; document.getElementById('script-activation-in').value = ''; document.getElementById('script-range-in').value = '';
        document.getElementById('script-comp-in').value = ''; document.getElementById('script-duration-in').value = ''; document.getElementById('script-scaling-in').value = '';
        document.getElementById('move-modal-title').textContent = "Add " + (isScript ? "Script" : "Move") + " - " + lvl; document.getElementById('move-delete-btn').classList.add('hidden'); 
    }
    document.querySelectorAll('#modal-standard-view input:not(#script-lvl-in), #modal-standard-view textarea').forEach(f => { f.readOnly = !canEdit; if (!canEdit) f.classList.add('opacity-80', 'pointer-events-none'); else f.classList.remove('opacity-80', 'pointer-events-none'); });
    document.getElementById('move-save-btn').classList.toggle('hidden', !canEdit); document.getElementById('move-modal').classList.remove('hidden'); 
};

window.toggleImportView = () => {
    const iV = document.getElementById('import-view'), sV = document.getElementById('modal-standard-view'), hidden = iV.classList.contains('hidden');
    iV.classList.toggle('hidden', !hidden); sV.classList.toggle('hidden', hidden); if (hidden) { document.getElementById('import-paste-area').value = ''; document.getElementById('import-paste-area').focus(); }
};

window.executeMoveImport = () => {
    const rawText = document.getElementById('import-paste-area').value; if (!rawText.trim()) return;
    const moveType = document.getElementById('move-type-hidden').value; const isScript = moveType === 'scriptcasting';
    const extract = (regex) => { const match = rawText.match(regex); return match ? match[1].trim() : ""; };
    const extractBlock = (startKey, endKeys) => { const startIdx = rawText.indexOf(startKey); if (startIdx === -1) return ""; const afterStart = rawText.substring(startIdx + startKey.length); let fIdx = afterStart.length; endKeys.forEach(ek => { const idx = afterStart.indexOf(ek); if (idx !== -1 && idx < fIdx) fIdx = idx; }); return afterStart.substring(0, fIdx).trim(); };
    const name = extract(/NAME:\s*(.*)/i) || extract(/\(The Name\)\s*(.*)/i), roll = extract(/DICE\/EFFECT ROLL:\s*(.*)/i) || extract(/ROLL:\s*(.*)/i);
    if (isScript) {
        const school = extract(/SCHOOL:\s*(.*)/i), type = extract(/TYPE:\s*(.*)/i), activation = extract(/ACTIVATION:\s*(.*)/i), range = extract(/RANGE:\s*(.*)/i), comp = extract(/COMPONENTS:\s*(.*)/i), duration = extract(/DURATION:\s*(.*)/i), effect = extractBlock("EFFECT:", ["SCALING:", "AUTHORIZED USERS:"]), scaling = extractBlock("SCALING:", ["AUTHORIZED USERS:"]);
        if (name) document.getElementById('move-name-in').value = name; if (roll) document.getElementById('move-roll-in').value = roll; if (school) document.getElementById('script-school-in').value = school; if (type) document.getElementById('script-type-in').value = type; if (activation) document.getElementById('script-activation-in').value = activation; if (range) document.getElementById('script-range-in').value = range; if (comp) document.getElementById('script-comp-in').value = comp; if (duration) document.getElementById('script-duration-in').value = duration; if (effect) document.getElementById('move-desc-in').value = effect; if (scaling) document.getElementById('script-scaling-in').value = scaling;
    } else {
        const desc = extractBlock("DESCRIPTION:", []) || extractBlock("(The Description)", []); if (name) document.getElementById('move-name-in').value = name; if (roll) document.getElementById('move-roll-in').value = roll; if (desc) document.getElementById('move-desc-in').value = desc;
    }
    window.toggleImportView(); window.showToast("Move Parsed Successfully");
};

window.grantLevelUp = async () => { if (!activeCharId || activeRole !== 'dm') return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', activeCharId), { pendingLevelUp: true }); window.showToast("Level Up Granted!"); };
window.openPartyModal = () => { document.getElementById('party-modal')?.classList.remove('hidden'); };
window.openManageParty = (id) => { const p = parties.find(x => x.id === id); if (!p) return; activeManagePartyId = id; document.getElementById('manage-party-name').value = p.name; window.resetPartyManageState(); document.getElementById('manage-party-modal').classList.remove('hidden'); };
window.resetPartyManageState = () => { document.getElementById('party-manage-main').classList.remove('hidden'); document.getElementById('party-manage-delete').classList.add('hidden'); };
window.confirmDeletePartyState = () => { document.getElementById('party-manage-main').classList.add('hidden'); document.getElementById('party-manage-delete').classList.remove('hidden'); };
window.savePartyRename = async () => { if (!activeManagePartyId) return; const n = document.getElementById('manage-party-name').value; if (!n) return window.showToast("Name required"); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parties', activeManagePartyId), { name: n }); document.getElementById('manage-party-modal').classList.add('hidden'); window.showToast("Party Renamed"); };
window.executeDeleteParty = async () => { if (!activeManagePartyId) return; const af = characters.filter(c => c.partyId === activeManagePartyId); for (const char of af) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', char.id), { partyId: "" }); } await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'parties', activeManagePartyId)); document.getElementById('manage-party-modal').classList.add('hidden'); window.showToast("Party Disbanded"); };
window.triggerDeleteModal = () => { const char = characters.find(c => c.id === activeCharId); if (!char) return; window.resetDeleteModal(); const isA = !!char.isDeleted; document.getElementById('archive-btn')?.classList.toggle('hidden', isA); document.getElementById('restore-btn')?.classList.toggle('hidden', !isA); document.getElementById('delete-modal')?.classList.remove('hidden'); };
window.showPermDeleteConfirm = () => { document.getElementById('delete-stage-1')?.classList.add('hidden'); document.getElementById('delete-stage-confirm')?.classList.remove('hidden'); };
window.resetDeleteModal = () => { document.getElementById('delete-stage-1')?.classList.remove('hidden'); document.getElementById('delete-stage-confirm')?.classList.add('hidden'); };
window.archiveCharacter = async () => { if (!activeCharId) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', activeCharId), { isDeleted: true, status: 'dead' }); document.getElementById('delete-modal')?.classList.add('hidden'); window.closeSheet(); };
window.restoreCharacter = async () => { if (!activeCharId) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', activeCharId), { isDeleted: false, status: 'alive', comaActive: false }); document.getElementById('delete-modal')?.classList.add('hidden'); window.showToast("Recovered"); window.syncSheetData(); };
window.executePermDelete = async () => { if (!activeCharId) return; await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'characters', activeCharId)); document.getElementById('delete-modal')?.classList.add('hidden'); window.closeSheet(); };

const setupListeners = () => {
    if (!currentUser) return;
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'characters'), (snap) => { characters = snap.docs.map(d => ({id: d.id, ...d.data()})); window.renderDashboard(); if (activeCharId) window.syncSheetData(); });
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'parties'), (snap) => { parties = snap.docs.map(d => ({id: d.id, ...d.data()})); window.renderDashboard(); if (activeCharId) window.syncSheetData(); });
};

onAuthStateChanged(auth, async (u) => {
    if (!u) { try { window.location.href = "index.html"; } catch(e) { document.getElementById('initial-loading').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-6xl text-blood mb-6"></i><h2 class="font-heading text-2xl text-blood">Authentication Required</h2>`; } return; }
    try {
        if (u.isAnonymous) currentUser = { uid: u.uid, username: "Guest Traveler", role: 'player' };
        else { const userDoc = await getDoc(doc(db, 'users', u.uid)); if (userDoc.exists()) currentUser = { uid: u.uid, ...userDoc.data() }; else currentUser = { uid: u.uid, username: u.displayName || 'Traveler', role: 'player' }; }
        activeRole = currentUser.role || 'player';
        if (appId !== "demo_campaign") { const campDoc = await getDoc(doc(db, 'campaigns', appId)); if (campDoc.exists()) { document.getElementById('main-campaign-title').innerText = campDoc.data().name; document.title = `${campDoc.data().name} - Manager`; } }
        document.getElementById('user-display-name').innerText = currentUser.username;
        const isDM = activeRole === 'dm'; document.getElementById('btn-create-npc')?.classList.toggle('hidden', !isDM); document.getElementById('nav-encounters')?.classList.toggle('hidden', !isDM); document.getElementById('create-actions')?.classList.remove('hidden'); document.getElementById('btn-campaign-settings')?.classList.toggle('hidden', !isDM);
        document.getElementById('initial-loading').classList.add('hidden'); document.getElementById('dashboard-screen').classList.remove('hidden');
        setupListeners();
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'campaignConfig', 'settings'), (docSnap) => { if (docSnap.exists()) { campaignSettings = docSnap.data(); window.applyTerminology(campaignSettings.terms); if (activeCharId) { window.calcMods(); window.renderMovesGrid(); window.updateClassSpecifics(); window.syncSheetData(); } } }, (err) => console.error(err));
    } catch (error) { console.error(error); document.getElementById('initial-loading').innerHTML = `<h2 class="font-heading text-2xl text-blood">Database Access Denied</h2>`; }
});

document.addEventListener('input', (e) => { if (e.target.dataset.key) { if (autoSaveTimer) clearTimeout(autoSaveTimer); autoSaveTimer = setTimeout(() => window.saveCurrentCharacter(), 1000); } });
