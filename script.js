(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SVG = "http://www.w3.org/2000/svg";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const svgEl = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent && parent.appendChild(e);
    return e;
  };

  /* The four sectors of the lap = the four sections of the page */
  const SECTORS = [
    { id: "research", k: "S1", name: "Research", c: "--purple" },
    { id: "garage",   k: "S2", name: "Garage",   c: "--green"  },
    { id: "journey",  k: "S3", name: "Journey",  c: "--amber", dir: [0.3, 1], push: 1.9 }, // label sits inside the chicane
    { id: "about",    k: "S4", name: "About",    c: "--cyan"   },
  ];
  SECTORS.forEach(s => { s.el = document.getElementById(s.id); s.hex = css(s.c); });
  const finishEl = document.getElementById("radio");
  let sectorIdx = -1; // -1 = hero / pit lane, 4 = finish

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.addEventListener("click", e => {
      if (e.target.closest("a")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Hero start lights ---------- */
  const heroLights = $$("#heroLights span");
  const lightsText = $("#lightsText");
  if (heroLights.length && lightsText) {
    if (reduceMotion) lightsText.classList.add("go");
    else {
      heroLights.forEach((l, i) => setTimeout(() => l.classList.add("on"), 250 + i * 250));
      setTimeout(() => {
        heroLights.forEach(l => l.classList.remove("on"));
        lightsText.classList.add("go");
      }, 250 + 5 * 250 + 400);
    }
  }

  /* ---------- Rotating greeting (English · Telugu · Arabic) ---------- */
  const greet = $("#greet");
  let greetTimer = null, gi = 0;
  const greetings = [
    { t: "Hello,", lang: "en" },
    { t: "నమస్కారం,", lang: "te" },
    { t: "مرحبا،", lang: "ar", dir: "rtl" },
  ];
  const startGreet = () => {
    if (!greet || reduceMotion || greetTimer) return;
    greetTimer = setInterval(() => {
      greet.classList.add("swap");
      setTimeout(() => {
        gi = (gi + 1) % greetings.length;
        const g = greetings[gi];
        greet.textContent = g.t;
        greet.lang = g.lang;
        greet.dir = g.dir || "ltr";
        greet.classList.remove("swap");
      }, 350);
    }, 2800);
  };
  const stopGreet = () => { clearInterval(greetTimer); greetTimer = null; };

  /* ---------- Circuit: 4 coloured sectors with clickable labels ---------- */
  const circuit = $("#circuit");
  const basePath = $("#circuitPath");
  const D = basePath ? basePath.getAttribute("d") : "";
  const GAP = 0.9; // gap between sectors, in % of lap

  function addSegments(group, cls) {
    return SECTORS.map((s, i) => svgEl("path", {
      d: D, class: cls, pathLength: 100,
      "stroke-dasharray": `${25 - GAP} ${75 + GAP}`,
      "stroke-dashoffset": -(25 * i + GAP / 2),
      style: `--c: var(${s.c})`,
    }, group));
  }

  if (circuit && basePath) {
    const group = $("#circuitSectors");
    const segs = addSegments(group, "circuit__seg");
    const L = basePath.getTotalLength();
    const bb = basePath.getBBox();
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;

    SECTORS.forEach((s, i) => {
      const p = basePath.getPointAtLength(L * (i * 0.25 + 0.125));
      let [dx, dy] = s.dir || [p.x - cx, p.y - cy];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const push = s.push || 1;
      const lx = p.x + dx * 34 * push, ly = p.y + dy * 30 * push;
      const anchor = dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle";
      // stack the two lines away from the track: above it when the label sits on the top side
      const above = dy < -0.35;
      const kY = above ? ly - 20 : ly - 4, nY = above ? ly - 2 : ly + 14;
      const a = svgEl("a", { href: `#${s.id}`, class: "circuit__label", style: `--c: var(${s.c})`, "aria-label": `Sector ${i + 1}: ${s.name}` }, circuit);
      svgEl("circle", { class: "pip", cx: p.x, cy: p.y, r: 4 }, a);
      const k = svgEl("text", { class: "k", x: lx, y: kY, "text-anchor": anchor }, a);
      k.textContent = s.k;
      const n = svgEl("text", { class: "n", x: lx, y: nY, "text-anchor": anchor }, a);
      n.textContent = s.name;
      a.addEventListener("pointerenter", () => segs[i].classList.add("is-hot"));
      a.addEventListener("pointerleave", () => segs[i].classList.remove("is-hot"));
      a.addEventListener("focus", () => segs[i].classList.add("is-hot"));
      a.addEventListener("blur", () => segs[i].classList.remove("is-hot"));
    });
    // car + start/finish line on top of the labels' pips
    circuit.appendChild($(".circuit__sf", circuit));
    circuit.appendChild($(".circuit__car", circuit));

    segs.forEach((sg, i) => { sg.style.transitionDelay = reduceMotion ? "0s" : `${1.5 + i * 0.18}s`; });
    requestAnimationFrame(() => circuit.classList.add("is-drawn"));
  }

  /* ---------- Mini-map HUD ---------- */
  const hud = $("#hud");
  const hudMap = $("#hudMap");
  const hudSector = $("#hudSector");
  const hudSpeed = $("#hudSpeed");
  let hudBase, hudSegs = [], hudCar, hudL = 0;
  if (hud && hudMap && D) {
    hudBase = svgEl("path", { d: D, class: "base" }, hudMap);
    hudSegs = addSegments(hudMap, "seg");
    hudCar = svgEl("circle", { class: "car", r: 17 }, hudMap);
    hudL = hudBase.getTotalLength();
  }

  /* ---------- Scroll engine: lap position, nav, HUD, speed, statement ---------- */
  const navMap = Object.fromEntries($$(".nav__links a[href^='#']").map(a => [a.getAttribute("href").slice(1), a]));
  const scrubEls = $$("[data-scrub]");
  if (!reduceMotion) {
    scrubEls.forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
      el.classList.add("scrub");
      el._words = $$(".w", el);
    });
  }

  let lastY = window.scrollY, lastT = performance.now(), speed = 0, lastScrollAt = 0;
  let ticking = false, decaying = false, lastNavId;

  function lapPosition() {
    const line = window.innerHeight * 0.4;
    const tops = SECTORS.map(s => s.el ? s.el.getBoundingClientRect().top - line : Infinity);
    const end = finishEl ? finishEl.getBoundingClientRect().top - line : Infinity;
    if (tops[0] > 0) return { pos: 0, idx: -1 };
    if (end <= 0) return { pos: 1, idx: 4 };
    for (let i = 0; i < 4; i++) {
      const a = tops[i], b = i < 3 ? tops[i + 1] : end;
      if (a <= 0 && b > 0) return { pos: (i + clamp(-a / (b - a), 0, 1)) / 4, idx: i };
    }
    return { pos: 0, idx: -1 };
  }

  function renderSpeed() {
    if (hudSpeed) hudSpeed.textContent = Math.round(speed);
  }

  function update() {
    ticking = false;
    const now = performance.now();
    const y = window.scrollY;
    const dt = Math.max(1, now - lastT);
    const target = Math.min(342, Math.abs(y - lastY) / dt * 110);
    speed = speed * 0.6 + target * 0.4;
    lastY = y; lastT = now; lastScrollAt = now;
    renderSpeed();

    const { pos, idx } = lapPosition();
    sectorIdx = idx;

    // nav highlight
    const navId = idx >= 0 && idx < 4 ? SECTORS[idx].id : idx === 4 ? "radio" : null;
    if (navId !== lastNavId) {
      Object.entries(navMap).forEach(([k, a]) => a.classList.toggle("is-active", k === navId));
      lastNavId = navId;
    }

    // HUD
    if (hud && hudL) {
      hud.classList.toggle("is-hidden", y < window.innerHeight * 0.5);
      const p = hudBase.getPointAtLength(hudL * Math.min(pos, 0.9999));
      hudCar.setAttribute("cx", p.x);
      hudCar.setAttribute("cy", p.y);
      hudSegs.forEach((sg, i) => {
        sg.classList.toggle("is-done", pos >= (i + 1) / 4);
        sg.classList.toggle("is-now", i === idx);
      });
      const label = idx < 0 ? "Pit lane" : idx > 3 ? "Chequered flag" : `${SECTORS[idx].k} · ${SECTORS[idx].name}`;
      const color = idx >= 0 && idx < 4 ? `var(${SECTORS[idx].c})` : idx > 3 ? "#fff" : "var(--dim)";
      if (hudSector._label !== label) {
        hudSector.innerHTML = `<i style="--c:${color}"></i>${label}`;
        hudSector._label = label;
      }
    }

    // Apple-style scroll-lit statement
    scrubEls.forEach(el => {
      if (!el._words) return;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp((vh * 0.88 - r.top) / (vh * 0.6), 0, 1);
      const lit = Math.ceil(p * el._words.length);
      if (lit !== el._lit) {
        el._words.forEach((w, i) => w.classList.toggle("on", i < lit));
        el._lit = lit;
      }
    });

    if (!decaying) { decaying = true; requestAnimationFrame(decay); }
  }

  // speedometer falls back to 0 once scrolling stops
  function decay() {
    if (performance.now() - lastScrollAt > 90) speed *= 0.82;
    renderSpeed();
    if (speed > 0.5) requestAnimationFrame(decay);
    else { speed = 0; renderSpeed(); decaying = false; }
  }

  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(update), { passive: true });
  update();

  /* ---------- Pause animations that are off-screen ---------- */
  const ticker = $("#ticker");
  const hero = $(".hero");
  const visIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const on = e.isIntersecting;
      if (e.target === hero) {
        on ? startGreet() : stopGreet();
        if (circuit && circuit.pauseAnimations) on ? circuit.unpauseAnimations() : circuit.pauseAnimations();
      }
      e.target.classList.toggle("is-paused", !on);
    });
  });
  [hero, ticker].forEach(el => el && visIO.observe(el));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(
    ".section__head, .spec__row, .car, .stamp, .faith, .hobby, .react, .pubs, .setup, " +
    ".trophies li, .yr, .driver, .carousel, .radio__inner"
  );
  if (!reduceMotion && "IntersectionObserver" in window) {
    revealEls.forEach(el => el.classList.add("reveal"));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Cursor: racing-line trail + ring + magnetic buttons + hero tilt ---------- */
  if (finePointer && !reduceMotion) {
    const canvas = document.createElement("canvas");
    canvas.className = "trail";
    canvas.setAttribute("aria-hidden", "true");
    const ring = document.createElement("div");
    ring.className = "cursor is-gone";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(canvas, ring);
    const ctx = canvas.getContext("2d");
    let dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size, { passive: true });

    const LIFE = 420;
    const pts = [];
    let mx = -100, my = -100, rx = -100, ry = -100, running = false;

    const trailColor = () =>
      sectorIdx >= 0 && sectorIdx < 4 ? SECTORS[sectorIdx].hex : sectorIdx > 3 ? "#f5f5f7" : css("--red");

    function frame() {
      const now = performance.now();
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (pts.length > 1) {
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = trailColor();
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i];
          const life = 1 - (now - b.t) / LIFE;
          ctx.globalAlpha = life * 0.9;
          ctx.lineWidth = 0.5 + life * 2.5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      const settled = Math.abs(mx - rx) < 0.3 && Math.abs(my - ry) < 0.3;
      if (pts.length || !settled) requestAnimationFrame(frame);
      else running = false;
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

    window.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (ring.classList.contains("is-gone")) { rx = mx; ry = my; ring.classList.remove("is-gone"); }
      pts.push({ x: mx, y: my, t: performance.now() });
      if (pts.length > 80) pts.shift();
      kick();
    }, { passive: true });
    document.addEventListener("pointerleave", () => ring.classList.add("is-gone"));
    window.addEventListener("pointerdown", () => ring.classList.add("is-down"));
    window.addEventListener("pointerup", () => ring.classList.remove("is-down"));
    const HOT = "a, button, summary, [tabindex], .radar__hit, .carousel__track";
    document.addEventListener("pointerover", e => ring.classList.toggle("is-link", !!e.target.closest(HOT)));

    // magnetic buttons
    $$(".btn, .carousel__btn").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });

    // hero track tilts toward the cursor
    const track = $(".hero__track");
    if (hero && track) {
      hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        track.style.transform = `perspective(1100px) rotateY(${x * 12}deg) rotateX(${-y * 9}deg)`;
      });
      hero.addEventListener("pointerleave", () => { track.style.transform = ""; });
    }
  }

  /* ---------- Project tags ---------- */
  const tagbar = $("#tagbar");
  const cars = $$("#cars .car");
  if (tagbar && cars.length) {
    const counts = new Map();
    cars.forEach(car => {
      car.dataset.tags = "";
      $$(".ptags li", car).forEach(li => {
        const tag = li.textContent.trim();
        car.dataset.tags += tag + "|";
        counts.set(tag, (counts.get(tag) || 0) + 1);
        li.innerHTML = "";
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = tag;
        b.dataset.tag = tag;
        b.setAttribute("aria-label", `Show projects tagged ${tag}`);
        li.appendChild(b);
      });
    });

    const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const mkChip = (tag, n, label) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.dataset.tag = tag;
      c.innerHTML = `${label}<span class="chip__n">${n}</span>`;
      tagbar.appendChild(c);
    };
    mkChip("all", cars.length, "All projects");
    // bar shows tags shared by 2+ projects; one-off tags stay clickable on the cards
    sorted.filter(([, n]) => n > 1).forEach(([t, n]) => mkChip(t, n, t));

    let active = "all";
    const apply = tag => {
      active = tag;
      $$(".chip", tagbar).forEach(c => {
        const on = c.dataset.tag === tag;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on);
      });
      $$(".ptags button").forEach(b => b.classList.toggle("is-on", b.dataset.tag === tag));
      cars.forEach(car => {
        const show = tag === "all" || car.dataset.tags.split("|").includes(tag);
        car.classList.toggle("is-hidden", !show);
        if (show) car.classList.add("is-in");
      });
      requestAnimationFrame(update);
    };
    tagbar.addEventListener("click", e => {
      const c = e.target.closest(".chip");
      if (c) apply(c.dataset.tag);
    });
    $("#cars").addEventListener("click", e => {
      const b = e.target.closest(".ptags button");
      if (!b) return;
      apply(active === b.dataset.tag ? "all" : b.dataset.tag);
      if (tagbar.getBoundingClientRect().top < 0) tagbar.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    });
    apply("all");
  }

  /* ---------- Timeline filters ---------- */
  $$(".filters[data-filter-target]").forEach(group => {
    const chips = $$(".chip", group);
    const items = $$(group.dataset.filterTarget);
    group.addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      chips.forEach(c => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-pressed", c === chip);
      });
      const f = chip.dataset.filter;
      items.forEach(it => {
        const show = f === "all" || (it.dataset.type || "").split(" ").includes(f);
        it.classList.toggle("is-hidden", !show);
      });
      $$(".yr").forEach(yr => {
        const any = $$(".ev", yr).some(ev => !ev.classList.contains("is-hidden"));
        yr.classList.toggle("is-hidden", !any);
        if (any) yr.classList.add("is-in");
      });
      requestAnimationFrame(update);
    });
  });

  /* ---------- Gallery carousel (native swipe + buttons + dots) ---------- */
  $$(".carousel").forEach(car => {
    const track = $(".carousel__track", car);
    const slides = $$(".slide", track);
    const dotsEl = $(".carousel__dots", car);
    const [prev, next] = $$(".carousel__btn", car);
    if (!track || !slides.length) return;

    const dots = slides.map(() => {
      const d = document.createElement("span");
      dotsEl && dotsEl.appendChild(d);
      return d;
    });
    const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      const i = Math.round(track.scrollLeft / step());
      dots.forEach((d, k) => d.classList.toggle("is-on", k === Math.min(i, slides.length - 1)));
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    let raf = 0;
    track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    [prev, next].forEach(btn => btn && btn.addEventListener("click", () => {
      track.scrollBy({ left: step() * Number(btn.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
    }));
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: step() * (e.key === "ArrowRight" ? 1 : -1) });
      }
    });
    window.addEventListener("resize", sync, { passive: true });
    sync();
  });

  /* ---------- Skill radar charts ---------- */
  function radar(fig) {
    let data;
    try { data = JSON.parse(fig.dataset.skills); } catch (_) { return; }
    const n = data.length;
    const W = 400, H = 320, cx = W / 2, cy = 160, R = 105;
    const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
    const cap = fig.querySelector("figcaption");

    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": `${cap.textContent}: ` + data.map(d => `${d[0]} ${d[1]}`).join(", ") });

    [25, 50, 75, 100].forEach(v => {
      svgEl("polygon", { class: "radar__ring", points: data.map((_, i) => pt(i, v).join(",")).join(" ") }, svg);
    });
    const ticks = [25, 50, 75, 100].map(v => {
      const t = svgEl("text", { class: "radar__tick", x: cx - 6, y: cy - R * v / 100 + 4, "text-anchor": "end" });
      t.textContent = v;
      return t;
    });
    const axisLabels = data.map(([name], i) => {
      const [x, y] = pt(i, 100);
      svgEl("line", { class: "radar__spoke", x1: cx, y1: cy, x2: x, y2: y }, svg);
      const c = Math.cos(ang(i)), s = Math.sin(ang(i));
      const [lx, ly] = pt(i, 116);
      const t = svgEl("text", {
        class: "radar__axis", x: lx, y: ly + (s > 0.3 ? 12 : s < -0.3 ? -4 : 4),
        "text-anchor": c > 0.3 ? "start" : c < -0.3 ? "end" : "middle",
      }, svg);
      t.textContent = name;
      return t;
    });
    svgEl("polygon", { class: "radar__area", points: data.map((d, i) => pt(i, d[1]).join(",")).join(" ") }, svg);
    ticks.forEach(t => svg.appendChild(t));

    const tip = document.createElement("div");
    tip.className = "radar__tip";
    tip.setAttribute("role", "status");
    fig.appendChild(tip);

    data.forEach(([name, v], i) => {
      const [x, y] = pt(i, v);
      const dot = svgEl("circle", { class: "radar__pt", cx: x, cy: y, r: 5 }, svg);
      const hit = svgEl("circle", { class: "radar__hit", cx: x, cy: y, r: 16, tabindex: 0, "aria-label": `${name}: ${v} out of 100` }, svg);
      const on = () => {
        const fb = fig.getBoundingClientRect(), hb = hit.getBoundingClientRect();
        tip.innerHTML = `<i></i>${name}<b>${v}</b>`;
        tip.style.left = hb.left - fb.left + hb.width / 2 + "px";
        tip.style.top = hb.top - fb.top + hb.height / 2 - 4 + "px";
        tip.classList.add("is-on");
        dot.classList.add("is-hot");
        axisLabels[i].classList.add("is-hot");
      };
      const off = () => {
        tip.classList.remove("is-on");
        dot.classList.remove("is-hot");
        axisLabels[i].classList.remove("is-hot");
      };
      hit.addEventListener("pointerenter", on);
      hit.addEventListener("pointerleave", off);
      hit.addEventListener("focus", on);
      hit.addEventListener("blur", off);
    });

    cap.after(svg);
    const det = document.createElement("details");
    det.innerHTML = `<summary>View as table</summary><table><tbody>${
      data.map(([name, v]) => `<tr><td>${name}</td><td>${v}</td></tr>`).join("")
    }</tbody></table>`;
    fig.appendChild(det);
  }
  $$(".radar[data-skills]").forEach(radar);

  /* ---------- Reaction-time game ---------- */
  const pad = $("#reactPad");
  if (pad) {
    const msg = $("#reactMsg");
    const bestEl = $("#reactBest");
    const rLights = $$("#reactLights span");
    let state = "idle", timers = [], goAt = 0, best = null;
    try { best = Number(localStorage.getItem("reactBest")) || null; } catch (_) {}
    if (best) bestEl.textContent = best.toFixed(3) + "s";

    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const setLights = n => rLights.forEach((l, i) => l.classList.toggle("on", i < n));

    const start = () => {
      clear();
      state = "arming";
      pad.classList.remove("go", "jump");
      msg.textContent = "Wait for it…";
      setLights(0);
      rLights.forEach((_, i) => timers.push(setTimeout(() => setLights(i + 1), 600 + i * 800)));
      const outAt = 600 + 4 * 800 + 700 + Math.random() * 2300;
      timers.push(setTimeout(() => {
        setLights(0);
        state = "waiting";
        goAt = performance.now();
        pad.classList.add("go");
        msg.textContent = "GO!";
      }, outAt));
    };

    const hit = () => {
      if (state === "idle" || state === "done") return start();
      if (state === "arming") {
        clear(); setLights(0);
        state = "done";
        pad.classList.add("jump");
        msg.textContent = "Jump start! Click to retry";
        return;
      }
      if (state === "waiting") {
        const t = (performance.now() - goAt) / 1000;
        state = "done";
        pad.classList.remove("go");
        let verdict = t < 0.2 ? "Purple sector!" : t < 0.3 ? "Race-ready." : t < 0.45 ? "Solid getaway." : "Bogged down off the line.";
        if (!best || t < best) {
          best = t;
          bestEl.textContent = t.toFixed(3) + "s";
          try { localStorage.setItem("reactBest", String(t)); } catch (_) {}
          verdict += " New personal best.";
        }
        msg.textContent = `${t.toFixed(3)}s · ${verdict}`;
      }
    };
    pad.addEventListener("pointerdown", e => { e.preventDefault(); hit(); });
    pad.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); hit(); }
    });
  }
})();
