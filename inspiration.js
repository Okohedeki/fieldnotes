'use strict';

// Saved references are user-curated. This module never fetches social feeds.
function inspirationURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.replace(/^www\./, '');
    let channel;
    if (host === 'linkedin.com' && /^\/(posts\/[^/]+|feed\/update\/[^/]+)/.test(url.pathname)) channel = 'linkedin';
    if (['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host) && /^\/[^/]+\/status\/\d+/.test(url.pathname)) channel = 'x';
    if (host === 'tiktok.com' && /^\/@[^/]+\/video\/\d+/.test(url.pathname)) channel = 'tiktok';
    if (['vm.tiktok.com', 'vt.tiktok.com'].includes(host) && /^\/[^/]+\/?$/.test(url.pathname)) channel = 'tiktok';
    if (!channel) return null;
    url.search = ''; url.hash = '';
    if (channel === 'x') url.hostname = 'x.com';
    else if (host === 'linkedin.com' || host === 'tiktok.com') url.hostname = `www.${host}`;
    url.pathname = url.pathname.replace(/\/$/, '');
    return {url: url.href, channel};
  } catch { return null; }
}

function validateInspiration(items) {
  if (!Array.isArray(items) || items.length > 5000) throw Error('Invalid inspiration library');
  const ids = new Set();
  for (const item of items) {
    const link = inspirationURL(item?.url);
    if (!item || typeof item.id !== 'string' || ids.has(item.id) || !link || link.channel !== item.channel ||
        typeof item.title !== 'string' || !item.title.trim() || item.title.length > 180 ||
        typeof item.topic !== 'string' || item.topic.length > 60 ||
        typeof item.note !== 'string' || item.note.length > 2000 ||
        typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))) throw Error('Invalid inspiration post');
    ids.add(item.id);
  }
  return items;
}

let inspirationFilter = 'all';
let inspirationEditing = null;
let inspirationScratch = {};
function inspirationPanel() {
  const items = state.inspiration.filter(item => inspirationFilter === 'all' || item.topic === inspirationFilter);
  const topics = [...new Set([...state.settings.markovTopics, ...state.inspiration.map(item => item.topic).filter(Boolean)])];
  const draft = inspirationEditing || inspirationScratch;
  return `<section class="inspiration-library" aria-labelledby="inspiration-heading">
    <div class="section-title"><div><h3 id="inspiration-heading">Saved posts</h3><p class="helper">Your reference shelf across LinkedIn, X, and TikTok.</p></div><span>${state.inspiration.length}</span></div>
    <details class="save-reference" ${inspirationEditing || inspirationScratch.url ? 'open' : ''}><summary>${inspirationEditing ? 'Edit saved post' : '+ Save a post'}</summary>
      <form id="inspiration-form">
        <label>Post URL<input name="url" type="url" required value="${esc(draft?.url)}" placeholder="Paste a LinkedIn, X, or TikTok post link"></label>
        <label>What is it about?<input name="title" required maxlength="180" value="${esc(draft?.title)}" placeholder="A short title to find it again"></label>
        <label>Topic<input name="topic" list="inspiration-topics" maxlength="60" value="${esc(draft?.topic)}" placeholder="e.g. Corporate leadership"></label>
        <datalist id="inspiration-topics">${topics.map(topic => `<option value="${esc(topic)}"></option>`).join('')}</datalist>
        <label>What caught your attention?<textarea name="note" rows="3" maxlength="2000" placeholder="An idea to question, an example, or your own angle…">${esc(draft?.note)}</textarea></label>
        <p class="helper">Save the link and your notes. Post content and metrics aren’t fetched.</p>
        <p id="inspiration-error" class="form-error" role="alert"></p>
        <button class="primary" type="submit">${inspirationEditing ? 'Save changes' : 'Save reference'}</button>
        ${inspirationEditing ? '<button type="button" data-action="cancel-reference">Cancel</button>' : ''}
      </form>
    </details>
    ${state.inspiration.length ? `<label class="reference-filter">Filter by topic<select id="inspiration-filter"><option value="all">All topics</option>${topics.map(topic => `<option value="${esc(topic)}" ${topic === inspirationFilter ? 'selected' : ''}>${esc(topic)}</option>`).join('')}</select></label>` : ''}
    <div class="reference-list">${items.length ? items.map(item => `<article class="reference-card">
      <div class="reference-meta"><span>${CHANNELS[item.channel].label}</span><span>${esc(item.topic || 'No topic')}</span></div>
      <a class="reference-title" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a>
      ${item.note ? `<p>${esc(item.note)}</p>` : ''}
      <button class="story-button" data-action="reference-draft" data-id="${esc(item.id)}">Develop my take ↗</button>
      <div class="reference-actions"><button class="text-button" data-action="edit-reference" data-id="${esc(item.id)}">Edit</button><button class="text-button" data-action="remove-reference" data-id="${esc(item.id)}">Remove</button></div>
    </article>`).join('') : `<p class="reference-empty">${state.inspiration.length ? 'No saved posts for this topic yet.' : 'Found something worth thinking about? Save it here, then develop your own take.'}</p>`}</div>
  </section>`;
}

function referenceContext(post) {
  if (post.ideaSource?.provider !== 'saved-post') return '';
  const item = state.inspiration.find(item => item.id === post.ideaSource.id);
  if (!item) return '<div class="reference-context">This draft began from a saved reference that has since been removed.</div>';
  return `<div class="reference-context"><span class="eyebrow">YOUR STARTING POINT</span><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a>${item.note ? `<p>${esc(item.note)}</p>` : ''}<p>What is your experience or perspective on this? Add your own story below.</p></div>`;
}

document.addEventListener('submit', event => {
  if (event.target.id !== 'inspiration-form') return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target));
  const link = inspirationURL(values.url);
  const error = message => { $('#inspiration-error').textContent = message; };
  if (!link) return error('Use a LinkedIn post, X status, or TikTok video link starting with https://.');
  if (!values.title.trim()) return error('Give this post a short title.');
  if (state.inspiration.some(item => item.id !== inspirationEditing?.id && inspirationURL(item.url).url === link.url)) return error('That post is already saved. Open its existing reference to edit it.');
  if (!inspirationEditing && state.inspiration.length >= 5000) return error('Your library is full. Remove a reference before adding another.');
  const item = {...link, title: values.title.trim(), topic: values.topic.trim(), note: values.note.trim()};
  if (inspirationEditing) Object.assign(state.inspiration.find(source => source.id === inspirationEditing.id), item);
  else state.inspiration.unshift({...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()});
  inspirationEditing = null; inspirationScratch = {}; inspirationFilter = 'all'; save(); render(); toast('Reference saved.');
});

document.addEventListener('input', event => {
  const form = event.target.closest('#inspiration-form');
  if (form) Object.assign(inspirationEditing || inspirationScratch, Object.fromEntries(new FormData(form)));
});

document.addEventListener('change', event => {
  if (event.target.id !== 'inspiration-filter') return;
  inspirationFilter = event.target.value; render(); $('#inspiration-filter').focus();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = state.inspiration.find(item => item.id === button.dataset.id);
  switch (button.dataset.action) {
    case 'edit-reference':
      inspirationEditing = {...item}; render(); $('#inspiration-form input').focus(); break;
    case 'cancel-reference':
      inspirationEditing = null; render(); break;
    case 'remove-reference':
      if (!item || !confirm('Remove this reference? Drafts developed from it will stay.')) return;
      state.inspiration = state.inspiration.filter(source => source.id !== item.id);
      if (inspirationEditing?.id === item.id) inspirationEditing = null;
      inspirationFilter = 'all'; save(); render(); break;
    case 'reference-draft': {
      if (!item) return;
      const post = newPost();
      post.ideaSource = {provider: 'saved-post', id: item.id};
      state.posts.push(post); save(); openPost(post); $('#post-title').focus(); break;
    }
  }
});
