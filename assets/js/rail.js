/* LAVIGO rail dividers.
   Markup (reusable on any page):
     <div class="rail-divider" aria-hidden="true" data-direction="ltr|rtl">   <- data-direction optional
              <img class="rail-train" src="assets/theme/Rail_track/train_right.png" width="360" height="44" alt="">
     </div>
   Without data-direction, dividers alternate: 1st left-to-right, 2nd right-to-left, ...
   The train position is tied to scroll: just off-screen on one side when the divider enters
   at the bottom of the viewport, just off-screen on the other side when it leaves at the top. */
(function () {
  var dividers = document.querySelectorAll('.rail-divider');
  if (!dividers.length) return;

  var script = document.currentScript;
  var base = script ? script.src.replace(/js\/rail\.js.*$/, 'theme/Rail_track/') : 'assets/theme/Rail_track/';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var rails = Array.prototype.map.call(dividers, function (el, i) {
    var forced = el.getAttribute('data-direction');
    var dir = forced === 'ltr' || forced === 'rtl' ? forced : (i % 2 === 0 ? 'ltr' : 'rtl');
    var train = el.querySelector('.rail-train');
    var file = dir === 'ltr' ? 'train_right.png' : 'train_left.png';
    if (train.getAttribute('src').indexOf(file) === -1) train.src = base + file;
    return { el: el, train: train, dir: dir, last: null };
  });

  function place(r, progress) {
    var width = r.el.clientWidth;
    var tw = r.train.offsetWidth;
    var x = reduceMotion
      ? (width - tw) / 2
      : r.dir === 'ltr'
        ? -tw + progress * (width + tw)
        : width - progress * (width + tw);
    r.train.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
  }

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    rails.forEach(function (r) {
      var rect = r.el.getBoundingClientRect();
      // progress 0 = divider just entering at the bottom, 1 = just left at the top
      var p = (vh - rect.top) / (vh + rect.height);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      var offscreen = rect.bottom < 0 || rect.top > vh;
      if (offscreen && r.last === p) return;   // skip dividers that are off-screen and already parked
      r.last = p;
      place(r, p);
    });
  }
  function request() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  if (reduceMotion) {
    rails.forEach(function (r) { place(r, 0.5); });
    window.addEventListener('resize', function () { rails.forEach(function (r) { place(r, 0.5); }); });
    return;
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () {
    rails.forEach(function (r) { r.last = null; });
    request();
  });
  window.addEventListener('load', request);
  update();
})();
