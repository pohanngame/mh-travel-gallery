# 部署到 Cloudflare Pages

这个项目是**纯静态站点**（Vite 构建，产物在 `dist/`，没有服务端、没有数据库、没有环境变量），
所以 Cloudflare Pages 可以原样托管，**不需要改任何配置**。

| 项 | 值 |
| --- | --- |
| 仓库 | `github.com/pohanngame/mh-travel-gallery`（fork 自 `1077553201/mh-travel-gallery`） |
| 生产分支 | `blockchain`（不是 `main`，填错会 404） |
| 框架预设 | `Vite` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| Node 版本 | `22`（Vite 8 要求 ≥ 20.19 / 22.12） |

`dist/` 已在 `.gitignore` 里，**不需要提交构建产物**——Cloudflare 会自己拉源码构建。

---

## 方式 A：连 Git，推一次自动发一次（推荐）

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → 左侧 **Workers & Pages** → 点右上蓝色按钮 **Create application** → 弹层里切到 **Pages** 标签 → **Connect to Git**。
   （这版控制台左侧已经没有单独的 Pages 菜单了，Pages 收在 `Create application` 里；
   点成 Workers 会要求写 `wrangler` 配置，不是这个项目要的。）
2. 授权 GitHub，选中 `mh-travel-gallery` 仓库 → **Begin setup**。
3. 按上表填写：

   - **Project name**：`blockchain-workshop`（决定默认域名 `blockchain-workshop.pages.dev`，建好后不能改）
   - **Production branch**：`blockchain`
   - **Framework preset**：`Vite`（选完构建命令与输出目录会自动填好，对一下即可）
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - 展开 **Environment variables**，加一条 `NODE_VERSION` = `22`

4. **Save and Deploy**。首次构建约 40–90 秒，日志里出现 `✓ built in 3.1s` 就成了。
5. 拿到 `https://blockchain-workshop.pages.dev`，手机也打开看一眼。

之后**每次 `git push` 到 `blockchain` 分支，Cloudflare 都会自动重新构建并发布**，不用再做任何操作。
推其它分支会生成预览地址（形如 `<commit>.blockchain-workshop.pages.dev`），不会影响线上。

---

## 方式 B：直接上传 `dist`（没有 GitHub 也能发）

适合临时给人看一眼、或网络连不上 GitHub 时。

```bash
npm run build                      # 生成 dist/
npx wrangler pages deploy dist --project-name blockchain-workshop
```

第一次会要求浏览器登录 Cloudflare 授权。这条路径**不会自动更新**，每次改完都要重新执行一遍。

也可以把 `dist` 文件夹整个拖进 Dashboard 的 Upload assets 页面，效果一样。

---

## 关于这是一个 fork

本仓库是 `1077553201/mh-travel-gallery` 的 fork，上游是**接手改造前的旧版**。

- 仓库页会出现「N commits ahead of」和右上角的 **Sync fork → Update branch**。**不要点。**
  同步是把上游提交合并进来，会把改造前的旧文件（旅行画廊主题的 `docs/PLAN.md`、旧 tokens 等）带回来，
  还可能制造一批无意义的合并提交。你不是落后，你是领先。
- 真要取上游某个改动，用 `git cherry-pick <sha>` 单独挑，别整分支同步。
- fork 关系不能解除。想让仓库页不显示「forked from …」，只能删库重建：新建空仓库，
  `git remote set-url` 指过去，`git push --all` + `git push --tags`。

---

## 绑定自己的域名（可选）

1. 在 Pages 项目里 → **Custom domains** → **Set up a custom domain**。
2. 填域名（如 `workshop.example.com`）→ Cloudflare 会给出 CNAME 记录。
3. 域名已托管在 Cloudflare 的话，它会自动加记录；在别处注册的，去域名商后台加那条 CNAME。
4. 证书由 Cloudflare 自动签发，通常几分钟内生效。

---

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 连接仓库时列表里找不到 `mh-travel-gallery` | Cloudflare 的 GitHub App 只授权了部分仓库 | 列表下方点 **Adjust GitHub App Permissions**（或 Configure repository access），在 GitHub 弹页里把这个仓库勾上再返回 |
| 页面 404 | 生产分支填成了 `main` | 项目设置 → Builds & deployments → 改成 `blockchain` |
| 白屏、控制台报 `/assets/index-xxx.js` 404 | 有人给 `vite.config.js` 加了 `base: './'` 或子路径 | 删掉 `base`，保持默认（根路径部署） |
| 构建失败：`Vite requires Node.js version 20.19+` | 没设 `NODE_VERSION` | 环境变量加 `NODE_VERSION=22`，然后 Retry deployment |
| 改了图片线上没变 | 浏览器缓存 | 强刷（Ctrl/Cmd+Shift+R），或看构建日志确认 `dist/photos/` 里有新文件 |
| 想回滚 | —— | 项目 → Deployments → 选历史某次 → **Rollback to this deployment** |

---

## 上线前自检（30 秒）

```bash
npm run build
npx vite preview --port 5203     # 用构建产物起一个静态服务器
```

打开 `http://localhost:5203/`，确认：首屏文案在、开机动画走完、六张照片都出图、浏览器控制台无红色报错。
本地 `preview` 能过，Cloudflare 上就能过——两者都是纯静态托管，行为一致。
