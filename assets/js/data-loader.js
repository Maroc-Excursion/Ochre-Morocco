/* ============================================================
   OCHRE MOROCCO — Dynamic Data Loader v2.0
   Loads content from data/*.json and renders it live.
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

  async function fetchJSON(path) {
    const r = await fetch(path + '?_t=' + Date.now());
    if (!r.ok) throw new Error('Could not load ' + path);
    return r.json();
  }

  /* ── Render single excursion card ── */
  function cardHTML(exc) {
    const features = (exc.meta || []).map(m => {
      const parts = m.split('|');
      const label = parts[1] || parts[0] || '';
      return '<li><i class="fas fa-check-circle"></i> ' + label + '</li>';
    }).join('');
    const discount = exc.badge ? '<span class="badge-discount">' + exc.badge + '</span>' : '';
    const tag      = exc.tags && exc.tags[0] ? '<span class="badge-tag">' + exc.tags[0] + '</span>' : '';
    const oldPrice = exc.oldPrice ? '<span class="price-old">&euro;' + exc.oldPrice + '</span>' : '';
    const svcType  = (exc.category || '').includes('transfer') ? 'transfer' : 'excursion';
    const imgSrc   = exc.image
      ? (exc.image.startsWith('http') ? exc.image : exc.image)
      : 'assets/images/agafay-coucher-soleil.jpg';

    return '<div class="card" data-exc-id="' + exc.id + '">' +
      '<div class="card-img">' +
        '<img src="' + imgSrc + '" alt="' + exc.title + '" loading="lazy" onerror="this.src=\'assets/images/agafay-coucher-soleil.jpg\'"/>' +
        discount + tag +
        '<div class="card-price-overlay">' +
          '<span class="price-new">&euro;' + exc.price + '</span>' + oldPrice +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + exc.title + '</div>' +
        '<ul class="card-features">' +
          (features || '<li><i class="fas fa-check-circle"></i> Included</li>') +
        '</ul>' +
      '</div>' +
      '<div class="card-footer-btn">' +
        '<button type="button" class="btn-book"' +
          ' data-service="' + exc.title + '"' +
          ' data-price="' + exc.price + '"' +
          ' data-type="' + svcType + '"' +
          ' data-id="' + exc.id + '">' +
          '<i class="fas fa-calendar-check"></i> Book &ndash; &euro;' + exc.price +
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
      var excursions = await fetchJSON('data/excursions.json');
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
      var excursions = await fetchJSON('data/excursions.json');
      var html = buildGroupedHTML(excursions);
      container.innerHTML = html ||
        '<p style="text-align:center;padding:40px;color:#666">No services available at the moment.</p>';
      if (typeof window.__initBookingBtns === 'function') window.__initBookingBtns();
    } catch (err) {
      console.error('[data-loader] index services:', err);
      // On error, keep the static content as fallback (do nothing to container)
    }
  }

  /* ── Render YouTube video section ── */
  async function renderYouTubeSection() {
    var section = document.getElementById('youtube-section');
    if (!section) return;
    try {
      var settings = await fetchJSON('data/settings.json');
      var yt = settings && settings.youtube_video;
      if (!yt || !yt.active || !yt.videoId) {
        section.style.display = 'none';
        return;
      }
      var title    = yt.title    || 'Discover Morocco';
      var subtitle = yt.subtitle || 'Watch our video and feel the magic';
      section.innerHTML =
        '<div class="yt-section-inner">' +
          '<span class="section-kicker"><i class="fab fa-youtube"></i> Video</span>' +
          '<h2 class="section-title">' + title + '</h2>' +
          (subtitle ? '<p class="section-sub">' + subtitle + '</p>' : '') +
          '<div class="divider"></div>' +
          '<div class="yt-embed-wrap">' +
            '<iframe src="https://www.youtube.com/embed/' + yt.videoId + '?rel=0&modestbranding=1"' +
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
    renderYouTubeSection();
  });

  window.OchreDataLoader = {
    renderIndexServices:    renderIndexServices,
    renderExcursionsPage:   renderExcursionsPage,
    renderYouTubeSection:   renderYouTubeSection,
    applySettings:          applySettings
  };
})();
