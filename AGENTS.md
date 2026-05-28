# AGENTS.md

This file provides a comprehensive overview of the `me` project, its structure, and how to work with it.

## Project Overview

This project is a personal blog built with the [Astro](https://astro.build/) framework, specifically using the [AstroPaper](https://github.com/satnaing/astro-paper) theme. It features a clean, minimalist design and is optimized for performance and SEO.

### Key Technologies

*   **Framework**: [Astro](https://astro.build/)
*   **UI Components**: [React](https://react.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Internationalization (i18n)**: English (`en`) and Chinese (`zh`) are supported.

### Project Structure

*   `src/`: Contains the main source code, including layouts, pages, components, and styles.
*   `src/content/blog/`: Contains the blog posts in Markdown format.
*   `public/`: Contains static assets like images and fonts.
*   `astro.config.ts`: The main configuration file for Astro.
*   `package.json`: Defines the project's dependencies and scripts.

## Building and Running

### Prerequisites

*   [Node.js](https://nodejs.org/) (version specified in `.nvmrc` if available)
*   [pnpm](https://pnpm.io/) (based on the presence of `pnpm-lock.yaml`)

### Installation

```bash
pnpm install
```

### Development

To start the local development server:

```bash
pnpm dev
```

This will start a hot-reloading development server, typically at `http://localhost:4321`.

### Build

To build the project for production:

```bash
pnpm build
```

This command will:
1.  Check for any type errors.
2.  Build the static site to the `dist/` directory.
3.  Generate a search index using `pagefind`.
4.  Copy the search index to the `public/` directory.

### Preview

To preview the production build locally:

```bash
pnpm preview
```

## Development Conventions

### Code Style

This project uses [Prettier](https://prettier.io/) for code formatting and [ESLint](https://eslint.org/) for linting.

*   **To check formatting**: `pnpm format:check`
*   **To format all files**: `pnpm format`
*   **To run the linter**: `pnpm lint`

### Commits

This project follows the [Conventional Commits](https.conventionalcommits.org) specification. A `cz.yaml` file is present, suggesting the use of a tool like `commitizen` for creating commit messages.

### Content Creation

Blog posts are written in Markdown and located in the `src/data/blog` directory. Each post should have a corresponding file for each supported language (e.g., `my-post.en.md` and `my-post.zh.md`).

### 博客写作指南

#### 语气

口语化，有个人观点，像一个有经验的开发者在分享心得。不要居高临下的说教，也不要干巴巴的功能列表。偶尔可以带点锋芒敢于下判断，但整体基调是分享。

#### 结构

采用"痛点引入 → 核心拆解 → 设计亮点 → 可带走的模式 → 实操引导"的结构：

1. **痛点引入** — 先建立共鸣，让读者意识到自己也有这个问题
2. **核心拆解** — 选 3-4 个最有代表性的点深入分析，不要贪多求全
3. **设计亮点** — 分析"为什么这么做"，不只是"做了什么"
4. **可带走的模式** — 给读者可以直接用在自己实践中的具体模式
5. **实操引导** — 降低行动门槛，告诉读者怎么开始

#### 读者假设

目标读者是已经在使用 AI 编程工具（Claude Code、Cursor 等）的开发者。可以假设他们熟悉基本概念，不需要基础科普。重点放在理念和方法论上，而非工具安装和入门教程。

#### 内容策略

深度分析型，重理念提炼而非功能罗列。读者要的是"认知升级"，不是"使用手册"。每个技术点都要回答"为什么"和"我们能学到什么"，而不只是"是什么"和"怎么用"。

#### 技术细节处理

代码命令、工具名称、项目名保留英文原名（如 `/grill-me`、`Claude Code`），不翻译。在分析段落中用中文描述其功能即可。
