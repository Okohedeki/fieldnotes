'use strict';
const $ = s=>document.querySelector(s);
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty = (date,options={month:'short',day:'numeric'})=>parseDay(date).toLocaleDateString('en-US',options);
let selectedWeek=weekKey(), editing=null, toastTimer, personEditing=null;
try {editing=state.posts.find(p=>p.channel==='linkedin'&&p.id===sessionStorage.getItem('fieldnotes.openPost'))||null;}catch{}
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
