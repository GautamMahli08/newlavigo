/* LAVIGO site behaviour: header, mobile menu, reveal-on-scroll, card sliders, contact form. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- header turns solid after scrolling a little
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.pageYOffset > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  // ---- reveal sections as they scroll into view
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('is-visible'); });
  }

  // ---- card sliders: <div class="carousel" id="x"> + buttons with data-carousel="x" data-dir="-1|1"
  Array.prototype.forEach.call(document.querySelectorAll('.carousel'), function (track) {
    var prev = document.querySelector('[data-carousel="' + track.id + '"][data-dir="-1"]');
    var next = document.querySelector('[data-carousel="' + track.id + '"][data-dir="1"]');
    function step() {
      var item = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 8;
      if (prev) prev.disabled = track.scrollLeft <= 8;
      if (next) next.disabled = track.scrollLeft >= max;
    }
    [prev, next].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        track.scrollBy({ left: step() * parseInt(btn.getAttribute('data-dir'), 10), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  });

  // ---- contact form -> Netlify Forms (sent in the background, message shown in place)
  Array.prototype.forEach.call(document.querySelectorAll('form[data-netlify]'), function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var label = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Sending…';
      fetch(form.getAttribute('action') || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.className = 'form-status is-success';
        status.textContent = 'Thank you! Your request has been received. We will reply within 24 hours - please check your spam folder too.';
      }).catch(function () {
        status.className = 'form-status is-error';
        status.textContent = 'Sorry, something went wrong. Please try again or message us on WhatsApp.';
      }).then(function () {
        button.disabled = false;
        button.innerHTML = label;
      });
    });
  });

  // ---- reading progress bar
  var bar = document.querySelector('.progress');
  if (bar) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.pageYOffset / max, 1) : 0).toFixed(4) + ')';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  // ---- trip finder: opens the chosen trip with travellers and month pre-filled in the calculator
  var finder = document.querySelector('.finder');
  if (finder) {
    finder.addEventListener('submit', function (e) {
      e.preventDefault();
      var slug = finder.elements.trip.value;
      var month = parseInt(finder.elements.month.value, 10);
      var params = new URLSearchParams({ adults: finder.elements.travellers.value });
      if (!isNaN(month)) {
        var now = new Date();
        var year = month < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
        var day = month === now.getMonth() ? now.getDate() : 1;
        params.set('date', year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'));
      }
      window.location.href = 'trips/' + slug + '.html?' + params.toString() + '#book';
    });
  }

  // ---- filter buttons: <button class="filter" data-filter="x"> shows [data-region~="x"] items
  Array.prototype.forEach.call(document.querySelectorAll('.filters'), function (group) {
    var items = document.querySelectorAll(group.getAttribute('data-target') + ' [data-region]');
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      var f = btn.getAttribute('data-filter');
      Array.prototype.forEach.call(group.querySelectorAll('.filter'), function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      Array.prototype.forEach.call(items, function (it) {
        var show = f === 'all' || (' ' + it.getAttribute('data-region') + ' ').indexOf(' ' + f + ' ') !== -1;
        it.classList.toggle('is-hidden', !show);
        if (show) it.classList.add('is-visible');
      });
    });
  });

  // ---- season charts: highlight the current month
  var thisMonth = new Date().getMonth();
  Array.prototype.forEach.call(document.querySelectorAll('.season [data-m="' + thisMonth + '"]'), function (el) { el.classList.add('is-now'); });

  // ---- current year in the footer
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) { el.textContent = new Date().getFullYear(); });
})();
