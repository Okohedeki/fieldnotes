'use strict';
const STORE = 'fieldnotes.consistency.v2';
const TYPES = {top:'Reach',middle:'Expertise',bottom:'Offer'};
const RHYTHM = ['top','middle','top','middle','bottom'];
const CHANNELS = {linkedin:{label:'LinkedIn',mode:'manual'},x:{label:'X',mode:'future'},tiktok:{label:'TikTok',mode:'future'}};
const dayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDay = s => new Date(`${s}T12:00:00`);
const shiftDay = (s,n) => {const d=parseDay(s);d.setDate(d.getDate()+n);return dayKey(d);};
const weekKey = (s=dayKey()) => shiftDay(s,-((parseDay(s).getDay()+6)%7));
const inWeek = (date,week) => date>=week && date<shiftDay(week,7);
const emptyState = () => ({version:2,posts:[],people:[],inspiration:[],activity:{},settings:{comments:50,markovTopics:['Corporate leadership','AI']},legacy:null});
function validateState(data) {
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const count=x=>Number.isSafeInteger(x)&&x>=0;
  const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&dayKey(parseDay(x))===x;
  if(!object(data)||data.version!==2||!Array.isArray(data.posts)||!Array.isArray(data.people)||!object(data.activity)||!object(data.settings)||!count(data.settings.comments)||data.settings.comments>10000)throw Error('Invalid workspace');
  data.settings.markovTopics ??= ['Corporate leadership','AI'];
  data.inspiration = validateInspiration(data.inspiration ?? []);
  if(!Array.isArray(data.settings.markovTopics)||data.settings.markovTopics.length>12||data.settings.markovTopics.some(t=>typeof t!=='string'||!t.trim()||t.length>60))throw Error('Invalid writing topics');
  for(const p of data.posts)if(!object(p)||typeof p.id!=='string'||typeof p.title!=='string'||typeof p.body!=='string'||!Object.hasOwn(TYPES,p.type)||!Object.hasOwn(CHANNELS,p.channel)||!['idea','draft','ready','published'].includes(p.status)||(p.date!==''&&!date(p.date))||(p.publishedAt!==null&&!date(p.publishedAt)))throw Error('Invalid post');
  for(const p of data.people)if(!object(p)||typeof p.id!=='string'||typeof p.name!=='string'||typeof p.note!=='string'||typeof p.url!=='string'||!Object.hasOwn(CHANNELS,p.channel))throw Error('Invalid person');
  for(const [d,a] of Object.entries(data.activity))if(!date(d)||!object(a)||!count(a.comments)||!count(a.connections)||typeof a.draft!=='boolean'||!Array.isArray(a.people)||a.people.some(id=>typeof id!=='string'))throw Error('Invalid activity');
  if(new Set(data.posts.map(p=>p.id)).size!==data.posts.length||new Set(data.people.map(p=>p.id)).size!==data.people.length)throw Error('Duplicate records');
  return data;
}
let storageProblem = '';
function migrateLegacy(old) {
  const next=emptyState();
  next.legacy=old;
  next.posts=(old.drafts||[]).map(p=>({...p,channel:p.platform||'linkedin',ideaSource:null,publishedAt:p.status==='published'?p.date:null}));
  next.people=(old.people||[]).map(p=>({...p,channel:p.platform||'linkedin'}));
  for(const [date,d] of Object.entries(old.days||{})) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(date)) next.activity[date]={connections:0,comments:d.comments?.length||0,draft:!!d.checks?.draft,people:[...(d.comments||[])]};
  }
  for(const [date,w] of Object.entries(old.weeks||{})) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      next.activity[date] ||= {connections:0,comments:0,draft:false,people:[]};
      next.activity[date].connections=w.connections||0;
    }
  }
  return next;
}
function loadState() {
  try {
    const saved=localStorage.getItem(STORE);
    if(saved) {
      const data=JSON.parse(saved);
      return validateState(data);
    }
    const old=localStorage.getItem('fieldnotes.v1');
    return old?validateState(migrateLegacy(JSON.parse(old))):emptyState();
  } catch {storageProblem='Could not read saved data. Original data is preserved; export before closing.';return emptyState();}
}
let state=loadState();
const activity = (date=dayKey()) => state.activity[date]||{connections:0,comments:0,draft:false,people:[]};
function changeActivity(date,change) {state.activity[date]={...activity(date),...change};}
const linkedPosts = () => state.posts.filter(p=>p.channel==='linkedin');
function summary(week=weekKey()) {
  const days=Object.entries(state.activity).filter(([d])=>inWeek(d,week));
  const posts=linkedPosts().filter(p=>p.status==='published'&&inWeek(p.publishedAt||p.date,week));
  return {posts,connections:days.reduce((n,[,a])=>n+a.connections,0),comments:days.reduce((n,[,a])=>n+a.comments,0),drafts:days.filter(([,a])=>a.draft).length};
}
function targetForToday(kind,total) {
  const today=dayKey(), start=weekKey(), index=(parseDay(today).getDay()+6)%7;
  const before=Object.entries(state.activity).filter(([d])=>inWeek(d,start)&&d<today).reduce((n,[,a])=>n+a[kind],0);
  return Math.max(0,Math.ceil((total-before)/Math.max(1,5-index)));
}
function nextPostDate() {
  let date=shiftDay(dayKey(),1);
  while([0,6].includes(parseDay(date).getDay())) date=shiftDay(date,1);
  return date;
}
function postForDate(date) {return linkedPosts().find(p=>p.date===date&&p.status!=='published')||linkedPosts().find(p=>p.date===date);}
function newPost(date=dayKey()) {
  return {id:crypto.randomUUID(),title:'',body:'',type:RHYTHM[(parseDay(date).getDay()+6)%7]||'top',date,status:'draft',channel:'linkedin',ideaSource:null,publishedAt:null};
}
function safeURL(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&['linkedin.com','www.linkedin.com'].includes(u.hostname)&&!u.username&&!u.password;}catch{return false;}
}
