/* =========================================================
   NEXA : main.js  (vanilla JS, no dependencies)
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     DATA : products, blog posts, testimonials and site text come from
     js/store.js, which the admin panel edits (saved in this browser)
     --------------------------------------------------------- */
  const S = window.NexaStore;
  const DATA = S.get();
  const esc = S.esc;
  const PRODUCTS = DATA.products;
  const BLOGS = DATA.blogs;
  const TESTIMONIALS = DATA.testimonials;
  S.applyText();

  // Home page: testimonials and the three latest blog cards
  const track0 = $('#carousel-track');
  if (track0) {
    if (!TESTIMONIALS.length) track0.closest('section').hidden = true;
    else track0.innerHTML = TESTIMONIALS.map(t => `
      <figure class="slide glass">
        <div class="stars" role="img" aria-label="${t.stars} out of 5 stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div>
        <blockquote>"${esc(t.text)}"</blockquote>
        <figcaption>${esc(t.name)}<span>${esc(t.product)}</span></figcaption>
      </figure>`).join('');
  }
  const teaser = $('#blog-teaser');
  if (teaser) {
    if (!BLOGS.length) teaser.closest('section').hidden = true;
    else teaser.innerHTML = BLOGS.slice(0, 3).map(b => `
      <article class="post reveal">
        <a href="blogs.html" class="post__img"><img src="${esc(b.img)}" alt="" width="600" height="400" loading="lazy"></a>
        <div class="post__body">
          <time datetime="${esc(b.iso)}">${esc(b.date)}</time>
          <h3><a href="blogs.html">${esc(b.title)}</a></h3>
          <a href="blogs.html" class="post__more">Read More</a>
        </div>
      </article>`).join('');
  }

  /* ---------------------------------------------------------
     PAGE LOADER
     --------------------------------------------------------- */
  const loader = $('#loader');
  const hideLoader = () => loader && loader.classList.add('is-done');
  const started = performance.now();
  window.addEventListener('load', () => {
    const wait = Math.max(0, 900 - (performance.now() - started));
    setTimeout(hideLoader, wait);
  });
  setTimeout(hideLoader, 4000); // safety net

  /* ---------------------------------------------------------
     NAVBAR : solid on scroll, mobile panel, back to top, parallax
     --------------------------------------------------------- */
  const navbar = $('#navbar');
  const toTop  = $('#to-top');
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('is-solid', y > 40);
    toTop.classList.toggle('is-shown', y > 700);

    if (!reduceMotion && y < window.innerHeight * 1.2) {
      parallaxEls.forEach(el => {
        el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`;
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Mobile slide-in panel
  const burger = $('#burger'), panel = $('#mobile-panel'), scrim = $('#scrim');
  const setMenu = open => {
    burger.classList.toggle('is-open', open);
    panel.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', () => setMenu(!panel.classList.contains('is-open')));
  scrim.addEventListener('click', () => setMenu(false));
  $$('a', panel).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Smooth scroll for in-page anchors
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && !id.startsWith('#/') && $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ---------------------------------------------------------
     HERO PARTICLES (canvas, pauses when off-screen)
     --------------------------------------------------------- */
  const canvas = $('#particles');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, dots = [], running = true;
    const colors = ['232,80,138', '47,107,255', '247,244,242'];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, w / 20));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2 + .4, vy: Math.random() * .35 + .08,
        vx: (Math.random() - .5) * .2, a: Math.random() * .5 + .15,
        c: colors[Math.floor(Math.random() * colors.length)]
      }));
    };
    const draw = () => {
      if (running) {
        ctx.clearRect(0, 0, w, h);
        dots.forEach(d => {
          d.y -= d.vy; d.x += d.vx;
          if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
          ctx.beginPath();
          ctx.fillStyle = `rgba(${d.c},${d.a})`;
          ctx.shadowColor = `rgba(${d.c},.8)`; ctx.shadowBlur = 8;
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(canvas);
    draw();
  }

  if ($('#grid')) {
  /* ---------------------------------------------------------
     COLLECTIONS : render cards, tabs, staggered reveal
     --------------------------------------------------------- */
  const section = $('#collections');
  const tabs    = $('#tabs');
  const grid    = $('#grid');
  const tabBtns = $$('.tabs__btn', tabs);
  let current = 'gents';
  let gridSeen = false;

  const cardHTML = (p, i) => `
    <article class="card" style="--i:${i}">
      <div class="card__img"><img src="${esc(p.img)}" alt="${esc(p.name)} perfume bottle" width="300" height="440" loading="lazy"></div>
      <h3 class="card__name">${esc(p.name)}</h3>
      <p class="card__notes">${esc(p.notes)}</p>
      <p class="card__price">${esc(p.price)}</p>
      <button class="btn" type="button" data-product="${i}">View Details</button>
    </article>`;

  const render = key => {
    grid.innerHTML = PRODUCTS[key].length ? PRODUCTS[key].map(cardHTML).join('') : '<p class="section__lead">New fragrances are coming soon.</p>';
  };

  const showGrid = () => {
    void grid.offsetWidth; // restart the staggered animation
    grid.classList.add('is-visible');
  };

  const switchTab = key => {
    if (key === current) return;
    current = key;
    section.dataset.theme = key;
    tabs.dataset.active = key;
    tabBtns.forEach(b => {
      const on = b.dataset.tab === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    grid.setAttribute('aria-labelledby', `tab-${key}`);

    grid.classList.remove('is-visible');
    setTimeout(() => { render(key); showGrid(); }, reduceMotion ? 0 : 280);
  };

  tabBtns.forEach((b, i) => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
    b.addEventListener('keydown', e => {      // arrow-key support for the tablist
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const next = tabBtns[(i + 1) % tabBtns.length];
        next.focus(); switchTab(next.dataset.tab);
      }
    });
  });

  render(current);
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting && !gridSeen) { gridSeen = true; showGrid(); obs.disconnect(); }
  }, { threshold: .15 }).observe(grid);

  /* ---------------------------------------------------------
     PRODUCT DETAILS DIALOG
     --------------------------------------------------------- */
  const modal = $('#modal');
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-product]');
    if (!btn) return;
    const p = PRODUCTS[current][+btn.dataset.product];
    if (!p) return;
    $('#modal-img').src = p.img;
    $('#modal-img').alt = `${p.name} perfume bottle`;
    $('#modal-title').textContent = p.name;
    $('#modal-notes').textContent = `Scent notes: ${p.notes}.`;
    $('#modal-price').textContent = p.price;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  });
  $('#modal-close').addEventListener('click', () => modal.close());
  $('#modal-cta').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); // click backdrop

  }

  /* ---------------------------------------------------------
     SCROLL REVEAL (IntersectionObserver)
     --------------------------------------------------------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  if ($('#carousel-track')) {
  /* ---------------------------------------------------------
     TESTIMONIAL CAROUSEL (auto-slide, dots, pause on hover)
     --------------------------------------------------------- */
  const track = $('#carousel-track');
  const dotsWrap = $('#carousel-dots');
  const slides = $$('.slide', track);
  const carousel = $('#carousel');
  let idx = 0, timer;

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `Show review ${i + 1}`);
    d.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(d);
  });
  const dots = $$('button', dotsWrap);

  function go(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, n) => {
      d.classList.toggle('is-active', n === idx);
      d.setAttribute('aria-selected', n === idx);
    });
  }
  function start()   { if (!reduceMotion) timer = setInterval(() => go(idx + 1), 5500); }
  function restart() { clearInterval(timer); start(); }

  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin',  () => clearInterval(timer));
  carousel.addEventListener('focusout', start);
  go(0); start();

  }

  if ($('#newsletter-form')) {
  /* ---------------------------------------------------------
     NEWSLETTER FORM VALIDATION
     --------------------------------------------------------- */
  const form  = $('#newsletter-form');
  const email = $('#email');
  const msg   = $('#form-msg');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = email.value.trim();
    msg.className = 'form-msg';

    if (!value) {
      email.classList.add('is-invalid');
      msg.textContent = 'Please enter your email address.';
      msg.classList.add('is-error');
      email.focus();
    } else if (!emailRe.test(value)) {
      email.classList.add('is-invalid');
      msg.textContent = 'That email looks incomplete. Try name@example.com.';
      msg.classList.add('is-error');
      email.focus();
    } else {
      email.classList.remove('is-invalid');
      msg.textContent = 'Thank you for subscribing. Your first Nexa note is on its way.';
      msg.classList.add('is-success');
      form.reset();
      // TODO: send `value` to your email service here (Mailchimp, Brevo, your own API...)
    }
  });
  email.addEventListener('input', () => email.classList.remove('is-invalid'));

  }

  /* ---------------------------------------------------------
     BLOGS PAGE : list and article dialog
     --------------------------------------------------------- */
  const blogList = $('#blog-list');
  if (blogList) {
    blogList.innerHTML = BLOGS.map((b, n) => `
      <article class="post reveal">
        <button type="button" class="post__img" data-post="${n}" aria-label="Read: ${esc(b.title)}"><img src="${esc(b.img)}" alt="" width="600" height="400" loading="lazy"></button>
        <div class="post__body">
          <time datetime="${esc(b.iso)}">${esc(b.date)}</time>
          <h3>${esc(b.title)}</h3>
          <button type="button" class="post__more" data-post="${n}">Read More</button>
        </div>
      </article>`).join('');
    $$('.reveal', blogList).forEach(el => revealObs.observe(el));

    const bm = $('#blog-modal');
    blogList.addEventListener('click', e => {
      const t = e.target.closest('[data-post]');
      if (!t) return;
      const b = BLOGS[+t.dataset.post];
      $('#blog-modal-img').src = b.img;
      $('#blog-modal-title').textContent = b.title;
      $('#blog-modal-date').textContent = b.date;
      $('#blog-modal-body').innerHTML = b.body.map(p => `<p>${esc(p)}</p>`).join('');
      if (typeof bm.showModal === 'function') bm.showModal(); else bm.setAttribute('open', '');
    });
    $('#blog-modal-close').addEventListener('click', () => bm.close());
    bm.addEventListener('click', e => { if (e.target === bm) bm.close(); });
  }

  /* ---------------------------------------------------------
     CONTACT FORM VALIDATION
     --------------------------------------------------------- */
  const cform = $('#contact-form');
  if (cform) {
    const cmsg = $('#contact-msg');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const fields = ['c-name', 'c-email', 'c-message'].map(id => $('#' + id));
    fields.forEach(f => f.addEventListener('input', () => f.classList.remove('is-invalid')));
    cform.addEventListener('submit', e => {
      e.preventDefault();
      cmsg.className = 'form-msg';
      const bad = fields.filter(f => !f.value.trim() || (f.type === 'email' && !re.test(f.value.trim())));
      fields.forEach(f => f.classList.toggle('is-invalid', bad.includes(f)));
      if (bad.length) {
        cmsg.textContent = bad[0].type === 'email' && bad[0].value.trim()
          ? 'That email looks incomplete. Try name@example.com.'
          : 'Please fill in your name, email and message.';
        cmsg.classList.add('is-error'); bad[0].focus();
        return;
      }
      cmsg.textContent = 'Thank you. Your message has been sent and we will reply within one business day.';
      cmsg.classList.add('is-success');
      cform.reset();
      // TODO: send the form data to your email service or backend here
    });
  }

  /* ---------------------------------------------------------
     FOOTER YEAR
     --------------------------------------------------------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
