/* ============================================================
   OCHRE MOROCCO — Dynamic Data Loader v3.0
   المصدر الأول: Supabase | المصدر الاحتياطي: data/*.json
   ============================================================ */

(function () {
  'use strict';

  /* ── Category mapping (JSON legacy) ── */
  var CAT_MAP = {
    'marrakech transfer':   'activities',
    'marrakech desert':     'desert',
    'marrakech':            'activities',
    'marrakech montagne':   'activities',
    'marrakech excursions': 'day'
  };
  var CAT_LABELS = {
    activities: { icon: 'fa-bolt',       label: 'Activities & Adventures' },
    day:        { icon: 'fa-sun',        label: 'Day Excursions' },
    desert:     { icon: 'fa-campground', label: 'Desert Tours' }
  };

  function mapCat(cat) { return CAT_MAP[cat] || 'activities'; }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[char];
    });
  }

  function imageSrc(path) {
    var value = String(path || '').trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(?:javascript|data|vbscript):/i.test(value)) return 'assets/images/webp/agafay-coucher-soleil.webp';
    if (!value) return 'assets/images/webp/agafay-coucher-soleil.webp';
    if (value.indexOf('assets/images/') === 0 && /\.(?:jpe?g|png)$/i.test(value)) {
      var filename = value.split('/').pop().replace(/\.(?:jpe?g|png)$/i, '');
      return 'assets/images/webp/' + filename + '.webp';
    }
    return value;
  }

  function imageFallback(path, fallback) {
    var value = String(path || '').trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(?:javascript|data|vbscript):/i.test(value) || !value) return fallback;
    return value;
  }

  function validYoutubeId(value) {
    return /^[a-zA-Z0-9_-]{11}$/.test(String(value || ''));
  }

  var DEFAULT_IMG = 'assets/images/webp/agafay-coucher-soleil.webp';

  /* ══════════════════════════════════════════════════════════
     SUPABASE HELPERS
  ══════════════════════════════════════════════════════════ */

  function hasSupabase() {
    return typeof window.supabaseClient !== 'undefined';
  }

  /* Convertit un objet Supabase → format JSON interne */
  function supabaseToJSON(exc) {
    return {
      id:       exc.id,
      title:    exc.title,
      slug:     exc.slug || '',
      price:    exc.price || 0,
      duration: exc.duration || '',
      category: exc.category,
      image:    exc.image_url || '',
      description: exc.description || '',
      active:   exc.is_active,
      meta:     exc.duration ? ['clock|' + exc.duration] : [],
      tags:     exc.category ? [exc.category] : []
    };
  }

  async function fetchFromSupabase(filter) {
    var query = window.supabaseClient
      .from('excursions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filter && filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter && filter.categories) {
      query = query.in('category', filter.categories);
    }
    if (filter && filter.search) {
      query = query.ilike('title', '%' + filter.search + '%');
    }

    var { data, error } = await query;
    if (error) throw error;
    return (data || []).map(supabaseToJSON);
  }

  /* ══════════════════════════════════════════════════════════
     CARD HTML GENERATORS
  ══════════════════════════════════════════════════════════ */

  function cardHTML(exc) {
    var features = (exc.meta || []).map(function(m) {
      var parts = m.split('|');
      var label = escapeHTML(parts[1] || parts[0] || '');
      return '<li><i class="fas fa-check-circle"></i> ' + label + '</li>';
    }).join('');
    if (!features && exc.duration) {
      features = '<li><i class="fas fa-clock"></i> ' + escapeHTML(exc.duration) + '</li>';
    }
    var discount  = exc.badge ? '<span class="badge-discount">' + escapeHTML(exc.badge) + '</span>' : '';
    var tag       = exc.tags && exc.tags[0] ? '<span class="badge-tag">' + escapeHTML(exc.tags[0]) + '</span>' : '';
    var oldPrice  = exc.oldPrice ? '<span class="price-old">&euro;' + escapeHTML(String(exc.oldPrice)) + '</span>' : '';
    var svcType   = (exc.category || '').includes('transfer') || exc.category === 'transfert' ? 'transfer' : 'excursion';
    var imgRaw    = exc.image || exc.image_url || '';
    var imgSrc2   = imageSrc(imgRaw) || DEFAULT_IMG;
    var imgFall   = imageFallback(imgRaw, DEFAULT_IMG);

    return '<div class="card" data-exc-id="' + escapeHTML(String(exc.id)) + '">' +
      '<div class="card-img">' +
        '<img src="' + escapeHTML(imgSrc2) + '" alt="' + escapeHTML(exc.title) + '" loading="lazy" decoding="async"' +
          ' onerror="this.onerror=null;this.src=\'' + escapeHTML(imgFall) + '\'"/>' +
        discount + tag +
        '<div class="card-price-overlay">' +
          '<span class="price-new">&euro;' + escapeHTML(String(exc.price || 0)) + '</span>' + oldPrice +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + escapeHTML(exc.title) + '</div>' +
        (exc.description ? '<p style="font-size:.78rem;color:var(--muted);margin:6px 0;line-height:1.5">' + escapeHTML(exc.description.substring(0,100)) + (exc.description.length > 100 ? '…' : '') + '</p>' : '') +
        '<ul class="card-features">' + (features || '<li><i class="fas fa-check-circle"></i> Included</li>') + '</ul>' +
      '</div>' +
      '<div class="card-footer-btn">' +
        '<button type="button" class="btn-book"' +
          ' data-service="' + escapeHTML(exc.title) + '"' +
          ' data-price="' + escapeHTML(String(exc.price || 0)) + '"' +
          ' data-type="' + svcType + '"' +
          ' data-id="' + escapeHTML(String(exc.id)) + '">' +
          '<i class="fas fa-calendar-check"></i> Book &ndash; &euro;' + escapeHTML(String(exc.price || 0)) +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function circuitCardHTML(circuit) {
    var includes = (circuit.includes || (circuit.meta || [])).slice(0, 4).map(function (item) {
      var label = typeof item === 'string' ? item.split('|').pop() : item;
      return '<li><i class="fas fa-check-circle"></i> ' + escapeHTML(label) + '</li>';
    }).join('');
    var imgRaw = circuit.image || circuit.image_url || '';
    var imgSrc2 = imageSrc(imgRaw) || DEFAULT_IMG;
    var imgFall = imageFallback(imgRaw, 'assets/images/webp/desert-nuit-etoiles.webp');
    return '<article class="card circuit-card">' +
      '<div class="card-img">' +
        '<img src="' + escapeHTML(imgSrc2) + '" alt="' + escapeHTML(circuit.title) + '" loading="lazy" decoding="async"' +
          ' onerror="this.onerror=null;this.src=\'' + escapeHTML(imgFall) + '\'"/>' +
        '<div class="card-price-overlay"><span class="price-new">&euro;' + escapeHTML(String(circuit.price || 0)) + '</span></div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + escapeHTML(circuit.title) + '</div>' +
        (circuit.duration ? '<div class="circuit-duration"><i class="fas fa-calendar-days"></i> ' + escapeHTML(circuit.duration) + '</div>' : '') +
        (circuit.description ? '<p class="circuit-description">' + escapeHTML(circuit.description) + '</p>' : '') +
        (includes ? '<ul class="card-features">' + includes + '</ul>' : '') +
      '</div>' +
      '<div class="card-footer-btn">' +
        '<button type="button" class="btn-book" data-service="' + escapeHTML(circuit.title) + '"' +
          ' data-price="' + escapeHTML(String(circuit.price || 0)) + '" data-type="circuit"' +
          ' data-id="' + escapeHTML(String(circuit.id)) + '">' +
          '<i class="fas fa-calendar-check"></i> Book from &euro;' + escapeHTML(String(circuit.price || 0)) +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function renderCards(container, items, emptyMessage, renderer) {
    var active = (items || []).filter(function (item) { return item.active !== false && item.is_active !== false; });
    container.innerHTML = active.length
      ? '<div class="services-grid">' + active.map(renderer).join('') + '</div>'
      : '<p class="empty-results" style="text-align:center;padding:40px;color:var(--muted)">' + escapeHTML(emptyMessage) + '</p>';
  }

  async function fetchJSON(path) {
    var r = await fetch(path);
    if (!r.ok) throw new Error('Could not load ' + path);
    return r.json();
  }

  /* ── Build grouped HTML (categories + grids) ── */
  function buildGroupedHTML(excursions) {
    var active = excursions
      .filter(function(e) { return e.active !== false && e.is_active !== false; })
      .sort(function(a, b) { return (a.order || 99) - (b.order || 99); });

    var groups = { activities: [], day: [], desert: [] };
    active.forEach(function(e) {
      var cat = e.category === 'excursion' || e.category === 'transfert'
        ? 'activities'
        : e.category === 'circuit'
          ? 'day'
          : mapCat(e.category || '');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });

    var html = '';
    ['activities', 'day', 'desert'].forEach(function(cat) {
      var items = groups[cat];
      if (!items || !items.length) return;
      var cl = CAT_LABELS[cat] || { icon: 'fa-star', label: cat };
      html += '<div class="cat-label cat-section" data-cat="' + cat + '">' +
        '<i class="fas ' + cl.icon + '"></i> ' + cl.label + '</div>' +
        '<div class="services-grid cat-section" data-cat="' + cat + '">' +
        items.map(cardHTML).join('') + '</div>';
    });
    return html;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE RENDERERS
  ══════════════════════════════════════════════════════════ */

  async function renderExcursionsPage() {
    var container = document.getElementById('excursions-dynamic');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#666)">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:12px"></i>Loading services&hellip;</div>';
    try {
      var excursions;
      if (hasSupabase()) {
        excursions = await fetchFromSupabase({});
      } else {
        excursions = await fetchJSON('data/excursions.json');
      }
      var html = buildGroupedHTML(excursions);
      container.innerHTML = html ||
        '<p style="text-align:center;padding:40px;color:#666">No services available at the moment.</p>';
      reattachFilterTabs();
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      // Supabase failed — try JSON fallback
      if (hasSupabase()) {
        try {
          var excursions2 = await fetchJSON('data/excursions.json');
          var html2 = buildGroupedHTML(excursions2);
          container.innerHTML = html2 || '<p style="text-align:center;padding:40px;color:#666">No services available.</p>';
          reattachFilterTabs();
          if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
          return;
        } catch (_) {}
      }
      container.innerHTML = '<p style="text-align:center;padding:60px 20px;color:#999">' +
        '<i class="fas fa-exclamation-triangle"></i>&nbsp; Unable to load services. ' +
        '<a href="javascript:location.reload()" style="color:var(--gold,#c8922b)">Retry</a></p>';
    }
  }

  async function renderIndexServices() {
    var container = document.getElementById('services-dynamic');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted,#666)">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem;display:block;margin-bottom:10px"></i>Loading&hellip;</div>';
    try {
      var excursions;
      if (hasSupabase()) {
        excursions = await fetchFromSupabase({});
      } else {
        excursions = await fetchJSON('data/excursions.json');
      }
      var html = buildGroupedHTML(excursions);
      container.innerHTML = html ||
        '<p style="text-align:center;padding:40px;color:#666">No services available.</p>';
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      try {
        var exc2 = await fetchJSON('data/excursions.json');
        container.innerHTML = buildGroupedHTML(exc2) || '';
        if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
      } catch (_) {}
    }
  }

  async function renderCircuitsPage() {
    var container = document.getElementById('circuits-dynamic');
    if (!container) return;
    container.innerHTML = '<div class="dynamic-loading"><i class="fas fa-spinner fa-spin"></i> Loading circuits&hellip;</div>';
    try {
      var circuits;
      if (hasSupabase()) {
        circuits = await fetchFromSupabase({ category: 'circuit' });
      } else {
        circuits = await fetchJSON('data/circuits.json');
      }
      renderCards(container, circuits, 'No circuits are available at the moment.', circuitCardHTML);
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      try {
        var circ2 = await fetchJSON('data/circuits.json');
        renderCards(container, circ2, 'No circuits available.', circuitCardHTML);
      } catch (_) {
        container.innerHTML = '<p class="empty-results" style="text-align:center;padding:40px;color:var(--muted)">Unable to load circuits. Please try again.</p>';
      }
    }
  }

  async function renderAgafayPage() {
    var container = document.getElementById('agafay-dynamic');
    if (!container) return;
    container.innerHTML = '<div class="dynamic-loading"><i class="fas fa-spinner fa-spin"></i> Loading Agafay experiences&hellip;</div>';
    try {
      var items;
      if (hasSupabase()) {
        // Try excursion category first (Agafay entries should be category=excursion)
        var all = await fetchFromSupabase({ category: 'excursion' });
        // Filter by agafay keyword if possible, otherwise show all excursions
        var agafayItems = all.filter(function(e) {
          return (e.title||'').toLowerCase().includes('agafay') ||
                 (e.description||'').toLowerCase().includes('agafay') ||
                 (e.category||'').toLowerCase().includes('agafay');
        });
        items = agafayItems.length ? agafayItems : all;
      } else {
        var excursions = await fetchJSON('data/excursions.json');
        items = excursions.filter(function (item) {
          return item.active !== false && item.category === 'marrakech desert';
        });
      }
      renderCards(container, items, 'No Agafay experiences are available at the moment.', cardHTML);
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      try {
        var exc2 = await fetchJSON('data/excursions.json');
        var agafay2 = exc2.filter(function(e) { return e.active !== false && e.category === 'marrakech desert'; });
        renderCards(container, agafay2, 'No Agafay experiences available.', cardHTML);
      } catch (_) {
        container.innerHTML = '<p class="empty-results" style="text-align:center;padding:40px;color:var(--muted)">Unable to load Agafay experiences. Please try again.</p>';
      }
    }
  }

  async function renderTransfersSection() {
    var container = document.getElementById('transfers-dynamic');
    if (!container) return;
    try {
      var items;
      if (hasSupabase()) {
        items = await fetchFromSupabase({ category: 'transfert' });
      } else {
        var data = await fetchJSON('data/transfers.json');
        items = data;
      }
      if (!items || !items.length) {
        container.style.display = 'none';
        return;
      }
      container.innerHTML = '<div class="services-grid">' + items.map(cardHTML).join('') + '</div>';
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      container.style.display = 'none';
    }
  }

  async function renderYouTubeSection() {
    var section = document.getElementById('youtube-section');
    if (!section) return;
    try {
      var settings = await fetchJSON('data/settings.json');
      var yt = settings && settings.youtube_video;
      if (!yt || !yt.active || !validYoutubeId(yt.videoId)) {
        section.style.display = 'none';
        return;
      }
      var title    = escapeHTML(yt.title || 'Discover Morocco');
      var subtitle = escapeHTML(yt.subtitle || '');
      section.innerHTML =
        '<div class="yt-section-inner">' +
          '<span class="section-kicker"><i class="fab fa-youtube"></i> Video</span>' +
          '<h2 class="section-title">' + title + '</h2>' +
          (subtitle ? '<p class="section-sub">' + subtitle + '</p>' : '') +
          '<div class="divider"></div>' +
          '<div class="yt-embed-wrap">' +
            '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(yt.videoId) + '?rel=0&modestbranding=1"' +
              ' title="' + title + '" frameborder="0" allowfullscreen loading="lazy"' +
              ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">' +
            '</iframe>' +
          '</div>' +
        '</div>';
      section.style.display = 'block';
    } catch (e) {
      section.style.display = 'none';
    }
  }

  function reattachFilterTabs() {
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.dataset.cat;
        document.querySelectorAll('.cat-section').forEach(function(el) {
          el.style.display = (cat === 'all' || el.dataset.cat === cat) ? '' : 'none';
        });
      });
    });
  }

  async function applySettings() {
    try {
      var s = await fetchJSON('data/settings.json');
      if (!s) return;
      window.dispatchEvent(new CustomEvent('ochre:settings', { detail: s }));
      if (s.contact && s.contact.whatsapp) {
        var wa = s.contact.whatsapp;
        document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a) {
          a.href = a.href.replace(/wa\.me\/[\d]+/, 'wa.me/' + wa);
        });
      }
      if (s.contact && s.contact.email) {
        var em = s.contact.email;
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
          a.href = 'mailto:' + em;
          if (a.textContent.indexOf('@') > -1) a.textContent = em;
        });
      }
      if (s.social) {
        var map = { facebook:'facebook.com', instagram:'instagram.com', tiktok:'tiktok.com', youtube:'youtube.com' };
        Object.keys(map).forEach(function(k) {
          if (s.social[k]) {
            document.querySelectorAll('a[href*="' + map[k] + '"]').forEach(function(a) {
              if (k !== 'youtube' || !a.href.includes('embed')) a.href = s.social[k];
            });
          }
        });
      }
    } catch (e) { /* silent */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applySettings();
    renderIndexServices();
    renderExcursionsPage();
    renderCircuitsPage();
    renderAgafayPage();
    renderTransfersSection();
    renderYouTubeSection();
  });

  window.OchreDataLoader = {
    renderIndexServices:    renderIndexServices,
    renderExcursionsPage:   renderExcursionsPage,
    renderCircuitsPage:     renderCircuitsPage,
    renderAgafayPage:       renderAgafayPage,
    renderTransfersSection: renderTransfersSection,
    renderYouTubeSection:   renderYouTubeSection,
    applySettings:          applySettings
  };
})();
