'use strict';
const $ = s=>document.querySelector(s);
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty = (date,options={month:'short',day:'numeric'})=>parseDay(date).toLocaleDateString('en-US',options);
let selectedWeek=weekKey(), editing=null, toastTimer, personEditing=null;
try {editing=state.posts.find(p=>p.channel==='linkedin'&&p.id===sessionStorage.getItem('fieldnotes.openPost'))||null;}catch{}
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function save() {
  if(storageProblem) {$('#save-status').textContent='Not saved · export your work';return false;}
  try {localStorage.setItem(STORE,JSON.stringify(state));$('#save-status').textContent='Saved on this device';return true;}
  catch {$('#save-status').textContent='Not saved · export your work';toast('Storage is full or unavailable. Export your work before closing.');return false;}
}
function badge(type) {return `<span class="badge ${esc(type)}">${TYPES[type]||'Reach'}</span>`;}
function heading(kicker,title,description,action='') {return `<div class="heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;}
