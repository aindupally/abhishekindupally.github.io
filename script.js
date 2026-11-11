(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SVG = "http://www.w3.org/2000/svg";

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
  let greetTimer = null;
  const greetings = [
    { t: "Hello,", lang: "en" },
    { t: "నమస్కారం,", lang: "te" },
    { t: "مرحبا،", lang: "ar", dir: "rtl" },
  ];
  let gi = 0;
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

  /* ---------- Pause animations that are off-screen ---------- */
  const circuit = $("#circuit");
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

  /* ---------- Lap progress + active nav (rAF-throttled) ---------- */
  const fill = $("#lapFill");
  const label = $("#lapLabel");
  const sectored = $$("[data-sector]");
  const navMap = Object.fromEntries(
    $$(".nav__links a[href^='#']").map(a => [a.getAttribute("href").slice(1), a])
  );
  let ticking = false;
  let lastId = undefined;

  function update() {
    ticking = false;
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;

    let current = null;
    const line = window.innerHeight * 0.4;
    for (const el of sectored) {
      if (el.getBoundingClientRect().top < line) current = el; else break;
    }
    const id = current ? current.id : null;
    if (id !== lastId) {
      Object.entries(navMap).forEach(([k, a]) => a.classList.toggle("is-active", k === id));
      lastId = id;
    }
    if (label) {
      const s = current ? current.dataset.sector : "S1";
      label.textContent = p > 0.985 ? "CHEQUERED FLAG" : `LAP 1/1 · ${s} · ${Math.round(p * 100)}%`;
    }
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(
    ".section__head, .spec__row, .car, .stamp, .faith, .hobby, .react, .pubs, .setup, " +
    ".trophies, .yr, .driver, .carousel"
  );
  if (!reduceMotion && "IntersectionObserver" in window) {
    revealEls.forEach(el => el.classList.add("reveal"));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Project tags ---------- */
  const tagbar = $("#tagbar");
  const cars = $$("#cars .car");
  if (tagbar && cars.length) {
    const counts = new Map();
    // turn each <li>Tag</li> into a clickable button
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
      return c;
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
    };
    tagbar.addEventListener("click", e => {
      const c = e.target.closest(".chip");
      if (c) apply(c.dataset.tag);
    });
    $("#cars").addEventListener("click", e => {
      const b = e.target.closest(".ptags button");
      if (!b) return;
      apply(active === b.dataset.tag ? "all" : b.dataset.tag);
      const top = tagbar.getBoundingClientRect().top;
      if (top < 0) tagbar.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
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
    const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 14);
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
    const el = (tag, attrs, parent) => {
      const e = document.createElementNS(SVG, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      parent && parent.appendChild(e);
      return e;
    };
    const cap = fig.querySelector("figcaption");

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": `${cap.textContent}: ` + data.map(d => `${d[0]} ${d[1]}`).join(", ") });

    [25, 50, 75, 100].forEach(v => {
      el("polygon", { class: "radar__ring", points: data.map((_, i) => pt(i, v).join(",")).join(" ") }, svg);
    });
    const ticks = [25, 50, 75, 100].map(v => {
      const t = el("text", { class: "radar__tick", x: cx - 6, y: cy - R * v / 100 + 4, "text-anchor": "end" });
      t.textContent = v;
      return t;
    });
    const axisLabels = data.map(([name], i) => {
      const [x, y] = pt(i, 100);
      el("line", { class: "radar__spoke", x1: cx, y1: cy, x2: x, y2: y }, svg);
      const c = Math.cos(ang(i)), s = Math.sin(ang(i));
      const [lx, ly] = pt(i, 116);
      const t = el("text", {
        class: "radar__axis", x: lx, y: ly + (s > 0.3 ? 12 : s < -0.3 ? -4 : 4),
        "text-anchor": c > 0.3 ? "start" : c < -0.3 ? "end" : "middle",
      }, svg);
      t.textContent = name;
      return t;
    });
    el("polygon", { class: "radar__area", points: data.map((d, i) => pt(i, d[1]).join(",")).join(" ") }, svg);
    ticks.forEach(t => svg.appendChild(t));

    const tip = document.createElement("div");
    tip.className = "radar__tip";
    tip.setAttribute("role", "status");
    fig.appendChild(tip);

    data.forEach(([name, v], i) => {
      const [x, y] = pt(i, v);
      const dot = el("circle", { class: "radar__pt", cx: x, cy: y, r: 5 }, svg);
      const hit = el("circle", { class: "radar__hit", cx: x, cy: y, r: 16, tabindex: 0,
        "aria-label": `${name}: ${v} out of 100` }, svg);
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
    let state = "idle"; // idle | arming | waiting | done
    let timers = [];
    let goAt = 0;
    let best = null;
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
