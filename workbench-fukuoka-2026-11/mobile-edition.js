/* Mobile travel-book composition, informed by Taste redesign and Impeccable adapt. */
(() => {
 const home=document.querySelector('#home'),cover=home?.querySelector('#top');if(!cover||!window.HANDBOOK_CONFIG||window.HANDBOOK_CONFIG.start_date==='pending')return;
 const countdown=document.createElement('section');countdown.className='atlas-countdown';countdown.setAttribute('aria-label','旅行倒計時');
 countdown.innerHTML='<div class="countdown-heading"><span>下一站，福岡</span><a href="#flights">航班信息 ↗</a></div><p class="countdown-status">距離出發</p><div class="countdown-digits" role="timer"><span><b data-count="days">00</b><small>天</small></span><i>:</i><span><b data-count="hours">00</b><small>小時</small></span><i>:</i><span><b data-count="minutes">00</b><small>分</small></span><i>:</i><span><b data-count="seconds">00</b><small>秒</small></span></div><div class="countdown-foot"><span>2026-11-24 — 2026-11-29</span><a href="#booking">出發準備 ↗</a></div>';
 cover.after(countdown);
 const departure=Date.parse(window.HANDBOOK_CONFIG.start_date),tripEnd=Date.parse(window.HANDBOOK_CONFIG.end_date);
 const update=()=>{const now=Date.now(),remaining=Math.max(0,Math.floor((departure-now)/1000));const vals={days:Math.floor(remaining/86400),hours:Math.floor(remaining/3600)%24,minutes:Math.floor(remaining/60)%60,seconds:remaining%60};for(const [key,val]of Object.entries(vals))countdown.querySelector('[data-count="'+key+'"]').textContent=String(val).padStart(2,'0');countdown.querySelector('.countdown-status').textContent=now<departure?'距離出發':now<tripEnd?'旅行進行中，按當天安排出發':'旅程已結束，把回憶留下';countdown.querySelector('.countdown-digits').hidden=now>=departure;};
 update();setInterval(()=>{if(!document.hidden)update()},1000);document.addEventListener('visibilitychange',update);
 const guide=document.querySelector('.atlas-menu-guide');if(guide){const meta=guide.querySelector('summary .atlas-fold-meta');if(meta)meta.textContent='菜名 · 辣度 · 賬單';}
 const foodIntro=document.querySelector('#food>.section-heading p:last-child');if(foodIntro)foodIntro.textContent='當地小吃、專程餐廳與本地連鎖，按當天路線選擇。';
})();
(() => {
 const sidebar=document.querySelector('.atlas-sidebar'),toggle=document.querySelector('.atlas-menu-toggle');if(!sidebar)return;
 const head=document.createElement('div');head.className='atlas-directory-head';head.innerHTML='<div><h2 id="atlas-directory-title">旅行目錄</h2><p>選擇章節，直接到達</p></div><button class="atlas-directory-close" aria-label="關閉目錄"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18"/></svg></button>';sidebar.prepend(head);
 const close=()=>{document.body.classList.remove('atlas-menu-open');toggle.setAttribute('aria-expanded','false')};head.querySelector('button').onclick=close;
 sidebar.addEventListener('click',e=>{const link=e.target.closest('a[data-page]');if(!link||!matchMedia('(max-width:800px)').matches)return;if(link.hash===location.hash){document.querySelector(link.hash)?.scrollIntoView({block:'start'});close();}});
 let wasOpen=false,previousFocus;
 const sync=()=>{const open=document.body.classList.contains('atlas-menu-open')&&matchMedia('(max-width:800px)').matches;if(open===wasOpen)return;wasOpen=open;if(open){previousFocus=document.activeElement;sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-labelledby','atlas-directory-title');head.querySelector('button').focus({preventScroll:true})}else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('aria-labelledby');previousFocus?.focus({preventScroll:true});}};
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{if(!wasOpen)return;if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const els=[head.querySelector('button'),...sidebar.querySelectorAll('nav a')],first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
})();
