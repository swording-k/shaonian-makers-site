/*! dissolve-ui@0.0.6 · ThinkingOrb
MIT License

Copyright (c) 2026 Rayan Selmi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// src/lib/motion-core/dissolve/kit.ts
var reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function vibrate(pattern) {
  if (typeof navigator === "undefined" || !navigator.userActivation?.hasBeenActive) return;
  navigator.vibrate?.(pattern);
}
function injectStyle(id, css, root) {
  if (typeof document === "undefined" || (root ?? document).getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = css;
  (root ?? document.head).appendChild(s);
}
function token(node, name, fallback) {
  return getComputedStyle(node).getPropertyValue(`--dissolve-${name}`).trim() || fallback;
}
function onThemeChange(sc, fn) {
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", fn);
  sc.onDispose(() => {
    mo.disconnect();
    mq.removeEventListener("change", fn);
  });
}
var probe = null;
function rgbOf(color) {
  probe ?? (probe = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true }));
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
function propsOf(defaults, initial) {
  let raw = { ...initial };
  const resolve = () => {
    const out = { ...defaults };
    for (const [k, v] of Object.entries(raw)) if (v !== void 0) out[k] = v;
    return out;
  };
  const box = {
    current: resolve(),
    update(next) {
      raw = { ...raw, ...next };
      const prev = box.current;
      box.current = resolve();
      const cur = box.current;
      return new Set([...Object.keys(prev), ...Object.keys(cur)].filter((k) => prev[k] !== cur[k]));
    }
  };
  return box;
}
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const Y = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x, d = dX(t);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-4) {
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 40; i++) {
        if (X(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return Y(t);
  };
}
var CALM = bezier(0.32, 0.72, 0, 1);
var SPLIT = bezier(0.45, 0, 0.2, 1);
var clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
function scope() {
  const timers = /* @__PURE__ */ new Set(), handles = /* @__PURE__ */ new Set(), fns = [];
  const sc = {
    alive: true,
    wait: (ms) => new Promise((res) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (sc.alive) res();
      }, ms);
      timers.add(t);
    }),
    track(h) {
      handles.add(h);
      h.done.then(() => handles.delete(h));
      return h;
    },
    onDispose(fn) {
      fns.push(fn);
    },
    dispose() {
      if (!sc.alive) return;
      sc.alive = false;
      timers.forEach(clearTimeout);
      handles.forEach((h) => h.cancel());
      fns.forEach((f) => f());
    }
  };
  return sc;
}
function value(sc, v0, onChange) {
  let id = 0;
  const a = {
    v: v0,
    vel: 0,
    set(x) {
      id++;
      a.v = x;
      a.vel = 0;
      onChange();
    },
    to(to, ms, ease = CALM, delay = 0) {
      const my = ++id, from = a.v;
      return new Promise((res) => {
        const t0 = performance.now() + delay;
        let lastT = t0;
        const f = (now) => {
          if (my !== id) return res(false);
          if (!sc.alive) return;
          if (now < t0) return void requestAnimationFrame(f);
          const k = ms > 0 ? Math.min(1, (now - t0) / ms) : 1;
          const prev = a.v;
          a.v = from + (to - from) * ease(k);
          const dt = (now - lastT) / 1e3;
          a.vel = dt > 0 ? (a.v - prev) / dt : 0;
          lastT = now;
          onChange();
          if (k < 1) requestAnimationFrame(f);
          else {
            a.vel = 0;
            res(true);
          }
        };
        requestAnimationFrame(f);
      });
    },
    spring(to, { stiffness = 260, damping = 31, mass = 1, eps = 0.02 } = {}) {
      const my = ++id;
      return new Promise((res) => {
        let last = performance.now();
        const f = (now) => {
          if (my !== id) return res(false);
          if (!sc.alive) return;
          let dt = Math.min(0.064, (now - last) / 1e3);
          last = now;
          while (dt > 0) {
            const h = Math.min(1 / 480, dt);
            a.vel += (-stiffness * (a.v - to) - damping * a.vel) / mass * h;
            a.v += a.vel * h;
            dt -= h;
          }
          if (Math.abs(a.v - to) < eps && Math.abs(a.vel) < eps * 10) {
            a.v = to;
            a.vel = 0;
            onChange();
            return res(true);
          }
          onChange();
          requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      });
    }
  };
  return a;
}
function el(tag, cls = "", html = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
function onScreen(sc, node, onChange) {
  let waiting = [];
  const st = {
    on: true,
    shown: () => st.on ? Promise.resolve() : new Promise((res) => waiting.push(res))
  };
  const io = new IntersectionObserver(([e]) => {
    st.on = e.isIntersecting;
    if (st.on) {
      waiting.forEach((res) => res());
      waiting = [];
    }
    onChange?.(st.on);
  });
  io.observe(node);
  sc.onDispose(() => io.disconnect());
  return st;
}
function loop(sc, node, fn, active = () => true) {
  let raf = 0;
  const tick = (now) => {
    raf = 0;
    if (!sc.alive) return;
    fn(now);
    if (seen.on && active()) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf && sc.alive) raf = requestAnimationFrame(tick);
  };
  const seen = onScreen(sc, node, (on) => on && kick());
  kick();
  sc.onDispose(() => cancelAnimationFrame(raf));
  return { kick };
}

// src/lib/motion-core/dissolve/thinking-orb.core.ts
var DEFAULTS = { state: "idle", size: 64, dots: 180, interactive: false, haptics: true };
var TAU = Math.PI * 2;
var GA = Math.PI * (3 - Math.sqrt(5));
var MORPH = 600;
var STAGGER = 1.5;
var FALL = 900;
var FLEE = 40;
var RING_SPD = [21e-4, -16e-4, 12e-4];
var RING_TZ = [0, 1.05, -1.05];
var CHECK = [[-0.52, 0.02], [-0.16, 0.38], [0.56, -0.36]];
var CSS = `
:where([data-dissolve="thinking-orb"]) { position: relative; display: block; flex: none; -webkit-tap-highlight-color: transparent; }
:where(.dissolve-orb-canvas) { display: block; }
`;
var lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
var unit = (c) => {
  const [r, g, b] = rgbOf(c);
  return [r / 255, g / 255, b / 255];
};
function createThinkingOrb(host, initial = {}) {
  const root = host.getRootNode();
  injectStyle("dissolve-thinking-orb", CSS, root instanceof ShadowRoot ? root : void 0);
  const props = propsOf(DEFAULTS, initial);
  const p = () => props.current;
  const reduce = () => p().reducedMotion ?? reducedMotion();
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const sc = scope();
  host.dataset.dissolve = "thinking-orb";
  host.setAttribute("role", "img");
  const cv = el("canvas", "dissolve-orb-canvas");
  host.append(cv);
  const ctx = cv.getContext("2d");
  let S = 0, N = 0, R = 0, DOT = 0;
  let r1 = new Float32Array(0), r2 = new Float32Array(0), fib = new Float32Array(0), check = new Float32Array(0);
  let cur = new Float32Array(0), from = new Float32Array(0), vel = new Float32Array(0), off = new Float32Array(0), offV = new Float32Array(0);
  const tg = new Float32Array(4);
  let colors = null;
  let shape = "idle";
  let t0 = -1e9, fallUntil = 0, level = 0, last = performance.now();
  const epoch = performance.now();
  const ok = value(sc, 0, () => {
  }), bad = value(sc, 0, () => {
  });
  let ptr = null;
  function layout() {
    S = p().size;
    R = S * 0.4;
    DOT = p().dotSize != null ? p().dotSize / 2 : Math.max(1.25, S * 0.0105);
    cv.width = Math.round(S * DPR);
    cv.height = Math.round(S * DPR);
    cv.style.width = cv.style.height = S + "px";
    host.style.width = host.style.height = S + "px";
  }
  function seed() {
    N = Math.max(1, Math.round(p().dots));
    r1 = new Float32Array(N);
    r2 = new Float32Array(N);
    fib = new Float32Array(N * 3);
    check = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      r1[i] = Math.random();
      r2[i] = Math.random();
      const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), th = i * GA;
      fib[i * 3] = Math.cos(th) * r;
      fib[i * 3 + 1] = y;
      fib[i * 3 + 2] = Math.sin(th) * r;
    }
    const segs = [];
    let tot = 0;
    for (let k = 0; k < 2; k++) {
      const a = CHECK[k], b = CHECK[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push([a, b, l]);
      tot += l;
    }
    for (let i = 0; i < N; i++) {
      let s = (i + 0.5) / N * tot, k = 0;
      while (k < 1 && s > segs[k][2]) {
        s -= segs[k][2];
        k++;
      }
      const [a, b, l] = segs[k], u = s / l, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, j = (r1[i] - 0.5) * 0.11;
      check[i * 3] = a[0] + (b[0] - a[0]) * u + nx * j;
      check[i * 3 + 1] = a[1] + (b[1] - a[1]) * u + ny * j;
      check[i * 3 + 2] = (r2[i] - 0.5) * 0.5;
    }
    cur = new Float32Array(N * 4);
    from = new Float32Array(N * 4);
    vel = new Float32Array(N * 2);
    off = new Float32Array(N * 2);
    offV = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      cur[i * 4] = fib[i * 3];
      cur[i * 4 + 1] = fib[i * 3 + 1];
      cur[i * 4 + 2] = fib[i * 3 + 2];
      cur[i * 4 + 3] = 1;
    }
    from.set(cur);
  }
  function target(st, i, tm, o) {
    let x, y, z, a = 1;
    if (st === "thinking") {
      const r = i % 3, ang = (i / 3 | 0) / (N / 3) * TAU + tm * RING_SPD[r];
      const x0 = Math.cos(ang) * 0.95, z0 = Math.sin(ang) * 0.95;
      const y1 = -z0 * Math.sin(0.45), z1 = z0 * Math.cos(0.45);
      const c2 = Math.cos(RING_TZ[r]), s2 = Math.sin(RING_TZ[r]);
      x = x0 * c2 - y1 * s2;
      y = x0 * s2 + y1 * c2;
      z = z1;
    } else if (st === "searching") {
      const rd = 0.95 * Math.sqrt((i + 0.5) / N), th = i * GA;
      x = Math.cos(th) * rd;
      y = Math.sin(th) * rd;
      let d = (tm / 1e3 * TAU - th) % TAU;
      if (d < 0) d += TAU;
      a = 0.3 + 0.7 * Math.exp(-d * 1.4);
      z = a * 0.6 - 0.3;
    } else if (st === "done") {
      x = check[i * 3];
      y = check[i * 3 + 1];
      z = check[i * 3 + 2];
    } else {
      x = fib[i * 3];
      y = fib[i * 3 + 1];
      z = fib[i * 3 + 2];
      let s = 0.98 + 0.02 * Math.sin(tm / 2400 * TAU);
      if (st === "listening") s = (0.84 + level * 0.2) * (1 + 0.06 * level * Math.sin(y * 5 - tm * 0.012));
      x *= s;
      y *= s;
      z *= s;
    }
    if (st !== "done" && st !== "searching" && st !== "thinking") {
      const ra = tm * 4e-4, c = Math.cos(ra), sn = Math.sin(ra);
      const xr = x * c + z * sn, zr = -x * sn + z * c;
      const cb = Math.cos(0.3), sb = Math.sin(0.3);
      x = xr;
      z = y * sb + zr * cb;
      y = y * cb - zr * sb;
    }
    o[0] = x;
    o[1] = y;
    o[2] = z;
    o[3] = a;
  }
  function go(next) {
    if (next === shape && next !== "error") return;
    from.set(cur);
    shape = next;
    t0 = performance.now();
    ok.to(next === "done" ? 1 : 0, 600, CALM);
    if (next === "error") {
      bad.to(1, 150, CALM);
      for (let i = 0; i < N; i++) {
        vel[i * 2] = (r1[i] - 0.5) * 0.7;
        vel[i * 2 + 1] = -r2[i] * 0.6;
      }
      fallUntil = t0 + (reduce() ? 0 : FALL);
    } else bad.to(0, 500, CALM);
  }
  function inputLevel(tm) {
    const l = p().level;
    if (l == null) return clamp(0.3 + 0.35 * Math.sin(tm * 47e-4) * Math.sin(tm * 13e-4 + 1) + 0.3 * Math.abs(Math.sin(tm * 0.011)));
    return clamp(typeof l === "number" ? l : l.value);
  }
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    const red = reduce(), tm = red ? 0 : now - epoch;
    const dur = red ? 150 : MORPH, stg = red ? 0 : STAGGER;
    level += (inputLevel(tm) - level) * (red ? 1 : 0.15);
    if (shape === "error" && fallUntil && (red || now >= fallUntil)) {
      fallUntil = 0;
      go("idle");
    }
    if (!colors) {
      colors = {
        fg: unit(p().color ?? token(host, "foreground", "rgb(28 28 30)")),
        ok: unit(token(host, "success", "rgb(52 199 89)")),
        bad: unit(token(host, "danger", "rgb(255 59 48)"))
      };
    }
    const col = lerp3(lerp3(colors.fg, colors.ok, ok.v), colors.bad, bad.v);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = `rgb(${col.map((v) => Math.round(v * 255)).join(",")})`;
    const falling = shape === "error" && fallUntil;
    const flee = ptr && !red && p().interactive ? ptr : null;
    for (let i = 0; i < N; i++) {
      const k4 = i * 4;
      if (falling) {
        vel[i * 2 + 1] += 4.2 * dt;
        cur[k4] += vel[i * 2] * dt;
        cur[k4 + 1] += vel[i * 2 + 1] * dt;
        if (cur[k4 + 1] > 1.05) {
          cur[k4 + 1] = 1.05;
          vel[i * 2 + 1] *= -0.28;
          vel[i * 2] *= 0.7;
        }
      } else {
        target(shape, i, tm, tg);
        const e = CALM(clamp((now - t0 - i * stg) / dur));
        for (let c = 0; c < 4; c++) cur[k4 + c] = from[k4 + c] + (tg[c] - from[k4 + c]) * e;
      }
      let px = S / 2 + cur[k4] * R, py = S / 2 + cur[k4 + 1] * R;
      let gx = 0, gy = 0;
      if (flee) {
        const dx = px - flee.x, dy = py - flee.y, d2 = Math.hypot(dx, dy);
        if (d2 < FLEE && d2 > 0.01) {
          gx = dx / d2 * (FLEE - d2) * 0.8;
          gy = dy / d2 * (FLEE - d2) * 0.8;
        }
      }
      for (let c = 0; c < 2; c++) {
        const j = i * 2 + c, to = c ? gy : gx;
        if (red) {
          offV[j] = off[j] = 0;
        } else {
          offV[j] += (260 * (to - off[j]) - 22 * offV[j]) * dt;
          off[j] += offV[j] * dt;
        }
      }
      px += off[i * 2];
      py += off[i * 2 + 1];
      const d = clamp((cur[k4 + 2] + 1) / 2);
      ctx.globalAlpha = (0.38 + 0.62 * d) * cur[k4 + 3];
      ctx.beginPath();
      ctx.arc(px, py, DOT * (0.8 + 0.4 * d), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const local = (e) => {
    const b = cv.getBoundingClientRect(), s = b.width / S || 1;
    return { x: (e.clientX - b.left) / s, y: (e.clientY - b.top) / s };
  };
  const onMove = (e) => {
    ptr = local(e);
  };
  const onLeave = () => {
    ptr = null;
  };
  const onUp = (e) => {
    if (e.pointerType !== "mouse") ptr = null;
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerdown", onMove);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onLeave);
  function decorate() {
    host.setAttribute("aria-label", `Assistant ${p().state}`);
    host.style.touchAction = p().interactive ? "pan-y" : "";
  }
  layout();
  seed();
  decorate();
  shape = p().state === "error" ? "idle" : p().state;
  if (shape === "done") ok.set(1);
  draw(performance.now());
  if (p().state === "error") go("error");
  const motion = loop(sc, cv, draw, () => !reduce() || last < t0 + MORPH);
  onThemeChange(sc, () => {
    colors = null;
    motion.kick();
  });
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", motion.kick);
  sc.onDispose(() => media.removeEventListener("change", motion.kick));
  return {
    update(next) {
      const changed = props.update(next);
      if (!changed.size) return;
      if (changed.has("size") || changed.has("dotSize")) layout();
      if (changed.has("dots")) {
        seed();
        t0 = -1e9;
      }
      if (changed.has("color")) colors = null;
      if (changed.has("state")) {
        const st = p().state;
        if (p().haptics && st === "done") vibrate(10);
        if (p().haptics && st === "error") vibrate([20, 60, 20]);
        go(st);
      }
      decorate();
      motion.kick();
    },
    destroy() {
      sc.dispose();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onLeave);
      cv.remove();
      delete host.dataset.dissolve;
      host.removeAttribute("role");
      host.removeAttribute("aria-label");
      for (const k of ["width", "height", "touch-action"]) host.style.removeProperty(k);
    }
  };
}

// src/lib/motion-core/thinking-orb-demo.ts
import { createSurface } from "./motion-runtime";

// src/data/thinking-orb.ts
var THINKING_ORB_WIDTH = 820;
var THINKING_ORB_HEIGHT = 390;
var THINKING_ORB_NAME = "Dissolve Thinking Orb";
var description = "A 180-dot orb morphs between six agent states and responds to the pointer.";
var instructions = "Switch the agent state, drag across the orb, or adjust the simulated voice level while listening.";
var THINKING_ORB_API = [
  { key: "state", type: '"idle" | "thinking" | "searching" | "listening" | "done" | "error"', defaultValue: '"idle"', en: "Set the agent state. The dots morph from their current positions.", zh: "\u8BBE\u7F6E\u667A\u80FD\u4F53\u72B6\u6001\uFF0C\u7C92\u5B50\u4ECE\u5F53\u524D\u4F4D\u7F6E\u5F00\u59CB\u53D8\u5F62\u3002" },
  { key: "size", type: "number", defaultValue: "96", en: "Orb width and height in CSS pixels.", zh: "\u8BBE\u7F6E\u7C92\u5B50\u7403\u7684\u5BBD\u9AD8\uFF0C\u5355\u4F4D\u4E3A CSS \u50CF\u7D20\u3002" },
  { key: "level", type: "number | { value: number }", en: "Normalized voice level from 0 to 1. The orb reads a level object on each frame.", zh: "\u4F20\u5165 0 \u5230 1 \u7684\u97F3\u91CF\u3002\u4F20\u5165\u5BF9\u8C61\u65F6\uFF0C\u7C92\u5B50\u7403\u9010\u5E27\u8BFB\u53D6\u5176\u503C\u3002" },
  { key: "interactive", type: "boolean", defaultValue: "false", en: "Let dots repel the pointer and spring back on release.", zh: "\u542F\u7528\u7C92\u5B50\u907F\u8BA9\u9F20\u6807\u6216\u624B\u6307\uFF0C\u677E\u5F00\u540E\u5F39\u56DE\u3002" },
  { key: "color", type: "string", en: "Override the base dot color. Done and error use the dissolve success and danger tokens.", zh: "\u8986\u76D6\u9ED8\u8BA4\u7C92\u5B50\u989C\u8272\u3002\u5B8C\u6210\u548C\u9519\u8BEF\u8BFB\u53D6 Dissolve \u7684\u6210\u529F\u4E0E\u9519\u8BEF\u8272\u4EE4\u724C\u3002" },
  { key: "dots", type: "number", defaultValue: "180", en: "Number of dots in the orb.", zh: "\u7C92\u5B50\u7403\u7684\u70B9\u6570\u3002" },
  { key: "dotSize", type: "number", en: "Set the dot diameter in CSS pixels.", zh: "\u8BBE\u7F6E\u7C92\u5B50\u76F4\u5F84\uFF0C\u5355\u4F4D\u4E3A CSS \u50CF\u7D20\u3002" },
  { key: "haptics", type: "boolean", defaultValue: "false", en: "Vibrate on done and error when the browser supports it.", zh: "\u6D4F\u89C8\u5668\u652F\u6301\u65F6\uFF0C\u5728\u5B8C\u6210\u548C\u9519\u8BEF\u72B6\u6001\u89E6\u53D1\u632F\u52A8\u3002" },
  { key: "showControls", type: "boolean", defaultValue: "false", en: "Show state and voice level controls for a demo.", zh: "\u5728\u6F14\u793A\u4E2D\u663E\u793A\u72B6\u6001\u548C\u97F3\u91CF\u63A7\u4EF6\u3002" },
  { key: "locale", type: '"en" | "zh"', defaultValue: '"en"', en: "Set the language of the demo controls.", zh: "\u8BBE\u7F6E\u6F14\u793A\u63A7\u4EF6\u8BED\u8A00\u3002" }
];
var thinkingOrbTranslations = Object.fromEntries([
  [THINKING_ORB_NAME, "Dissolve \u72B6\u6001\u7C92\u5B50\u7403"],
  [description, "\u7531 180 \u4E2A\u7C92\u5B50\u7EC4\u6210\u7684\u72B6\u6001\u7403\uFF0C\u5728\u516D\u79CD\u667A\u80FD\u4F53\u72B6\u6001\u95F4\u53D8\u5F62\uFF0C\u4E5F\u4F1A\u907F\u8BA9\u6307\u9488\u3002"],
  [instructions, "\u5207\u6362\u667A\u80FD\u4F53\u72B6\u6001\uFF0C\u5212\u8FC7\u7C92\u5B50\u7403\uFF0C\u6216\u5728\u8046\u542C\u65F6\u62D6\u52A8\u6ED1\u6746\u6A21\u62DF\u97F3\u91CF\u3002"],
  ...THINKING_ORB_API.map(({ en, zh }) => [en, zh])
]);

// src/lib/motion-core/thinking-orb-demo.ts
var states = {
  idle: ["Idle", "\u5F85\u673A"],
  thinking: ["Thinking", "\u601D\u8003"],
  searching: ["Searching", "\u641C\u7D22"],
  listening: ["Listening", "\u8046\u542C"],
  done: ["Done", "\u5B8C\u6210"],
  error: ["Error", "\u9519\u8BEF"]
};
var markup = `
<div class="orb-stage">
  <div class="orb-asset"></div>
  <div class="library-controls" hidden>
    <fieldset class="library-field">
      <legend data-orb-state-label></legend>
      <div class="library-segments">${Object.keys(states).map((state) => `
        <label><input type="radio" name="orb-state" value="${state}"><span></span></label>`).join("")}</div>
    </fieldset>
    <label class="library-field library-range">
      <span data-orb-level-label></span>
      <span class="library-range-row">
        <input type="range" min="0" max="100" value="45">
        <output class="library-range-value" aria-hidden="true"></output>
      </span>
    </label>
  </div>
</div>`;
var styles = `
.orb-stage { display: grid; }
.orb-stage.library-demo { display: flex; }
.orb-stage .library-controls { padding-bottom: 3px; }
.orb-stage .library-range { margin-inline-start: auto; }
.orb-stage .library-range:has(input:disabled) { opacity: .72; }
@media (max-width: 540px) {
  .orb-stage .library-range { margin-inline-start: 0; }
}
`;
function createThinkingOrbDemo(target, initial, sharedStyles) {
  let options = { size: 96, haptics: false, ...initial };
  let selectedState = "idle";
  let simulatedLevel = 0.45;
  let destroyed = false;
  const surfaceOptions = () => ({
    height: options.height ?? (options.showControls ? THINKING_ORB_HEIGHT : options.size),
    reducedMotion: options.reducedMotion
  });
  const scope2 = createSurface(target, {
    markup,
    css: sharedStyles + styles,
    width: THINKING_ORB_WIDTH,
    height: THINKING_ORB_HEIGHT,
    responsive: true
  }, surfaceOptions());
  const stage = scope2.root.querySelector(".orb-stage");
  const host = scope2.root.querySelector(".orb-asset");
  const controls = scope2.root.querySelector(".library-controls");
  const radios = [...controls.querySelectorAll('input[type="radio"]')];
  const slider = controls.querySelector('input[type="range"]');
  const output = controls.querySelector("output");
  const stateLabel = controls.querySelector("[data-orb-state-label]");
  const levelLabel = controls.querySelector("[data-orb-level-label]");
  const orbOptions = () => ({
    state: options.state ?? selectedState,
    size: options.size,
    level: options.level ?? (options.showControls ? simulatedLevel : void 0),
    interactive: options.interactive,
    color: options.color,
    dots: options.dots,
    dotSize: options.dotSize,
    haptics: options.haptics,
    reducedMotion: options.reducedMotion
  });
  const orb = createThinkingOrb(host, orbOptions());
  function syncControls() {
    const zh = options.locale === "zh";
    const labelIndex = zh ? 1 : 0;
    const state = options.state ?? selectedState;
    const level = options.level ?? simulatedLevel;
    const percentage = Math.round((typeof level === "number" ? level : level.value) * 100);
    controls.hidden = !options.showControls;
    stage.classList.toggle("library-demo", !!options.showControls);
    stage.lang = zh ? "zh" : "en";
    stateLabel.textContent = zh ? "\u72B6\u6001" : "State";
    levelLabel.textContent = zh ? "\u6A21\u62DF\u97F3\u91CF" : "Simulated level";
    for (const radio of radios) {
      const radioState = radio.value;
      radio.checked = radioState === state;
      radio.disabled = options.state !== void 0;
      radio.nextElementSibling.textContent = states[radioState][labelIndex];
    }
    slider.disabled = state !== "listening" || options.level !== void 0;
    slider.value = String(percentage);
    output.value = percentage + "%";
    host.setAttribute("aria-label", zh ? `\u667A\u80FD\u4F53\u72B6\u6001\uFF0C${states[state][1]}` : `Agent status, ${states[state][0]}`);
  }
  for (const radio of radios) {
    scope2.on(radio, "change", () => {
      selectedState = radio.value;
      orb.update(orbOptions());
      syncControls();
    });
  }
  scope2.on(slider, "input", () => {
    simulatedLevel = slider.valueAsNumber / 100;
    orb.update({ level: simulatedLevel });
    syncControls();
  });
  scope2.addCleanup(() => {
    destroyed = true;
    orb.destroy();
  });
  syncControls();
  return {
    ...scope2.controller,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope2.controller.update(surfaceOptions());
      orb.update(orbOptions());
      syncControls();
    }
  };
}

// src/lib/motion-core/thinking-orb-entry.js
function mountThinkingOrb(target, options = {}) {
  return createThinkingOrbDemo(target, options, ".library-demo {\r\n  display: flex;\r\n  flex-direction: column;\r\n  justify-content: center;\r\n  align-items: center;\r\n  gap: 18px;\r\n  padding: 20px 16px;\r\n  min-height: var(--motion-height);\r\n  background: #fff;\r\n  color: #111;\r\n  color-scheme: light;\r\n  font: 14px/1.4 system-ui, sans-serif;\r\n}\r\n\r\n.library-visual {\r\n  display: grid;\r\n  place-items: center;\r\n  width: 100%;\r\n  min-width: 0;\r\n  flex: 1;\r\n}\r\n\r\n.library-demo[data-preview=true] .library-controls,\r\n.library-demo[data-controls=false] .library-controls {\r\n  display: none;\r\n}\r\n\r\n.library-controls {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  justify-content: flex-start;\r\n  align-items: end;\r\n  gap: 12px 18px;\r\n  width: min(100%, 560px);\r\n  margin: 0;\r\n  padding-top: 12px;\r\n  border-top: 1px solid #ededed;\r\n}\r\n\r\n.library-field {\r\n  display: grid;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  gap: 5px;\r\n  padding: 0;\r\n  margin: 0;\r\n  border: 0;\r\n  color: #646464;\r\n  font: 500 12px/1.35 system-ui, sans-serif;\r\n}\r\n\r\n.library-field legend { margin-bottom: 5px; padding: 0; }\r\n.library-segments {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 3px;\r\n}\r\n.library-segments label { position: relative; display: grid; cursor: pointer; }\r\n.library-segments input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; margin: 0; cursor: inherit; }\r\n.library-segments span,\r\n.library-controls > button,\r\n.library-select-trigger {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-height: 32px;\r\n  max-width: 100%;\r\n  padding: 4px 8px;\r\n  border: 0;\r\n  border-radius: 6px;\r\n  background: #f4f4f4;\r\n  color: #111;\r\n  font: 500 13px/1.35 system-ui, sans-serif;\r\n}\r\n.library-segments input:checked + span,\r\n.library-controls > button[aria-pressed=true] { background: #111; color: #fff; }\r\n.library-segments input:disabled + span { opacity: .55; }\r\n.library-segments label:has(:disabled) { cursor: default; }\r\n.library-controls > button, .library-select-trigger { cursor: pointer; }\r\n.library-controls :is(button, input):disabled { cursor: default; }\r\n.library-controls > button:disabled, .library-select-trigger:disabled { opacity: .55; }\r\n.library-select-trigger {\r\n  justify-content: space-between;\r\n  gap: 10px;\r\n  min-width: 88px;\r\n  background: #fff;\r\n  box-shadow: inset 0 0 0 1px #e5e5e5;\r\n}\r\n.library-select-trigger svg, .library-select-item svg { display: block; }\r\n.library-select-positioner { z-index: 8; }\r\n.library-select-popup {\r\n  min-width: var(--anchor-width);\r\n  max-height: min(248px, var(--available-height));\r\n  overflow-y: auto;\r\n  overscroll-behavior: contain;\r\n  outline: none;\r\n  padding: 4px;\r\n  border-radius: 9px;\r\n  background: #fff;\r\n  box-shadow: 0 4px 16px #0002;\r\n  color: #111;\r\n  font: 500 13px/1.35 system-ui, sans-serif;\r\n}\r\n.library-select-item {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  gap: 12px;\r\n  min-height: 32px;\r\n  padding: 4px 8px;\r\n  border-radius: 5px;\r\n  cursor: pointer;\r\n  outline: none;\r\n}\r\n.library-select-item[data-highlighted], .library-select-trigger[data-popup-open] { background: #f4f4f4; }\r\n.library-range-row { display: flex; align-items: center; gap: 6px; }\r\n.library-range-value { min-width: 3ch; color: #111; font-variant-numeric: tabular-nums; }\r\n.library-controls input[type=range] { width: 86px; min-height: 32px; margin: 0; accent-color: #111; }\r\n.library-demo :is(button, input):focus-visible,\r\n.library-segments input:focus-visible + span {\r\n  outline: 2px solid #2563eb;\r\n  outline-offset: 2px;\r\n}\r\n.library-demo[data-reduced=true] :is(.library-visual, .library-visual *) {\r\n  animation-play-state: paused !important;\r\n  transition-duration: 0s !important;\r\n}\r\n\r\n@media (max-width: 360px) {\r\n  .library-demo { padding: 12px; gap: 12px; }\r\n  .library-controls { gap: 8px 12px; }\r\n}\r\n");
}
export {
  mountThinkingOrb
};
