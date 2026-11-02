(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '18682591409';

  /* theme: light by default, dark only when chosen */
  const themeBtn = document.querySelector('.theme-toggle');
  const setTheme = (t) => {
    root.dataset.theme = t;
    themeBtn.innerHTML = t === 'dark' ? '<i class="ph-light ph-sun"></i>' : '<i class="ph-light ph-moon"></i>';
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    document.querySelector('meta[name="theme-color"]').content = t === 'dark' ? '#0D1612' : '#EDF0EA';
  };
  try { if (localStorage.getItem('tctt-theme') === 'dark') setTheme('dark'); } catch (e) {}
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('tctt-theme', next); } catch (e) {}
  });

  /* mobile menu */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  const toggleMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

  /* smooth scroll */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    if (window.gsap) { gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: id === '#top' ? 0 : -24 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* marquee: duplicate the track for a seamless loop */
  const track = document.querySelector('.marquee-track');
  track.parentNode.appendChild(track.cloneNode(true)).setAttribute('aria-hidden', 'true');

  /* reveal on enter */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (el.closest('.bento') ? (i % 4) * 0.08 : 0) + 's';
    io.observe(el);
  });

  /* manifesto: wrap words so they can scrub from dim to full */
  const scrub = document.getElementById('scrub');
  const words = [];
  [...scrub.childNodes].forEach((node) => {
    if (node.nodeType !== 3) { words.push(node); node.classList.add('w'); return; }
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const s = document.createElement('span'); s.className = 'w'; s.textContent = part;
      words.push(s); frag.appendChild(s);
    });
    node.replaceWith(frag);
  });

  /* services accordion */
  const slices = [...document.querySelectorAll('.slice')];
  const open = (s) => slices.forEach((x) => x.classList.toggle('is-open', x === s));
  const hoverable = matchMedia('(hover: hover) and (min-width: 768px)').matches;
  slices.forEach((s) => {
    if (hoverable) s.addEventListener('mouseenter', () => open(s));
    s.addEventListener('click', () => open(s));
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(s); } });
  });

  /* process index follows the step in view */
  const idx = [...document.querySelectorAll('.process-index li')];
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = en.target.dataset.i;
      idx.forEach((li) => li.classList.toggle('is-active', li.dataset.i === i));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('.pstep').forEach((s) => stepIO.observe(s));

  /* GSAP: hero entrance, parallax, scrubbed manifesto, image scale + fade */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-media img', { scale: 1.12, duration: 2.2, ease: 'expo.out' });
    gsap.from('.hero-anim', { yPercent: 110, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
    gsap.to('.hero-media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    gsap.to(words, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });

    document.querySelectorAll('.pstep-img img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'center center', scrub: true } });
      gsap.fromTo(img.parentNode, { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'top 35%', scrub: true } });
      gsap.to(img.parentNode, { opacity: 0.25, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'bottom 30%', end: 'bottom top', scrub: true } });
    });

    gsap.to('.storm-media img', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.storm', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* tuck the nav away while scrolling down, bring it back on the way up */
    const nav = document.querySelector('.nav');
    ScrollTrigger.create({
      start: 400, end: 'max',
      onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1 && !document.body.classList.contains('menu-open'))
    });
    ScrollTrigger.create({ start: 0, end: 400, onEnterBack: () => nav.classList.remove('is-hidden') });
  } else {
    words.forEach((w) => (w.style.opacity = 1));
  }

  /* estimator */
  const state = { job: 'remove', size: 'm', near: 'house' };
  const base = { s: [700, 1500], m: [2000, 4200], l: [4800, 11000] };
  const jobMult = { remove: 1, prune: 0.5, palm: 0.4 };
  const nearMult = { open: 0.85, house: 1.2, lines: 1.55 };
  const notes = {
    open: 'With open ground we can often fell it in one piece, which is the quickest and cheapest way.',
    house: 'Near a house we section the tree down on ropes, which takes longer but nothing gets hit.',
    lines: 'Near power lines we plan around a T&TEC outage first. Live lines are never touched.'
  };
  const lo = document.getElementById('estLo'), hi = document.getElementById('estHi');
  const fmt = (n) => (Math.round(n / 50) * 50).toLocaleString('en-US');
  const shown = { lo: 2400, hi: 5200 };
  const animateTo = (el, key, target) => {
    if (reduce || !window.gsap) { el.textContent = fmt(target); shown[key] = target; return; }
    gsap.to(shown, { [key]: target, duration: 0.7, ease: 'expo.out', onUpdate: () => (el.textContent = fmt(shown[key])) });
  };
  const calc = () => {
    const [a, b] = base[state.size];
    const m = jobMult[state.job] * nearMult[state.near];
    const stump = document.getElementById('stump').checked && state.job === 'remove' ? [450, 900] : [0, 0];
    animateTo(lo, 'lo', a * m + stump[0]);
    animateTo(hi, 'hi', b * m + stump[1]);
    document.getElementById('estNote').textContent = notes[state.near];
  };
  document.querySelectorAll('.chips').forEach((group) => {
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', c === chip); });
      state[group.dataset.key] = chip.dataset.v;
      document.querySelector('.toggle').style.opacity = state.job === 'remove' ? 1 : 0.45;
      calc();
    });
    group.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.classList.contains('is-on')));
  });
  document.getElementById('stump').addEventListener('change', calc);
  calc();

  /* reviews carousel */
  const revs = [...document.querySelectorAll('.rev')];
  const photos = [...document.querySelectorAll('.rev-photo')];
  let r = 0, timer;
  const show = (n) => {
    r = (n + revs.length) % revs.length;
    revs.forEach((x, i) => x.classList.toggle('is-on', i === r));
    photos.forEach((x, i) => x.classList.toggle('is-on', i === r));
    document.getElementById('revN').textContent = r + 1;
  };
  const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show(r + 1), 7000); };
  document.getElementById('revPrev').addEventListener('click', () => { show(r - 1); auto(); });
  document.getElementById('revNext').addEventListener('click', () => { show(r + 1); auto(); });
  auto();

  /* quote form: validate, then open WhatsApp with the details filled in */
  const form = document.getElementById('quoteForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    ['qName', 'qPhone', 'qArea'].forEach((id) => {
      const el = document.getElementById(id);
      const bad = id === 'qPhone' ? el.value.replace(/\D/g, '').length < 7 : !el.value.trim();
      el.closest('.field').classList.toggle('invalid', bad);
      el.setAttribute('aria-invalid', bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    if (!ok) return;
    const f = new FormData(form);
    const text = [
      'Hi Tree Cutting TT, I would like a quote.',
      `Name: ${f.get('name')}`,
      `Phone: ${f.get('phone')}`,
      `Area: ${f.get('area')}`,
      `Service: ${f.get('job')}`,
      f.get('msg') ? `About the tree: ${f.get('msg')}` : ''
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    document.getElementById('formOk').hidden = false;
  });
  form.querySelectorAll('input, select').forEach((el) =>
    el.addEventListener('input', () => el.closest('.field').classList.remove('invalid'))
  );
})();
