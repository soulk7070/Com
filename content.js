(function(){
  function parseCountFromText(t){
    const m = (t||'').replace(/\u00A0/g,' ').match(/([0-9][0-9 .,:']*)/);
    if(!m) return null;
    let s = m[1].trim().replace(/[ .,'’]/g,'');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function findResultCount(){
    const sels = [
      '[data-testid="result-count"]',
      '.search-results__count',
      'span[aria-live="polite"]',
      'h1, h2, h3'
    ];
    for(const sel of sels){
      const el = document.querySelector(sel);
      if(el){
        const n = parseCountFromText(el.textContent);
        if(typeof n === 'number') return n;
      }
    }
    return parseCountFromText(document.body.innerText);
  }
  function getKeyword(){
    try {
      const u = new URL(location.href);
      return u.searchParams.get('k') || '';
    } catch(e){ return ''; }
  }
  function ensurePhotosFilter(){
    const u = new URL(location.href);
    if(u.pathname.startsWith('/search') && u.searchParams.get('filters[content_type:photo]') !== '1'){
      u.searchParams.set('filters[content_type:photo]','1');
      if(location.href !== u.toString()){
        location.replace(u.toString());
        return true;
      }
    }
    return false;
  }
  async function readAndSend(manual){
    if(ensurePhotosFilter()) return;
    const keyword = getKeyword();
    const count = findResultCount();
    chrome.runtime.sendMessage({ type: manual ? 'PAGE_RESULT' : 'PAGE_RESULT_AUTO', keyword, count });
  }
  async function fetchSuggestions(prefix, limit){
    const inputSel = ['input[name="k"]', 'input[type="search"]', '#search-input'];
    let box = null;
    for(const sel of inputSel){ box = document.querySelector(sel); if(box) break; }
    if(!box) return [];
    box.focus();
    box.value = prefix;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.dispatchEvent(new KeyboardEvent('keyup', { bubbles:true, key:'End' }));
    const items = await new Promise(resolve => {
      const t0 = Date.now();
      const timer = setInterval(()=>{
        const cont = document.querySelector('[data-testid*="suggest"], ul[role="listbox"]');
        let texts = [];
        if(cont){
          cont.querySelectorAll('li, [role="option"]').forEach(li => {
            const txt = (li.textContent||'').trim();
            if(txt) texts.push(txt);
          });
        }
        if(texts.length > 0 || Date.now()-t0 > 1200){
          clearInterval(timer);
          resolve(texts);
        }
      }, 120);
    });
    box.blur();
    return (items||[]).slice(0, limit || 20);
  }
  chrome.runtime.onMessage.addListener((msg)=>{
    if(msg.type === 'READ_RESULT') readAndSend(true);
    if(msg.type === 'FETCH_SUGGESTIONS'){
      fetchSuggestions(msg.prefix, msg.limit).then(items => {
        chrome.runtime.sendMessage({ type:'SUGGESTIONS', items });
      });
    }
  });
  if(location.pathname.startsWith('/search')){
    setTimeout(()=> readAndSend(false), 700);
  }
})();
