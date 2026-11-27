# 动效、页面流转与组件台账

本表以当前实验分支 `design/fast-first-paint` 的实际入口为准。线上发布基线见 [交接](HANDOFF.md)，跨项目选用顺序见 [前端工作流](FRONTEND-WORKFLOW.md)。

## 当前页面会加载

| 技术 | 场景 | 入口与来源 |
| --- | --- | --- |
| CSS 动画和 Web Animations API | 蓝色棱纹开场、跳过和淡出，首页文字入场，按压与焦点反馈 | `site.css`、`index.html` |
| GSAP 3.15.0 与 ScrollTrigger 3.15.0 | 首屏退场、首屏到理念段的滚动覆盖、理念文字变化、列表入场 | `site/public/assets/`、`site.js`。源码头部声明 GreenSock Standard License。[GSAP](https://gsap.com/) |
| SVG 与 CSS sticky | 第二屏浅蓝波浪接缝，短屏按自然滚动展示 | 接缝为项目自绘，参考 Codrops 的滚动覆盖方式。[Seam Transitions](https://tympanus.net/Demos/SeamTransitions/) |
| LeiBox CardSwap | 首屏右侧作品堆的点击、拖动、键盘切换 | `site/components-src/card-swap/`、`site/public/components/card-swap/`。[LeiBox](https://leibox.pantoria.cn/components) |
| LeiBox AsciiSharks | 首屏全幅字符海洋和想法输入框，发送后打开企微二维码 | `site/components/ascii-sharks/`。上游 MIT，保留源码声明。[Ascii Sharks](https://github.com/stackedlol/ascii-sharks) |
| LeiBox Deep Agent composer 与 reasoning effort slider | 「提出真问题」和「指挥智能体」交互演示，滚动接近时加载 | `site/components/deep-agent/original-standalone.html` 和生成的 `bundle.js`。上游内嵌 React 等依赖，官网主体为原生 HTML/CSS/JS，保留包内声明 |
| HTML 锚点、dialog 和普通链接 | 章节导航、详情路径、企微与视频号二维码弹窗、外链 | `index.html`、`event.html`、`site.js`；页面间当前走原生链接 |

## 用过或保存过的试验

- **BlueFlutedGlass（LeiBox，WebGL）** 曾用于已发布版本的蓝色开场。新分支改为 CSS 棱纹背景。源码和旧产物保留在 `site/components/blue-glass/` 与 `site/public/components/blue-glass/`。原始设计许可未核实。
- **ThinkingParticles、ThinkingOrb、ThinkingOrbs（LeiBox）** 在旧三栏里试验过的粒子系列。当前改用输入框和思考强度滑块，留档在 `site/components-src/`。ThinkingOrb 的视觉来源涉及 Dissolve，具体以该包内声明为准。
- **作品册替代交互，以及浅蓝滚动线纹** 是早期分支实验。现版作品使用 CardSwap，背景使用 AsciiSharks。

## 参考过的整站和页面切换资源

| 资源 | 研究所得 |
| --- | --- |
| [Codrops Seam Transitions](https://tympanus.net/Demos/SeamTransitions/) | 连续滚动时用边缘覆盖连接两个章节，借鉴构图和节奏 |
| [Swup Demos](https://swup.js.org/getting-started/demos/) | 查看过遮罩揭示，也研究了列表和详情返回涉及的历史与滚动恢复 |
| [Barba.js](https://barba.js.org/docs/advanced/hooks/) 与 [原生 View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) | 研究过跨页动画、元素连续性与组件挂载时机，留待真实详情链路使用 |
| [Dissolve](https://dissolve.rselmi.com/) | 对照 SweepTransition 的扫光、Accordion 的展开，以及 Card expand、Lightbox 等参考；后两者在调研时列为 Pro |
| [Recent](https://recent.design/) 与 [Hoverstat.es](https://www.hoverstat.es/) | 找完整站点的排版和滚动参考，近期参考包括 Eaton |
| [Rare UI](https://www.rareui.com/) | Folder 组件启发过早期作品册的索引和动效 |
| Looseleaf、Sketchbook UI、goopUI、ExpoKit、beUI | 对话中收集的候选。纸感、手作与形变有参考价值，逐项集成与许可待核实 |

当前运行时没有引入 Swup、Barba.js、Dissolve 或 View Transitions。详情和返回交互的研究在 [整站流转方案](SITE-FLOW-RESEARCH.md)。

## 工程说明

`node site/build-motion.mjs` 用于重建 AsciiSharks、BlueFlutedGlass 与 Deep Agent 的生成包，需要 Node 支持 `stripTypeScriptTypes`。CardSwap 已有独立源码与生成产物。生成、预览与发布命令见 [仓库 README](../README.md)。
