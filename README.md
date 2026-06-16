# 校园超艺术托马森观察档案

一个基于 `Astro + TypeScript` 的静态网站，用于展示《社会调查与研究方法课程》中同学们在校园田野调查中拍摄到的“超艺术托马森”作品。当前版本采用偏废土档案的视觉方向，专注展示作品本身，不再包含校园地图模块。

## 技术栈

- Astro
- TypeScript
- CSS Modules + 全局 CSS
- GitHub Actions + GitHub Pages

## 安装依赖

```bash
npm install
```

## 导入本地作品素材

当前项目使用的原始素材目录是：

```text
webpage素材/
```

运行下面的命令后，脚本会：

- 读取 `webpage素材/` 中的图片素材；
- 将作品图片复制到 `public/works/`；
- 重命名为稳定路径，例如 `work-001.jpg`；
- 根据文件名自动生成 `src/data/works.ts`；
- 输出需要人工确认的异常文件列表。

```bash
npm run import:works
```

### 文件名规则

- 标准格式：`名字-作品名.jpg`
- 只有作者：`名字.jpg` 或 `名字1.jpg`

当前脚本也兼容少量变体：

- `名字—作品名`
- `名字–作品名`
- `名字 作品名`

其中“空格分隔”的文件会被列入导入报告里的 `parsedByWhitespaceFallback`，方便后续人工复核。

## 本地预览

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 添加新作品

推荐把新作品图片放进 `webpage素材/`，并尽量使用：

- `名字-作品名.jpg`
- `名字.jpg`
- `名字1.jpg`

然后重新运行：

```bash
npm run import:works
```

如果需要手动微调，也可以直接编辑 [src/data/works.ts](/Users/lizhangrui/Desktop/大学/TA/2026春夏社会调查与研究方法/超托马森物体web page/src/data/works.ts)。

## 数据维护方式

站点内容统一从 [src/data/works.ts](/Users/lizhangrui/Desktop/大学/TA/2026春夏社会调查与研究方法/超托马森物体web page/src/data/works.ts) 读取。每条作品数据包含：

- `id`
- `image`
- `originalFileName`
- `title`
- `author`

页面组件不会硬编码图片路径，后续维护时优先更新数据文件。

## GitHub Pages 部署

项目已包含 GitHub Actions 工作流：[.github/workflows/deploy.yml](/Users/lizhangrui/Desktop/大学/TA/2026春夏社会调查与研究方法/超托马森物体web page/.github/workflows/deploy.yml)

部署步骤：

1. 将项目推送到 GitHub 仓库的 `main` 分支。
2. 进入仓库 Settings -> Pages。
3. 在 Build and deployment 中选择 `GitHub Actions`。
4. 推送后工作流会自动执行 `npm install`、`npm run build` 并部署 `dist/`。

### `site` 和 `base` 的说明

- `base` 已在 [astro.config.mjs](/Users/lizhangrui/Desktop/大学/TA/2026春夏社会调查与研究方法/超托马森物体web page/astro.config.mjs) 中自动根据 `GITHUB_REPOSITORY` 推导：
  - 如果仓库名是 `<username>.github.io`，则使用 `/`
  - 否则使用 `/<repo-name>/`
- `site` 默认读取环境变量 `SITE_URL`，本地未设置时会使用占位值 `https://example.github.io`

如果你希望本地构建时也完全贴合真实线上地址，可以把 [astro.config.mjs](/Users/lizhangrui/Desktop/大学/TA/2026春夏社会调查与研究方法/超托马森物体web page/astro.config.mjs) 里的默认值改成你自己的域名，例如：

```js
site: "https://yourname.github.io"
```
