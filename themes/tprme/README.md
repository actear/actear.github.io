# actear 博客主题

Hexo 的独立 EJS 主题。用原生 CSS 和 JavaScript 实现，不依赖 Vue、React 或第三方 CDN。

## 文件

- `layout/`：首页、文章页、归档、分类、标签与公共模板。
- `source/css/site.css`：深浅配色、排版、响应式布局。
- `source/js/site.js`：主题切换、归档搜索、图片预览、代码复制、阅读进度与目录。
- `source/js/hero-motion.js`：首页标题、按钮和照片的入场。
- 站点 `source/js/nav-preview.js` 和 `source/css/nav-preview.css`：归档、分类和标签共用的导航面板。
- `layout/_partial/nav-preview.ejs`：构建时从文章、分类和标签生成快捷入口。

## 导航交互

悬停立即切换。同一个面板在 240ms 内移动并改变可见轮廓，内容同时交接。离开后保留 160ms，方便跨过面板间隙。

主链接仍可直接点击。键盘左右切换主链接，上下或 Tab 进入面板，Escape 关闭并还原焦点。手机用原生 `details` 菜单。系统开启减弱动态效果时关闭过渡。

动画参考了 x.ai 导航的交互思路；实现独立编写，没有复制其代码或素材，也不需要付费组件。

GSAP 3.15.1 Core 取自 [官方 npm 发布包](https://www.npmjs.com/package/gsap/v/3.15.1)，放在站点的 `source/js/vendor/gsap.min.js`，保留了 [GreenSock 许可](https://gsap.com/standard-license) 声明。没有加载 GSAP 插件。库加载失败时，菜单即时切换，首页内容保持可见。

## 发布检查

```sh
npm run clean
npm run build
npm run check
```

正文和旧链接保持不变，首页分页从第 2 页起不再显示 hero。代码在构建时高亮；图片完整显示，点击可查看原图。搜索在本地筛选标题、标签和分类，不发送请求。

目前所有文章都是公开文章。以后若加入 `secret` 加密文章，主题会中止构建，避免正文意外公开；需要先接入解密功能。

旧主题和旧样式没有删除。完整恢复旧版应回退主题改版及后续相关提交。仅切换 `theme` 和 `highlight.enable` 不够：当前 CI 检查还包含新主题的文件要求，也需要同步恢复。
