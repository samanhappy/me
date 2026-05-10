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

### Writing Style

When generating or editing blog post content in this project, strictly adhere to the following stylistic guidelines (inspired by Tw93's writing style):
- **Conversational & Practical (接地气):** Avoid didactic, overly formal, or "AI-like" transitional phrases. Write as if you are directly sharing hands-on experience face-to-face with a peer.
- **No System-level Jargon Bloat (少端着):** Explain technical concepts simply. Avoid heavy architectural buzzwords when simple, practical engineering terms work better.
- **TL;DR First (太长不读):** Start articles with a brief, punchy summary of the core decisions and takeaways.
- **Focus on Pitfalls & Habits (防坑与实战):** Use practical section titles like "The First Hurdle" (第一道坎) and "Real-World Habits" (用熟之后的几条避坑习惯) instead of generic academic headers.
- **Direct Voice:** Keep sentences short, concise, and straight to the point. Focus on *how* to solve the problem and *why* a specific boundary/decision matters.
