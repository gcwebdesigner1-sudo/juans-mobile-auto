(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var dock = document.getElementById('dock');
  var quote = document.getElementById('quote');
  var mobilePhoto = document.querySelector('.mobile-photo');
  var tabList = document.getElementById('tabs');
  var tabLinks = Array.prototype.slice.call(tabList.querySelectorAll('a'));
  var ticking = false;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function onScroll() {
    var y = window.scrollY;
    var h = window.innerHeight;
    if (!reduce) hero.style.setProperty('--p', clamp(y / h, 0, 1).toFixed(4));
    nav.classList.toggle('solid', y > h * 0.6);
    if (y < h * 0.4) {
      tabLinks.forEach(function (a) { a.classList.remove('active'); });
      if (tabList.scrollLeft > 0) tabList.scrollLeft = 0;
    }
    var nearQuote = quote.getBoundingClientRect().top < h * 0.8;
    dock.classList.toggle('show', y > h * 0.75 && !nearQuote);
    if (!reduce && mobilePhoto) {
      var r = mobilePhoto.getBoundingClientRect();
      var mp = clamp((h - r.top) / (h + r.height), 0, 1) * 2 - 1;
      mobilePhoto.style.setProperty('--mp', mp.toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* highlight the tab for the section in the middle of the screen */
  var tabIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      tabLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('active', on);
        if (on && window.innerWidth <= 1120) {
          tabList.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  tabLinks.forEach(function (a) {
    var s = document.querySelector(a.getAttribute('href'));
    if (s) tabIO.observe(s);
  });

  /* repairs: the sticky photo follows whichever row is mid-screen */
  var stageImgs = document.querySelectorAll('.svc-stage img');
  var svcs = document.querySelectorAll('.svc');
  var svcIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var key = e.target.getAttribute('data-key');
      svcs.forEach(function (s) { s.classList.toggle('is-active', s === e.target); });
      stageImgs.forEach(function (img) { img.classList.toggle('on', img.getAttribute('data-key') === key); });
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  svcs.forEach(function (s) { svcIO.observe(s); });
  if (svcs[0]) svcs[0].classList.add('is-active');

  /* symptom picker */
  var SYM = [
    { short: 'grinds when I brake', img: 'caliper', w: 640, h: 1138,
      title: 'Brake pads, and maybe rotors',
      body: "Squealing is the wear tab telling you the pads are getting thin. Grinding means they're gone and metal is hitting metal, which chews up the rotors next. Don't put this one off." },
    { short: "clicks but won't start", img: 'underside', w: 640, h: 480,
      title: 'The starter or the battery',
      body: "One loud click with bright dash lights usually points at the starter. Fast clicking with dim lights is more often a weak battery or a bad connection. Either way, it can be fixed where the car is sitting." },
    { short: 'died while I was driving', img: 'underside', w: 640, h: 480,
      title: 'The alternator',
      body: "If the battery light came on first, the alternator probably quit charging and the car ran on the battery until it was empty. A jump will get it started, but it won't stay running for long." },
    { short: 'has the check engine light on', img: 'scanner', w: 640, h: 853,
      title: 'Anything, until it gets scanned',
      body: "It could be a loose gas cap or a misfire. A scan pulls the code and the history behind it, so nobody has to guess. If the light is flashing, drive gently and call. That's an active misfire and it can damage the catalytic converter." },
    { short: 'clunks over bumps', img: 'strut', w: 640, h: 480,
      title: 'Sway bar links or struts',
      body: "A knock from one corner over speed bumps is very often a worn sway bar link. A car that floats or keeps bouncing after a dip needs struts. Both are driveway jobs." },
    { short: 'shakes or runs rough', img: 'intake-off', w: 640, h: 853,
      title: 'Spark plugs or a bad coil',
      body: "A shake at idle or a stumble when you step on it is usually one cylinder misfiring. Plugs and coils are the usual fix. On some V6 engines the intake has to come off to reach the back row." }
  ];
  var chips = document.querySelectorAll('.sym-chips button');
  var card = document.getElementById('sym-panel');
  var sImg = document.getElementById('sym-img');
  var sTitle = document.getElementById('sym-title');
  var sBody = document.getElementById('sym-body');
  var sText = document.getElementById('sym-text');
  var current = 0;

  function smsHref(msg) { return 'sms:+12402712402?&body=' + encodeURIComponent(msg); }

  function showSym(i) {
    if (i === current) return;
    current = i;
    var d = SYM[i];
    chips.forEach(function (c, k) { c.setAttribute('aria-selected', String(k === i)); });
    function apply() {
      sTitle.textContent = d.title;
      sBody.textContent = d.body;
      sText.href = smsHref('Hi Juan, my car ' + d.short + ". It's a ");
      sImg.src = 'assets/' + d.img + '-sm.webp';
      sImg.width = d.w; sImg.height = d.h;
      card.classList.remove('fading');
      sImg.classList.remove('swap');
    }
    if (reduce) { apply(); return; }
    card.classList.add('fading');
    sImg.classList.add('swap');
    setTimeout(apply, 280);
  }
  chips.forEach(function (c, k) { c.addEventListener('click', function () { showSym(k); }); });

  /* quote form: open a pre-written text to Juan */
  var form = document.getElementById('quote-form');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var lines = ['Hi Juan, this is ' + f.name.value.trim() + '. Looking for a quote.',
      'Car: ' + f.car.value.trim(),
      'Problem: ' + f.problem.value.trim()];
    if (f.where.value.trim()) lines.push('Car is at: ' + f.where.value.trim());
    window.location.href = smsHref(lines.join('\n'));
  });

  /* light reveal on a few blocks only */
  if (!reduce && 'IntersectionObserver' in window) {
    var rvEls = document.querySelectorAll('.repairs-intro, .quotes blockquote, .rating, .mobile-copy, .quote-call, .quote-form');
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    rvEls.forEach(function (el) { el.classList.add('rv'); rvIO.observe(el); });
  }

  onScroll();
})();
