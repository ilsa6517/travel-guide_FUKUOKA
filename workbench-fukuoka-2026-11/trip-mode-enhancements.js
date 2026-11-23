(function () {
  'use strict';

  var KEY = 'fukuoka-2026-itinerary-adjustments-v1';
  var connected = new WeakSet();

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function readPlan() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (value && value.version === 1 && Array.isArray(value.days) && value.days.length === (window.BALI_ITINERARY || []).length) return value;
    } catch (error) {}
    return null;
  }
  window.TripItineraryDraft = { read: readPlan };
  function firePlanChange() {
    window.dispatchEvent(new CustomEvent('travel-handbook:local-itinerary-change'));
  }
  function savePlan() {
    var api = window.BaliCustomizer;
    if (!api || typeof api.getDraft !== 'function') return false;
    var ops = typeof api.getOps === 'function' ? api.getOps() : [];
    if (!ops.length) {
      var status = $('.itinerary-customizer__status');
      if (status) status.textContent = '先修改時間、地點或順序，再套用到旅行模式。';
      return false;
    }
    var state = { version: 1, savedAt: Date.now(), days: api.getDraft(), ops: ops };
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      var status = $('.itinerary-customizer__status');
      if (status) status.textContent = '已套用到本機旅行模式；原始手冊行程仍保留。';
      var clear = $('[data-trip-draft-clear]');
      if (clear) clear.disabled = false;
      firePlanChange();
      return true;
    } catch (error) {
      var status = $('.itinerary-customizer__status');
      if (status) status.textContent = '本機儲存失敗，這次調整仍留在編輯視窗；請先下載完整申請包。';
      return false;
    }
  }
  function clearPlan(resetEditor) {
    try { localStorage.removeItem(KEY); }
    catch (error) {
      var status = $('.itinerary-customizer__status');
      if (status) status.textContent = '無法清除本機行程，請檢查瀏覽器儲存空間。';
      return;
    }
    if (resetEditor && window.BaliCustomizer && typeof window.BaliCustomizer.restoreAll === 'function') window.BaliCustomizer.restoreAll();
    firePlanChange();
  }
  function enhanceCustomizer(modal) {
    var actions = $('.itinerary-customizer__actions', modal);
    if (!actions || $('.trip-draft-actions', modal)) return;
    var draftActions = document.createElement('div');
    draftActions.className = 'trip-draft-actions';
    var apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'trip-draft-apply';
    apply.dataset.tripDraftApply = '';
    apply.textContent = '套用到旅行模式';
    apply.setAttribute('aria-label', '儲存這份自訂行程，並在旅行模式使用');
    apply.addEventListener('click', savePlan);
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'trip-draft-clear';
    clear.dataset.tripDraftClear = '';
    clear.textContent = '清除已儲存行程';
    clear.disabled = !readPlan();
    clear.addEventListener('click', function () { clearPlan(true); clear.disabled = true; });
    draftActions.append(apply, clear);
    actions.insertAdjacentElement('afterend', draftActions);
  }
  function renderRouteBanner() {
    var route = $('#route');
    if (!route) return;
    var old = $('.local-itinerary-banner', route);
    var state = readPlan();
    if (!state) { if (old) old.remove(); return; }
    if (old) return;
    var banner = document.createElement('aside');
    banner.className = 'local-itinerary-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<div><strong>本機自訂行程已套用</strong><p>旅行模式會使用這份站序；正文保留原始行程作參考。交通時間與營業條件請按新順序再確認。</p></div><div class="local-itinerary-banner__actions"><button type="button" data-open-trip-mode>開啟旅行模式</button><button type="button" data-clear-trip-draft>清除自訂行程</button></div>';
    var anchor = $('.days', route) || $('.section-heading', route);
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(banner, anchor);
  }

  function normalize(value) { return String(value || '').toLowerCase().replace(/[\s\u3000·・、，,。／/（）()【】「」『』「」_-]/g, ''); }
  function activeDayIndex(panel) {
    var buttons = $$('.trip-mode-day', panel);
    var index = buttons.findIndex(function (button) { return button.classList.contains('is-active'); });
    return index < 0 ? 0 : index;
  }
  function selectView(panel, view) {
    panel.dataset.tripView = view;
    var shell = $('.trip-mode-panel', panel);
    if (shell) shell.dataset.tripView = view;
    $$('[data-trip-view]', panel).forEach(function (button) {
      var active = button.dataset.tripView === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('[data-trip-page]', panel).forEach(function (page) { page.hidden = page.dataset.tripPage !== view; });
    var content = $('.trip-mode-content', panel);
    if (content) content.scrollTop = 0;
  }
  function guideCards(index) {
    var source = $$('#sights .sight-card');
    var saved = readPlan();
    var selectedNames = saved && saved.days[index] ? saved.days[index].places.map(function (place) { return place.name; }) : ((window.BALI_ITINERARY || [])[index] || {}).stops || [];
    selectedNames = selectedNames.map(function (item) { return typeof item === 'string' ? item : item.name; }).filter(Boolean);
    return source.map(function (original) {
      var card = original.cloneNode(true);
      card.classList.add('trip-guide-card');
      card.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
      var title = $('h3', card);
      var name = title ? title.textContent.trim() : '';
      var normalizedName = normalize(name);
      var belongsToday = selectedNames.some(function (place) {
        var normalizedPlace = normalize(place);
        return normalizedName && normalizedPlace && (normalizedPlace.indexOf(normalizedName) >= 0 || normalizedName.indexOf(normalizedPlace) >= 0 || (normalizedName.indexOf('秋月') >= 0 && normalizedPlace.indexOf('秋月') >= 0) || (normalizedName.indexOf('太宰府') >= 0 && normalizedPlace.indexOf('太宰府') >= 0));
      });
      card.dataset.todayStop = belongsToday ? 'true' : 'false';
      if (belongsToday) {
        var copy = $('.sight-copy', card);
        if (copy) {
          var chip = document.createElement('span');
          chip.className = 'trip-guide-route-chip';
          chip.textContent = '今天行程';
          copy.insertBefore(chip, copy.firstChild);
        }
      }
      return card;
    });
  }
  function ensureGuide(panel) {
    var tabs = $('.trip-view-tabs', panel);
    var content = $('.trip-mode-content', panel);
    if (!tabs || !content) return;
    var tab = $('#trip-tab-guide', panel);
    if (!tab) {
      tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'trip-tab-guide';
      tab.className = 'trip-guide-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-label', '景點指南');
      tab.setAttribute('aria-controls', 'trip-page-guide');
      tab.setAttribute('aria-selected', 'false');
      tab.tabIndex = -1;
      tab.dataset.tripView = 'guide';
      tab.textContent = '景點指南';
      tab.onclick = function () { selectView(panel, 'guide'); };
      tab.addEventListener('keydown', function (event) {
        var buttons = $$('[data-trip-view]', panel);
        var index = buttons.indexOf(tab), next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault(); buttons[next].click(); buttons[next].focus();
      });
      var expenseTab = $('#trip-tab-expense', tabs);
      if (expenseTab) tabs.insertBefore(tab, expenseTab.nextSibling); else tabs.appendChild(tab);
      if (!tabs.dataset.allToolsKeyboard) {
        tabs.dataset.allToolsKeyboard = 'true';
        tabs.addEventListener('keydown', function (event) {
          var buttons = $$('[data-trip-view]', tabs), index = buttons.indexOf(event.target.closest('[data-trip-view]'));
          var next = index;
          if (index < 0) return;
          if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
          else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = buttons.length - 1;
          else return;
          event.preventDefault(); event.stopPropagation();
          buttons[next].click(); buttons[next].focus();
        }, true);
      }
    } else {
      var expenseTab = $('#trip-tab-expense', tabs);
      if (expenseTab && tab.previousElementSibling !== expenseTab) tabs.insertBefore(tab, expenseTab.nextSibling);
    }
    var page = $('#trip-page-guide', content);
    if (!page) {
      page = document.createElement('section');
      page.id = 'trip-page-guide';
      page.setAttribute('role', 'tabpanel');
      page.setAttribute('aria-labelledby', 'trip-tab-guide');
      page.dataset.tripPage = 'guide';
      content.appendChild(page);
    }
    var index = activeDayIndex(panel);
    if (page.dataset.guideDay === String(index)) {
      page.hidden = panel.dataset.tripView !== 'guide';
      return;
    }
    page.dataset.guideDay = String(index);
    page.innerHTML = '<header class="trip-guide-heading"><small>SPOT GUIDE · DAY ' + String(index + 1).padStart(2, '0') + '</small><h2>福岡景點指南</h2><p>按今天行程標出相關景點，也可搜尋全程收錄的景點資料。</p></header><label class="trip-guide-search"><span>搜尋景點</span><input type="search" placeholder="輸入景點名稱" aria-label="搜尋景點指南"></label><div class="trip-guide-list" role="list"></div><p class="trip-guide-empty" hidden>找不到符合的景點，請換個關鍵字。</p><a class="trip-guide-back" href="#sights">查看完整景點指南章節 ↗</a>';
    var list = $('.trip-guide-list', page);
    var cards = guideCards(index);
    if (!cards.length) {
      list.innerHTML = '<p>本手冊暫無內嵌景點資料。</p>';
    } else {
      cards.forEach(function (card) { card.setAttribute('role', 'listitem'); list.appendChild(card); });
    }
    var input = $('input[type="search"]', page);
    var empty = $('.trip-guide-empty', page);
    if (input) input.addEventListener('input', function () {
      var query = normalize(input.value), visible = 0;
      $$('.trip-guide-card', page).forEach(function (card) {
        var match = !query || normalize(card.textContent).indexOf(query) >= 0;
        card.hidden = !match;
        if (match) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
    page.hidden = panel.dataset.tripView !== 'guide';
  }
  function googleSearch(name) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ' 福岡 日本'); }
  function googleRoute(places) {
    var names = places.map(function (place) { return String(place.name || '').trim(); }).filter(Boolean);
    if (!names.length) return '#';
    if (names.length === 1) return googleSearch(names[0]);
    return 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(names[0] + ' 福岡 日本') + '&destination=' + encodeURIComponent(names[names.length - 1] + ' 福岡 日本') + (names.length > 2 ? '&waypoints=' + encodeURIComponent(names.slice(1, -1).map(function (name) { return name + ' 福岡 日本'; }).join('|')) : '');
  }
  function customStops(dayIndex, day) {
    var bases = ((window.BALI_ITINERARY || [])[dayIndex] || {}).stops || [];
    return day.places.map(function (place, index) {
      var match = /^source-(\d+)-(\d+)$/.exec(String(place.id || ''));
      var base = match && Number(match[1]) === dayIndex ? bases[Number(match[2])] : null;
      var sameName = base && place.name === base.name;
      return {
        name: place.name || '待補地點',
        time: place.arrival || (base && base.time) || '時間待定',
        dwell: place.dwell || (base && (base.dwell_label || (base.dwell_minutes ? '停留約 ' + base.dwell_minutes + ' 分鐘' : ''))) || '依現場狀況安排',
        mapQuery: sameName && base.map_query ? base.map_query : place.name + ' 福岡 日本',
        placeId: sameName && base.place_id ? base.place_id : 'local-' + dayIndex + '-' + index,
        note: base ? (base.practical_note || '') : '本機新增地點；營業、預約與停留時間請另行確認。'
      };
    });
  }
  function applyDraft(panel) {
    var state = readPlan();
    var banner = $('.trip-local-plan-note', panel);
    if (!state) { if (banner) banner.remove(); return; }
    var header = $('.trip-mode-header', panel);
    if (header && !banner) {
      banner = document.createElement('p');
      banner.className = 'trip-local-plan-note';
      banner.textContent = '本機自訂行程已套用 · 原始正文保留；請重新確認交通時間與營業條件。';
      header.appendChild(banner);
    }
    var index = activeDayIndex(panel), day = state.days[index];
    if (!day) return;
    var dayButtons = $$('.trip-mode-day', panel);
    dayButtons.forEach(function (button, i) {
      var customDay = state.days[i];
      if (!customDay) return;
      var date = $('b', button), title = $('span', button);
      if (date) date.textContent = String(i + 1).padStart(2, '0') + ' · ' + (customDay.date || '日期待定');
      if (title) title.textContent = customDay.title || ('第 ' + (i + 1) + ' 天');
    });
    var intro = $('#trip-page-itinerary .trip-mode-intro', panel);
    if (intro) {
      var heading = $('h2', intro);
      var names = day.places.map(function (place) { return place.name; }).filter(Boolean);
      if (heading && heading.textContent !== (day.title || heading.textContent)) heading.textContent = day.title;
      var summary = $('.trip-intro-summary p', intro);
      var summaryText = names.length ? '本機調整順序：' + names.join(' → ') + '。已保存於目前瀏覽器；出發前請重新核對各段交通、開放與預約。' : '本機自訂行程目前沒有安排景點。';
      if (summary && summary.textContent !== summaryText) summary.textContent = summaryText;
    }
    var mapHeading = $('#trip-page-map .trip-map-page-title h2', panel);
    if (mapHeading && day.title && mapHeading.textContent !== day.title) mapHeading.textContent = day.title;
    var places = customStops(index, day);
    var list = $('#trip-page-itinerary .trip-stop-list', panel);
    if (list) {
      var signature = JSON.stringify(places);
      if (list.dataset.localDraftSignature !== signature) {
        list.dataset.localDraftSignature = signature;
        list.innerHTML = places.length ? places.map(function (place, stopIndex) {
          return '<article class="trip-stop trip-local-stop"><span class="trip-stop-no">' + String(stopIndex + 1).padStart(2, '0') + '</span><div class="trip-stop-copy"><time>' + esc(place.time) + ' · ' + esc(place.dwell) + '</time><strong>' + esc(place.name) + '</strong>' + (place.note ? '<p>' + esc(place.note) + '</p>' : '') + '</div><div class="trip-stop-actions"><a class="trip-stop-map" href="' + esc(googleSearch(place.name)) + '" target="_blank" rel="noreferrer">地圖搜尋</a></div></article>';
        }).join('') : '<p class="trip-local-empty">這一天目前沒有安排地點；可回到「調整行程」新增停留。</p>';
      }
    }
    var nav = $('#trip-page-map .trip-map-navigate', panel);
    if (nav) {
      nav.hidden = !places.length;
      var routeHref = googleRoute(places), routeLabel = '用 Google Maps 開啟自訂路線 ↗';
      if (nav.href !== routeHref) nav.href = routeHref;
      if (nav.textContent !== routeLabel) nav.textContent = routeLabel;
    }
    var frame = $('#trip-page-map .trip-map-frame', panel);
    if (frame) {
      var mapSignature = JSON.stringify(places.map(function (place) { return place.name; }));
      if (frame.dataset.localDraftSignature !== mapSignature) {
        frame.dataset.localDraftSignature = mapSignature;
        frame.innerHTML = places.length ? '<div class="trip-local-route-map"><p>離線路線順序</p><ol>' + places.map(function (place) { return '<li><span>' + esc(place.name) + '</span><a href="' + esc(googleSearch(place.name)) + '" target="_blank" rel="noreferrer" aria-label="在地圖查看 ' + esc(place.name) + '">地圖 ↗</a></li>'; }).join('') + '</ol><small>這份順序來自你的本機調整。上方連結會開啟含中途站的 Google Maps 路線；實際道路、車程與路況需連線確認。</small></div>' : '<p class="trip-local-empty">這一天目前沒有自訂路線。</p>';
      }
    }
  }
  function connectOverlay(panel) {
    if (connected.has(panel)) return;
    connected.add(panel);
    var observer = new MutationObserver(function () {
      ensureGuide(panel);
      applyDraft(panel);
    });
    var content = $('.trip-mode-content', panel);
    if (content) observer.observe(content, { childList: true, subtree: true });
    panel.addEventListener('click', function (event) {
      if (event.target.closest('[data-trip-provider]')) setTimeout(function () { applyDraft(panel); }, 0);
    }, true);
    ensureGuide(panel);
    applyDraft(panel);
  }
  function init() {
    var observer = new MutationObserver(function () {
      var modal = $('#itinerary-customizer');
      if (modal) enhanceCustomizer(modal);
      renderRouteBanner();
      var panel = $('.trip-mode-overlay');
      if (panel) connectOverlay(panel);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-open-trip-mode]')) {
        var launch = $('.trip-mode-launch');
        if (launch) launch.click();
      }
      if (event.target.closest('[data-clear-trip-draft]')) clearPlan(false);
    });
    window.addEventListener('travel-handbook:local-itinerary-change', renderRouteBanner);
    renderRouteBanner();
    var modal = $('#itinerary-customizer');
    if (modal) enhanceCustomizer(modal);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
