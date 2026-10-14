/* =========================================================
   NEXA : store.js
   Shared data + theme engine used by the website AND the admin panel.
   Everything is saved in the browser (localStorage) under one key.
   Load this file in <head> so the theme applies before the page paints.
   ========================================================= */
(() => {
  'use strict';
  const KEY = 'nexa:data:v1';

  /* ---------- Font catalogue (name -> Google Fonts weights, fallback) ---------- */
  const FONTS = {
    'Playfair Display':   { w: '400;500;600;700', fb: 'Georgia, serif' },
    'Cormorant Garamond': { w: '400;500;600',     fb: 'Georgia, serif' },
    'Cinzel':             { w: '400;500;600',     fb: 'Georgia, serif' },
    'DM Serif Display':   { w: '',                fb: 'Georgia, serif' },
    'Lora':               { w: '400;500;600',     fb: 'Georgia, serif' },
    'Inter':              { w: '300;400;500;600', fb: 'system-ui, sans-serif' },
    'Poppins':            { w: '300;400;500;600', fb: 'system-ui, sans-serif' },
    'Montserrat':         { w: '300;400;500;600', fb: 'system-ui, sans-serif' },
    'Josefin Sans':       { w: '300;400;500;600', fb: 'system-ui, sans-serif' },
    'Great Vibes':        { w: '',                fb: 'cursive' },
    'Dancing Script':     { w: '400;500;600',     fb: 'cursive' },
    'Allura':             { w: '',                fb: 'cursive' },
    'Parisienne':         { w: '',                fb: 'cursive' }
  };

  /* ---------- Theme presets ---------- */
  const PRESETS = {
    'Midnight': { bg: '#0B0B0F', text: '#F7F4F2', pink: '#E8508A', blue: '#2F6BFF', header: 'transparent', footer: 'dark' },
    'Rose Noir': { bg: '#140910', text: '#FCEFF4', pink: '#FF5C9A', blue: '#8A5CFF', header: 'glass', footer: 'pink' },
    'Ocean':     { bg: '#060C1B', text: '#EAF1FF', pink: '#3FA9FF', blue: '#2F6BFF', header: 'solid', footer: 'blue' },
    'Ivory':     { bg: '#F7F4F2', text: '#1B1B22', pink: '#D63A78', blue: '#2F5BD8', header: 'light', footer: 'light' },
    'Violet':    { bg: '#0D0818', text: '#F3ECFF', pink: '#FF6FB5', blue: '#8B5CF6', header: 'gradient', footer: 'gradient' }
  };

  const slug = () => Math.random().toString(36).slice(2, 9);
  const P = (name, notes, price, img) => ({ id: slug(), name, notes, price, img });

  /* ---------- Default content ---------- */
  const defaults = () => ({
    products: {
      gents: [
        P('Nexa Noir',          'Black pepper, cedar, amber',    '$120', 'images/gents-1.svg'),
        P('Nexa Aqua Pulse',    'Sea salt, bergamot, driftwood', '$98',  'images/gents-2.svg'),
        P('Nexa Midnight Oud',  'Oud, saffron, leather',         '$145', 'images/gents-3.svg'),
        P('Nexa Steel Voltage', 'Cardamom, vetiver, white musk', '$110', 'images/gents-4.svg')
      ],
      ladies: [
        P('Nexa Rosé Muse',       'Damask rose, peony, vanilla',      '$115', 'images/ladies-1.svg'),
        P('Nexa Velvet Bloom',    'Plum, jasmine, sandalwood',        '$125', 'images/ladies-2.svg'),
        P('Nexa Pearl Petal',     'Pear blossom, white tea, musk',    '$105', 'images/ladies-3.svg'),
        P('Nexa Twilight Orchid', 'Orchid, pink pepper, tonka bean',  '$135', 'images/ladies-4.svg')
      ]
    },
    blogs: [
      { id: slug(), title: 'How to Apply Perfume So It Lasts All Day', date: '28 Sep 2026', iso: '2026-09-28', img: 'images/blog-1.svg',
        body: ['Apply fragrance right after a shower, when skin is warm and slightly moist. Scent clings better to hydrated skin, so an unscented lotion first helps.', 'Spray the pulse points: wrists, neck and inner elbows. Do not rub your wrists together, which crushes the top notes and shortens the opening.'] },
      { id: slug(), title: 'Woody, Floral or Fresh? Find Your Fragrance Family', date: '14 Sep 2026', iso: '2026-09-14', img: 'images/blog-2.svg',
        body: ['Woody scents such as cedar and oud feel warm and grounded. Floral scents like rose and jasmine feel soft and romantic. Fresh scents built on citrus and sea salt feel crisp and clean.', 'Think about the clothes and places you love, then test two or three families on skin. Wait an hour before you decide, because the base notes show up last.'] },
      { id: slug(), title: 'A Simple Guide to Choosing a Perfume Gift', date: '30 Aug 2026', iso: '2026-08-30', img: 'images/blog-3.svg',
        body: ['If you know what the person already wears, choose something in the same family. If you do not, a fresh or lightly woody scent is the safest starting point.', 'A gift-ready box and a small handwritten note turn a good bottle into a memorable present.'] },
      { id: slug(), title: 'Top, Heart and Base: How a Fragrance Unfolds', date: '12 Aug 2026', iso: '2026-08-12', img: 'images/blog-4.svg',
        body: ['Top notes are what you smell first and they fade within minutes. Heart notes form the character of the scent and last a few hours.', 'Base notes, such as amber, musk and woods, linger the longest. That is why a perfume can smell different at noon than it did when you sprayed it.'] },
      { id: slug(), title: 'Storing Your Perfume So It Stays Perfect', date: '27 Jul 2026', iso: '2026-07-27', img: 'images/blog-5.svg',
        body: ['Heat, light and humidity break down fragrance. Keep bottles in their box or in a cool drawer rather than on a sunny shelf or in the bathroom.', 'Store them upright with the cap on, and a well-kept bottle can stay true for years.'] },
      { id: slug(), title: 'Day Scents and Night Scents: When to Wear What', date: '09 Jul 2026', iso: '2026-07-09', img: 'images/blog-6.svg',
        body: ['For the day, light citrus, tea and clean florals stay polite in an office or a warm afternoon. For the evening, amber, oud, vanilla and rose can be richer and deeper.', 'In hot weather use fewer sprays. In cold weather, heavier scents carry beautifully.'] }
    ],
    testimonials: [
      { id: slug(), name: 'Daniel R.', product: 'Nexa Noir', stars: 5, text: 'Nexa Noir is the first fragrance people ask me about. It lasts through a full day at work and still smells rich at dinner.' },
      { id: slug(), name: 'Amira K.',  product: 'Nexa Rosé Muse', stars: 5, text: 'Rosé Muse feels soft and luxurious without being heavy. The bottle looks beautiful on my dresser, too.' },
      { id: slug(), name: 'Sophie L.', product: 'Nexa Velvet Bloom', stars: 5, text: 'I bought a set as a gift and the packaging was stunning. My sister has not stopped wearing Velvet Bloom.' }
    ],
    text: {
      'hero.kicker': 'Nexa Parfums',
      'hero.title': 'Wear Your Signature.',
      'hero.sub': 'Luxury fragrances crafted for him and her.',
      'spotlight.name': 'Nexa Noir',
      'spotlight.desc': 'Dark, warm and quietly confident. Noir opens with a spark of pepper, settles into smooth cedar, and lingers on amber long after you have left the room.',
      'spotlight.top': 'Black pepper, bergamot',
      'spotlight.heart': 'Cedarwood, violet leaf',
      'spotlight.base': 'Amber, tonka bean, musk',
      'footer.tagline': 'Luxury fragrances crafted for him and her.',
      'contact.email': 'hello@nexaparfums.com',
      'contact.phone': '+00 000 000 0000',
      'contact.address': 'Your Street, Your City',
      'contact.hours': 'Mon to Sat, 10am to 6pm'
    },
    theme: Object.assign({ preset: 'Midnight', headingFont: 'Playfair Display', bodyFont: 'Inter', scriptFont: 'Great Vibes', scale: 100 }, PRESETS['Midnight']),
    username: 'admin',
    password: 'nexa2026'
  });

  /* ---------- Load / save ---------- */
  const merge = (base, over) => {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!over || typeof over !== 'object') return out;
    Object.keys(over).forEach(k => {
      out[k] = (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof over[k] === 'object' && !Array.isArray(over[k]))
        ? merge(base[k], over[k]) : over[k];
    });
    return out;
  };

  let cache = null;
  const get = () => {
    if (cache) return cache;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* storage blocked */ }
    cache = merge(defaults(), saved);
    return cache;
  };
  const save = data => {
    cache = data || cache;
    try { localStorage.setItem(KEY, JSON.stringify(cache)); return true; }
    catch (e) { return false; } // storage full or blocked
  };
  const reset = () => { cache = defaults(); try { localStorage.removeItem(KEY); } catch (e) {} return cache; };
  const replaceAll = data => { cache = merge(defaults(), data); return save(); };

  /* ---------- Helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fontUrl = names => 'https://fonts.googleapis.com/css2?' + [...new Set(names)].filter(n => FONTS[n])
    .map(n => 'family=' + n.replace(/ /g, '+') + (FONTS[n].w ? ':wght@' + FONTS[n].w : '')).join('&') + '&display=swap';
  const stack = n => `'${n}', ${(FONTS[n] || { fb: 'serif' }).fb}`;

  /* ---------- Theme engine ---------- */
  const applyTheme = (theme, root = document.documentElement) => {
    const t = theme || get().theme;
    const s = root.style;
    s.setProperty('--black', t.bg);
    s.setProperty('--white', t.text);
    s.setProperty('--pink', t.pink);
    s.setProperty('--blue', t.blue);
    s.setProperty('--font-heading', stack(t.headingFont));
    s.setProperty('--font-body', stack(t.bodyFont));
    s.setProperty('--font-script', stack(t.scriptFont));
    if (root === document.documentElement) {
      s.fontSize = (t.scale || 100) + '%';
      root.dataset.header = t.header;
      root.dataset.footer = t.footer;
      root.dataset.light = isLight(t.bg) ? '1' : '0';
      const id = 'nexa-fonts';
      let link = document.getElementById(id);
      if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
      const href = fontUrl([t.headingFont, t.bodyFont, t.scriptFont]);
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
  };
  const isLight = hex => {
    const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150;
  };

  /* ---------- Text binding: <el data-cms="hero.title"> ---------- */
  const applyText = (scope = document) => {
    const text = get().text;
    scope.querySelectorAll('[data-cms]').forEach(el => {
      const v = text[el.dataset.cms];
      if (v != null) el.textContent = v;
    });
  };

  window.NexaStore = { get, save, reset, replaceAll, defaults, applyTheme, applyText, esc, slug, FONTS, PRESETS, fontUrl, stack };

  // Apply the saved theme immediately (skipped on the admin page itself)
  if (!document.documentElement.hasAttribute('data-no-theme')) applyTheme();
})();
