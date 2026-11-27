# 少年创想家官网

面向青少年的 AI 实践课程官网，包含首页、课程、活动与作品、联系与合作。

## 公开预览

https://swording-k.github.io/shaonian-makers-site/

这是此公司官网的项目地址。账号根地址 https://swording-k.github.io/ 可同时用于个人网站。

## 自定义域名

先在本仓库 Settings → Pages → Custom domain 填入实际公司域名并保存，再到域名 DNS 管理配置。

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| @ | A | 185.199.108.153 |
| @ | A | 185.199.109.153 |
| @ | A | 185.199.110.153 |
| @ | A | 185.199.111.153 |
| www | CNAME | swording-k.github.io |

GitHub 依据访问的域名及仓库的 Custom domain 设置选择站点。CNAME 值填账号的 github.io 主机名，项目路径只出现在默认预览地址中。解析生效、证书签发完成后开启 Enforce HTTPS。已有同名解析冲突时先核对用途再修改。

## 当前发布方式

main 分支根目录由 GitHub Pages 发布。开发源码在本地项目 site/public/。运行 node site/build-demo.mjs 后，使用 preview/index.html 更新本仓库的 index.html，并同步 event-demo.html 等所需页面。保留域名配置文件 CNAME。

本次核对时线上仍是最初静态版，最新版三栏对齐、产品更名和动效尚待成功发布。GitHub 连接器写入曾返回 403，需要有仓库写入权限的授权或浏览器登录完成上传。

正式活动数据与飞书的自动连接尚待部署和联调。

## 静态服务器部署

运行 `npm run build:static` 后，将 `dist/static/` 内的全部文件和目录发布到站点根目录。首页、样例活动页、样式、图片和脚本分别传输，兼容子目录部署。静态包展示网站内置的活动内容。

服务器或 CDN 可对 HTML 使用 `Cache-Control: no-cache`，并为 HTML、CSS、JavaScript 开启 gzip 或 Brotli。构建会给 HTML 引用的脚本和样式加上内容版本，以便发布后更新缓存。部署后先验证根地址、活动详情返回链接和咨询二维码。

`site-demo.html` 是便于离线发送的单文件预览。它包含所有素材和互动组件，体积比静态部署版的入口大。
