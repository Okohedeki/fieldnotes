const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function workspace() {
  const context = vm.createContext({URL, Date, crypto: require('node:crypto').webcrypto,
    document: {addEventListener() {}}, localStorage: {getItem() {return null;}}});
  for (const file of ['inspiration.js', 'consistency-model.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return code => vm.runInContext(code, context);
}

test('recognizes social post links and strips tracking parameters', () => {
  const run = workspace();
  assert.equal(run(`inspirationURL('https://www.linkedin.com/posts/example-post?utm_source=share').channel`), 'linkedin');
  assert.equal(run(`inspirationURL('https://www.linkedin.com/feed/update/urn:li:activity:123').channel`), 'linkedin');
  assert.equal(run(`inspirationURL('https://twitter.com/example/status/123?s=20').url`), 'https://x.com/example/status/123');
  assert.equal(run(`inspirationURL('https://www.tiktok.com/@example/video/123').channel`), 'tiktok');
  assert.equal(run(`inspirationURL('https://vm.tiktok.com/example/').channel`), 'tiktok');
});

test('rejects profile links, lookalike hosts, credentials and unsafe schemes', () => {
  const run = workspace();
  for (const url of ['javascript:alert(1)', 'http://x.com/example/status/123',
    'https://x.com.evil.example/example/status/123', 'https://user:pass@x.com/example/status/123',
    'https://www.linkedin.com/in/example', 'https://x.com/example', 'https://www.tiktok.com/@example']) {
    assert.equal(run(`inspirationURL(${JSON.stringify(url)})`), null, url);
  }
});

test('old version-two workspaces gain an empty inspiration library', () => {
  const run = workspace();
  assert.equal(run(`const old=emptyState(); delete old.inspiration; validateState(old).inspiration.length`), 0);
});

test('reference backups validate platform, required title and unique IDs', () => {
  const run = workspace();
  run(`const source={id:'ref',url:'https://x.com/example/status/123',channel:'x',title:'An observation',topic:'AI',note:'My own angle',createdAt:'2026-09-10T12:00:00Z'};`);
  assert.equal(run('validateInspiration([source]).length'), 1);
  assert.throws(() => run(`validateInspiration([{...source,channel:'linkedin'}])`));
  assert.throws(() => run(`validateInspiration([{...source,title:''}])`));
  assert.throws(() => run('validateInspiration([source,source])'));
});

test('legacy posts and engagement survive migration', () => {
  const run = workspace();
  run(`state=validateState(migrateLegacy({drafts:[{id:'old',title:'Keep me',body:'Original text',type:'top',date:'2026-09-07',status:'published'}],people:[],days:{'2026-09-07':{comments:['person'],checks:{}}},weeks:{'2026-09-07':{connections:12}}}));`);
  assert.equal(run('state.posts[0].body'), 'Original text');
  assert.equal(run(`summary('2026-09-07').connections`), 12);
  assert.equal(run(`summary('2026-09-07').comments`), 1);
  assert.equal(run('state.inspiration.length'), 0);
});

test('multiple same-day publications count and next week is excluded', () => {
  const run = workspace();
  run(`state.posts=['2026-09-10','2026-09-10','2026-09-14'].map(date=>({...newPost(date),body:'My story',status:'published',publishedAt:date}));`);
  assert.equal(run(`summary('2026-09-07').posts.length`), 2);
  assert.equal(run(`weekKey('2026-09-13')`), '2026-09-07');
});
