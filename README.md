# AvaMedia 发布与反馈

天池万象转换（AvaMedia）的公开发布仓库：安装包与更新说明在 [Releases](../../releases)，问题与建议请提交到 [Issues](../../issues/new/choose)。

- 报告 Bug：请附上系统版本、软件版本和复现步骤。
- 功能建议：描述你想完成的事情，而不只是想要的按钮。
- 产品介绍与购买：见落地页（`site/`，通过 Cloudflare Pages 发布）。

本仓库不包含应用源代码。

## 落地页

`site/` 是纯静态页面，无构建步骤。Cloudflare Pages：连接此仓库，构建命令留空，输出目录填 `site`。购买链接在 `site/site.js` 的 `BUY_URL` 中设置。

## 部署（Cloudflare Pages）

站点发布到 `https://ava.xpai.uk`（中文 `/`，英文 `/en/`）。Pages 项目名 `avamedia-site`，直接上传 `site/`：

```bash
# 在一个不含 wrangler.toml 的目录里运行，避免被当成 Worker 部署
npx wrangler pages deploy <本仓库>/site --project-name avamedia-site --branch main
```

`ava` 需要一条指向 `avamedia-site.pages.dev` 的 CNAME（已代理）。
