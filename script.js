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
    $$("a", links).forEach(a => a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
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
  if (greet && !reduceMotion) {
    const greetings = [
      { t: "Hello,", lang: "en" },
      { t: "నమస్కారం,", lang: "te" },
      { t: "مرحبا،", lang: "ar", dir: "rtl" },
    ];
    let gi = 0;
    setInterval(() => {
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
  }

  /* ---------- Lap progress + active nav ---------- */
  const fill = $("#lapFill");
  const label = $("#lapLabel");
  const sectored = $$("[data-sector]");
  const navMap = Object.fromEntries(
    $$(".nav__links a").filter(a => a.getAttribute("href").startsWith("#"))
      .map(a => [a.getAttribute("href").slice(1), a])
  );

  function onScroll() {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    if (fill) fill.style.width = (p * 100).toFixed(2) + "%";

    let current = null;
    for (const el of sectored) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.4) current = el;
    }
    const id = current && current.id;
    Object.entries(navMap).forEach(([k, a]) => a.classList.toggle("is-active", k === id));
    if (label) {
      const s = current ? current.dataset.sector : "S1";
      label.textContent = p > 0.985 ? "CHEQUERED FLAG" : `LAP 1/1 · ${s} · ${Math.round(p * 100)}%`;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(
    ".section__head, .sector, .car, .stamp, .faith, .hobby, .react, .pubs, .setup, .now, " +
    ".trophies, .yr, .teaser, .profile, .facts article, .shot"
  );
  revealEls.forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  /* ---------- Generic filters (projects + timeline) ---------- */
  $$(".filters[data-filter-target]").forEach(group => {
    const chips = $$(".chip", group);
    const items = $$(group.dataset.filterTarget);
    chips.forEach(chip => chip.addEventListener("click", () => {
      chips.forEach(c => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-pressed", c === chip);
      });
      const f = chip.dataset.filter;
      items.forEach(it => {
        const tags = (it.dataset.cat || it.dataset.type || "").split(" ");
        const show = f === "all" || tags.includes(f);
        it.classList.toggle("is-hidden", !show);
      });
      // collapse empty year rows on the timeline
      $$(".yr").forEach(yr => {
        const any = $$(".ev", yr).some(ev => !ev.classList.contains("is-hidden"));
        yr.classList.toggle("is-hidden", !any);
        if (any) yr.classList.add("is-in");
      });
      items.forEach(it => it.classList.add("is-in"));
    }));
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

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": `${fig.querySelector("figcaption").textContent}: ` + data.map(d => `${d[0]} ${d[1]}`).join(", ") });

    // rings + tick labels
    [25, 50, 75, 100].forEach(v => {
      el("polygon", { class: "radar__ring", points: data.map((_, i) => pt(i, v).join(",")).join(" ") }, svg);
    });
    const ticks = [25, 50, 75, 100].map(v => {
      const t = el("text", { class: "radar__tick", x: cx - 6, y: cy - R * v / 100 + 4, "text-anchor": "end" });
      t.textContent = v;
      return t;
    });
    // spokes + axis labels
    const axisLabels = data.map(([name], i) => {
      const [x, y] = pt(i, 100);
      el("line", { class: "radar__spoke", x1: cx, y1: cy, x2: x, y2: y }, svg);
      const c = Math.cos(ang(i)), s = Math.sin(ang(i));
      const [lx, ly] = pt(i, 100 + 16);
      const t = el("text", {
        class: "radar__axis", x: lx, y: ly + (s > 0.3 ? 12 : s < -0.3 ? -4 : 4),
        "text-anchor": c > 0.3 ? "start" : c < -0.3 ? "end" : "middle",
      }, svg);
      t.textContent = name;
      return t;
    });
    // data area, then tick labels on top so they stay legible
    el("polygon", { class: "radar__area", points: data.map((d, i) => pt(i, d[1]).join(",")).join(" ") }, svg);
    ticks.forEach(t => svg.appendChild(t));

    // tooltip
    const tip = document.createElement("div");
    tip.className = "radar__tip";
    tip.setAttribute("role", "status");
    fig.appendChild(tip);

    // points + bigger invisible hit targets
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

    fig.insertBefore(svg, fig.querySelector("figcaption").nextSibling);

    // table view
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
