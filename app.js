(function () {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), S);
  const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'
  };
  const icon = (n) => '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || ICONS.spark) + "</svg></span>";

  // ---------- Тексты и цвета ----------
  document.title = S.brand + " — " + S.niche.toLowerCase() + " в " + S.city;
  const meta = $('meta[name="description"]');
  if (meta) meta.content = S.hero.stages[0].text;
  $$("[data-t]").forEach((el) => (el.textContent = get(el.dataset.t) || ""));
  const R = document.documentElement.style;
  R.setProperty("--accent", S.colors.accent);
  R.setProperty("--accent-dark", S.colors.accentDark);
  R.setProperty("--warm", S.colors.warm);

  // ---------- Контакты ----------
  const tel = "tel:+" + S.phone.replace(/\D/g, "");
  $$("[data-phone]").forEach((a) => { a.href = tel; if (!a.textContent.trim()) a.textContent = S.phone; });
  const waText = encodeURIComponent("Здравствуйте! Хочу узнать стоимость химчистки: ");
  $$("[data-wa]").forEach((a) => { a.href = "https://wa.me/" + S.whatsapp + "?text=" + waText; a.target = "_blank"; a.rel = "noopener"; });
  $$("[data-tg]").forEach((a) => { if (S.telegram) { a.href = "https://t.me/" + S.telegram; a.target = "_blank"; a.rel = "noopener"; } else a.remove(); });

  // Пометки «демо» прячутся, когда в client.js указано demo: false
  if (S.demo === false) $$(".demo-only").forEach((el) => el.remove());

  // ---------- Шапка ----------
  const top = $("#top");
  const onTop = () => top.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onTop, { passive: true }); onTop();

  // ---------- СЦЕНА: кадры из Blender, прокрутка = очистка ----------
  (function hero() {
    const sec = $("#hero"), cv = $("#heroCanvas"), ctx = cv.getContext("2d");
    const copy = $("#heroCopy"), bar = $("#heroBar"), hint = $("#heroHint");
    const st = S.hero.stages;
    copy.innerHTML = st.map((s, i) =>
      '<div class="stage" data-i="' + i + '"><p class="kicker">' + esc(s.kicker) + "</p><h1>" + esc(s.title) + "</h1><p>" + esc(s.text) + "</p>" +
      (i === st.length - 1 ? '<a href="#calc" class="btn btn--accent">' + esc(S.hero.cta) + "</a>" : "") + "</div>").join("");
    const stages = $$(".stage", copy);

    const N = S.sequence ? S.sequence.frames : 0;
    const src = (i) => S.sequence.path.replace("####", String(i + 1).padStart(4, "0"));
    const frames = new Array(N);
    let cur = -1, want = 0, raf = 0;

    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d;
      cur = -1; draw();
    }
    function nearest(i) {
      for (let k = 0; k < N; k++) {
        if (frames[i - k] && frames[i - k].ready) return frames[i - k];
        if (frames[i + k] && frames[i + k].ready) return frames[i + k];
      }
      return null;
    }
    function draw() {
      raf = 0;
      if (!N) return;
      const im = nearest(want);
      if (!im || (cur === want && im.ready)) return;
      cur = want;
      const W = cv.width, H = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
      const portrait = W / H < 1;
      // На телефоне — вписываем по ширине и опускаем вниз, на компьютере — заполняем экран
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--stage").trim();
      if (portrait) {
        // Телефон: диван по центру, края картинки растворяются в цвете стены и пола
        const s = (W / iw) * 1.45, dw = iw * s, dh = ih * s;
        const dx = (W - dw) / 2, dy = H * 0.6 - dh / 2;
        const [top, bot] = edgeColors(im);
        ctx.fillStyle = top; ctx.fillRect(0, 0, W, dy + 2);
        ctx.fillStyle = bot; ctx.fillRect(0, dy + dh - 2, W, H);
        ctx.drawImage(im, dx, dy, dw, dh);
        let g = ctx.createLinearGradient(0, dy, 0, dy + dh * 0.3);
        g.addColorStop(0, top); g.addColorStop(1, top.replace("rgb", "rgba").replace(")", ",0)"));
        ctx.fillStyle = g; ctx.fillRect(0, dy, W, dh * 0.3);
        g = ctx.createLinearGradient(0, dy + dh * 0.82, 0, dy + dh);
        g.addColorStop(0, bot.replace("rgb", "rgba").replace(")", ",0)")); g.addColorStop(1, bot);
        ctx.fillStyle = g; ctx.fillRect(0, dy + dh * 0.82, W, dh * 0.18 + 1);
        return;
      }
      const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
      const dx = (W - dw) / 2 + W * 0.18, dy = (H - dh) / 2 + H * 0.04;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(im, dx, dy, dw, dh);
      // мягкий переход картинки в фон под текстом
      const g = ctx.createLinearGradient(0, 0, W * 0.48, 0);
      g.addColorStop(0, bg); g.addColorStop(0.45, bg); g.addColorStop(1, bg + "00");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W * 0.48, H);
    }
    // Средний цвет верхнего и нижнего края кадра (стена и пол)
    let edges = null;
    function edgeColors(im) {
      if (edges) return edges;
      const t = document.createElement("canvas"); t.width = 32; t.height = 18;
      const c = t.getContext("2d"); c.drawImage(im, 0, 0, 32, 18);
      const row = (y) => { const d = c.getImageData(0, y, 32, 1).data; let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        return "rgb(" + Math.round(r / 32) + "," + Math.round(g / 32) + "," + Math.round(b / 32) + ")"; };
      return (edges = [row(0), row(17)]);
    }
    function progress() {
      const r = sec.getBoundingClientRect();
      return clamp(-r.top / (sec.offsetHeight - innerHeight), 0, 1);
    }
    function update() {
      const p = progress();
      // кадры занимают первые 85% прокрутки, затем пауза на чистом диване
      want = Math.round(clamp(p / 0.85, 0, 1) * (N - 1));
      const si = p < 0.28 ? 0 : p < 0.68 ? 1 : 2;
      stages.forEach((el, i) => el.classList.toggle("on", i === si));
      bar.style.width = p * 100 + "%";
      hint.style.opacity = p > 0.03 ? 0 : 1;
      if (!raf) raf = requestAnimationFrame(draw);
    }
    // Загрузка: сначала первый кадр, потом каждый 6-й, затем остальные
    const order = [];
    for (let step of [N, 6, 3, 1]) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
    let li = 0;
    function loadNext() {
      if (li >= order.length) return;
      const i = order[li++], im = new Image();
      im.decoding = "async";
      im.onload = () => { im.ready = true; if (Math.abs(i - want) < 4 || cur < 0) { cur = -1; draw(); } loadNext(); };
      im.onerror = loadNext;
      im.src = src(i);
      frames[i] = im;
    }
    if (N) for (let k = 0; k < 4; k++) loadNext();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", size);
    size(); update();
  })();

  // ---------- Цифры ----------
  $("#stats").innerHTML = S.stats.map((s) => '<div class="stat"><b>' + esc(s.value) + "</b><span>" + esc(s.label) + "</span></div>").join("");

  // ---------- Почистите сами ----------
  (function scratch() {
    const box = $("#scratch"), cv = $("#scratchCanvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    const cleanImg = $("#scratchClean"), meter = $("#scratchMeter"), pct = $("#scratchPct");
    const done = $("#scratchDone"), tip = $("#scratchTip");
    const dirty = new Image();
    cleanImg.src = S.scratch.after;
    dirty.src = S.scratch.before;
    let mask = null, finished = false, drawing = false, last = null;
    const brush = document.createElement("div");
    brush.className = "brush";
    document.body.appendChild(brush);

    // object-fit: cover, как у картинки снизу
    function layout() {
      const W = cv.width, H = cv.height, iw = dirty.naturalWidth, ih = dirty.naturalHeight;
      const s = Math.max(W / iw, H / ih);
      return { s, dx: (W - iw * s) / 2, dy: (H - ih * s) / 2 };
    }
    function reset() {
      const d = Math.min(devicePixelRatio || 1, 2);
      cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d;
      if (!dirty.complete || !dirty.naturalWidth) return;
      const L = layout();
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(dirty, L.dx, L.dy, dirty.naturalWidth * L.s, dirty.naturalHeight * L.s);
      buildMask();
      painted = 0;
      finished = false; done.classList.remove("on"); tip.style.opacity = 1;
      setPct(0);
    }
    // Считаем только пиксели, где «грязный» и «чистый» кадры отличаются (сам диван)
    function buildMask() {
      if (!cleanImg.complete || !cleanImg.naturalWidth) return;
      const W = cv.width, H = cv.height, step = Math.max(8, Math.round(W / 90));
      const t = document.createElement("canvas"); t.width = W; t.height = H;
      const tc = t.getContext("2d"), L = layout();
      tc.drawImage(cleanImg, L.dx, L.dy, cleanImg.naturalWidth * L.s, cleanImg.naturalHeight * L.s);
      let a, b;
      // Если сайт открыт файлом (file://), браузер запрещает читать пиксели — считаем приблизительно
      try { a = ctx.getImageData(0, 0, W, H).data; b = tc.getImageData(0, 0, W, H).data; }
      catch (_) { mask = null; return; }
      mask = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4;
        if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) mask.push(i + 3);
      }
    }
    function setPct(v) {
      meter.style.width = v + "%";
      pct.textContent = v + "% чисто";
    }
    let measureT = 0;
    let painted = 0;
    function measure() {
      let v;
      if (mask && mask.length) {
        const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let c = 0;
        for (const i of mask) if (data[i] < 40) c++;
        v = Math.min(100, Math.round((c / mask.length) * 100 / 0.92));
      } else {
        v = Math.min(100, Math.round(painted / (cv.width * cv.height * 0.45) * 100));
      }
      setPct(v);
      if (v >= 80 && !finished) {
        finished = true;
        done.classList.add("on");
        ctx.globalCompositeOperation = "destination-out";
        let a = 0;
        (function fade() { a += 0.08; ctx.fillStyle = "rgba(0,0,0," + a + ")"; ctx.fillRect(0, 0, cv.width, cv.height); if (a < 1) requestAnimationFrame(fade); else setPct(100); })();
      }
    }
    function pos(e) {
      const r = cv.getBoundingClientRect(), d = cv.width / r.width;
      return { x: (e.clientX - r.left) * d, y: (e.clientY - r.top) * d, r: Math.max(34, r.width * 0.055) * d };
    }
    function paint(p) {
      ctx.globalCompositeOperation = "destination-out";
      const pts = [];
      if (last) {
        const dist = Math.hypot(p.x - last.x, p.y - last.y), n = Math.ceil(dist / (p.r * 0.3));
        for (let k = 1; k <= n; k++) pts.push({ x: last.x + (p.x - last.x) * k / n, y: last.y + (p.y - last.y) * k / n });
      } else pts.push(p);
      for (const q of pts) {
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, p.r);
        g.addColorStop(0, "rgba(0,0,0,.9)"); g.addColorStop(0.6, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.x, q.y, p.r, 0, Math.PI * 2); ctx.fill();
        painted += p.r * p.r * 0.9;
      }
      last = p;
      tip.style.opacity = 0;
      clearTimeout(measureT); measureT = setTimeout(measure, 120);
    }
    cv.addEventListener("pointerdown", (e) => { if (finished) return; drawing = true; last = null; cv.setPointerCapture(e.pointerId); paint(pos(e)); });
    cv.addEventListener("pointermove", (e) => {
      brush.style.left = e.clientX + "px"; brush.style.top = e.clientY + "px";
      brush.style.width = brush.style.height = pos(e).r / (cv.width / cv.getBoundingClientRect().width) * 2 + "px";
      brush.style.margin = "-" + parseFloat(brush.style.width) / 2 + "px 0 0 -" + parseFloat(brush.style.width) / 2 + "px";
      // На компьютере чистим просто движением мыши, на телефоне — касанием
      if (finished) return;
      if (drawing || e.pointerType === "mouse") paint(pos(e));
    });
    const stop = () => { drawing = false; last = null; };
    cv.addEventListener("pointerup", stop);
    cv.addEventListener("pointercancel", stop);
    cv.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") brush.classList.add("on"); });
    cv.addEventListener("pointerleave", () => { brush.classList.remove("on"); last = null; });
    $("#scratchReset").addEventListener("click", reset);
    let pending = 2;
    const ready = () => { if (--pending === 0) reset(); };
    dirty.onload = ready;
    if (cleanImg.complete && cleanImg.naturalWidth) ready(); else cleanImg.onload = ready;
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(reset, 200); });
  })();

  // ---------- Калькулятор ----------
  (function calc() {
    const C = S.calc, qty = {}, opts = {};
    $("#calcItems").innerHTML = C.items.map((it) =>
      '<div class="item rv" data-id="' + it.id + '"><span class="item__badge">0</span>' +
      '<div class="item__img"><img src="' + esc(it.img || "") + '" alt="" loading="lazy"></div>' +
      '<div class="item__name">' + esc(it.name) + '</div>' +
      '<div class="item__row"><span class="item__price">' + rub(it.price) + "</span>" +
      '<div class="qty"><button type="button" data-d="-1" aria-label="Меньше">−</button><output>0</output><button type="button" data-d="1" aria-label="Больше">+</button></div></div></div>').join("");
    $("#calcOptions").innerHTML = C.options.map((o) =>
      '<label class="opt"><input type="checkbox" data-o="' + o.id + '"><span>' + esc(o.name) + " <small>+" + o.percent + "%</small></span></label>").join("");
    let shown = 0, anim = 0;
    function tween(to) {
      cancelAnimationFrame(anim);
      const from = shown, t0 = performance.now();
      (function step(t) {
        const k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3);
        shown = from + (to - from) * e;
        $("#calcTotal").textContent = rub(shown);
        if (k < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    function summary() {
      return C.items.filter((i) => qty[i.id]).map((i) => i.name + " × " + qty[i.id])
        .concat(C.options.filter((x) => opts[x.id]).map((x) => x.name)).join(", ");
    }
    function recalc() {
      const base = C.items.reduce((s, i) => s + (qty[i.id] || 0) * i.price, 0);
      const pctSum = C.options.reduce((s, o) => s + (opts[o.id] ? o.percent : 0), 0);
      const total = base * (1 + pctSum / 100);
      const low = total > 0 && total < C.minOrder;
      tween(low ? C.minOrder : total);
      $("#calcMin").textContent = low ? "Минимальный заказ — " + rub(C.minOrder) : "";
      const lines = C.items.filter((i) => qty[i.id]).map((i) => "<li><span>" + esc(i.name) + " × " + qty[i.id] + "</span><b>" + rub(i.price * qty[i.id]) + "</b></li>");
      $("#calcList").innerHTML = lines.join("") || '<li class="muted">Пока ничего не выбрано</li>';
      $$(".item").forEach((el) => {
        const n = qty[el.dataset.id] || 0;
        el.querySelector("output").textContent = n;
        el.querySelector(".item__badge").textContent = n;
        el.classList.toggle("on", n > 0);
      });
    }
    $("#calcItems").addEventListener("click", (e) => {
      const card = e.target.closest(".item"); if (!card) return;
      const b = e.target.closest("button");
      const d = b ? Number(b.dataset.d) : (qty[card.dataset.id] ? 0 : 1);
      if (!d) return;
      qty[card.dataset.id] = clamp((qty[card.dataset.id] || 0) + d, 0, 50);
      recalc();
    });
    $("#calcOptions").addEventListener("change", (e) => { opts[e.target.dataset.o] = e.target.checked; recalc(); });
    $("#calcOrder").addEventListener("click", () => {
      const s = summary();
      if (s) $("#formComment").value = s + " (≈ " + $("#calcTotal").textContent + ")";
    });
    recalc();
  })();

  // ---------- Галерея клиента ----------
  if (S.gallery && S.gallery.length) {
    $("#gallerySec").hidden = false;
    $("#gallery").innerHTML = S.gallery.map((g) =>
      '<figure class="ba rv"><img src="' + esc(g.after) + '" alt="После"><img class="ba__b" src="' + esc(g.before) + '" alt="До">' +
      '<div class="ba__line"></div><input type="range" min="0" max="100" value="50" aria-label="До и после">' +
      (g.caption ? "<figcaption>" + esc(g.caption) + "</figcaption>" : "") + "</figure>").join("");
    $$(".ba").forEach((f) => {
      const r = $("input", f), b = $(".ba__b", f), l = $(".ba__line", f);
      r.addEventListener("input", () => { b.style.clipPath = "inset(0 " + (100 - r.value) + "% 0 0)"; l.style.left = r.value + "%"; });
    });
  }

  // ---------- Остальные блоки ----------
  $("#advList").innerHTML = S.advantages.map((s, i) =>
    '<div class="adv__card rv" style="transition-delay:' + i * 80 + 'ms">' + icon(s.icon) + "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div>").join("");
  $("#stepsList").innerHTML = S.steps.map((s, i) =>
    '<li class="rv" style="transition-delay:' + i * 100 + 'ms"><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>").join("");
  $("#reviewsList").innerHTML = S.reviews.map((s, i) =>
    '<div class="review rv" style="transition-delay:' + i * 80 + 'ms"><div class="stars">' + "★".repeat(s.stars || 5) + "</div><p>«" + esc(s.text) + '»</p><div class="review__who"><span class="avatar">' + esc(s.name[0]) + "</span>" + esc(s.name) + "</div></div>").join("");
  $("#faqList").innerHTML = S.faq.map((f) => "<details class=\"rv\"><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>").join("");

  // ---------- Появление при прокрутке ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".rv").forEach((el) => io.observe(el));

  // ---------- Форма ----------
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, st = $("#formStatus"), data = new FormData(f);
    st.textContent = "Отправляем…"; st.style.color = "";
    try {
      const res = await fetch("send.php", { method: "POST", body: data });
      const j = await res.json();
      if (!j.ok) throw new Error();
      st.textContent = "Спасибо! Перезвоним в ближайшие минуты."; st.style.color = "#15803d";
      f.reset();
    } catch (_) {
      // Нет сервера для заявок (демо-версия) — предлагаем отправить заявку в WhatsApp
      const text = "Заявка с сайта\nИмя: " + data.get("name") + "\nТелефон: " + data.get("phone") + "\n" + (data.get("comment") || "");
      st.innerHTML = 'Почти готово: <a href="https://wa.me/' + S.whatsapp + "?text=" + encodeURIComponent(text) +
        '" target="_blank" rel="noopener">отправьте заявку в WhatsApp</a>';
    }
  });
})();
