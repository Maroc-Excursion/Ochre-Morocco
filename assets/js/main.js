/* Ochre Morocco — main.js */

(function () {
  'use strict';

  /* --- Hero slider --- */
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

  /* --- Sticky header --- */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    header && header.classList.toggle('scrolled', window.scrollY > 60);
    updateBackToTop();
  }, { passive: true });

  /* --- Cards slider --- */
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

  /* --- Search tabs --- */
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

  /* --- Mobile nav --- */
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

  /* --- Back to top --- */
  const btt = document.querySelector('.back-to-top');
  function updateBackToTop() {
    btt && btt.classList.toggle('visible', window.scrollY > 500);
  }
  btt?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* --- Scroll reveal --- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('aos-animate'), (e.target.dataset.delay || 0) * 1);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

  /* --- Count-up stats --- */
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

  /* --- Wishlist --- */
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

  /* --- Currency switcher --- */
  const rates = { EUR: 1, USD: 1.09, GBP: 0.86, MAD: 10.85 };
  const symbols = { EUR: '€', USD: '$', GBP: '£', MAD: 'MAD ' };
  let currentCurrency = localStorage.getItem('me_currency') || 'EUR';

  function convertPrices(currency) {
    currentCurrency = currency;
    localStorage.setItem('me_currency', currency);
    const rate   = rates[currency];
    const symbol = symbols[currency];

    document.querySelectorAll('[data-eur]').forEach(el => {
      el.textContent = symbol + Math.round(parseFloat(el.dataset.eur) * rate);
    });
    document.querySelectorAll('[data-eur-old]').forEach(el => {
      el.textContent = symbol + Math.round(parseFloat(el.dataset.eurOld) * rate);
    });
    document.querySelectorAll('[data-eur-circuit]').forEach(el => {
      const v = Math.round(parseFloat(el.dataset.eurCircuit) * rate);
      el.innerHTML = `<sup style="font-size:.6rem">${symbol}</sup>${v}`;
    });
    document.querySelectorAll('.currency-select').forEach(sel => { sel.value = currency; });
  }

  /* Expose globally so data-loader can call after dynamic render */
  window.__applyCurrentCurrency = function() { convertPrices(currentCurrency); };

  document.addEventListener('DOMContentLoaded', () => convertPrices(currentCurrency));
  document.querySelectorAll('.currency-select').forEach(sel => {
    sel.value = currentCurrency;
    sel.addEventListener('change', e => convertPrices(e.target.value));
  });
  if (document.readyState !== 'loading') convertPrices(currentCurrency);

  /* --- Language switcher --- */
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
      about_title:    'About Ochre Morocco',
      about_sub:      'Your trusted partner for premium experiences in Morocco',
      contact_title:  'Contact Us',
      contact_sub:    'Our team is available 7 days a week to answer your questions',
      exc_title:      'Our Excursions',
      exc_sub:        'Discover all our experiences from Marrakech',
      circ_title:     'Our Tours & Circuits',
      circ_sub:       'Multi-day adventures across the Kingdom',
      trans_title:    'Airport Transfers',
      trans_sub:      'Fast, reliable transfers to your hotel and back',
      blog_title:     'Morocco Travel Blog',
      blog_sub:       'Tips, guides and inspiration for your trip',
      book_now:       'Book Now',
      read_more:      'Read More',
    },
    fr: {
      nav_home:       'Accueil',
      nav_exc:        'Excursions',
      nav_circ:       'Circuits',
      nav_trans:      'Transferts',
      nav_desert:     'Désert Agafay',
      nav_about:      'À propos',
      nav_contact:    'Contact',
      nav_blog:       'Blog',
      hero_badge:     '#1 Agence d\'Excursions au Maroc',
      hero_title:     'Découvrez la Magie<br>du <span>Maroc</span>',
      hero_sub:       'Excursions premium, circuits inoubliables et aventures authentiques au cœur du Royaume Chérifien',
      hero_btn1:      'Voir nos Excursions',
      hero_btn2:      'Nous contacter',
      wa_btn:         'WhatsApp',
      search_tab1:    'Excursions',
      search_tab2:    'Circuits',
      search_tab3:    'Transferts',
      free_cancel:    'Annulation gratuite',
      about_title:    'À propos d'Ochre Morocco',
      about_sub:      'Votre partenaire de confiance pour des expériences premium au Maroc',
      contact_title:  'Contactez-nous',
      contact_sub:    'Notre équipe est disponible 7j/7 pour répondre à vos questions',
      exc_title:      'Nos Excursions',
      exc_sub:        'Découvrez toutes nos expériences depuis Marrakech',
      circ_title:     'Nos Circuits & Voyages',
      circ_sub:       'Aventures multi-jours à travers le Royaume',
      trans_title:    'Transferts Aéroport',
      trans_sub:      'Transferts rapides et fiables vers votre hôtel',
      blog_title:     'Blog Voyage Maroc',
      blog_sub:       'Conseils, guides et inspiration pour votre séjour',
      book_now:       'Réserver',
      read_more:      'Lire la suite',
    },
    ar: {
      nav_home:       'الرئيسية',
      nav_exc:        'الرحلات',
      nav_circ:       'الجولات',
      nav_trans:      'النقل',
      nav_desert:     'صحراء أكافاي',
      nav_about:      'من نحن',
      nav_contact:    'اتصل بنا',
      nav_blog:       'المدونة',
      hero_badge:     'وكالة #1 للرحلات في المغرب',
      hero_title:     'اكتشف سحر<br><span>المغرب</span>',
      hero_sub:       'رحلات فاخرة وجولات لا تُنسى ومغامرات أصيلة في قلب المملكة المغربية',
      hero_btn1:      'استكشف رحلاتنا',
      hero_btn2:      'تواصل معنا',
      wa_btn:         'واتساب',
      search_tab1:    'الرحلات',
      search_tab2:    'الجولات',
      search_tab3:    'النقل',
      free_cancel:    'إلغاء مجاني',
      about_title:    'عن أوكر موروكو',
      about_sub:      'شريكك الموثوق للتجارب الفاخرة في المغرب',
      contact_title:  'تواصل معنا',
      contact_sub:    'فريقنا متاح 7 أيام في الأسبوع للرد على استفساراتك',
      exc_title:      'رحلاتنا',
      exc_sub:        'اكتشف جميع تجاربنا من مراكش',
      circ_title:     'جولاتنا ومساراتنا',
      circ_sub:       'مغامرات متعددة الأيام عبر المملكة',
      trans_title:    'نقل المطار',
      trans_sub:      'نقل سريع وموثوق إلى فندقك والعودة',
      blog_title:     'مدونة السفر إلى المغرب',
      blog_sub:       'نصائح وأدلة وإلهام لرحلتك',
      book_now:       'احجز الآن',
      read_more:      'اقرأ المزيد',
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

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.style.fontFamily = "'Cairo', 'Poppins', sans-serif";
    } else {
      document.documentElement.dir = 'ltr';
      document.body.style.fontFamily = "'Poppins', sans-serif";
    }

    const labelMap = { en: 'EN', fr: 'FR', ar: 'AR' };
    const lbl = document.getElementById('activeLangLabel');
    if (lbl) lbl.textContent = labelMap[lang] || lang.toUpperCase();

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

  /* --- Urgency notifications --- */
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

    setTimeout(() => { showRandom(); setInterval(showRandom, 18000); }, 6000);
  }
  showUrgencyNotif();

  /* --- Viewing badges --- */
  document.querySelectorAll('.tour-card').forEach(card => {
    const v = Math.floor(Math.random() * 18) + 3;
    const badge = card.querySelector('.viewing-badge');
    if (badge) badge.textContent = v + ' people viewing';
  });

  /* --- Newsletter --- */
  document.querySelector('.newsletter-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    if (!email) return;
    this.innerHTML = `<div class="newsletter-success">
      <i class="fas fa-check-circle"></i>
      <p>Thank you! You have been subscribed to our newsletter.</p>
    </div>`;
  });

  /* --- Chat widget --- */
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

  /* --- Mobile sub-menu --- */