/* ============================================================
   OCHRE MOROCCO — Dynamic Data Loader v2.0
   Loads content from Supabase and renders it live.
   Local JSON remains a safe fallback while the database is empty/unavailable.
   ▸ Services on index.html  (#services-dynamic)
   ▸ Services on excursions.html (#excursions-dynamic)
   ▸ YouTube video section   (#youtube-section)
   ▸ Settings (contact, social) applied site-wide
   ============================================================ */

(function () {
  'use strict';

  /* ── Category mapping: JSON category → filter tab ── */
  const CAT_MAP = {
    'marrakech transfer':   'activities',
    'marrakech desert':     'desert',
    'marrakech':            'activities',
    'marrakech montagne':   'activities',
    'marrakech excursions': 'day'
  };
  const CAT_LABELS = {
    activities: { icon: 'fa-bolt',       label: 'Activities & Adventures' },
    day:        { icon: 'fa-sun',        label: 'Day Excursions' },
    desert:     { icon: 'fa-campground', label: 'Desert Tours' }
  };

  function mapCat(cat) { return CAT_MAP[cat] || 'activities'; }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function imageSrc(path) {
    var value = String(path || '').trim();
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(?:javascript|data|vbscript):/i.test(value)) return 'assets/images/webp/agafay-coucher-soleil.webp';
    if (!value) return 'assets/images/webp/agafay-coucher-soleil.webp';
    // Keep editable JPG paths in the JSON, but serve the optimized WebP copy publicly.
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

  function circuitCardHTML(circuit) {
    var includes = (circuit.includes || []).slice(0, 4).map(function (item) {
      return '<li><i class="fas fa-check-circle"></i> ' + escapeHTML(item) + '</li>';
    }).join('');
    var tags = (circuit.tags || []).slice(0, 2).map(function (tag) {
      return '<span class="badge-tag">' + escapeHTML(tag) + '</span>';
    }).join('');
    var originalImage = imageFallback(circuit.image, 'assets/images/webp/desert-nuit-etoiles.webp');
    return '<article class="card circuit-card">' +
      '<div class="card-img">' +
        '<img src="' + escapeHTML(imageSrc(circuit.image)) + '" alt="' + escapeHTML(circuit.title) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + escapeHTML(originalImage) + '\'"/>' +
        tags +
        '<div class="card-price-overlay"><span class="price-new">&euro;' + escapeHTML(circuit.price) + '</span></div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + escapeHTML(circuit.title) + '</div>' +
        '<div class="circuit-duration"><i class="fas fa-calendar-days"></i> ' + escapeHTML(circuit.duration) + '</div>' +
        '<p class="circuit-description">' + escapeHTML(circuit.description || '') + '</p>' +
        '<ul class="card-features">' + includes + '</ul>' +
      '</div>' +
      '<div class="card-footer-btn">' +
        '<button type="button" class="btn-book" data-service="' + escapeHTML(circuit.title) + '" data-price="' + escapeHTML(circuit.price) + '" data-type="circuit" data-id="' + escapeHTML(circuit.id) + '">' +
          '<i class="fas fa-calendar-check"></i> Book from &euro;' + escapeHTML(circuit.price) +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function renderCards(container, items, emptyMessage, renderer) {
    var active = (items || []).filter(function (item) { return item.active !== false; });
    container.innerHTML = active.length
      ? '<div class="services-grid">' + active.map(renderer).join('') + '</div>'
      : '<p class="empty-results">' + escapeHTML(emptyMessage) + '</p>';
  }

  async function fetchJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error('Could not load ' + path);
    return r.json();
  }

  function supabaseRecord(record) {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      description: record.description || '',
      price: record.price,
      duration: record.duration || '',
      category: record.category,
      image: record.image_url ? (window.OchreSupabase.imageUrl(record.image_url) || record.image_url) : '',
      image_url: record.image_url || '',
      active: record.is_active !== false,
      is_active: record.is_active !== false,
      tags: [],
      meta: record.duration ? ['fas fa-clock|' + record.duration] : [],
      includes: []
    };
  }

  async function fetchSupabaseExcursions(category) {
    var client = window.OchreSupabase && window.OchreSupabase.client;
    if (!client) throw new Error('Supabase is not available');
    var query = client.from('excursions').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    var result = await query;
    if (result.error) throw result.error;
    return (result.data || []).map(supabaseRecord);
  }

  /* ── Render single excursion card ── */
  function cardHTML(exc) {
    const features = (exc.meta || []).map(m => {
      const parts = m.split('|');
      const label = escapeHTML(parts[1] || parts[0] || '');
      return '<li><i class="fas fa-check-circle"></i> ' + label + '</li>';
    }).join('');
    const discount = exc.badge ? '<span class="badge-discount">' + escapeHTML(exc.badge) + '</span>' : '';
    const tag      = exc.tags && exc.tags[0] ? '<span class="badge-tag">' + escapeHTML(exc.tags[0]) + '</span>' : '';
    const oldPrice = exc.oldPrice ? '<span class="price-old">&euro;' + escapeHTML(exc.oldPrice) + '</span>' : '';
    const svcType  = /transfer|transfert/i.test(exc.category || '') ? 'transfer' : 'excursion';
    const imgSrc   = imageSrc(exc.image);
    const originalImage = imageFallback(exc.image, 'assets/images/webp/agafay-coucher-soleil.webp');

    return '<div class="card" data-exc-id="' + escapeHTML(exc.id) + '">' +
      '<div class="card-img">' +
        '<img src="' + escapeHTML(imgSrc) + '" alt="' + escapeHTML(exc.title) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + escapeHTML(originalImage) + '\'"/>' +
        discount + tag +
        '<div class="card-price-overlay">' +
          '<span class="price-new">&euro;' + escapeHTML(exc.price) + '</span>' + oldPrice +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + escapeHTML(exc.title) + '</div>' +
        '<ul class="card-features">' +
          (features || '<li><i class="fas fa-check-circle"></i> Included</li>') +
        '</ul>' +
      '</div>' +
      '<div class="card-footer-btn">' +
        '<button type="button" class="btn-book"' +
          ' data-service="' + escapeHTML(exc.title) + '"' +
          ' data-price="' + escapeHTML(exc.price) + '"' +
          ' data-type="' + svcType + '"' +
          ' data-id="' + escapeHTML(exc.id) + '">' +
          '<i class="fas fa-calendar-check"></i> Book &ndash; &euro;' + escapeHTML(exc.price) +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* ── Build grouped HTML (categories + grids) ── */
  function buildGroupedHTML(excursions) {
    var active = excursions
      .filter(function(e) { return e.active !== false; })
      .sort(function(a, b) { return (a.order || 99) - (b.order || 99); });

    var groups = { activities: [], day: [], desert: [] };
    active.forEach(function(e) {
      var cat = mapCat(e.category || '');
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

  /* ── Render excursions on excursions.html (#excursions-dynamic) ── */
  async function renderExcursionsPage() {
    var container = document.getElementById('excursions-dynamic');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted,#666)">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:12px"></i>Loading services&hellip;</div>';
    try {
      var excursions;
      try {
        excursions = await fetchSupabaseExcursions('excursion');
      } catch (remoteError) {
        console.warn('[data-loader] Supabase unavailable, using local excursions:', remoteError.message);
        excursions = await fetchJSON('data/excursions.json');
      }
      var html = buildGroupedHTML(excursions);
      container.innerHTML = html ||
        '<p style="text-align:center;padding:40px;color:#666">No services available at the moment.</p>';

      reattachFilterTabs();
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      console.error('[data-loader]', err);
      container.innerHTML = '<p style="text-align:center;padding:60px 20px;color:#999">' +
        '<i class="fas fa-exclamation-triangle"></i>&nbsp; Unable to load services. ' +
        '<a href="javascript:location.reload()" style="color:var(--gold,#c8922b)">Retry</a></p>';
    }
  }

  /* ── Render services on index.html (#services-dynamic) ── */
  async function renderIndexServices() {
    var container = document.getElementById('services-dynamic');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted,#666)">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem;display:block;margin-bottom:10px"></i>Loading&hellip;</div>';
    try {
      var excursions;
      try {
        excursions = await fetchSupabaseExcursions();
      } catch (remoteError) {
        console.warn('[data-loader] Supabase unavailable, using local excursions:', remoteError.message);
        excursions = await fetchJSON('data/excursions.json');
      }
      var html = buildGroupedHTML(excursions);
      container.innerHTML = html ||
        '<p style="text-align:center;padding:40px;color:#666">No services available at the moment.</p>';
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      console.error('[data-loader] index services:', err);
      // On error, keep the static content as fallback (do nothing to container)
    }
  }

  async function renderCircuitsPage() {
    var container = document.getElementById('circuits-dynamic');
    if (!container) return;
    container.innerHTML = '<div class="dynamic-loading"><i class="fas fa-spinner fa-spin"></i> Loading circuits&hellip;</div>';
    try {
      var circuits;
      try {
        circuits = await fetchSupabaseExcursions('circuit');
      } catch (remoteError) {
        console.warn('[data-loader] Supabase unavailable, using local circuits:', remoteError.message);
        circuits = await fetchJSON('data/circuits.json');
      }
      renderCards(container, circuits, 'No circuits are available at the moment.', circuitCardHTML);
    } catch (err) {
      console.error('[data-loader] circuits:', err);
      container.innerHTML = '<p class="empty-results">Unable to load circuits. Please try again.</p>';
    }
  }

  async function renderAgafayPage() {
    var container = document.getElementById('agafay-dynamic');
    if (!container) return;
    container.innerHTML = '<div class="dynamic-loading"><i class="fas fa-spinner fa-spin"></i> Loading Agafay experiences&hellip;</div>';
    try {
      var agafayItems;
      try {
        agafayItems = await fetchSupabaseExcursions('excursion');
        agafayItems = agafayItems.filter(function (item) {
          return /agafay|quad|camel|dinner/i.test(item.title + ' ' + item.description);
        });
      } catch (remoteError) {
        console.warn('[data-loader] Supabase unavailable, using local Agafay data:', remoteError.message);
        var excursions = await fetchJSON('data/excursions.json');
        agafayItems = excursions.filter(function (item) {
          return item.active !== false && item.category === 'marrakech desert';
        });
      }
      renderCards(container, agafayItems, 'No Agafay experiences are available at the moment.', cardHTML);
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      console.error('[data-loader] agafay:', err);
      container.innerHTML = '<p class="empty-results">Unable to load Agafay experiences. Please try again.</p>';
    }
  }

  async function renderTransfersPage() {
    var container = document.getElementById('transfers-dynamic');
    if (!container) return;
    container.innerHTML = '<div class="dynamic-loading"><i class="fas fa-spinner fa-spin"></i> Loading transfers&hellip;</div>';
    try {
      var transfers = await fetchSupabaseExcursions('transfert');
      if (!transfers.length) throw new Error('No remote transfers');
      container.innerHTML = '<div class="services-grid">' + transfers.map(cardHTML).join('') + '</div>';
      var fallback = document.getElementById('transfers-static');
      if (fallback) fallback.style.display = 'none';
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (remoteError) {
      console.warn('[data-loader] Supabase unavailable, keeping local transfer content:', remoteError.message);
      container.innerHTML = '';
    }
  }

  /* ── Render YouTube video section ── */
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
      var subtitle = escapeHTML(yt.subtitle || 'Watch our video and feel the magic');
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

  /* ── Re-attach filter tab buttons ── */
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

  /* ── Apply settings (contact info, social links) to every page ── */
  async function applySettings() {
    try {
      var s = await fetchJSON('data/settings.json');
      if (!s) return;
       window.dispatchEvent(new CustomEvent('ochre:settings', { detail: s }));
      /* WhatsApp */
      if (s.contact && s.contact.whatsapp) {
        var wa = s.contact.whatsapp;
        document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a) {
          a.href = a.href.replace(/wa\.me\/[\d]+/, 'wa.me/' + wa);
        });
        if (typeof CFG !== 'undefined' && CFG.whatsapp !== undefined) CFG.whatsapp = wa;
      }
      /* Email */
      if (s.contact && s.contact.email) {
        var em = s.contact.email;
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
          a.href = 'mailto:' + em;
          if (a.textContent.indexOf('@') > -1) a.textContent = em;
        });
      }
      /* Social */
      if (s.social) {
        var map = { facebook:'facebook.com', instagram:'instagram.com', tiktok:'tiktok.com', youtube:'youtube.com' };
        Object.keys(map).forEach(function(k) {
          if (s.social[k]) {
            document.querySelectorAll('a[href*="' + map[k] + '"]').forEach(function(a) {
              // Don't update YouTube channel links (keep the general channel link)
              if (k !== 'youtube' || !a.href.includes('embed')) {
                a.href = s.social[k];
              }
            });
          }
        });
      }
    } catch (e) { /* silent */ }
  }

  /* ── Auto-run on DOMContentLoaded ── */
  document.addEventListener('DOMContentLoaded', function () {
    applySettings();
    renderIndexServices();
    renderExcursionsPage();
    renderCircuitsPage();
    renderAgafayPage();
    renderTransfersPage();
    renderYouTubeSection();
  });

  window.OchreDataLoader = {
    renderIndexServices:    renderIndexServices,
    renderExcursionsPage:   renderExcursionsPage,
    renderCircuitsPage:     renderCircuitsPage,
    renderAgafayPage:       renderAgafayPage,
    renderTransfersPage:    renderTransfersPage,
    renderYouTubeSection:   renderYouTubeSection,
    applySettings:          applySettings
  };
})();
