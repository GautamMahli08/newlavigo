/* LAVIGO sky: clouds drifting behind the page, a flock of birds, falling leaves,
   and hero clouds that part as you scroll. Everything sits behind the content (z-index -1). */
(function () {
  var script = document.currentScript;
  var assets = script.src.replace(/js\/clouds\.js.*$/, '');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function img(src) {
    var i = new Image();
    i.src = assets + src;
    i.alt = '';
    i.decoding = 'async';
    return i;
  }

  // top in % of the scroll span, left & width in vw, speed = parallax factor
  var CLOUDS = [
    { top: 8, left: -14, w: 38, speed: 0.12, opacity: 0.7, src: 'clouds/cloud.png', dur: 28 },
    { top: 45, left: 74, w: 34, speed: 0.28, opacity: 0.6, src: 'clouds/cloud-2.png', dur: 36 },
    { top: 82, left: -16, w: 36, speed: 0.38, opacity: 0.55, src: 'clouds/cloud-2.png', dur: 32 }
  ];
  var LEAVES = [
    { n: 1, left: 5, w: 2.6, dur: 24, delay: -3 },
    { n: 5, left: 91, w: 2.8, dur: 28, delay: -14 },
    { n: 7, left: 48, w: 2.2, dur: 26, delay: -20 }
  ];

  var sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');

  var movers = CLOUDS.map(function (c, i) {
    var el = document.createElement('div');
    el.className = 'sky__cloud';
    el.style.left = c.left + 'vw';
    el.style.width = c.w + 'vw';
    el.style.opacity = c.opacity;
    var pic = img(c.src);
    pic.style.animationDuration = c.dur + 's';
    pic.style.animationDelay = (-i * 7) + 's';
    el.appendChild(pic);
    sky.appendChild(el);
    return { el: el, top: c.top, speed: c.speed };
  });

  var birds = document.createElement('div');
  birds.className = 'sky__birds';
  birds.style.width = '18vw';
  birds.style.opacity = 0.45;
  birds.appendChild(img('theme/birds_flock.png'));
  sky.appendChild(birds);
  movers.push({ el: birds, top: 16, speed: 0.18 });

  LEAVES.forEach(function (l) {
    var el = document.createElement('div');
    el.className = 'sky__leaf';
    el.style.left = l.left + 'vw';
    el.style.width = l.w + 'vw';
    var pic = img('theme/leaf-' + l.n + '.png');
    pic.style.animationDuration = l.dur + 's, ' + (l.dur / 4) + 's';
    pic.style.animationDelay = l.delay + 's, 0s';
    el.appendChild(pic);
    sky.appendChild(el);
  });
  document.body.appendChild(sky);

  // hero clouds (home page hero only)
  var heroes = [];
  Array.prototype.forEach.call(document.querySelectorAll('.hero[data-clouds]'), function (hero) {
    var wrap = document.createElement('div');
    wrap.className = 'hero__clouds';
    wrap.setAttribute('aria-hidden', 'true');
    var left = img('clouds/cloud.png');
    var right = img('clouds/cloud-2.png');
    wrap.appendChild(left);
    wrap.appendChild(right);
    hero.appendChild(wrap);
    heroes.push({ hero: hero, left: left, right: right });
  });

  function update() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var vh = window.innerHeight;
    var span = vh * 1.5;
    movers.forEach(function (m) {
      // move up with scroll at each layer's own speed, wrapping so clouds keep appearing
      var pos = (m.top / 100) * span - y * m.speed;
      pos = ((pos % span) + span) % span - vh * 0.25;
      m.el.style.transform = 'translate3d(0,' + pos.toFixed(1) + 'px,0)';
    });
    heroes.forEach(function (h) {
      var p = Math.min(Math.max(y / ((h.hero.offsetHeight || vh) * 0.8), 0), 1);
      var ease = 1 - Math.pow(1 - p, 2);
      h.left.style.transform = 'translate3d(' + (-ease * 40) + 'vw,0,0) scale(' + (1 + ease * 0.4) + ')';
      h.right.style.transform = 'translate3d(' + (ease * 40) + 'vw,0,0) scale(' + (1 + ease * 0.4) + ')';
      h.left.style.opacity = h.right.style.opacity = (0.9 - ease * 0.85).toFixed(3);
    });
  }

  var ticking = false;
  update();
  if (reduceMotion) return;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
})();
