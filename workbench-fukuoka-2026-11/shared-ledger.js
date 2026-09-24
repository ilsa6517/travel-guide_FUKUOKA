(()=>{
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.createSharedLedger=cloud=>{
 const el=document.createElement('section');el.className='expense-app shared-ledger';
 el.innerHTML=`<header><small>OUR TRIP · ${cloud.local?'本機賬本':'共享賬本'}</small><h2>旅行記賬</h2></header>${cloud.local?'<p>本地文件僅保存到這臺設備。多人同步請打開云端手冊。</p>':''}
 <div class="ledger-sync"><button type="button" data-refresh>刷新</button><span data-sync role="status">正在連接…</span></div>
 <details class="ledger-members" open><summary>旅行成員 <span data-count></span></summary><p>先添加姓名，可上傳頭像。每筆選擇付款人和分攤成員，默認均分。</p><div data-members class="member-list"></div>
 <form class="member-form"><label>姓名<input name="name" maxlength="20" placeholder="例如：你的名字" required></label><label>頭像（可選）<input name="avatar" type="file" accept="image/*"></label><button type="submit">添加成員</button><button type="button" data-member-cancel hidden>取消</button><span role="status" data-member-status></span></form></details>
 <section class="settlement-box"><h3>現在怎么結算</h3><p>按幣種分別結算，不自動換匯；已登記的還款會抵扣欠款。</p><div data-settlements></div></section>
 <div class="expense-totals"></div>
 <form class="expense-form"><label>金額<input name="amount" type="number" min="0.01" max="10000000000" step="0.01" inputmode="decimal" placeholder="0.00" required></label><label>幣種<select name="currency"><option>JPY</option><option>KRW</option><option>IDR</option><option>CNY</option><option>USD</option><option>HKD</option></select></label><label>日期<input name="date" type="date" required></label><label>類別<select name="category"><option>餐飲</option><option>交通</option><option>住宿</option><option>門票與體驗</option><option>購物</option><option>其他</option></select></label><label>誰付的錢<select name="payer" required></select></label><label>支付方式<select name="method"><option value="刷卡／電子支付">刷卡 / 電子</option><option>現金</option></select></label><fieldset class="split-members"><legend>誰一起分攤 · 所選成員均分</legend><div data-splits></div><small>分到分，余數按固定成員編號分配，合計始終等于總額。</small></fieldset><label class="expense-note">備注<input name="note" maxlength="120" placeholder="例如：兩個人的晚餐"></label><button type="submit">保存這筆</button><button type="button" data-cancel hidden>取消修改</button></form>
 <p class="expense-status" role="status"></p><h3>賬目與還款記錄</h3><div class="expense-list"></div>`;
 const $=s=>el.querySelector(s),form=$('.expense-form'),mf=$('.member-form');
 const fx=document.createElement('details');fx.className='exchange-tool';fx.innerHTML='<summary><b>匯率換算</b><span>展開 ＋</span></summary><div class="exchange-tool-body"><div class="exchange-main"><label>原幣金額<span><input data-fx-amount type="number" min="0" step="0.01" value="10000"><select data-fx-from aria-label="原幣種"><option>JPY</option><option>KRW</option><option>CNY</option><option>USD</option><option>HKD</option><option>IDR</option></select></span></label><label>換算結果<span class="exchange-result"><output data-fx-result>52.00</output><select data-fx-to aria-label="目標幣種"><option>CNY</option><option>JPY</option><option>KRW</option><option>USD</option><option>HKD</option><option>IDR</option></select></span></label></div><label class="exchange-rate">參考匯率<span>1 原幣 = <input data-fx-rate aria-label="一單位原幣對應的目標幣金額" type="number" min="0.000001" step="0.000001" value="0.0052"> 目標幣</span></label><button type="button" data-fx-refresh>刷新最新匯率</button><small data-fx-status>聯網時讀取最新參考匯率；離線時可手動填寫。</small></div>';
 el.insertBefore(fx,$('.ledger-members'));
 const fxAmount=$('[data-fx-amount]'),fxFrom=$('[data-fx-from]'),fxTo=$('[data-fx-to]'),fxRate=$('[data-fx-rate]'),fxResult=$('[data-fx-result]'),fxRefresh=$('[data-fx-refresh]'),fxStatus=$('[data-fx-status]');
 const fxStoreKey='travel-ledger-fx:'+(window.HANDBOOK_CONFIG?.slug||document.title||location.pathname);
 const destinationCurrency=window.HANDBOOK_CONFIG?.currency||'USD';[fxFrom,form.elements.currency].forEach(select=>{if(![...select.options].some(o=>o.value===destinationCurrency))select.add(new Option(destinationCurrency,destinationCurrency),0);select.value=destinationCurrency});
 function renderFx(){if(!fxRate.value||!(Number(fxRate.value)>0)){fxResult.textContent='—';return}const amount=Number(fxAmount.value)||0,rate=Number(fxRate.value)||0;fxResult.textContent=Number(amount*rate).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});try{localStorage.setItem(fxStoreKey,JSON.stringify({from:fxFrom.value,to:fxTo.value,rate:rate}))}catch(e){}}
async function calibrateFx(force){const from=fxFrom.value,to=fxTo.value;if(from===to){fxRate.value='1';fxStatus.textContent='同幣種匯率為 1';renderFx();return}const cacheKey=fxStoreKey+':latest:'+from+':'+to;try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(!force&&cached&&Date.now()-cached.savedAt<21600000){fxRate.value=cached.rate;fxStatus.textContent='參考匯率 · '+cached.date+' 更新';renderFx();return}}catch(e){}fxRefresh.disabled=true;fxStatus.textContent='正在獲取最新參考匯率…';try{const res=await fetch('https://api.frankfurter.dev/v2/rate/'+encodeURIComponent(from)+'/'+encodeURIComponent(to),{cache:'no-store'});if(!res.ok)throw Error('rate');const data=await res.json();if(fxFrom.value!==from||fxTo.value!==to)return;if(!Number.isFinite(Number(data.rate)))throw Error('rate');fxRate.value=Number(data.rate).toFixed(Number(data.rate)<.01?6:4);try{localStorage.setItem(cacheKey,JSON.stringify({rate:fxRate.value,date:data.date,savedAt:Date.now()}))}catch(e){}fxStatus.textContent='參考匯率 · '+data.date+' 更新';renderFx()}catch(e){fxStatus.textContent='暫時無法自動校準，可繼續手動填寫'}finally{fxRefresh.disabled=false}}
 try{const saved=JSON.parse(localStorage.getItem(fxStoreKey)||'null');fxRate.value=saved&&saved.from===destinationCurrency&&saved.to==='CNY'?saved.rate:''}catch(e){fxRate.value=''}
 fxFrom.value=destinationCurrency;fxTo.value='CNY';
 ;[fxAmount,fxRate].forEach(x=>x.addEventListener('input',renderFx));[fxFrom,fxTo].forEach(x=>x.addEventListener('change',()=>{fxRate.value='';renderFx();calibrateFx(true)}));fxRefresh.addEventListener('click',()=>calibrateFx(true));renderFx();calibrateFx(false);
 let members=[],records=[],loaded=false,busy=false,editing=null,memberEditing=null,transfers=[],draftId=null,memberDraftId=null,formMembers='',selectionTouched=false,initial=true;
 const member=id=>members.find(m=>m.id===id),name=id=>member(id)?.name||'待確認付款人',money=n=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const avatar=m=>m.avatar?`<img src="${esc(m.avatar)}" alt="" width="32" height="32">`:`<span class="member-initial" aria-hidden="true">${esc(m.name.slice(0,1))}</span>`;
 const identity=id=>{const m=member(id)||{name:'待確認付款人',avatar:''};return `<span class="settlement-party">${avatar(m)}<b>${esc(m.name)}</b></span>`};
 const today=()=>new Date().toLocaleDateString('en-CA');
 function selectMembers(){
  const signature=JSON.stringify(members.map(m=>[m.id,m.name]));if(signature===formMembers)return;formMembers=signature;
  const payer=form.elements.payer.value,selected=new Set([...el.querySelectorAll('[name=participant]:checked')].map(x=>x.value));
  form.elements.payer.innerHTML=members.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');if(members.some(m=>m.id===payer))form.elements.payer.value=payer;
  $('[data-splits]').innerHTML=members.map(m=>`<label><input type="checkbox" name="participant" value="${esc(m.id)}" ${!selectionTouched||selected.has(m.id)?'checked':''}>${avatar(m)}<span>${esc(m.name)}</span></label>`).join('');
 }
 function render(){
  selectMembers();$('[data-count]').textContent=`${members.length} 人`;
  $('[data-members]').innerHTML=members.map(m=>`<button type="button" data-member="${esc(m.id)}">${avatar(m)}<span>${esc(m.name)}</span><small>編輯</small></button>`).join('');
  const totals=window.calculateTravelSettlement(records,members);transfers=[];
  $('.expense-totals').innerHTML=Object.entries(totals).map(([c,s])=>`<span>已花 ${esc(c)} <b>${money(s.total/100)}</b></span>`).join('');
  $('[data-settlements]').innerHTML=Object.entries(totals).map(([c,s])=>`<div class="currency-settlement"><b>${esc(c)}</b>${s.unresolved?`<p>有 ${s.unresolved} 筆舊記錄未明確付款人，請點擊該筆“修改”後再結算。</p>`:s.transfers.length?s.transfers.map(t=>{const index=transfers.push({...t,currency:c})-1;return `<div class="settlement-row"><span class="settlement-parties">${identity(t.from)}<i aria-hidden="true">→</i>${identity(t.to)}</span><strong>${money(t.amount)}</strong><button type="button" data-settle="${index}">登記還款</button></div>`}).join(''):'<p>已結清，不需要轉賬。</p>'}${s.unresolved?'':`<details><summary>查看每人凈額</summary>${Object.entries(s.balances).map(([id,n])=>`<p>${esc(name(id))} · ${n>0?'應收':n<0?'應付':'已平'} ${money(Math.abs(n)/100)}</p>`).join('')}</details>`}</div>`).join('')||`<p>${!loaded?'正在讀取…':members.length<2?'添加旅行成員，再記下第一筆。':'還沒有賬目，記賬後會自動算出誰給誰多少錢。'}</p>`;
  $('.expense-list').innerHTML=records.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.updated_at.localeCompare(a.updated_at)).map(r=>`<article><div><b>${esc(r.kind==='settlement'?'還款 · '+name(r.payer)+' → '+name(r.participants[0]):r.note||r.category)}</b><small>${esc(r.date)} · ${r.kind==='settlement'?'已登記還款':esc(name(r.payer))+' 付款 · '+r.participants.map(id=>esc(name(id))).join('、')+'均分'}</small></div><strong>${esc(r.currency)} ${money(r.amount)}</strong><div class="ledger-record-actions">${r.kind==='settlement'?'':`<button type="button" data-edit="${esc(r.id)}">修改</button>`}<button type="button" data-delete="${esc(r.id)}">${r.kind==='settlement'?'撤銷':'刪除'}</button></div></article>`).join('')||'<p>暫無記錄。</p>';
  form.querySelector('[type=submit]').disabled=busy||!loaded||!members.length;
  el.querySelectorAll('[data-edit],[data-delete],[data-settle]').forEach(b=>b.disabled=busy);
 }
 async function refresh(){try{await cloud.refresh();}catch(e){$('[data-sync]').textContent='未同步 · 請聯網後刷新';if(!loaded)$('.expense-status').textContent=e.message;}}
 cloud.subscribe(state=>{members=state.members||[];records=state.expenses;loaded=true;render();$('[data-sync]').textContent=(cloud.local?'已讀取本機 ':'已同步 ')+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});if(initial){initial=false;if(members.length>=2)$('.ledger-members').open=false;}});
 $('[data-refresh]').onclick=refresh;
 function reset(){editing=null;draftId=null;selectionTouched=false;form.reset();form.elements.date.value=today();el.querySelectorAll('[name=participant]').forEach(x=>x.checked=true);form.querySelector('[type=submit]').textContent='保存這筆';$('[data-cancel]').hidden=true;}
 $('[data-cancel]').onclick=reset;
 form.addEventListener('change',e=>{if(e.target.name==='participant')selectionTouched=true;});
 async function write(record){await cloud.putExpense(record);await refresh();}
 form.onsubmit=async e=>{e.preventDefault();if(busy||!loaded)return;const f=new FormData(form),participants=f.getAll('participant');if(!participants.length){$('.expense-status').textContent='請至少選擇一位分攤成員。';return;}
  const r={...Object.fromEntries(f),amount:Number(f.get('amount')),participants,kind:'expense',id:editing?.id||(draftId??=crypto.randomUUID()),version:editing?.version||0};delete r.participant;
  busy=true;render();$('.expense-status').textContent='正在保存…';try{await write(r);reset();$('.expense-status').textContent='已保存，結算結果已更新。';}catch(error){$('.expense-status').textContent=error.message+' 輸入已保留。';}finally{busy=false;render();}
 };
 el.addEventListener('click',async e=>{
  const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]'),settle=e.target.closest('[data-settle]'),member=e.target.closest('[data-member]');
  if(member){const m=members.find(m=>m.id===member.dataset.member);memberEditing={...m};mf.elements.name.value=m.name;mf.elements.avatar.value='';mf.querySelector('[type=submit]').textContent='保存成員';$('[data-member-cancel]').hidden=false;return;}
  if(busy)return;
  if(edit){const r=records.find(r=>r.id===edit.dataset.edit);editing={...r};selectionTouched=true;for(const [k,v]of Object.entries(r))if(form.elements[k])form.elements[k].value=v;el.querySelectorAll('[name=participant]').forEach(x=>x.checked=r.participants.includes(x.value));form.querySelector('[type=submit]').textContent='保存修改';$('[data-cancel]').hidden=false;$('.expense-status').textContent='';form.scrollIntoView({block:'nearest'});return;}
  if(del){const r=records.find(r=>r.id===del.dataset.delete);if(!r||!confirm(r.kind==='settlement'?'撤銷這次還款登記？欠款將重新計入結算。':'從共享賬本刪除這筆消費？'))return;busy=true;render();try{await cloud.deleteExpense(r);if(editing?.id===r.id)reset();await refresh();$('.expense-status').textContent='已刪除，結算結果已更新。';}catch(error){$('.expense-status').textContent=error.message;}finally{busy=false;render();}}
  if(settle){const t={...transfers[+settle.dataset.settle]},snapshot=records.map(r=>r.id+':'+r.version).sort().join('|');if(!t.from||!confirm(`確認 ${name(t.from)} 已實際付給 ${name(t.to)} ${t.currency} ${money(t.amount)}？\n這只登記還款，不會發起真實轉賬。`))return;
   busy=true;render();try{const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(snapshot+JSON.stringify(t)));const id='settle_'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,56);await write({id,version:0,kind:'settlement',amount:t.amount,currency:t.currency,payer:t.from,participants:[t.to],date:today(),category:'其他',method:'刷卡／電子支付',note:'還款'});$('.expense-status').textContent='還款已登記，剩余應付已更新。';}catch(error){$('.expense-status').textContent=error.message+' 請先刷新，確認是否已登記後再操作。';}finally{busy=false;render();}
  }
 });
 function resetMember(){memberEditing=null;memberDraftId=null;mf.reset();mf.querySelector('[type=submit]').textContent='添加成員';$('[data-member-cancel]').hidden=true;}
 $('[data-member-cancel]').onclick=resetMember;
 async function photo(file){
  if(!file)return memberEditing?.avatar||'';
  if(file.size>15*1024*1024)throw Error('請選擇15MB以內的照片');
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const context=canvas.getContext('2d');const side=Math.min(img.naturalWidth,img.naturalHeight);context.fillStyle='#ffffff';context.fillRect(0,0,128,128);context.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,128,128);return canvas.toDataURL('image/jpeg',.78);}finally{URL.revokeObjectURL(url);}
 }
 mf.onsubmit=async e=>{e.preventDefault();const b=mf.querySelector('[type=submit]');if(b.disabled)return;b.disabled=true;$('[data-member-status]').textContent='正在保存…';
  try{const avatar=await photo(mf.elements.avatar.files[0]);await cloud.putMember({id:memberEditing?.id||(memberDraftId??=crypto.randomUUID()),version:memberEditing?.version||0,name:mf.elements.name.value.trim(),avatar});resetMember();await refresh();$('[data-member-status]').textContent=cloud.local?'成員已保存到本機。':'成員已保存并同步。';}
  catch(error){$('[data-member-status]').textContent=error.message||'照片讀取失敗，請使用 JPG 或 PNG';}finally{b.disabled=false;}
 };
 reset();render();refresh();return{element:el,render,refresh};
};
})();

