/* =========================================================
   NEXA ADMIN : admin.js
   Edit / add / delete content, change theme. All data lives in
   the browser through NexaStore (see store.js).
   ========================================================= */
(() => {
  'use strict';
  const S = window.NexaStore;
  const root = document.getElementById('adm');
  if (!S || !root) return;

  const $  = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => [...ctx.querySelectorAll(sel)];
  const esc = S.esc;
  let data = S.get();
  const state = { cat: 'gents', pane: 'products' };

  /* ---------- small helpers ---------- */
  let toastTimer;
  const toast = (msg, isError) => {
    const t = $('#adm-toast');
    t.textContent = msg; t.classList.toggle('is-error', !!isError); t.classList.add('is-shown');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-shown'), 2200);
  };
  const persist = (msg = 'Saved') => {
    if (S.save(data)) toast(msg);
    else toast('Could not save. Browser storage is full or blocked. Try smaller images.', true);
  };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = iso => { const [y, m, d] = iso.split('-'); return `${d} ${MONTHS[+m - 1]} ${y}`; };
  const today = () => new Date().toISOString().slice(0, 10);

  // Resize an uploaded photo and return a small data URL (keeps storage light)
  const readImage = (file, max = 700) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let out = c.toDataURL('image/webp', .85);
        if (!out.startsWith('data:image/webp')) out = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', .85);
        resolve(out);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  /* ---------- generic editor dialog ---------- */
  const dlg = $('#adm-dialog'), form = $('#adm-editor');
  const fieldHTML = (f, v) => {
    const id = 'f-' + f.key;
    const label = `<label for="${id}">${esc(f.label)}</label>`;
    if (f.type === 'textarea') return `<div class="adm-field">${label}<textarea id="${id}" name="${f.key}" ${f.hint ? `placeholder="${esc(f.hint)}"` : ''}>${esc(v)}</textarea>${f.hint ? `<span class="adm-hint">${esc(f.hint)}</span>` : ''}</div>`;
    if (f.type === 'select') return `<div class="adm-field">${label}<select id="${id}" name="${f.key}">${f.options.map(o => `<option value="${esc(o)}" ${String(o) === String(v) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
    if (f.type === 'image') return `<div class="adm-field"><span class="adm-label">${esc(f.label)}</span>
      <div class="adm-upload"><img id="${id}-prev" src="${esc(v)}" alt="Preview">
        <div class="adm-upload__btns">
          <label class="adm-btn adm-btn--sm" for="${id}">Upload photo</label>
          <input type="file" id="${id}" accept="image/*" hidden>
          <button type="button" class="adm-btn adm-btn--sm" data-default-img="${f.key}">Use placeholder</button>
        </div></div></div>`;
    return `<div class="adm-field">${label}<input type="${f.type || 'text'}" id="${id}" name="${f.key}" value="${esc(v)}"></div>`;
  };

  const openEditor = ({ title, fields, values, onSave }) => {
    const v = Object.assign({}, values);
    form.innerHTML = `<h3>${esc(title)}</h3>` + fields.map(f => fieldHTML(f, v[f.key])).join('') +
      `<div class="adm-dialog__foot"><button type="button" class="adm-btn" data-close>Cancel</button><button type="submit" class="adm-btn adm-btn--primary">Save</button></div>`;

    fields.filter(f => f.type === 'image').forEach(f => {
      const prev = $('#f-' + f.key + '-prev', form);
      $('#f-' + f.key, form).addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        try { v[f.key] = await readImage(file); prev.src = v[f.key]; }
        catch (err) { toast('That image could not be read. Try a JPG or PNG.', true); }
      });
      $(`[data-default-img="${f.key}"]`, form).addEventListener('click', () => { v[f.key] = f.fallback; prev.src = f.fallback; });
    });
    $('[data-close]', form).addEventListener('click', () => dlg.close());

    form.onsubmit = e => {
      e.preventDefault();
      const out = {};
      for (const f of fields) {
        if (f.type === 'image') { out[f.key] = v[f.key]; continue; }
        const el = $('#f-' + f.key, form);
        out[f.key] = el.value.trim();
        if (f.required && !out[f.key]) { toast(`${f.label} is required.`, true); el.focus(); return; }
      }
      onSave(out); dlg.close();
    };
    dlg.showModal();
  };
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------- PRODUCTS ---------- */
  const renderProducts = () => {
    const list = data.products[state.cat];
    $$('[data-cat]').forEach(b => b.classList.toggle('is-active', b.dataset.cat === state.cat));
    $('#adm-products').innerHTML = list.length ? list.map((p, i) => `
      <div class="adm-item">
        <img src="${esc(p.img)}" alt="">
        <div><h4>${esc(p.name)} <span class="adm-hint">${esc(p.price)}</span></h4><p>${esc(p.notes)}</p></div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--sm" data-edit="${i}">Edit</button>
          <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${i}">Delete</button>
        </div>
      </div>`).join('') : '<div class="adm-empty">No products here yet. Use "Add product".</div>';
  };
  const productEditor = idx => {
    const list = data.products[state.cat];
    const fallback = `images/${state.cat}-1.svg`;
    const cur = idx == null ? { name: '', notes: '', price: '', img: fallback } : list[idx];
    openEditor({
      title: idx == null ? 'Add product' : 'Edit product', values: cur,
      fields: [
        { key: 'name', label: 'Perfume name', required: true },
        { key: 'notes', label: 'Short scent notes' },
        { key: 'price', label: 'Price (for example $120)', required: true },
        { key: 'img', label: 'Bottle photo', type: 'image', fallback }
      ],
      onSave: v => {
        if (idx == null) list.push(Object.assign({ id: S.slug() }, v)); else Object.assign(list[idx], v);
        persist(idx == null ? 'Product added' : 'Product updated'); renderProducts();
      }
    });
  };
  $('#adm-products').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) productEditor(+ed.dataset.edit);
    if (del) {
      const list = data.products[state.cat], p = list[+del.dataset.del];
      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) { list.splice(+del.dataset.del, 1); persist('Product deleted'); renderProducts(); }
    }
  });
  $$('[data-cat]').forEach(b => b.addEventListener('click', () => { state.cat = b.dataset.cat; renderProducts(); }));
  $('#adm-add-product').addEventListener('click', () => productEditor());

  /* ---------- BLOG POSTS ---------- */
  const renderBlogs = () => {
    $('#adm-blogs').innerHTML = data.blogs.length ? data.blogs.map((b, i) => `
      <div class="adm-item">
        <img src="${esc(b.img)}" alt="" style="object-fit:cover">
        <div><h4>${esc(b.title)}</h4><p>${esc(b.date)} · ${esc(b.body[0] || '')}</p></div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--sm" data-edit="${i}">Edit</button>
          <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${i}">Delete</button>
        </div>
      </div>`).join('') : '<div class="adm-empty">No posts yet. Use "Add post".</div>';
  };
  const blogEditor = idx => {
    const cur = idx == null ? { title: '', iso: today(), img: 'images/blog-1.svg', body: [] } : data.blogs[idx];
    openEditor({
      title: idx == null ? 'Add blog post' : 'Edit blog post',
      values: { title: cur.title, iso: cur.iso, img: cur.img, text: cur.body.join('\n\n') },
      fields: [
        { key: 'title', label: 'Title', required: true },
        { key: 'iso', label: 'Date', type: 'date', required: true },
        { key: 'img', label: 'Cover image', type: 'image', fallback: 'images/blog-1.svg' },
        { key: 'text', label: 'Article text', type: 'textarea', hint: 'Leave a blank line between paragraphs.', required: true }
      ],
      onSave: v => {
        const post = { id: cur.id || S.slug(), title: v.title, iso: v.iso, date: fmtDate(v.iso), img: v.img, body: v.text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean) };
        if (idx == null) data.blogs.push(post); else data.blogs[idx] = post;
        data.blogs.sort((a, b) => b.iso.localeCompare(a.iso));
        persist(idx == null ? 'Post added' : 'Post updated'); renderBlogs();
      }
    });
  };
  $('#adm-blogs').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) blogEditor(+ed.dataset.edit);
    if (del && confirm(`Delete "${data.blogs[+del.dataset.del].title}"? This cannot be undone.`)) { data.blogs.splice(+del.dataset.del, 1); persist('Post deleted'); renderBlogs(); }
  });
  $('#adm-add-blog').addEventListener('click', () => blogEditor());

  /* ---------- TESTIMONIALS ---------- */
  const renderReviews = () => {
    $('#adm-reviews').innerHTML = data.testimonials.length ? data.testimonials.map((t, i) => `
      <div class="adm-item adm-item--noimg">
        <div><h4>${esc(t.name)} <span class="adm-hint">${'★'.repeat(t.stars)} · ${esc(t.product)}</span></h4><p>${esc(t.text)}</p></div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--sm" data-edit="${i}">Edit</button>
          <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${i}">Delete</button>
        </div>
      </div>`).join('') : '<div class="adm-empty">No reviews yet. The testimonials section is hidden until you add one.</div>';
  };
  const reviewEditor = idx => {
    const cur = idx == null ? { name: '', product: '', stars: 5, text: '' } : data.testimonials[idx];
    openEditor({
      title: idx == null ? 'Add review' : 'Edit review', values: cur,
      fields: [
        { key: 'name', label: 'Customer name', required: true },
        { key: 'product', label: 'Product reviewed' },
        { key: 'stars', label: 'Stars (1 to 5)', type: 'select', options: [5, 4, 3, 2, 1] },
        { key: 'text', label: 'Review', type: 'textarea', required: true }
      ],
      onSave: v => {
        const item = { id: cur.id || S.slug(), name: v.name, product: v.product, stars: +v.stars, text: v.text };
        if (idx == null) data.testimonials.push(item); else data.testimonials[idx] = item;
        persist(idx == null ? 'Review added' : 'Review updated'); renderReviews();
      }
    });
  };
  $('#adm-reviews').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) reviewEditor(+ed.dataset.edit);
    if (del && confirm(`Delete the review from ${data.testimonials[+del.dataset.del].name}?`)) { data.testimonials.splice(+del.dataset.del, 1); persist('Review deleted'); renderReviews(); }
  });
  $('#adm-add-review').addEventListener('click', () => reviewEditor());

  /* ---------- SITE TEXT ---------- */
  const TEXT_FIELDS = [
    ['hero.kicker', 'Hero small line'], ['hero.title', 'Hero headline'], ['hero.sub', 'Hero sub-headline'],
    ['spotlight.name', 'Spotlight: perfume name'], ['spotlight.desc', 'Spotlight: description', true],
    ['spotlight.top', 'Spotlight: top notes'], ['spotlight.heart', 'Spotlight: heart notes'], ['spotlight.base', 'Spotlight: base notes'],
    ['footer.tagline', 'Footer tagline'],
    ['contact.email', 'Contact email'], ['contact.phone', 'Contact phone'], ['contact.address', 'Contact address'], ['contact.hours', 'Opening hours']
  ];
  const renderText = () => {
    $('#adm-text-fields').innerHTML = TEXT_FIELDS.map(([k, label, ta]) => `<div class="adm-field"><label for="t-${k}">${label}</label>${
      ta ? `<textarea id="t-${k}" data-key="${k}">${esc(data.text[k])}</textarea>` : `<input type="text" id="t-${k}" data-key="${k}" value="${esc(data.text[k])}">`}</div>`).join('');
  };
  $('#adm-text-form').addEventListener('submit', e => {
    e.preventDefault();
    $$('[data-key]', e.target).forEach(el => { data.text[el.dataset.key] = el.value.trim(); });
    persist('Site text saved');
  });
  $('#adm-text-reset').addEventListener('click', () => {
    if (!confirm('Reset all site text to the original wording?')) return;
    data.text = S.defaults().text; persist('Text reset'); renderText();
  });

  /* ---------- THEME ---------- */
  const HEADERS = { transparent: 'Transparent (solid on scroll)', solid: 'Solid', glass: 'Glass blur', gradient: 'Pink to blue gradient', light: 'Light' };
  const FOOTERS = { dark: 'Dark', gradient: 'Pink to blue gradient', light: 'Light', blue: 'Deep blue', pink: 'Deep pink' };
  const FONT_SETS = {
    headingFont: ['Playfair Display', 'Cormorant Garamond', 'Cinzel', 'DM Serif Display', 'Lora', 'Montserrat', 'Poppins'],
    bodyFont: ['Inter', 'Poppins', 'Montserrat', 'Lora', 'Josefin Sans'],
    scriptFont: ['Great Vibes', 'Dancing Script', 'Allura', 'Parisienne']
  };
  const pv = $('#adm-pv');

  const paintPreview = () => {
    const t = data.theme;
    S.applyTheme(t, pv);
    pv.dataset.header = t.header; pv.dataset.footer = t.footer;
    pv.style.fontSize = (t.scale / 100 * 16) + 'px';
    pv.style.setProperty('--font-script', S.stack(t.scriptFont));
  };
  const themeChanged = (msg) => { paintPreview(); S.save(data); if (msg) toast(msg); };

  const renderTheme = () => {
    const t = data.theme;
    $('#adm-presets').innerHTML = Object.keys(S.PRESETS).map(n => {
      const p = S.PRESETS[n];
      return `<button type="button" class="adm-preset ${t.preset === n ? 'is-active' : ''}" data-preset="${n}"><i style="background:linear-gradient(135deg,${p.bg} 50%,${p.pink} 50%)"></i>${n}</button>`;
    }).join('');
    $$('[data-color]').forEach(el => { el.value = t[el.dataset.color]; });
    Object.keys(FONT_SETS).forEach(k => {
      $('#th-' + k).innerHTML = FONT_SETS[k].map(f => `<option value="${f}" ${t[k] === f ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('');
    });
    $('#th-scale').value = t.scale; $('#th-scale-out').textContent = t.scale + '%';
    $('#adm-headers').innerHTML = Object.entries(HEADERS).map(([k, l]) => `<button type="button" class="adm-choice ${t.header === k ? 'is-active' : ''}" data-header="${k}">${l}</button>`).join('');
    $('#adm-footers').innerHTML = Object.entries(FOOTERS).map(([k, l]) => `<button type="button" class="adm-choice ${t.footer === k ? 'is-active' : ''}" data-footer="${k}">${l}</button>`).join('');
    paintPreview();
  };
  $('#adm-presets').addEventListener('click', e => {
    const b = e.target.closest('[data-preset]'); if (!b) return;
    Object.assign(data.theme, S.PRESETS[b.dataset.preset], { preset: b.dataset.preset });
    renderTheme(); themeChanged('Theme applied');
  });
  $$('[data-color]').forEach(el => el.addEventListener('input', () => {
    data.theme[el.dataset.color] = el.value; data.theme.preset = 'Custom';
    $$('.adm-preset').forEach(p => p.classList.remove('is-active')); themeChanged();
  }));
  $$('[data-color]').forEach(el => el.addEventListener('change', () => toast('Colors saved')));
  Object.keys(FONT_SETS).forEach(k => $('#th-' + k).addEventListener('change', e => { data.theme[k] = e.target.value; themeChanged('Font saved'); }));
  $('#th-scale').addEventListener('input', e => { data.theme.scale = +e.target.value; $('#th-scale-out').textContent = e.target.value + '%'; themeChanged(); });
  $('#th-scale').addEventListener('change', () => toast('Text size saved'));
  $('#adm-headers').addEventListener('click', e => {
    const b = e.target.closest('[data-header]'); if (!b) return;
    data.theme.header = b.dataset.header; renderTheme(); themeChanged('Header style saved');
  });
  $('#adm-footers').addEventListener('click', e => {
    const b = e.target.closest('[data-footer]'); if (!b) return;
    data.theme.footer = b.dataset.footer; renderTheme(); themeChanged('Footer style saved');
  });
  $('#adm-theme-reset').addEventListener('click', () => {
    if (!confirm('Reset colors, fonts, size, header and footer to the original theme?')) return;
    data.theme = S.defaults().theme; renderTheme(); themeChanged('Theme reset');
  });

  /* ---------- BACKUP and SECURITY ---------- */
  $('#adm-export').addEventListener('click', () => {
    const copy = JSON.parse(JSON.stringify(data)); delete copy.password; delete copy.username;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' }));
    a.download = 'nexa-site-data.json'; a.click(); URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });
  $('#adm-import').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const parsed = JSON.parse(fr.result); parsed.password = data.password; parsed.username = data.username;
        if (!S.replaceAll(parsed)) throw new Error('save');
        data = S.get(); renderAll(); toast('Backup restored');
      } catch (err) { toast('That file is not a valid Nexa backup.', true); }
    };
    fr.readAsText(file); e.target.value = '';
  });
  $('#adm-reset-all').addEventListener('click', () => {
    if (!confirm('Delete ALL your changes and restore the original website content and theme?')) return;
    const pw = data.password, un = data.username; data = S.reset(); data.password = pw; data.username = un; persist('Everything reset'); renderAll();
  });
  $('#adm-pass-form').addEventListener('submit', e => {
    e.preventDefault();
    const cur = $('#adm-curpass').value, user = $('#adm-newuser').value.trim(), pass = $('#adm-newpass').value;
    if (cur !== data.password) { toast('Your current password is not correct.', true); $('#adm-curpass').focus(); return; }
    if (user && user.length < 3) { toast('Username needs at least 3 characters.', true); return; }
    if (pass && pass.length < 6) { toast('Password needs at least 6 characters.', true); return; }
    if (!user && !pass) { toast('Enter a new username or a new password.', true); return; }
    if (user) data.username = user;
    if (pass) data.password = pass;
    persist('Login details changed'); e.target.reset(); $('#adm-current-user').textContent = data.username;
  });

  /* ---------- NAV, LOGIN, STARTUP ---------- */
  const renderAll = () => { renderProducts(); renderBlogs(); renderReviews(); renderText(); renderTheme(); };
  const showPane = name => {
    state.pane = name;
    $$('[data-pane]').forEach(b => b.classList.toggle('is-active', b.dataset.pane === name));
    $$('.adm-pane').forEach(p => { p.hidden = p.id !== 'pane-' + name; });
    if (name === 'theme') paintPreview();
    root.scrollTo(0, 0);
  };
  $$('[data-pane]').forEach(b => b.addEventListener('click', () => showPane(b.dataset.pane)));

  const showApp = () => { $('#adm-current-user').textContent = data.username; $('#adm-login').hidden = true; $('#adm-app').hidden = false; renderAll(); showPane(state.pane); };
  $('#adm-login-form').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#adm-user').value.trim().toLowerCase() === String(data.username).toLowerCase() && $('#adm-pass').value === data.password) {
      try { sessionStorage.setItem('nexa:auth', '1'); } catch (err) {}
      $('#adm-login-msg').textContent = ''; $('#adm-pass').value = ''; $('#adm-user').value = ''; showApp();
    } else {
      $('#adm-login-msg').textContent = 'The username or password is not correct.'; $('#adm-pass').value = ''; $('#adm-user').focus();
    }
  });
  $('#adm-logout').addEventListener('click', () => {
    try { sessionStorage.removeItem('nexa:auth'); } catch (err) {}
    $('#adm-app').hidden = true; $('#adm-login').hidden = false;
  });

  // Called when the admin screen opens (also used by the single-page site router)
  const show = () => {
    root.hidden = false;
    data = S.get();
    if (!document.getElementById('adm-fonts')) {            // load every font so the pickers can preview them
      const l = document.createElement('link'); l.id = 'adm-fonts'; l.rel = 'stylesheet';
      l.href = S.fontUrl(Object.keys(S.FONTS)); document.head.appendChild(l);
    }
    let ok = false; try { ok = sessionStorage.getItem('nexa:auth') === '1'; } catch (err) {}
    if (ok) showApp(); else { $('#adm-app').hidden = true; $('#adm-login').hidden = false; $('#adm-user').focus(); }
  };
  window.NexaAdmin = { show, hide: () => { root.hidden = true; } };
  if (!root.hasAttribute('hidden')) show();
})();
