/* ============================================================
   OCHRE MOROCCO — Booking System v1.0
   ============================================================ */
(function () {
  'use strict';

  /* ── CONFIGURATION ───────────────────────────────────────── */
  var CFG = {
    whatsapp: '212694170004',
    ownerEmail: 'ochremorocco@gmail.com',

    /* EmailJS — sign up FREE at https://www.emailjs.com
       1. Create an account and add your email service (Gmail, Outlook, etc.)
       2. Create TWO templates:
            ownerTpl  — sends to {{owner_email}} with all booking details
            clientTpl — sends to {{email}} as customer confirmation
       3. Set enabled: true and fill in your IDs below                       */
    emailjs: {
      enabled: false,
      publicKey: 'YOUR_PUBLIC_KEY',
      serviceId: 'YOUR_SERVICE_ID',
      ownerTpl:  'YOUR_OWNER_TEMPLATE_ID',
      clientTpl: 'YOUR_CLIENT_TEMPLATE_ID'
    },

    /* Stripe / PayPal payment links (optional).
       Create a Stripe Payment Link at stripe.com, paste URL here per service.
       Leave empty '' to use WhatsApp fallback for card payments.             */
    payLinks: {
      'airport-transfer':    '',
      'agafay-desert-pack':  '',
      'hot-air-balloon':     '',
      'paragliding':         '',
      'petit-buggy':         '',
      'grand-buggy':         '',
      'quad-palmeraie':      '',
      'camel-ride':          '',
      'essaouira':           '',
      'ouzoud':              '',
      'ourika':              '',
      'ait-ben-haddou':      '',
      'zagora-desert':       '',
      'merzouga-desert':     '',
      'transfer-standard':   '',
      'transfer-minibus':    '',
      'transfer-vip':        ''
    }
  };

  /* ── FIELD SETS per service type ─────────────────────────── */
  var FIELDS = {
    transfer: [
      {id:'name',   label:'Full Name',                    type:'text',           req:true,  ph:'Your full name'},
      {id:'email',  label:'Email Address',                type:'email',          req:true,  ph:'your@email.com'},
      {id:'phone',  label:'Phone / WhatsApp',             type:'tel',            req:true,  ph:'+1 234 567 890'},
      {id:'dir',    label:'Transfer Direction',           type:'select',         req:true,
       opts:[{v:'',l:'— Select direction —'},{v:'Airport \u2192 Hotel',l:'\u2708  Airport \u2192 Hotel'},{v:'Hotel \u2192 Airport',l:'\uD83C\uDFE8  Hotel \u2192 Airport'}]},
      {id:'flight', label:'Flight Number',                type:'text',           req:true,  ph:'e.g. AT 500'},
      {id:'dt',     label:'Flight Date & Time',           type:'datetime-local', req:true},
      {id:'hotel',  label:'Hotel / Address in Marrakech', type:'text',           req:true,  ph:'Hotel name or full address'},
      {id:'pax',    label:'Number of Passengers',         type:'number',         req:true,  min:1, max:20, def:1},
      {id:'notes',  label:'Special Requests',             type:'textarea',       req:false, ph:'Child seats, extra luggage\u2026'}
    ],
    excursion: [
      {id:'name',    label:'Full Name',                   type:'text',   req:true,  ph:'Your full name'},
      {id:'email',   label:'Email Address',               type:'email',  req:true,  ph:'your@email.com'},
      {id:'phone',   label:'Phone / WhatsApp',            type:'tel',    req:true,  ph:'+1 234 567 890'},
      {id:'date',    label:'Date of Excursion',           type:'date',   req:true},
      {id:'adults',  label:'Adults',                      type:'number', req:true,  min:1, max:50, def:1},
      {id:'children',label:'Children (under 12)',          type:'number', req:false, min:0, max:20, def:0},
      {id:'hotel',   label:'Hotel / Pickup Address',      type:'text',   req:true,  ph:'Hotel name or address in Marrakech'},
      {id:'notes',   label:'Special Requests',            type:'textarea',req:false,ph:'Dietary needs, accessibility\u2026'}
    ],
    desert: [
      {id:'name',    label:'Full Name',                    type:'text',   req:true,  ph:'Your full name'},
      {id:'email',   label:'Email Address',                type:'email',  req:true,  ph:'your@email.com'},
      {id:'phone',   label:'Phone / WhatsApp',             type:'tel',    req:true,  ph:'+1 234 567 890'},
      {id:'date',    label:'Departure Date',               type:'date',   req:true},
      {id:'adults',  label:'Adults',                       type:'number', req:true,  min:1, max:20, def:2},
      {id:'children',label:'Children (under 12)',           type:'number', req:false, min:0, max:10, def:0},
      {id:'hotel',   label:'Hotel / Pickup in Marrakech',  type:'text',   req:true,  ph:'Hotel name or address'},
      {id:'notes',   label:'Special Requests',             type:'textarea',req:false,ph:'Dietary needs, accessibility\u2026'}
    ],
    circuit: [
      {id:'name',    label:'Full Name',                    type:'text',   req:true,  ph:'Your full name'},
      {id:'email',   label:'Email Address',                type:'email',  req:true,  ph:'your@email.com'},
      {id:'phone',   label:'Phone / WhatsApp',             type:'tel',    req:true,  ph:'+1 234 567 890'},
      {id:'date',    label:'Start Date',                   type:'date',   req:true},
      {id:'adults',  label:'Adults',                       type:'number', req:true,  min:1, max:20, def:2},
      {id:'children',label:'Children (under 12)',           type:'number', req:false, min:0, max:10, def:0},
      {id:'room',    label:'Room Type',                    type:'select', req:true,
       opts:[{v:'',l:'— Select room type —'},{v:'Double Room',l:'Double Room'},{v:'Single Room (+supplement)',l:'Single Room (+supplement)'},{v:'Triple Room',l:'Triple Room'},{v:'Suite (+supplement)',l:'Suite (+supplement)'}]},
      {id:'notes',   label:'Special Requests',             type:'textarea',req:false,ph:'Dietary needs, accessibility\u2026'}
    ]
  };

  /* ── FIELD LABELS for WhatsApp message ──────────────────── */
  var LABELS = {
    name:'\uD83D\uDC64 Name', email:'\uD83D\uDCE7 Email', phone:'\uD83D\uDCF1 Phone',
    dir:'\u21D5 Direction', flight:'\u2708 Flight No.', dt:'\uD83D\uDCC5 Date & Time',
    date:'\uD83D\uDCC5 Date', hotel:'\uD83C\uDFE8 Hotel/Address',
    pax:'\uD83D\uDC65 Passengers', adults:'\uD83D\uDC65 Adults',
    children:'\uD83D\uDC76 Children', room:'\uD83D\uDECF Room Type',
    notes:'\uD83D\uDCDD Requests'
  };

  /* ── STATE ───────────────────────────────────────────────── */
  var svc = null;
  var fd  = {};

  /* ── SUPABASE BOOKING SAVE ───────────────────────────────── */
  function saveToSupabase(payMethod) {
    try {
      var db = window.supabaseClient;
      if (!db || !db.rpc) return Promise.resolve(null);
      var total = calcTotal();
      var bookingDate = fd.date || fd.dt || null;
      if (bookingDate && bookingDate.length > 10) bookingDate = bookingDate.slice(0, 10);
      var notesArr = [];
      var fields = FIELDS[svc.type] || FIELDS.excursion;
      fields.forEach(function(f) {
        if (fd[f.id] && f.id !== 'name' && f.id !== 'email' && f.id !== 'phone' && f.id !== 'date' && f.id !== 'dt' && f.id !== 'pax' && f.id !== 'adults') {
          notesArr.push(f.label + ': ' + fd[f.id]);
        }
      });
      return db.rpc('create_booking', {
        p_service_name:   svc.name,
        p_client_name:    fd.name  || '',
        p_client_email:   fd.email || null,
        p_client_phone:   fd.phone || null,
        p_booking_date:   bookingDate,
        p_people_count:   parseInt(fd.adults || fd.pax || 1, 10) || 1,
        p_amount:         total,
        p_currency:       'EUR',
        p_payment_method: payMethod,
        p_notes:          notesArr.join(' | ') || null
      }).then(function(res) {
        if (res && res.error) console.warn('Booking save error:', res.error.message);
        return res;
      });
    } catch(e) {
      console.warn('Booking save exception:', e);
      return Promise.resolve(null);
    }
  }



  window.addEventListener('ochre:settings', function (event) {
    var settings = event.detail || {};
    if (settings.contact && settings.contact.whatsapp) {
      CFG.whatsapp = String(settings.contact.whatsapp).replace(/\D/g, '') || CFG.whatsapp;
    }
    if (settings.contact && settings.contact.email) {
      CFG.ownerEmail = settings.contact.email;
    }
  });

  /* ── INJECT MODAL ────────────────────────────────────────── */
  document.body.insertAdjacentHTML('beforeend', [
    '<div id="bk-overlay" class="bk-overlay" role="dialog" aria-modal="true" aria-label="Book this service">',
    '<div class="bk-modal">',

    '<div class="bk-header">',
    '<span class="bk-brand"><i class="fas fa-mountain-sun"></i> Ochre Morocco</span>',
    '<button class="bk-close" aria-label="Close">&times;</button>',
    '</div>',

    '<div class="bk-banner">',
    '<div class="bk-banner-name" id="bk-bname"></div>',
    '<div class="bk-banner-price" id="bk-bprice"></div>',
    '</div>',

    '<div class="bk-steps">',
    '<div class="bk-step bk-step--active" data-s="1"><span class="bk-step-num">1</span><span class="bk-step-lbl">Details</span></div>',
    '<div class="bk-step-sep"></div>',
    '<div class="bk-step" data-s="2"><span class="bk-step-num">2</span><span class="bk-step-lbl">Payment</span></div>',
    '<div class="bk-step-sep"></div>',
    '<div class="bk-step" data-s="3"><span class="bk-step-num">3</span><span class="bk-step-lbl">Confirm</span></div>',
    '</div>',

    '<div class="bk-body">',

    '<!-- Step 1: Form -->',
    '<div id="bk-s1">',
    '<form id="bk-form" novalidate>',
    '<div id="bk-fields"></div>',
    '<button type="submit" class="bk-btn-primary">Continue <i class="fas fa-arrow-right"></i></button>',
    '</form>',
    '</div>',

    '<!-- Step 2: Payment -->',
    '<div id="bk-s2" class="bk-hidden">',
    '<div class="bk-summary" id="bk-summary"></div>',
    '<p class="bk-pay-heading"><i class="fas fa-hand-holding-dollar"></i> How would you like to pay?</p>',
    '<div class="bk-pay-opts">',

    '<button class="bk-pay-opt" id="bk-opt-wa">',
    '<span class="bk-pay-ico bk-pay-ico--wa"><i class="fab fa-whatsapp"></i></span>',
    '<span class="bk-pay-info"><strong>Book via WhatsApp</strong><small>Chat directly with our team</small></span>',
    '<i class="fas fa-chevron-right"></i>',
    '</button>',

    '<button class="bk-pay-opt" id="bk-opt-cash">',
    '<span class="bk-pay-ico bk-pay-ico--cash"><i class="fas fa-money-bill-wave"></i></span>',
    '<span class="bk-pay-info"><strong>Pay on Arrival (Cash)</strong><small>Reserve now, pay when you arrive</small></span>',
    '<i class="fas fa-chevron-right"></i>',
    '</button>',

    '<button class="bk-pay-opt" id="bk-opt-card">',
    '<span class="bk-pay-ico bk-pay-ico--card"><i class="fas fa-credit-card"></i></span>',
    '<span class="bk-pay-info"><strong>Pay by Card Online</strong><small>Secure payment \u00b7 Instant confirmation</small></span>',
    '<i class="fas fa-chevron-right"></i>',
    '</button>',

    '</div>',
    '<button class="bk-btn-back" id="bk-back"><i class="fas fa-arrow-left"></i> Back to details</button>',
    '</div>',

    '<!-- Step 3: Confirmation -->',
    '<div id="bk-s3" class="bk-hidden">',
    '<div class="bk-success-ico" id="bk-s3ico"></div>',
    '<h3 class="bk-success-title" id="bk-s3title"></h3>',
    '<p class="bk-success-msg" id="bk-s3msg"></p>',
    '<div class="bk-success-box" id="bk-s3box"></div>',
    '<div id="bk-paybtn"></div>',
    '<button class="bk-btn-primary" id="bk-done">Close</button>',
    '</div>',

    '</div>',<!-- /bk-body -->

    '<div class="bk-footer-bar">',
    '<i class="fas fa-lock"></i> Secure &nbsp;|&nbsp; <i class="fas fa-shield-halved"></i> Encrypted &nbsp;|&nbsp; <i class="fas fa-undo"></i> Free Cancellation',
    '</div>',

    '</div>',<!-- /bk-modal -->
    '</div>'  <!-- /bk-overlay -->
  ].join(''));

  /* ── HELPERS ─────────────────────────────────────────────── */
  function G(id){ return document.getElementById(id); }
  function show(el){ if(el) el.classList.remove('bk-hidden'); }
  function hide(el){ if(el) el.classList.add('bk-hidden'); }
  var overlay = G('bk-overlay');

  /* ── OPEN / CLOSE ────────────────────────────────────────── */
  function openModal(data) {
    svc = data; fd = {};
    G('bk-bname').textContent  = svc.name;
    G('bk-bprice').textContent = 'From \u20ac' + svc.price + ' / person';
    renderFields();
    setStep(1);
    /* Show card only when a Stripe payLink is configured for this service */
    var hasPayLink = !!(CFG.payLinks[svc.id || ''] || '').trim();
    var cardBtn = G('bk-opt-card');
    if (cardBtn) { cardBtn.style.display = hasPayLink ? '' : 'none'; }
    overlay.classList.add('bk-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('bk-open');
    document.body.style.overflow = '';
  }

  /* ── STEP MANAGEMENT ─────────────────────────────────────── */
  function setStep(n) {
    [G('bk-s1'), G('bk-s2'), G('bk-s3')].forEach(function(el, i) {
      (i + 1 === n) ? show(el) : hide(el);
    });
    document.querySelectorAll('.bk-step').forEach(function(s) {
      s.classList.toggle('bk-step--active', parseInt(s.dataset.s, 10) <= n);
    });
  }

  /* ── RENDER FORM FIELDS ──────────────────────────────────── */
  function renderFields() {
    var fields = FIELDS[svc.type] || FIELDS.excursion;
    var wrap = G('bk-fields');
    wrap.innerHTML = '';
    fields.forEach(function(f) {
      var req = f.req ? '<span class="bk-req">*</span>' : '';
      var inp = '';
      if (f.type === 'select') {
        inp = '<select id="bk-f-' + f.id + '" class="bk-input"' + (f.req ? ' required' : '') + '>' +
          f.opts.map(function(o){ return '<option value="' + o.v + '">' + o.l + '</option>'; }).join('') +
          '</select>';
      } else if (f.type === 'textarea') {
        inp = '<textarea id="bk-f-' + f.id + '" class="bk-input bk-textarea" placeholder="' + (f.ph||'') + '" rows="3"></textarea>';
      } else {
        var extras = (f.min !== undefined) ? ' min="' + f.min + '" max="' + f.max + '" value="' + (f.def !== undefined ? f.def : '') + '"' : '';
        inp = '<input id="bk-f-' + f.id + '" type="' + f.type + '" class="bk-input" placeholder="' + (f.ph||'') + '"' + (f.req ? ' required' : '') + extras + ' />';
      }
      wrap.insertAdjacentHTML('beforeend',
        '<div class="bk-field">' +
          '<label class="bk-label" for="bk-f-' + f.id + '">' + f.label + ' ' + req + '</label>' +
          inp +
          '<div class="bk-err" id="bk-err-' + f.id + '"></div>' +
        '</div>'
      );
    });
  }

  /* ── VALIDATION ──────────────────────────────────────────── */
  function validate() {
    var fields = FIELDS[svc.type] || FIELDS.excursion;
    var ok = true;
    var firstErr = null;
    fields.forEach(function(f) {
      var el = G('bk-f-' + f.id);
      var errEl = G('bk-err-' + f.id);
      if (!el) return;
      var v = el.value.trim();
      errEl.textContent = '';
      el.classList.remove('bk-input--error');
      if (f.req && !v) {
        errEl.textContent = 'This field is required.';
        el.classList.add('bk-input--error');
        if (!firstErr) firstErr = el;
        ok = false;
      } else {
        fd[f.id] = v;
      }
    });
    if (firstErr) firstErr.focus();
    return ok;
  }

  /* ── TOTAL PRICE ─────────────────────────────────────────── */
  function calcTotal() {
    var qty = parseInt(fd.adults || fd.pax || 1, 10) || 1;
    return svc.price * qty;
  }

  /* ── BOOKING SUMMARY HTML ────────────────────────────────── */
  function buildSummary() {
    var fields = FIELDS[svc.type] || FIELDS.excursion;
    var rows = '';
    fields.forEach(function(f) {
      if (fd[f.id]) {
        rows += '<div class="bk-sum-row"><span class="bk-sum-k">' + f.label + '</span><span class="bk-sum-v">' + fd[f.id] + '</span></div>';
      }
    });
    var total = calcTotal();
    return (
      '<div class="bk-sum-title"><i class="fas fa-clipboard-list"></i> Booking Summary</div>' +
      '<div class="bk-sum-row"><span class="bk-sum-k">Service</span><span class="bk-sum-v">' + svc.name + '</span></div>' +
      rows +
      '<div class="bk-sum-total"><span>Total Amount</span><span>\u20ac' + total + '</span></div>'
    );
  }

  /* ── WHATSAPP MESSAGE BUILDER ────────────────────────────── */
  function buildWA() {
    var total = calcTotal();
    var fields = FIELDS[svc.type] || FIELDS.excursion;
    var msg = 'Hello Ochre Morocco! \uD83C\uDF1F I would like to book:\n\n';
    msg += '\uD83D\uDCCC *Service:* ' + svc.name + '\n';
    msg += '\uD83D\uDCB0 *Total:* \u20ac' + total + '\n\n';
    fields.forEach(function(f) {
      if (fd[f.id]) msg += (LABELS[f.id] || f.label) + ': ' + fd[f.id] + '\n';
    });
    msg += '\nThank you! \uD83D\uDE4F';
    return encodeURIComponent(msg);
  }

  /* ── EMAILJS SENDER ──────────────────────────────────────── */
  function sendEmail(payMethod) {
    if (!CFG.emailjs.enabled) return Promise.resolve(true);
    var total = calcTotal();
    var params = {};
    Object.keys(fd).forEach(function(k){ params[k] = fd[k]; });
    params.service_name   = svc.name;
    params.service_price  = '\u20ac' + svc.price + ' / person';
    params.total_amount   = '\u20ac' + total;
    params.payment_method = payMethod;
    params.owner_email    = CFG.ownerEmail;

    var p = emailjs.send(CFG.emailjs.serviceId, CFG.emailjs.ownerTpl, params, CFG.emailjs.publicKey);
    if (fd.email && CFG.emailjs.clientTpl) {
      p = p.then(function() {
        return emailjs.send(CFG.emailjs.serviceId, CFG.emailjs.clientTpl, params, CFG.emailjs.publicKey);
      });
    }
    return p.catch(function(err) { console.warn('EmailJS error:', err); return true; });
  }

  /* ── PAYMENT OPTION: WHATSAPP ────────────────────────────── */
  G('bk-opt-wa').addEventListener('click', function() {
    saveToSupabase('whatsapp');
    window.open('https://wa.me/' + CFG.whatsapp + '?text=' + buildWA(), '_blank');
    closeModal();
  });

  /* ── PAYMENT OPTION: CASH ────────────────────────────────── */
  G('bk-opt-cash').addEventListener('click', function() {
    var btn = this;
    btn.disabled = true;
    btn.querySelector('strong').textContent = 'Processing\u2026';
    var total = calcTotal();
    sendEmail('Cash on Arrival').then(function() {
       setStep(3);
       G('bk-s3ico').innerHTML = '<i class="fas fa-check-circle" style="color:#1e6b3c"></i>';
       G('bk-s3title').textContent = 'Booking request ready';
       G('bk-s3msg').textContent = 'Your details are ready. Send them to our team on WhatsApp to confirm availability and finalize your reservation.';
      G('bk-s3box').innerHTML =
        '<div class="bk-confirm-row"><i class="fas fa-user"></i> ' + (fd.name || '') + '</div>' +
        '<div class="bk-confirm-row"><i class="fas fa-tag"></i> ' + svc.name + '</div>' +
        '<div class="bk-confirm-row bk-confirm-total"><i class="fas fa-money-bill-wave"></i> \u20ac' + total + ' \u2014 Pay on Arrival</div>' +
         '<div class="bk-confirm-row"><i class="fab fa-whatsapp"></i> We\'ll contact you at: ' + (fd.phone || fd.email || '') + '</div>';
       G('bk-paybtn').innerHTML =
         '<a href="https://wa.me/' + CFG.whatsapp + '?text=' + buildWA() + '" class="bk-btn-pay" target="_blank" rel="noopener">' +
         '<i class="fab fa-whatsapp"></i> Send request on WhatsApp</a>';
      btn.disabled = false;
    });
  });

  /* ── PAYMENT OPTION: CARD ────────────────────────────────── */
  G('bk-opt-card').addEventListener('click', function() {
    var btn = this;
    btn.disabled = true;
    btn.querySelector('strong').textContent = 'Processing\u2026';
    var total = calcTotal();
    sendEmail('Card Payment').then(function() {
      setStep(3);
      G('bk-s3ico').innerHTML = '<i class="fas fa-credit-card" style="color:#c8922b"></i>';
      G('bk-s3title').textContent = 'Almost There!';
      G('bk-s3msg').textContent = 'Your booking details have been recorded. Click the button below to complete your secure online payment.';
      G('bk-s3box').innerHTML =
        '<div class="bk-confirm-row"><i class="fas fa-user"></i> ' + (fd.name || '') + '</div>' +
        '<div class="bk-confirm-row"><i class="fas fa-tag"></i> ' + svc.name + '</div>' +
        '<div class="bk-confirm-row bk-confirm-total"><i class="fas fa-credit-card"></i> Total to pay: <strong>\u20ac' + total + '</strong></div>' +
        '<div class="bk-confirm-row"><i class="fas fa-envelope"></i> Confirmation will be sent to: ' + (fd.email || '') + '</div>';

      var link = CFG.payLinks[svc.id] || '';
      if (link) {
        G('bk-paybtn').innerHTML =
          '<a href="' + link + '" class="bk-btn-pay" target="_blank" rel="noopener">' +
          '<i class="fas fa-lock"></i> Pay \u20ac' + total + ' Securely Now</a>';
      } else {
        var waMsg = encodeURIComponent('I want to pay by card for: ' + svc.name + ' \u2014 Total: \u20ac' + total + '. Name: ' + (fd.name||'') + ', Email: ' + (fd.email||'') + ', Phone: ' + (fd.phone||''));
        G('bk-paybtn').innerHTML =
          '<p class="bk-pay-alt"><i class="fab fa-whatsapp"></i> ' +
          '<a href="https://wa.me/' + CFG.whatsapp + '?text=' + waMsg + '" target="_blank" rel="noopener">' +
          'Contact us on WhatsApp to complete card payment</a></p>';
      }
      btn.disabled = false;
    });
  });

  /* ── NAV CONTROLS ────────────────────────────────────────── */
  G('bk-back').addEventListener('click', function() { setStep(1); });
  G('bk-done').addEventListener('click', closeModal);
  document.querySelector('.bk-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

  /* ── FORM SUBMIT ─────────────────────────────────────────── */
  G('bk-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validate()) return;
    G('bk-summary').innerHTML = buildSummary();
    setStep(2);
  });

  /* ── GLOBAL BOOK BUTTON INTERCEPT ────────────────────────── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-service]');
    if (!btn || !btn.classList.contains('btn-book')) return;
    e.preventDefault();
    openModal({
      name:  btn.dataset.service || 'Service',
      price: parseFloat(btn.dataset.price) || 0,
      type:  btn.dataset.type    || 'excursion',
      id:    btn.dataset.id      || ''
    });
  });

})();
