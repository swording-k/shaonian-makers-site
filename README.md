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

2026-11-26 已通过浏览器上传新版首页、活动示例页和 README。主分支由 GitHub Pages 自动构建。design/motion-refinement 分支用于后续动效实验。

正式活动数据与飞书的自动连接尚待部署和联调。
