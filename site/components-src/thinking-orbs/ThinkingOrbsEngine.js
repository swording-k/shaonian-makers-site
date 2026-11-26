/*!
thinking-orbs@0.3.2 · Jakub Antalik · https://libraries.dev/orbs

MIT License

Copyright (c) 2026 Jakub Antalik

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

// src/lib/motion-core/libraries-dev/select-choice.jsx
import { useId, useRef } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
function SelectChoice({ label, value, items, onChange, disabled = false }) {
  const id = useId();
  const container = useRef(null);
  const current = items.find(([key]) => key === value)?.[1];
  return /* @__PURE__ */ jsxs("div", { className: "library-field", ref: container, children: [
    /* @__PURE__ */ jsx("span", { id, children: label }),
    /* @__PURE__ */ jsxs(Select.Root, { value, onValueChange: (next) => {
      if (next != null) onChange(next);
    }, disabled, children: [
      /* @__PURE__ */ jsxs(Select.Trigger, { className: "library-select-trigger", "aria-labelledby": id, children: [
        /* @__PURE__ */ jsx("span", { children: current }),
        /* @__PURE__ */ jsx(Select.Icon, { children: /* @__PURE__ */ jsx(ChevronDown, { "aria-hidden": "true", size: 14 }) })
      ] }),
      /* @__PURE__ */ jsx(Select.Portal, { container, children: /* @__PURE__ */ jsx(Select.Positioner, { className: "library-select-positioner", align: "start", side: "top", sideOffset: 6, alignItemWithTrigger: false, children: /* @__PURE__ */ jsx(Select.Popup, { className: "library-select-popup", children: /* @__PURE__ */ jsx(Select.List, { children: items.map(([key, text]) => /* @__PURE__ */ jsxs(Select.Item, { value: key, className: "library-select-item", children: [
        /* @__PURE__ */ jsx(Select.ItemText, { children: text }),
        /* @__PURE__ */ jsx(Select.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { "aria-hidden": "true", size: 14 }) })
      ] }, key)) }) }) }) })
    ] })
  ] });
}

// src/lib/motion-core/libraries-dev/demo-controls.jsx
import { useId as useId2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function SegmentedChoice({ label, value, items, onChange, disabled = false }) {
  const name = useId2();
  return /* @__PURE__ */ jsxs2("fieldset", { className: "library-field", disabled, children: [
    /* @__PURE__ */ jsx2("legend", { children: label }),
    /* @__PURE__ */ jsx2("div", { className: "library-segments", children: items.map(([key, text]) => /* @__PURE__ */ jsxs2("label", { children: [
      /* @__PURE__ */ jsx2("input", { type: "radio", name, value: key, checked: key === value, onChange: () => onChange(key) }),
      /* @__PURE__ */ jsx2("span", { children: text })
    ] }, key)) })
  ] });
}

// src/lib/motion-core/libraries-dev/thinking-orbs.jsx
import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var states = {
  working: ["Working", "\u5904\u7406\u4E2D", "#5040a2"],
  searching: ["Searching", "\u641C\u7D22\u4E2D", "#1b7394"],
  solving: ["Solving", "\u63A8\u7406\u4E2D", "#9b6429"],
  listening: ["Listening", "\u8046\u542C\u4E2D", "#327e60"],
  connecting: ["Connecting", "\u8FDE\u63A5\u4E2D", "#216790"],
  weaving: ["Weaving", "\u7F16\u7EC7\u4E2D", "#8c3d98"],
  composing: ["Composing", "\u64B0\u5199\u4E2D", "#a34175"],
  breathing: ["Breathing", "\u547C\u5438\u4E2D", "#5159a2"],
  shaping: ["Shaping", "\u5851\u5F62\u4E2D", "#376d92"]
};
var css = `
.orb-demo-panel {
  width: min(100%, 500px);
  min-height: 246px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 17px;
  padding: 18px;
}
.orb-demo-well { display: grid; place-items: center; width: 140px; height: 140px; }
.orb-demo-well canvas { transform: scale(2); }
.orb-demo-status { color: #5f5f5f; font-size: 14px; font-weight: 540; }
`;
function ThinkingOrbsScene({ reducedMotion, locale, options }) {
  const zh = locale === "zh";
  const [selectedState, setState] = useState("working");
  const [selectedSize, setSize] = useState(64);
  const [paused, setPaused] = useState(false);
  const state = options.state ?? selectedState;
  const size = options.size ?? selectedSize;
  const stateLabel = states[state][zh ? 1 : 0];
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsx3("style", { children: css }),
    /* @__PURE__ */ jsx3("div", { className: "library-visual", children: /* @__PURE__ */ jsxs3("div", { className: "orb-demo-panel", children: [
      /* @__PURE__ */ jsx3("div", { className: "orb-demo-well", children: /* @__PURE__ */ jsx3(ThinkingOrb, { "aria-hidden": "true", state, size, color: states[state][2], theme: "light", paused: reducedMotion || paused, speed: options.speed }) }),
      /* @__PURE__ */ jsx3("span", { className: "orb-demo-status", role: "status", children: stateLabel })
    ] }) }),
    /* @__PURE__ */ jsxs3("div", { className: "library-controls", children: [
      /* @__PURE__ */ jsx3(SelectChoice, { label: zh ? "\u72B6\u6001" : "State", value: state, onChange: setState, disabled: options.state != null, items: Object.entries(states).map(([key, labels]) => [key, labels[zh ? 1 : 0]]) }),
      /* @__PURE__ */ jsx3(SegmentedChoice, { label: zh ? "\u5927\u5C0F" : "Size", value: size, onChange: setSize, disabled: options.size != null, items: [64, 32, 20].map((value) => [value, value + " px"]) }),
      /* @__PURE__ */ jsx3("button", { type: "button", disabled: reducedMotion, "aria-pressed": paused, onClick: () => setPaused((value) => !value), children: zh ? paused ? "\u7EE7\u7EED" : "\u6682\u505C" : paused ? "Resume" : "Pause" })
    ] })
  ] });
}

// src/lib/motion-core/libraries-dev/mount.jsx
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createSurface } from "./motion-runtime";
import { jsx as jsx4 } from "react/jsx-runtime";
var stylesBySlug = {
  "liquid-metal": ["metal-fx-styles", "mfx-bare-style", "mfx-bend-style"]
};
function Demo({ Scene, options, reducedMotion, preview, onReady }) {
  const locale = options.locale ?? "en";
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return /* @__PURE__ */ jsx4(
    "div",
    {
      className: "library-demo",
      lang: locale,
      "data-preview": preview,
      "data-controls": options.showControls !== false,
      "data-reduced": reducedMotion,
      children: /* @__PURE__ */ jsx4(Scene, { options, reducedMotion, preview, locale })
    }
  );
}
function mountLibraryDemo(target, initialOptions, scene2, settings = {}) {
  const { Scene, slug, width, height, css: css2 } = scene2;
  const { preview = false, onReady } = settings;
  let options = { ...initialOptions };
  let destroyed = false;
  const scope = createSurface(target, { markup: "", css: css2, width, height, responsive: true }, options);
  const reactRoot = createRoot(scope.body);
  const document = target.ownerDocument;
  const media = document.defaultView.matchMedia("(prefers-reduced-motion: reduce)");
  const draw = () => reactRoot.render(
    /* @__PURE__ */ jsx4(Demo, { Scene, options, reducedMotion: scope.reduced() || document.hidden, preview, onReady })
  );
  const styleIds = stylesBySlug[slug];
  if (styleIds) {
    const mirror = () => {
      for (const id of styleIds) {
        const source = document.getElementById(id);
        if (source && !scope.root.getElementById(id)) scope.root.append(source.cloneNode(true));
      }
    };
    const observer = new document.defaultView.MutationObserver(mirror);
    observer.observe(document.head, { childList: true });
    scope.addCleanup(() => observer.disconnect());
    mirror();
  }
  scope.on(media, "change", draw);
  scope.on(document, "visibilitychange", draw);
  draw();
  return {
    ...scope.controller,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      scope.controller.update(next);
      draw();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scope.controller.destroy();
      queueMicrotask(() => reactRoot.unmount());
    }
  };
}

// src/lib/motion-core/libraries-dev/thinking-orbs-entry.js
var scene = { slug: "thinking-orbs", width: 820, height: 440, css: ".library-demo {\r\n  display: flex;\r\n  flex-direction: column;\r\n  justify-content: center;\r\n  align-items: center;\r\n  gap: 18px;\r\n  padding: 20px 16px;\r\n  min-height: var(--motion-height);\r\n  background: #fff;\r\n  color: #111;\r\n  color-scheme: light;\r\n  font: 14px/1.4 system-ui, sans-serif;\r\n}\r\n\r\n.library-visual {\r\n  display: grid;\r\n  place-items: center;\r\n  width: 100%;\r\n  min-width: 0;\r\n  flex: 1;\r\n}\r\n\r\n.library-demo[data-preview=true] .library-controls,\r\n.library-demo[data-controls=false] .library-controls {\r\n  display: none;\r\n}\r\n\r\n.library-controls {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  justify-content: flex-start;\r\n  align-items: end;\r\n  gap: 12px 18px;\r\n  width: min(100%, 560px);\r\n  margin: 0;\r\n  padding-top: 12px;\r\n  border-top: 1px solid #ededed;\r\n}\r\n\r\n.library-field {\r\n  display: grid;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  gap: 5px;\r\n  padding: 0;\r\n  margin: 0;\r\n  border: 0;\r\n  color: #646464;\r\n  font: 500 12px/1.35 system-ui, sans-serif;\r\n}\r\n\r\n.library-field legend { margin-bottom: 5px; padding: 0; }\r\n.library-segments {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 3px;\r\n}\r\n.library-segments label { position: relative; display: grid; cursor: pointer; }\r\n.library-segments input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; margin: 0; cursor: inherit; }\r\n.library-segments span,\r\n.library-controls > button,\r\n.library-select-trigger {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-height: 32px;\r\n  max-width: 100%;\r\n  padding: 4px 8px;\r\n  border: 0;\r\n  border-radius: 6px;\r\n  background: #f4f4f4;\r\n  color: #111;\r\n  font: 500 13px/1.35 system-ui, sans-serif;\r\n}\r\n.library-segments input:checked + span,\r\n.library-controls > button[aria-pressed=true] { background: #111; color: #fff; }\r\n.library-segments input:disabled + span { opacity: .55; }\r\n.library-segments label:has(:disabled) { cursor: default; }\r\n.library-controls > button, .library-select-trigger { cursor: pointer; }\r\n.library-controls :is(button, input):disabled { cursor: default; }\r\n.library-controls > button:disabled, .library-select-trigger:disabled { opacity: .55; }\r\n.library-select-trigger {\r\n  justify-content: space-between;\r\n  gap: 10px;\r\n  min-width: 88px;\r\n  background: #fff;\r\n  box-shadow: inset 0 0 0 1px #e5e5e5;\r\n}\r\n.library-select-trigger svg, .library-select-item svg { display: block; }\r\n.library-select-positioner { z-index: 8; }\r\n.library-select-popup {\r\n  min-width: var(--anchor-width);\r\n  max-height: min(248px, var(--available-height));\r\n  overflow-y: auto;\r\n  overscroll-behavior: contain;\r\n  outline: none;\r\n  padding: 4px;\r\n  border-radius: 9px;\r\n  background: #fff;\r\n  box-shadow: 0 4px 16px #0002;\r\n  color: #111;\r\n  font: 500 13px/1.35 system-ui, sans-serif;\r\n}\r\n.library-select-item {\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n  gap: 12px;\r\n  min-height: 32px;\r\n  padding: 4px 8px;\r\n  border-radius: 5px;\r\n  cursor: pointer;\r\n  outline: none;\r\n}\r\n.library-select-item[data-highlighted], .library-select-trigger[data-popup-open] { background: #f4f4f4; }\r\n.library-range-row { display: flex; align-items: center; gap: 6px; }\r\n.library-range-value { min-width: 3ch; color: #111; font-variant-numeric: tabular-nums; }\r\n.library-controls input[type=range] { width: 86px; min-height: 32px; margin: 0; accent-color: #111; }\r\n.library-demo :is(button, input):focus-visible,\r\n.library-segments input:focus-visible + span {\r\n  outline: 2px solid #2563eb;\r\n  outline-offset: 2px;\r\n}\r\n.library-demo[data-reduced=true] :is(.library-visual, .library-visual *) {\r\n  animation-play-state: paused !important;\r\n  transition-duration: 0s !important;\r\n}\r\n\r\n@media (max-width: 360px) {\r\n  .library-demo { padding: 12px; gap: 12px; }\r\n  .library-controls { gap: 8px 12px; }\r\n}\r\n", Scene: ThinkingOrbsScene };
function mountThinkingOrbs(target, options = {}) {
  return mountLibraryDemo(target, options, scene);
}
export {
  mountThinkingOrbs
};
