# 少年创想家官网 · 技术架构

## 当前代码与交付

官网主体在 `site/public/`，使用原生 HTML、CSS 和 JavaScript。一个长页承载首页、课程、活动和联系，活动详情使用独立 HTML。组件来源和章节流转见 [动效台账](MOTION-LIBS.md)。

| 交付形态 | 输出 | 活动读取 |
| --- | --- | --- |
| 静态服务器 | `npm run build:static` → `dist/static/` | 内置真实回顾及明确标注的示例。相对路径支持子目录 |
| 本地离线预览 | `node site/build-demo.mjs` → `site-demo.html`、`event-demo.html` 及 `preview/` | 同一套静态内容，资源内联 |
| Cloudflare Worker | `npm run build` → `dist/server/index.js` | `GET /api/events` 读取飞书，依赖已部署服务与已授权活动表 |
| 既有线上站 | GitHub Pages 从远端 main 根目录发布静态构建，绑定公司域名 | 使用分离资源与内置活动 |

开发和验证方式见 [开发交接](DEVELOPMENT.md)。早期 Astro 方案见 Git 历史。

## 飞书与活动详情

`site/src/worker.mjs` 读取已发布的飞书记录，筛选公开字段，缓存成功结果，错误时可使用上次成功的结果。服务端凭据仅通过环境配置。字段、账号和接入验证见 [飞书接入](FEISHU.md)。

Worker 将 `/events/<slug>/` 映射为详情 HTML，前端按活动 ID 从 `/api/events` 找记录。静态详情演示使用 `event.html?sample=recap` 等相对地址。首期公开回顾直接链接真实视频号。

活动要使用稳定 ID，运营在飞书发布、改期、补内容或移除记录。已发布的日期、状态和有效链接共同决定报名入口。微信公众号原文保持独立链接，自动读取公众号是后续议题，需由团队实际验证账号权限与内容流程。
