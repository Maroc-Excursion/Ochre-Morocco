/* ============================================================
   MAROC EXCURSION — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ================================================================
     1. HERO SLIDER
  ================================================================ */
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  let current  = 0, timer;

  function goTo(n) {
    slides[current].classList.remove('active');
    dots[current] && dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    // Reset Ken Burns by forcing reflow on the incoming slide image
    const nextImg = slides[current].querySelector('img');
    if (nextImg) {
      if (!nextImg.getAttribute('src') && nextImg.dataset.src) nextImg.src = nextImg.dataset.src;
      nextImg.style.animation = 'none';
      void nextImg.offsetWidth; // reflow
      nextImg.style.animation = '';
    }
    slides[current].classList.add('active');
    dots[current] && dots[current].classList.add('active');
  }

  function startAuto() { timer = setInterval(() => goTo(current + 1), 7000); }
  function stopAuto()  { clearInterval(timer); }

  if (slides.length) {
    startAuto();
    document.querySelector('.hero-arrow.next')
      ?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    document.querySelector('.hero-arrow.prev')
      ?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));
  }

  /* ================================================================
     2. STICKY HEADER
  ================================================================ */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header && header.classList.toggle('scrolled', window.scrollY > 60);
    updateBackToTop();
  }, { passive: true });

  /* ================================================================
     3. CARDS SLIDER
  ================================================================ */
  function initCardsSlider(trackId, prevId, nextId) {
    const track    = document.querySelector(trackId);
    const prevBtn  = document.querySelector(prevId);
    const nextBtn  = document.querySelector(nextId);
    if (!track) return;

    let idx = 0;
    function getVisible() { return window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : 3; }
    function getTotal()   { return track.children.length; }
    function clamp(v)     { return Math.max(0, Math.min(v, getTotal() - getVisible())); }

    function update() {
      const gap  = 24;
      const card = track.children[0];
      if (!card) return;
      const w = card.offsetWidth + gap;
      track.style.transform = `translateX(-${idx * w}px)`;
    }

    prevBtn?.addEventListener('click', () => { idx = clamp(idx - 1); update(); });
    nextBtn?.addEventListener('click', () => { idx = clamp(idx + 1); update(); });
    window.addEventListener('resize', () => { idx = clamp(idx); update(); }, { passive: true });
  }

  initCardsSlider('#excursionsTrack', '#excPrev', '#excNext');
  initCardsSlider('#transfersTrack',  '#trfPrev', '#trfNext');

  /* ================================================================
     4. SEARCH TABS
  ================================================================ */
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  /* Mobile search panel */
  const searchToggle = document.querySelector('.search-mobile-toggle');
  const searchBox = document.querySelector('#hero-search-box');
  searchToggle?.addEventListener('click', () => {
    const isOpen = searchBox?.classList.toggle('mobile-open') || false;
    searchToggle.setAttribute('aria-expanded', String(isOpen));
    searchToggle.classList.toggle('is-hidden', isOpen);
  });

  /* ================================================================
     5. MOBILE NAV
  ================================================================ */
  const hamburger   = document.querySelector('.hamburger');
  const mobileNav   = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-nav-close');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav?.classList.toggle('open');
    document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
  });
  mobileClose?.addEventListener('click', () => {
    hamburger?.classList.remove('active');
    mobileNav?.classList.remove('open');
    document.body.style.overflow = '';
  });

  /* ================================================================
     6. BACK TO TOP
  ================================================================ */
  const btt = document.querySelector('.back-to-top');
  function updateBackToTop() {
    btt && btt.classList.toggle('visible', window.scrollY > 500);
  }
  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ================================================================
     7. SCROLL REVEAL (AOS-like)
  ================================================================ */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('aos-animate'), (e.target.dataset.delay || 0) * 1);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

  /* ================================================================
     8. COUNT UP STATS
  ================================================================ */
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const dur    = 2000;
    const step   = 16;
    const inc    = target / (dur / step);
    let cur      = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, target);
      el.textContent = Math.floor(cur).toLocaleString() + suffix;
      if (cur >= target) clearInterval(t);
    }, step);
  }
  const statsObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => countUp(el));
        statsObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelector('.stats-grid') && statsObs.observe(document.querySelector('.stats-grid'));

  /* ================================================================
     9. WISHLIST HEART TOGGLE
  ================================================================ */
  document.querySelectorAll('.card-wishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const icon = btn.querySelector('i');
      if (icon.classList.contains('far')) {
        icon.classList.replace('far', 'fas');
        btn.style.color = '#E53935';
        btn.style.borderColor = '#E53935';
      } else {
        icon.classList.replace('fas', 'far');
        btn.style.color = '';
        btn.style.borderColor = '';
      }
    });
  });

  /* ================================================================
     10. CURRENCY SWITCHER
  ================================================================ */
  const rates = { EUR: 1, USD: 1.09, GBP: 0.86, MAD: 10.85 };
  const symbols = { EUR: '€', USD: '$', GBP: '£', MAD: 'MAD ' };
  let currentCurrency = localStorage.getItem('me_currency') || 'EUR';

  function convertPrices(currency) {
    currentCurrency = currency;
    localStorage.setItem('me_currency', currency);
    const rate   = rates[currency];
    const symbol = symbols[currency];

    // Convert .amount elements
    document.querySelectorAll('[data-eur]').forEach(el => {
      const base = parseFloat(el.dataset.eur);
      const converted = Math.round(base * rate);
      el.textContent = symbol + converted;
    });
    // Convert .old price elements
    document.querySelectorAll('[data-eur-old]').forEach(el => {
      const base = parseFloat(el.dataset.eurOld);
      const converted = Math.round(base * rate);
      el.textContent = symbol + converted;
    });
    // Convert circuit prices
    document.querySelectorAll('[data-eur-circuit]').forEach(el => {
      const base = parseFloat(el.dataset.eurCircuit);
      const converted = Math.round(base * rate);
      // Show sup symbol if EUR, else just prefix
      el.innerHTML = currency === 'EUR'
        ? `<sup>${symbol}</sup>${converted}`
        : `<sup style="font-size:.6rem">${symbol}</sup>${converted}`;
    });
    // Update currency switcher display
    document.querySelectorAll('.currency-select').forEach(sel => {
      sel.value = currency;
    });
  }

  // Init currency on page load
  document.addEventListener('DOMContentLoaded', () => {
    convertPrices(currentCurrency);
  });

  // Bind currency selectors
  document.querySelectorAll('.currency-select').forEach(sel => {
    sel.value = currentCurrency;
    sel.addEventListener('change', e => convertPrices(e.target.value));
  });

  // Run immediately too (in case DOM already loaded)
  if (document.readyState !== 'loading') {
    convertPrices(currentCurrency);
  }

  /* ================================================================
     11. LANGUAGE SWITCHER
  ================================================================ */
  const translations = {
    en: {
      nav_home:       'Home',
      nav_exc:        'Excursions',
      nav_circ:       'Tours',
      nav_trans:      'Transfers',
      nav_desert:     'Agafay Desert',
      nav_about:      'About Us',
      nav_contact:    'Contact',
      nav_blog:       'Blog',
      hero_badge:     '#1 Excursion Agency in Morocco',
      hero_title:     'Discover the Magic<br>of <span>Morocco</span>',
      hero_sub:       'Premium excursions, unforgettable tours and authentic adventures in the heart of the Cherifian Kingdom',
      hero_btn1:      'Explore our Excursions',
      hero_btn2:      'Contact Us',
      wa_btn:         'WhatsApp',
      search_tab1:    'Excursions',
      search_tab2:    'Tours',
      search_tab3:    'Transfers',
      free_cancel:    'Free cancellation',
    },
    es: {
      nav_home:       'Inicio',
      nav_exc:        'Excursiones',
      nav_circ:       'Circuitos',
      nav_trans:      'Traslados',
      nav_desert:     'Desierto Agafay',
      nav_about:      'Quiénes somos',
      nav_contact:    'Contacto',
      nav_blog:       'Blog',
      hero_badge:     '#1 Agencia de Excursiones en Marruecos',
      hero_title:     'Descubre la Magia<br>de <span>Marruecos</span>',
      hero_sub:       'Excursiones premium, circuitos inolvidables y aventuras auténticas en el corazón del Reino Alauita',
      hero_btn1:      'Ver Excursiones',
      hero_btn2:      'Contáctanos',
      wa_btn:         'WhatsApp',
      search_tab1:    'Excursiones',
      search_tab2:    'Circuitos',
      search_tab3:    'Traslados',
      free_cancel:    'Cancelación gratuita',
    }
  };

  let currentLang = localStorage.getItem('me_lang') || 'en';

  function applyLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('me_lang', lang);
    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = t[key];
        } else if (el.innerHTML !== undefined && t[key].includes('<')) {
          el.innerHTML = t[key];
        } else {
          el.textContent = t[key];
        }
      }
    });

    // Update lang switcher buttons
    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update html lang attribute + direction
    document.documentElement.lang = lang;
    document.documentElement.dir  = 'ltr';

    // Update visible label in the switcher button
    const labelMap = { en: 'EN', es: 'ES', fr: 'FR' };
    const lbl = document.getElementById('activeLangLabel');
    if (lbl) lbl.textContent = labelMap[lang] || lang.toUpperCase();

    // Re-apply free cancel labels
    document.querySelectorAll('.badge-free-cancel').forEach(el => {
      el.textContent = t.free_cancel || 'Annulation gratuite';
    });
  }

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang);
      document.querySelector('.lang-dropdown')?.classList.remove('open');
    });
  });

  document.querySelector('.lang-switcher-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.lang-dropdown')?.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    document.querySelector('.lang-dropdown')?.classList.remove('open');
  });

  if (document.readyState !== 'loading') {
    applyLanguage(currentLang);
  } else {
    document.addEventListener('DOMContentLoaded', () => applyLanguage(currentLang));
  }

  /* ================================================================
     12. URGENCY NOTIFICATIONS (Social Proof)
  ================================================================ */
  function showUrgencyNotif() {
    const notif = document.querySelector('.urgency-notif');
    if (!notif) return;

    const tours = [
      'Essaouira Day Trip',
      'Sahara Desert 3 Days',
      'Agafay Sunset Dinner',
      'Atlas Mountains Tour',
      'Imperial Cities Circuit',
      'Camel Ride Palmeraie',
    ];
    const cities = ['Paris', 'London', 'Madrid', 'Berlin', 'Amsterdam', 'Rome', 'Zurich', 'Brussels'];
    const names  = ['Sophie', 'James', 'Maria', 'Pierre', 'Emma', 'Carlos', 'Anna', 'Lucas'];

    function showRandom() {
      const tour = tours[Math.floor(Math.random() * tours.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const mins = Math.floor(Math.random() * 8) + 1;

      notif.querySelector('.notif-text').innerHTML =
        `<strong>${name}</strong> from ${city} just booked <em>${tour}</em> – ${mins} min ago`;
      notif.classList.add('show');
      setTimeout(() => notif.classList.remove('show'), 4500);
    }

    // First show after 6s, then every 18s
    setTimeout(() => { showRandom(); setInterval(showRandom, 18000); }, 6000);
  }
  showUrgencyNotif();

  /* ================================================================
     13. VIEWING COUNT BADGES
  ================================================================ */
  document.querySelectorAll('.tour-card').forEach(card => {
    const v = Math.floor(Math.random() * 18) + 3;
    const badge = card.querySelector('.viewing-badge');
    if (badge) badge.textContent = v + ' people viewing';
  });

  /* ================================================================
     14. NEWSLETTER FORM
  ================================================================ */
  document.querySelector('.newsletter-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    if (!email) return;
    this.innerHTML = `<div class="newsletter-success">
      <i class="fas fa-check-circle"></i>
      <p>Thank you! You have been subscribed to our newsletter.</p>
    </div>`;
  });

  /* ================================================================
     15. CHAT WIDGET
  ================================================================ */
  const chatBtn  = document.querySelector('.chat-fab');
  const chatMenu = document.querySelector('.chat-menu');

  chatBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    chatMenu?.classList.toggle('open');
    chatBtn.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    chatMenu?.classList.remove('open');
    chatBtn?.classList.remove('active');
  });

  /* ================================================================
     16. MOBILE NAV SUB-MENU TOGGLE
  ================================================================ */
  // Make the parent link of each .mobile-sub act as a toggle
  document.querySelectorAll('.mobile-nav .mobile-sub').forEach(sub => {
    const prev = sub.previousElementSibling;
    if (!prev || prev.tagName !== 'A') return;
    prev.style.cursor = 'pointer';
    const arrow = document.createElement('span');
    arrow.innerHTML = ' <i class="fas fa-chevron-down" style="font-size:.65rem;transition:transform .3s"></i>';
    prev.appendChild(arrow);
    sub.style.display = 'none';
    prev.addEventListener('click', e => {
      e.preventDefault();
      const open = sub.style.display !== 'none';
      sub.style.display = open ? 'none' : 'block';
      const icon = arrow.querySelector('i');
      if (icon) icon.style.transform = open ? '' : 'rotate(180deg)';
    });
  });

})();
