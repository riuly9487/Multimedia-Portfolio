const $ = s => document.querySelector(s);
const { SUPABASE_URL: U, SUPABASE_ANON_KEY: K } = window.CONFIG;
if (!U || !K) { $('#grid').innerHTML = '<p class="empty">Add your Supabase URL and key in config.js to get started.</p>'; throw new Error('Missing config'); }
const sb = supabase.createClient(U, K);
let items = [], profile = {}, owner = false, editing = null, keep = [], files = [];
const VID = /\.(mp4|webm|mov|m4v)(\?|$)/i, PUB = '/object/public/media/';
const yt = u => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
const el = (t, c, x) => Object.assign(document.createElement(t), { className: c || '', textContent: x || '' });

function mediaEl(u, full) {
  if (VID.test(u)) { const v = el('video'); Object.assign(v, { src: u, muted: true, loop: true, playsInline: true, preload: 'metadata' }); if (full) { v.controls = true; v.autoplay = true; } return v; }
  const id = yt(u);
  if (id && full) { const f = el('iframe'); f.src = `https://www.youtube.com/embed/${id}?autoplay=1`; f.allow = 'autoplay; fullscreen'; return f; }
  const i = el('img'); i.loading = 'lazy'; i.alt = ''; i.src = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : u;
  i.onerror = () => { const a = el('a', 'm', u); a.href = u; a.target = '_blank'; i.replaceWith(a); };
  return i;
}
function carousel(m, full) {
  const box = el('div', 'media'); let i = 0;
  const show = () => { box.querySelector('.m')?.remove(); const e = mediaEl(m[i], full); e.classList.add('m'); box.prepend(e); };
  show();
  if (m.length > 1) [['‹', -1, 'prev', 'Previous'], ['›', 1, 'next', 'Next']].forEach(([t, d, c, l]) => {
    const b = el('button', 'arr ' + c, t); b.setAttribute('aria-label', l);
    b.onclick = e => { e.stopPropagation(); i = (i + d + m.length) % m.length; show(); }; box.append(b);
  });
  return box;
}
function card(it) {
  const c = el('article', 'card'), m = it.media || [];
  const box = m.length ? carousel(m) : Object.assign(el('div', 'media txt', (it.description || '').slice(0, 200)));
  c.append(box);
  if (it.title) c.append(el('h3', '', it.title));
  c.onmouseenter = () => box.querySelector('video')?.play().catch(() => {});
  c.onmouseleave = () => { const v = box.querySelector('video'); if (v) { v.pause(); v.currentTime = 0; } };
  c.onclick = () => openView(it);
  if (owner && !$('#search').value) {
    c.draggable = true;
    c.ondragstart = e => e.dataTransfer.setData('text/plain', it.id);
    c.ondragover = e => e.preventDefault();
    c.ondrop = e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id && id !== it.id) move(id, it.id); };
  }
  return c;
}
function render() {
  $('#name').textContent = profile.name || 'Your Name';
  const a = $('#avatarImg'); a.src = profile.avatar_url || ''; a.style.visibility = profile.avatar_url ? 'visible' : 'hidden';
  const q = $('#search').value.trim().toLowerCase(), g = $('#grid'); g.replaceChildren();
  const list = items.filter(i => !q || `${i.title} ${i.description}`.toLowerCase().includes(q));
  list.forEach(i => g.append(card(i)));
  if (!list.length) g.append(el('p', 'empty', q ? 'Nothing matches that search.' : owner ? 'Nothing here yet. Choose Add content.' : 'Nothing here yet.'));
  $('#addBtn').hidden = !owner; $('#authBtn').textContent = owner ? 'Log out' : 'Owner login';
}
async function load() {
  const [a, b] = await Promise.all([sb.from('items').select('*').order('position'), sb.from('profile').select('*').eq('id', 1).single()]);
  if (a.error) { $('#grid').innerHTML = `<p class="empty">Could not load content: ${a.error.message}</p>`; return; }
  items = a.data || []; profile = b.data || {}; render();
}
async function move(id, tid) {
  const l = items.filter(x => x.id !== id), t = l.findIndex(x => x.id === tid), p = l[t - 1];
  const pos = p ? (p.position + l[t].position) / 2 : l[t].position - 1;
  const { error } = await sb.from('items').update({ position: pos }).eq('id', id);
  if (error) alert(error.message); load();
}
function openView(it) {
  $('#vMedia').replaceChildren(it.media?.length ? carousel(it.media, true) : '');
  $('#vTitle').textContent = it.title || ''; $('#vDesc').textContent = it.description || '';
  const t = $('#vTools'); t.replaceChildren();
  if (owner) {
    const e = el('button', '', 'Edit'), d = el('button', 'ghost', 'Delete'); t.style.display = 'flex'; t.style.gap = '.5rem';
    e.onclick = () => { $('#view').close(); openEdit(it); };
    d.onclick = async () => {
      if (!confirm('Delete this item?')) return;
      const paths = (it.media || []).filter(u => u.includes(PUB)).map(u => decodeURIComponent(u.split(PUB)[1]));
      if (paths.length) await sb.storage.from('media').remove(paths);
      const { error } = await sb.from('items').delete().eq('id', it.id);
      if (error) alert(error.message); $('#view').close(); load();
    };
    t.append(e, d);
  }
  $('#view').showModal();
}
function chips() {
  const c = $('#chips'); c.replaceChildren();
  keep.forEach((u, i) => { const b = el('button', 'chip', '✕ ' + u.split('/').pop()); b.type = 'button'; b.onclick = () => { keep.splice(i, 1); chips(); }; c.append(b); });
  files.forEach((f, i) => { const b = el('button', 'chip', '✕ ' + f.name); b.type = 'button'; b.onclick = () => { files.splice(i, 1); chips(); }; c.append(b); });
}
function openEdit(it, isProfile) {
  editing = { it, isProfile }; keep = isProfile ? (profile.avatar_url ? [profile.avatar_url] : []) : [...(it?.media || [])]; files = [];
  $('#eHead').textContent = isProfile ? 'Edit profile' : it ? 'Edit content' : 'Add content';
  $('#fTitle').value = isProfile ? profile.name || '' : it?.title || ''; $('#fDesc').value = it?.description || '';
  $('#fUrls').value = ''; $('#descRow').hidden = isProfile; chips(); $('#edit').showModal();
}
const addFiles = fl => { files.push(...[...fl].filter(f => /^(image|video)\//.test(f.type))); chips(); };
$('#drop').onclick = () => $('#fFiles').click();
$('#fFiles').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
$('#drop').ondragover = e => { e.preventDefault(); $('#drop').classList.add('over'); };
$('#drop').ondragleave = () => $('#drop').classList.remove('over');
$('#drop').ondrop = e => { e.preventDefault(); $('#drop').classList.remove('over'); addFiles(e.dataTransfer.files); };

$('#form').onsubmit = async e => {
  e.preventDefault(); const b = $('#save'); b.disabled = true; b.textContent = 'Saving…';
  try {
    const up = [];
    for (const f of files) {
      const p = crypto.randomUUID() + '.' + (f.name.split('.').pop() || 'bin');
      const { error } = await sb.storage.from('media').upload(p, f, { contentType: f.type }); if (error) throw error;
      up.push(sb.storage.from('media').getPublicUrl(p).data.publicUrl);
    }
    const media = [...keep, ...up, ...$('#fUrls').value.split(/\s+/).filter(Boolean)], title = $('#fTitle').value.trim();
    let r;
    if (editing.isProfile) r = await sb.from('profile').update({ name: title || 'Your Name', avatar_url: media.at(-1) || null }).eq('id', 1);
    else {
      const row = { title, description: $('#fDesc').value, media };
      r = editing.it ? await sb.from('items').update(row).eq('id', editing.it.id)
        : await sb.from('items').insert({ ...row, position: Math.min(0, ...items.map(x => x.position)) - 1 });
    }
    if (r.error) throw r.error;
    $('#edit').close(); load();
  } catch (err) { alert(err.message); }
  b.disabled = false; b.textContent = 'Save';
};
$('#lform').onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $('#lEmail').value, password: $('#lPass').value });
  if (error) alert(error.message); else { $('#login').close(); $('#lPass').value = ''; }
};
$('#authBtn').onclick = () => owner ? sb.auth.signOut() : $('#login').showModal();
$('#addBtn').onclick = () => openEdit(null);
$('#avatar').onclick = () => owner && openEdit(null, true);
$('#search').oninput = render;
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
$('#view').addEventListener('close', () => $('#vMedia').replaceChildren());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
sb.auth.onAuthStateChange((_, s) => { owner = !!s; render(); });
sb.channel('live').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe();
load();
