// background.js (minimal untuk mode manual)

function status(t){ chrome.runtime.sendMessage({ type:'STATUS', text: t }); }

async function getResults(){
  const { results=[] } = await chrome.storage.local.get({ results: [] });
  return results;
}
async function setResults(rows){
  await chrome.storage.local.set({ results: rows });
  chrome.runtime.sendMessage({ type:'UPDATE_ROWS', rows });
}

async function addResult(keyword, count){
  if(typeof count !== 'number') return;
  // filter 1000–80000
  if(count < 1000 || count > 80000) return;
  const date = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0,10);
  const rows = await getResults();
  const idx = rows.findIndex(r => r.keyword.toLowerCase() === keyword.toLowerCase() && r.date === date);
  if(idx >= 0) rows[idx].count = count; else rows.push({ keyword, count, date });
  await setResults(rows);
}

// terima data otomatis dari content.js saat kamu buka halaman /search
chrome.runtime.onMessage.addListener(async (m) => {
  if(m.type === 'PAGE_RESULT_AUTO' || m.type === 'PAGE_RESULT'){
    await addResult(m.keyword, m.count);
    status(`Saved: ${m.keyword} → ${m.count}`);
  }
});
