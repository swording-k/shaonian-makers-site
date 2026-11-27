# 少年创想家官网

面向青少年的 AI 实践课程官网。正式网址 [youngmakers.com.cn](https://youngmakers.com.cn/)。

| 需求 | 命令或位置 |
| --- | --- |
| 修改官网 | `site/public/index.html`、`site.css`、`site.js`，活动详情为 `event.html`、`event.js` |
| 本地静态预览 | `npm run build:static`，再运行 `python3 -m http.server 8767 --bind 127.0.0.1 -d dist/static`，Chrome 打开 [127.0.0.1:8767](http://127.0.0.1:8767/) |
| 离线 HTML | `node site/build-demo.mjs` 生成 `site-demo.html` 和 `event-demo.html`，另有 `preview/` 副本 |
| 国内静态服务器 | `npm run build:static` 后，把 `dist/static/` 的全部内容部署到站点根目录 |
| 飞书接口 | `npm run build` 生成 Worker 的 `dist/server/index.js`，服务端配置见 [飞书接入](docs/FEISHU.md) |

静态构建将样式、图片和脚本拆开传输。HTML 可使用 `Cache-Control: no-cache`，CSS 和 JS 带内容版本参数，发布时保持资源目录结构，并为文本资源开启 gzip 或 Brotli。离线单文件包含完整资源，适合本地分享。静态官网展示内置活动内容，团队活动表需要 Worker 部署和真实授权。

## 发布与域名

既有 GitHub Pages 由远端 `main` 根目录发布，默认地址是 [GitHub Pages 项目页](https://swording-k.github.io/shaonian-makers-site/)。自定义域名通过仓库 Pages 配置关联，发布时保留 `CNAME`。本地源码与远端发布分支曾使用不同历史，先核对目标分支和站点产物再更新。最新验证记录见 [交接](docs/HANDOFF.md)。

切换国内托管前，先用新服务的预览地址检查首屏、企微二维码和活动返回，再根据新托管方要求变更 DNS 和 HTTPS。

## 开发入口

先读 [AGENTS.md](AGENTS.md)。网页视觉以 [设计基线](docs/DESIGN.md) 为准，技术选择查 [动效组件台账](docs/MOTION-LIBS.md) 和 [前端工作流](docs/FRONTEND-WORKFLOW.md)，部署形态见 [技术架构](docs/ARCHITECTURE.md)。
