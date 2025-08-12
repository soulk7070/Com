let queue = [];
let activeTabs = new Set();
let paused = false;
let running = false;
let settings = {
  minCount: 1000,
  maxCount: 80000,
  autoLog: true,
  maxSuggest: 20,
  concurrency: 3,
  prefixes: 'g, gr',
  mode: 'prefix'
};

async function getResults(){
  const { results=[] } = await chrome.storage.local.get({ results: [] });
  return results;
}
async function setResults(rows){
  await chrome.storage.local.set({ results: rows });
  chrome.runtime.sendMessage({ type:'UPDATE_ROWS', rows });
}
function status(t){ chrome.runtime.sendMessage({ type:'STATUS', text: t }); }

function buildPhotoSearchUrl(keyword){
  const base = 'https://stock.adobe.com/search?';
  const p = new URLSearchParams({
    'k': keyword,
    'search_type': 'usertyped',
    'filters[content_type:photo]': '1' // Photos default
  });
  return base + p.toString();
}

async function addResult(keyword, count){
  // Range filter
  if(typeof count !== 'number') return;
  if(count < settings.minCount || count > settings.maxCount) return;
  const date = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0,10);
  const rows = await getResults();
  const idx = rows.findIndex(r => r.keyword.toLowerCase() === keyword.toLowerCase() && r.date === date);
  if(idx >= 0){
    rows[idx].count = count; // update same-day duplicate
  } else {
    rows.push({ keyword, count, date });
  }
  await setResults(rows);
}

// Messaging from popup
chrome.runtime.onMessage.addListener(async (msg, sender)=>{
  if(msg.type === 'START'){
    running = true; paused = false; settings = { ...settings, ...msg };
    status('Starting…');
    await chrome.storage.local.set({ settings });
    if(settings.mode === 'prefix'){
      await startPrefixRun();
    } else {
      status('Manual Sniffer aktif. Buka Adobe Stock dan cari kata, lalu klik Save di halaman atau aktifkan Auto-log.');
    }
  }
  if(msg.type === 'PAUSE'){ paused = true; status('Paused'); }
  if(msg.type === 'RESUME'){ paused = false; status('Resumed'); pump(); }
  if(msg.type === 'STOP'){ await stopAll(); }
});

async function stopAll(){
  running = false; paused = false; queue = [];
  for(const id of Array.from(activeTabs)){
    try{ await chrome.tabs.remove(id); }catch(e){}
  }
  activeTabs.clear();
  status('Stopped');
}

// ------- PREFIX MODE -------
async function startPrefixRun(){
  const prefixes = (settings.prefixes||'').split(',').map(s=>s.trim()).filter(Boolean);
  // Step 1: collect suggestions per prefix (sekuensial agar stabil)
  let candidates = [];
  for(const prefix of prefixes){
    if(!running) break;
    status(`Ambil saran: ${prefix}`);
    const items = await fetchSuggestions(prefix, settings.maxSuggest);
    // jaga hanya yang diawali prefix
    const rx = new RegExp('^' + escapeRegExp(prefix), 'i');
    const filtered = (items||[]).filter(x => rx.test(x));
    candidates.push(...filtered);
  }
  // dedupe (case-insensitive)
  const seen = new Set();
  candidates = candidates.filter(k => {
    const key = k.toLowerCase();
    if(seen.has(key)) return false; seen.add(key); return true;
  });

  // Step 2: build queue of search URLs (Photos)
  queue = candidates.map(k => ({ keyword: k, url: buildPhotoSearchUrl(k) }));
  status(`Antrean: ${queue.length} keyword`);
  pump();
}

function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\]/g, '\$&'); }

async function fetchSuggestions(prefix, limit){
  // buka tab home Adobe Stock, inject content.js, minta suggestion
  const tab = await chrome.tabs.create({ url: 'https://stock.adobe.com/', a
