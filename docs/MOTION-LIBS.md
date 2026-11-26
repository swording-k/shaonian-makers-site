# 首页动效与组件库记录

记录官网已接入和调研过的动效/组件库，后续更新时按需复用或替换。每次接入新库请补一行。

## 已接入（正在页面运行）

| 库 | 位置 | 用途 | 来源与授权 |
| --- | --- | --- | --- |
| GSAP 3 + ScrollTrigger 3.15.0 | `site/public/assets/gsap.min.js`、`ScrollTrigger.min.js` | 全站滚动动效：章节渐显、理念文字逐行加深、波浪接缝驱动、首屏退场 | gsap.com，标准 GreenSock 许可，文件已本地化，无 CDN 依赖 |
| CardSwap（LeiBox） | `site/public/components/card-swap/card-swap.min.js`，源码 `site/components-src/card-swap/` | 首屏右侧学员作品卡切换（点击/拖动） | LeiBox 实时组件包，声明保留在源码内 |
| AsciiSharks（LeiBox） | `site/public/components/ascii-sharks/bundle.js`，源码 `site/components/ascii-sharks/` | 首屏字符鲨鱼海洋背景 + 「你想做出什么」输入框 | 上游 https://github.com/stackedlol/ascii-sharks ，MIT |
| BlueFlutedGlass（LeiBox） | `site/public/components/blue-glass/bundle.js`，源码 `site/components/blue-glass/` | 开场蓝色棱纹玻璃层（首次进站） | LeiBox 独立 WebGL 重建，原始设计授权未核实，参考 https://x.com/sashabirukoff/status/2113002960892649916/video/1 |
| DeepAgentUI composer/slider（LeiBox） | `site/public/components/deep-agent/bundle.js`，原始依赖 `site/components/deep-agent/original-standalone.html` | 「提出真问题」「指挥智能体」两栏交互示例 | LeiBox 实时组件包，原包依赖 React，已导出为独立 mount 入口 |

## 已下载未挂载（备用）

- ThinkingOrb / ThinkingOrbs / ThinkingParticles（LeiBox，`site/components-src/`）：粒子思考动效，曾在「指挥智能体」栏使用，后被 GSAP 顺序动效替代，未删除可复用。

## 调研参考（未复制源码）

- Codrops SeamTransitions：https://tympanus.net/Demos/SeamTransitions/ —— 首屏→理念段的波浪幕布衔接参考此方向（滚动驱动的曲线接缝 + 下层页面提前入场）。
- recent.design（Eaton）：https://recent.design/ —— 滚动叙事与组件演示站，风格参考。
- Swup / Barba.js / View Transitions API：多页过渡备选方案，记录于 `docs/SITE-FLOW-RESEARCH.md` 与 `design/site-flow-research` 分支。

## 构建方式

- LeiBox 类组件用 `node site/build-motion.mjs` 重建（需支持 `node:module.stripTypeScriptTypes` 的 Node），产物在 `site/public/components/`。
- 独立预览用 `node site/build-demo.mjs` 生成 `site-demo.html` 与 `preview/index.html`；发布时把 `preview/index.html` 更新到公开仓库 main 根目录的 `index.html`。
