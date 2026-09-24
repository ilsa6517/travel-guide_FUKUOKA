/* Independent offline reading shell. Original trip, checklist and place logic remain intact. */
(() => {
 const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
 const chapters=[["route", "行程", "路線與每日安排"], ["stay", "航班與住宿", "已確認資料與待辦"], ["sights", "景點", "已安排與可選"], ["food", "餐飲指南", "小吃、餐廳與菜單"], ["shops", "購物指南", "門店與伴手禮"], ["move", "當地特色體驗", "按興趣替換"], ["booking", "出發前準備", "預約與行李"], ["words", "語言錦囊", "當地語言與英語"], ["tips", "旅遊貼士", "實用提醒"]];
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.body.classList.add('atlas-ui');
 const main=$('body > main');
 const stayFold=$('.hotel-chapter-fold');if(stayFold){const stay=$('#stay',stayFold);if(stay)stayFold.replaceWith(stay);}
 const flight=$('.flight-band');if(flight){flight.id='flights';const stay=document.getElementById('stay');if(stay)stay.append(flight);}
 const menu=$('#food .menu-field-page');if(menu){const fold=document.createElement('details');fold.className='atlas-menu-guide';fold.innerHTML='<summary><span><b>點餐時，隨手查</b><small>菜單詞匯 · 辣度 · 過敏原 · 賬單</small></span><span>展開 ＋</span></summary>';menu.before(fold);fold.append(menu);}
 [...main.children].forEach(n=>n.classList.add('atlas-original'));
 const sidebar=document.createElement('aside');sidebar.className='atlas-sidebar';
 sidebar.innerHTML="<a class=\"atlas-brand\" href=\"#home\"><span class=\"atlas-mark\">旅</span><div>福岡<span>TRAVEL FIELD NOTES</span></div></a><div class=\"atlas-trip-label\">6天5晚<small>2026-11-24 — 2026-11-29 · 人數5 人：35 歲夫妻、58 歲夫妻與 30 歲男性同行，照顧長輩步調</small></div><nav aria-label=\"手冊章節\"><a href=\"#home\" data-page=\"home\"><span>⌂</span>旅行首頁</a><a href=\"#route\" data-page=\"route\"><span>01</span>行程</a><a href=\"#stay\" data-page=\"stay\"><span>02</span>航班與住宿</a><a href=\"#sights\" data-page=\"sights\"><span>03</span>景點</a><a href=\"#food\" data-page=\"food\"><span>04</span>餐飲指南</a><a href=\"#shops\" data-page=\"shops\"><span>05</span>購物指南</a><a href=\"#move\" data-page=\"move\"><span>06</span>當地特色體驗</a><a href=\"#booking\" data-page=\"booking\"><span>07</span>出發前準備</a><a href=\"#words\" data-page=\"words\"><span>08</span>語言錦囊</a><a href=\"#tips\" data-page=\"tips\"><span>09</span>旅遊貼士</a></nav><div class=\"atlas-sidebar-foot\"><span class=\"atlas-dot\"></span>離線手冊<small>內容與圖片隨手冊保存。</small></div>";
 document.body.prepend(sidebar);
 const top=document.createElement('header');top.className='atlas-topbar';top.innerHTML='<button class="atlas-menu-toggle" aria-label="展開章節目錄" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/></svg></button><span class="atlas-breadcrumb">我們的旅行 / <b>旅行首頁</b></span><button class="atlas-search-trigger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>搜索手冊</span><kbd>Ctrl K</kbd></button>';
 main.before(top);
 const home=document.createElement('div');home.id='home';home.className='atlas-home';
 home.innerHTML="<div class=\"atlas-home-title\"><div><p class=\"atlas-eyebrow\">FUKUOKA · 2026</p><h1>海風與街市</h1></div><span class=\"atlas-edition\">福岡 / 2026<br>旅行手冊</span></div><div class=\"atlas-cover\"><img src=\"assets/fukuoka-cover.jpg\" alt=\"福岡旅行封面\"><div class=\"atlas-cover-shade\"></div><div class=\"atlas-cover-copy\"><p>FUKUOKA · 2026</p><h2>福岡<br><em>海風與街市</em></h2><span>以福岡市區為基地，串起海岸自駕、別府近郊、秋月紅葉與門司港街景。</span><a class=\"atlas-primary\" href=\"#route\">翻開6天行程 <span>↗</span></a></div><div class=\"atlas-cover-caption\">2026-11-24 — 2026-11-29<span>6天5晚</span></div></div><div class=\"atlas-quickline\"><div><b>06</b><span>天的旅行安排</span></div><div><b>05</b><span>晚的城市停留</span></div><div><b>08</b><span>個隨行章節</span></div><button class=\"atlas-trip-open\">進入旅行模式 <span>↗</span><small>路線 · 地圖 · 攝影 · 記賬</small></button></div><div class=\"atlas-section-title\"><h2>每天的旅行書簽</h2><span>點一天，展開詳細安排</span></div><div class=\"atlas-day-list\"></div><div class=\"atlas-bottom-note\"><span>TRAVEL FIELD NOTES</span><p>內容與圖片可離線閱讀；導航和外部服務需聯網。</p><a href=\"#booking\">檢查行李與預約 ↗</a></div>";
 main.prepend(home);
 $$('#route .day').forEach((day,i)=>{
  const summary=$('summary',day);if(!summary)return;
  if(!day.id)day.id='atlas-day-'+(i+1);
  const a=document.createElement('a');a.href='#'+day.id;
  a.innerHTML=`<span class="atlas-day-num">${String(i+1).padStart(2,'0')}</span><div><small>${escape(($('small',summary)||{}).textContent||'')}</small><b>${escape(($('b',summary)||{}).textContent||'今日行程')}</b></div><span class="atlas-day-excerpt">${escape(($('em',summary)||{}).textContent||'')}</span><span>↗</span>`;
  $('.atlas-day-list',home).append(a);
 });
 const dialog=document.createElement('dialog');dialog.className='atlas-search';dialog.innerHTML='<div class="atlas-search-head"><input type="search" aria-label="搜索手冊內容" placeholder="找餐廳、景點、行李或某一天…"><button aria-label="關閉搜索">✕</button></div><p class="atlas-search-hint">搜索整本手冊 · 無需聯網</p><div class="atlas-search-results"></div>';
 document.body.append(dialog);
 const entries=[];
 chapters.forEach(([id,label])=>{
  const section=$('#'+id);if(!section)return;
  $$('h3, .day > summary, .tip, .check-item, .vocab',section).forEach((el,i)=>{
   const context=el.closest('article, details, .restaurant, .vocab')||el.parentElement;
   if(!el.id)el.id=`atlas-find-${id}-${i}`;
   entries.push({id:el.id,label,title:el.textContent.trim().replace(/\s+/g,' ').slice(0,110),text:context.textContent.toLowerCase(),element:el});
  });
  entries.push({id,label,title:label,text:section.textContent.toLowerCase(),element:section});
 });
 function results(){const q=$('input',dialog).value.trim().toLowerCase();const hits=q?entries.filter(e=>e.text.includes(q)||e.title.toLowerCase().includes(q)).slice(0,35):entries.filter(e=>chapters.some(c=>c[0]===e.id));$('.atlas-search-results',dialog).innerHTML=hits.length?hits.map(e=>`<a href="#${e.id}"><small>${escape(e.label)}</small><b>${escape(e.title)}</b><span>↗</span></a>`).join(''):'<p class="atlas-empty">沒有找到相關內容，試試「景點」「餐廳」或「行李」。</p>';}
 function openSearch(){results();dialog.showModal();$('input',dialog).focus();}
 $('.atlas-search-trigger').onclick=openSearch;$('input',dialog).oninput=results;$('button',dialog).onclick=()=>dialog.close();
 dialog.onclick=e=>{if(e.target===dialog)dialog.close();if(e.target.closest('a'))dialog.close();};
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});
 $('.atlas-menu-toggle').onclick=()=>{const open=document.body.classList.toggle('atlas-menu-open');$('.atlas-menu-toggle').setAttribute('aria-expanded',open);};
 $('.atlas-trip-open').onclick=()=>(function(e){if(e)e.click();}($('.trip-mode-launch')));
 const mobileReading=matchMedia('(max-width:800px)');
 // Put the continuous reading order in the same order as the directory.
 chapters.forEach(([id])=>{const section=document.getElementById(id);if(section&&section.parentElement===main)main.append(section);});
 function navigate(){let id;try{id=decodeURIComponent(location.hash.slice(1))||'home';}catch(e){id='home';}let target=document.getElementById(id);const chapter=target&&target.closest('main > section');let active=chapter&&chapter.id|| (id==='home'?'home':null);if(!active){active='home';target=home;}
  $$('.atlas-original',main).forEach(n=>n.hidden=mobileReading.matches?!chapters.some(c=>c[0]===n.id):n!==chapter);home.hidden=mobileReading.matches?false:active!=='home';
  if(chapter){let n=target;while(n&&n!==chapter){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement;}}
  $$('.atlas-sidebar [data-page]').forEach(a=>{const selected=a.dataset.page===active;a.classList.toggle('is-active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('.atlas-breadcrumb b').textContent=(chapters.find(c=>c[0]===active)||[])[1]||'旅行首頁';
  document.body.classList.remove('atlas-menu-open');$('.atlas-menu-toggle').setAttribute('aria-expanded','false');
  requestAnimationFrame(()=>{if(target&&target!==home&&(mobileReading.matches||target!==chapter))target.scrollIntoView({block:'start'});else window.scrollTo(0,0);});
 }
 window.addEventListener('hashchange',navigate);mobileReading.addEventListener('change',navigate);navigate();
 let scrollQueued=false;
 window.addEventListener('scroll',()=>{if(!mobileReading.matches||scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{scrollQueued=false;let current='home';for(const [id] of chapters){const section=document.getElementById(id);if(section&&section.getBoundingClientRect().top<=150)current=id;}
 $('.atlas-breadcrumb b').textContent=(chapters.find(c=>c[0]===current)||[])[1]||'旅行首頁';document.body.dataset.atlasChapter=current;
 $$('.atlas-sidebar [data-page]').forEach(a=>{const selected=a.dataset.page===current;a.classList.toggle('is-active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 });},{passive:true});
 // Keep a stable checklist key: original labels change from pending to confirmed.
 const checklistKey='fukuoka-2026-atlas-checklist-20260907';
 function restoreChecklist(){try{const saved=JSON.parse(localStorage.getItem(checklistKey)||'null');if(!Array.isArray(saved))return;$$('#booking input[type="checkbox"]').forEach((input,i)=>{input.checked=!!saved[i];var li=input.closest('li');if(li)li.classList.toggle('is-packed',input.checked);});if(typeof window.updatePacking==='function')window.updatePacking();}catch(e){}}
 document.addEventListener('change',e=>{if(!e.target.matches('#booking input[type="checkbox"]'))return;try{localStorage.setItem(checklistKey,JSON.stringify($$('#booking input[type="checkbox"]').map(x=>x.checked)));}catch(e){};});
 window.addEventListener('pageshow',()=>requestAnimationFrame(restoreChecklist));requestAnimationFrame(restoreChecklist);
})();

;(function(){document.documentElement.lang='zh-TW';document.title="福岡旅遊手冊";var meta=document.querySelector('meta[name=description]');if(meta)meta.content="福岡六天五夜繁體中文旅行手冊";var trigger=document.querySelector('.mobile-nav-trigger>span');if(trigger)trigger.textContent='目錄';var backdrop=document.querySelector('.mobile-menu-backdrop');if(backdrop)backdrop.setAttribute('aria-label','關閉目錄');var menu=document.querySelector('.mobile-menu-panel');if(menu)menu.setAttribute('aria-label','手機快捷導覽');var pulse=document.querySelector('.trip-pulse');if(pulse)pulse.setAttribute('aria-label','旅途快捷狀態');})();
