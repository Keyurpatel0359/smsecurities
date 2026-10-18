/* S.M. Securities — site behaviour
   Nav, scroll progress, reveal-on-scroll, counters, active section, enquiry form. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  var menu = document.querySelector('.menu');
  var links = document.querySelector('.links');

  function closeMenu(returnFocus) {
    if (!links || !links.classList.contains('open')) return;
    links.classList.remove('open');
    document.body.classList.remove('menu-open');
    if (menu) {
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Open navigation');
      if (returnFocus) menu.focus();
    }
  }

  if (menu && links) {
    menu.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      document.body.classList.toggle('menu-open', open);
      if (open) {
        var first = links.querySelector('a');
        if (first) first.focus();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu(true);
    });

    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') && !e.target.closest('.nav')) closeMenu(false);
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 940) closeMenu(false);
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  var revealItems = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Header state + scroll progress ---------- */
  var header = document.querySelector('.header');
  var progress = document.querySelector('.page-progress span');

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 16);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      progress.style.width = pct + '%';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Counters ---------- */
  function formatIN(n) {
    return Math.round(n).toLocaleString('en-IN');
  }

  function animateCounter(el) {
    var target = Number(el.dataset.target) || 0;

    if (reduceMotion) {
      el.textContent = formatIN(target);
      return;
    }

    var start = null;
    var duration = 1400;

    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatIN(target * eased);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatIN(target);
      }
    }

    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('.counter');

  if (!('IntersectionObserver' in window)) {
    counters.forEach(function (el) {
      el.textContent = formatIN(Number(el.dataset.target) || 0);
    });
  } else {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = entry.target;
        group.querySelectorAll('.counter').forEach(function (el) {
          if (!el.dataset.ran) {
            el.dataset.ran = '1';
            animateCounter(el);
          }
        });
        counterObserver.unobserve(group);
      });
    }, { threshold: 0.4 });

    var counterGroups = new Set();
    counters.forEach(function (el) {
      counterGroups.add(el.closest('section') || el.parentElement);
    });
    counterGroups.forEach(function (g) { counterObserver.observe(g); });
  }

  /* ---------- Active nav link ---------- */
  if ('IntersectionObserver' in window) {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.links a[href^="#"]'));
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var current = byId[entry.target.id];
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        if (current) current.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    document.querySelectorAll('main section[id]').forEach(function (s) {
      sectionObserver.observe(s);
    });
  }

  /* ---------- Enquiry form → WhatsApp ---------- */
  var form = document.getElementById('enquiryForm');

  if (form) {
    var WHATSAPP_NUMBER = '919033720298';

    form.querySelectorAll('input[required]').forEach(function (input) {
      var err = document.createElement('div');
      err.className = 'field-error';
      err.textContent = input.name === 'phone'
        ? 'Enter a valid 10-digit Indian mobile number.'
        : input.name === 'consent'
          ? 'Please tick this box to continue.'
          : 'This field is required.';

      if (input.name === 'consent') {
        input.closest('label').appendChild(err);
      } else {
        input.insertAdjacentElement('afterend', err);
      }

      input.addEventListener('input', function () {
        var label = input.closest('label');
        if (!label) return;
        var bad = !input.validity.valid && (input.type === 'checkbox' || input.value.length > 0);
        label.classList.toggle('has-error', bad);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = form.checkValidity();

      form.querySelectorAll('input[required]').forEach(function (input) {
        var label = input.closest('label');
        if (label) label.classList.toggle('has-error', !input.validity.valid);
      });

      if (!valid) {
        var firstBad = form.querySelector('input:invalid');
        if (firstBad) firstBad.focus();
        return;
      }

      var data = new FormData(form);
      var text =
        'Hello S.M. Securities,\n' +
        'Name: ' + data.get('name') + '\n' +
        'Phone: ' + data.get('phone') + '\n' +
        'Interested in: ' + data.get('interest') + '\n' +
        'Message: ' + (data.get('message') || '—');

      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
      var status = form.querySelector('.formStatus');
      var win = window.open(url, '_blank', 'noopener,noreferrer');

      if (status) {
        status.textContent = win
          ? 'Your message is ready — press Send in WhatsApp to complete the enquiry.'
          : 'WhatsApp did not open.';

        if (!win) {
          var link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = ' Open WhatsApp manually.';
          status.appendChild(link);
        }
      }
    });
  }
})();
