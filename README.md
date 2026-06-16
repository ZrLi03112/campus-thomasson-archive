# 校园超艺术托马森观察档案

这是一个用于展示浙江大学 2025-2026 学年春夏学期《社会调查与研究方法》课程田野作品的静态网站。

网站收录同学们在校园调查中拍摄到的“超艺术托马森”观察样本，并以废弃基础设施与空间残余的档案方式重新陈列。

## 项目结构

这个仓库的内容：

- `src/`：页面与组件源码
- `public/works/`：站点实际使用的作品图片
- `.github/workflows/deploy.yml`：GitHub Pages 自动部署配置
- `astro.config.mjs`：Astro 构建与 Pages 路径配置


## 技术栈

- Astro
- TypeScript
- CSS Modules + 全局 CSS
- GitHub Actions
- GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

## 本地构建

```bash
npm run build
```

## 作品数据维护

网站内容统一维护在：

```text
src/data/works.ts
```

每条作品数据包含：

- `id`
- `image`
- `originalFileName`
- `title`
- `author`

如果需要调整作品标题、作者、展示顺序，直接修改 `src/data/works.ts` 即可。

## 图片资源位置

站点实际展示的图片统一放在：

```text
public/works/
```

如果后续要替换某张图片，建议保留现有文件名路径，例如：

```text
public/works/work-001.jpg
```

这样不需要同步改动数据文件中的图片路径。

## GitHub Pages 发布

仓库已包含 GitHub Pages 工作流：

```text
.github/workflows/deploy.yml
```

发布步骤：

1. 将仓库推送到 GitHub 的 `main` 分支
2. 打开仓库 `Settings > Pages`
3. 将 `Source` 设置为 `GitHub Actions`
4. 每次推送后，GitHub 会自动执行 `npm install`、`npm run build` 并发布站点
