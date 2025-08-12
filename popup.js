const $ = (id) => document.getElementById(id);
const tbody = document.querySelector('#tbl tbody');

function fmtDate(d){
  // Asia/Jakarta YYYY-MM-DD
  const tz = 'Asia/Jakarta';
  const iso = new Date().toLocaleString('sv-SE', { timeZone: tz }).slice(0,10);
  return iso; // YYYY-MM-DD
}

function render(rows){
  tbody.innerHTML = '';
  rows.forEach((r, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${r.keyword}</td><td>${r.count}</td><td>${r.date}</td>`;
    tbody.appendChild(tr);
  });
}

function setStatus(t){ $('status').textContent = t; }

async function loadState(){
  const st = await chrome.storage.local.get({ results: [], settings: {} });
  render(st.results || []);
  if(st.settings){
    $('minCount').value = st.settings.minCount ?? 1000;
    $('maxCount').value = st.settings.maxCount ?? 80000;
    $('autoLog').checked = st.settings.autoLog ?? true;
    $('maxSuggest').value = st.settings.maxSuggest ?? 20;
    $('concurrency').value = st.settings.concurrency ?? 3;
    $('prefixes').value = st.settings.prefixes ?? 'g, gr, f, fa, fe, fi, fl, fr, fu';
    $('mode').value = st.settings.mode ?? 'prefix';
  }
}

async function saveSettings(){
  const settings = {
    minCount: +$('minCount').value,
    maxCount: +$('maxCount').value,
    autoLog: $('autoLog').checked,
    maxSuggest: +$('maxSuggest').value,
    concurrency: +$('concurrency').value,
    prefixes: $('prefixes').value,
    mode: $('mode').value
  };
  await chrome.storage.local.set({ settings });
}

$('start').addEventListener('click', async ()=>{
  await saveSettings();
  const cfg = {
    type: 'START',
    mode: $('mode').value,
    minCount: +$('minCount').value,
    maxCount: +$('maxCount').value,
    autoLog: $('autoLog').checked,
    maxSuggest: +$('maxSuggest').value,
    concurrency: +$('concurrency').value,
    prefixes: $('prefixes').value
  };
  chrome.runtime.sendMessage(cfg);
});

$('pause').addEventListener('click', ()=> chrome.runtime.sendMessage({type:'PAUSE'}));
$('resume').addEventListener('click', ()=> chrome.runtime.sendMessage({type:'RESUME'}));
$('stop').addEventListener('click', ()=> chrome.runtime.sendMessage({type:'STOP'}));
$('export').addEventListener('click', async ()=>{
  const { results=[] } = await chrome.storage.local.get({results:[]});
  const header = 'keyword,count,date
';
  const body = results.map(r=>`"${r.keyword.replaceAll('"','""')}",${r.count},${r.date}`).join('
');
  const blob = new Blob([header+body], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `adobestock_photos_${fmtDate()} .csv`.replace(' ',''); a.click();
  URL.revokeObjectURL(url);
});

$('mode').addEventListener('change', ()=>{
  const isPrefix = $('mode').value === 'prefix';
  $('prefixBox').style.display = isPrefix ? 'block' : 'none';
});

chrome.runtime.onMessage.addListener((msg)=>{
  if(msg.type === 'STATUS') setStatus(msg.text);
  if(msg.type === 'UPDATE_ROWS') render(msg.rows || []);
});

loadState();
