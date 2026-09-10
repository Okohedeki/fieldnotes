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
function progress(label,value,target) {return `<div class="progress-item"><div><span>${label}</span><strong>${value}<span> / ${target}</span></strong></div><progress aria-label="${label}" value="${Math.min(value,target)}" max="${Math.max(1,target)}"></progress></div>`;}
function weekScore(week=weekKey()) {
  const s=summary(week);
  return `<section class="score"><div class="section-title"><h2>This week</h2><span>${pretty(week)}–${pretty(shiftDay(week,6))}</span></div>${progress('Posts published',s.posts.length,5)}${progress('Connections',s.connections,100)}${progress('Meaningful comments',s.comments,state.settings.comments)}<div class="rhythm-summary">${Object.entries(TYPES).map(([k,v])=>`<div>${badge(k)}<strong>${s.posts.filter(p=>p.type===k).length} / ${k==='bottom'?1:2}</strong></div>`).join('')}</div><p class="helper">Every post counts. A missed day is room to adjust, not a reset.</p><a class="inline-link" href="#week">See your week <span>↗</span></a></section>`;
}
function counter(kind,label,detail,target,index) {
  const value=activity()[kind],done=value>=target;
  return `<article class="task ${done?'complete':''}"><span class="task-state" aria-label="${done?'Complete':'In progress'}">${done?'✓':index}</span><div class="task-content"><h3>${label}</h3><p>${detail}</p><span class="task-status">${done?'Complete for today':`${Math.max(0,target-value)} to go today`}</span></div><div class="counter"><button data-action="count" data-kind="${kind}" data-delta="-1" aria-label="Subtract one ${kind}" ${value===0?'disabled':''}>−</button><input aria-label="Today’s ${kind} count" data-count="${kind}" type="number" min="0" max="100000" step="1" value="${value}"><small>/ ${target}</small><button data-action="count" data-kind="${kind}" data-delta="1" aria-label="Add one ${kind}">+</button></div></article>`;
}
function todayView() {
  const date=dayKey(),a=activity(),p=postForDate(date),s=summary();
  const published=linkedPosts().some(p=>p.status==='published'&&(p.publishedAt||p.date)===date);
  const weekend=[0,6].includes(parseDay(date).getDay()),postDone=published||(weekend&&s.posts.length>=5);
  const connections=targetForToday('connections',100),comments=targetForToday('comments',state.settings.comments);
  const done=[postDone,a.connections>=connections,a.comments>=comments,a.draft].filter(Boolean).length;
  const overdue=linkedPosts().filter(p=>p.status!=='published'&&p.date&&p.date<date);
  return `${heading(pretty(date,{weekday:'long',month:'long',day:'numeric'}).toUpperCase(),'Make today count.','Your next steps to stay on track. One task at a time.','<a class="button primary" href="#write" data-action="today-post">Write today’s post <span>↗</span></a>')}
  <div class="today-layout"><section class="execution"><div class="execution-header"><div><h2>Today’s commitments</h2><span>${done===4?'You’re done for today. Nice work.':'A clear finish line for your day.'}</span></div><div class="completion"><strong>${done}<span> / 4</span></strong><span>complete</span></div></div><progress class="daily-progress" aria-label="Daily tasks completed" value="${done}" max="4"></progress>
  <article class="task ${postDone?'complete':''}"><span class="task-state" aria-label="${postDone?'Complete':'In progress'}">${postDone?'✓':'01'}</span><div class="task-content"><div class="task-title"><h3>${postDone?'Publishing complete':weekend?'Catch up on publishing':'Publish your scheduled post'}</h3>${badge(p?.type||RHYTHM[(parseDay(date).getDay()+6)%7]||'top')}</div><p>${postDone?'Your progress is counted for the week.':esc(p?.title||'Develop your thought, then share it on LinkedIn.')}</p><span class="task-status">${postDone?'Complete for today':p?.body?'Draft in progress':'Ready when you are'}</span></div><button data-action="today-post">${postDone?'View post':'Open post'} ↗</button></article>
  ${counter('connections','Connect with relevant people','Build your circle through thoughtful introductions.',connections,'02')}
  ${counter('comments','Leave meaningful comments','Add an example, an experience, or a useful question.',comments,'03')}
  <article class="task ${a.draft?'complete':''}"><button class="task-state check" data-action="draft-check" aria-label="${a.draft?'Undo draft completion':'Mark next draft developed'}" aria-pressed="${a.draft}">${a.draft?'✓':'04'}</button><div class="task-content"><h3>Develop the next draft</h3><p>Give your next writing session a head start.</p><span class="task-status">${a.draft?'Complete · click the check to undo':'Write a rough draft, then check this off'}</span></div><button data-action="next-draft">Develop draft ↗</button></article>
  <div class="execution-foot"><span class="status-dot"></span>Progress stays with your week. Keep going at your pace.</div></section>
  <aside class="context-column">${weekScore()}<div class="small-note"><span class="eyebrow">THE DAILY LOOP</span><p>Plan → Write → Publish<br>Engage → Repeat</p></div></aside></div>
  ${overdue.length?`<section class="recovery"><div><h2>Pick up where you left off</h2><p>${overdue.length} earlier draft${overdue.length===1?'':'s'} ready to move forward. Reschedule or publish when ready.</p></div><button data-action="edit-post" data-id="${esc(overdue[0].id)}">Continue draft ↗</button></section>`:''}`;
}
function postRow(p) {return `<button class="post-row" data-action="edit-post" data-id="${esc(p.id)}"><div>${badge(p.type)}<strong>${esc(p.title||'Untitled post')}</strong></div><span>${p.date?pretty(p.date):'Unscheduled'} · ${esc(p.status)} ↗</span></button>`;}
function weekView() {
  const s=summary(selectedWeek),posts=linkedPosts().filter(p=>inWeek(p.date,selectedWeek));
  return `${heading('PLAN · ADJUST · REPEAT','A week you can finish.','Five posts. Real conversations. Room to recover.')}
  <div class="week-toolbar"><div><button data-action="week-shift" data-delta="-7" aria-label="Previous week">←</button><h2>${pretty(selectedWeek)} – ${pretty(shiftDay(selectedWeek,6),{month:'short',day:'numeric',year:'numeric'})}</h2><button data-action="week-shift" data-delta="7" aria-label="Next week">→</button></div><button data-action="current-week">This week</button></div>
  <div class="week-grid">${Array.from({length:7},(_,i)=>{const date=shiftDay(selectedWeek,i),items=posts.filter(p=>p.date===date);return `<section class="day-column ${date===dayKey()?'is-today':''}"><div class="day-label">${pretty(date,{weekday:'short'})}<strong>${parseDay(date).getDate()}</strong>${date===dayKey()?'<span>Today</span>':''}</div>${i<5?badge(RHYTHM[i]):'<span class="flex-label">Recovery / rest</span>'}${items.map(p=>`<button class="calendar-post" data-action="edit-post" data-id="${esc(p.id)}"><strong>${esc(p.title||'Untitled post')}</strong><span>${p.status==='published'?'✓ Published':esc(p.status)}</span></button>`).join('')}<button class="slot-button" data-action="new-date" data-date="${date}">${items.length?'+ Add post':i<5?'+ Plan post':'+ Catch up'}</button></section>`;}).join('')}</div>
  <div class="week-bottom"><section><div class="section-title"><h2>Your weekly commitments</h2><span>${s.posts.length>=5?'Posting target met':'Keep moving forward'}</span></div><div class="weekly-metrics">${progress('Posts',s.posts.length,5)}${progress('Connections',s.connections,100)}${progress('Comments',s.comments,state.settings.comments)}</div><div class="rhythm-summary">${Object.entries(TYPES).map(([k,v])=>`<div>${badge(k)}<strong>${s.posts.filter(p=>p.type===k).length} / ${k==='bottom'?1:2}</strong><span>${k==='top'?'Top of funnel':k==='middle'?'Middle of funnel':'Bottom of funnel'}</span></div>`).join('')}</div><p class="helper">${Math.max(0,5-s.posts.length)} posts, ${Math.max(0,100-s.connections)} connections, and ${Math.max(0,state.settings.comments-s.comments)} comments left. Multiple posts on one day count toward this week.</p></section><section class="target-settings"><h2>Set your pace</h2><form id="target-form"><label for="comment-target">Meaningful comments per week</label><div class="input-button"><input id="comment-target" name="comments" type="number" min="0" max="10000" step="1" required value="${state.settings.comments}"><button type="submit">Save target</button></div><p class="helper">Daily targets adapt to the work remaining. Set 0 to pause this commitment.</p></form></section></div>`;
}
function markovSidebar() {
  const topics=state.settings.markovTopics;
  return `<section class="markov-discovery" aria-labelledby="markov-heading">
    <div class="markov-credit"><span class="eyebrow">INSPIRATION</span><span class="connection-status">Markov · coming later</span></div>
    <h2 id="markov-heading">Cool things to<br>write about.</h2>
    <p class="markov-intro">Interesting developments and fresh angles, based on the topics you care about.</p>
    <div class="topic-label">YOUR TOPICS <span>${topics.length} / 12</span></div>
    <div class="topic-chips">${topics.map((topic,i)=>`<button type="button" data-action="remove-topic" data-index="${i}" aria-label="Remove topic: ${esc(topic)}">${esc(topic)}<span aria-hidden="true">×</span></button>`).join('')||'<p class="helper">What do you like writing about?</p>'}</div>
    <form id="topic-form"><label class="sr-only" for="new-topic">Add a writing topic</label><div class="topic-input"><input id="new-topic" name="topic" maxlength="60" required placeholder="Add a topic…" ${topics.length>=12?'disabled':''}><button type="submit" aria-label="Add topic" ${topics.length>=12?'disabled':''}>+</button></div><p id="topic-error" class="form-error" role="alert"></p></form>
    ${inspirationPanel()}
    <p class="markov-future">Markov will add discoveries from your topics when connected. For now, build your own reference shelf.</p>
  </section>`;
}
