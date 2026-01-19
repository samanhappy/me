export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

const messages = {
  zh: {
    nav: {
      skipToContent: "跳到内容",
      openMenu: "打开菜单",
      closeMenu: "关闭菜单",
      posts: "文章",
      tags: "标签",
      about: "关于",
      archives: "归档",
      search: "搜索",
      toggleTheme: "切换明暗模式",
      switchLanguage: "English",
    },
    home: {
      featured: "精选",
      recentPosts: "最新文章",
      allPosts: "全部文章",
    },
    posts: {
      title: "文章",
      description: "所有文章。",
    },
    tags: {
      title: "标签",
      description: "所有标签。",
      tagTitle: "标签：{tag}",
      tagDescription: "包含“{tag}”的文章。",
    },
    archives: {
      title: "归档",
      description: "所有归档文章。",
    },
    search: {
      title: "搜索",
      description: "搜索所有文章…",
      devWarningTitle: "开发模式提示！",
      devWarningBody: "你需要至少构建一次项目才能在开发环境看到搜索结果。",
      buildCommand: "pnpm run build",
    },
    breadcrumb: {
      home: "首页",
      postsPage: "文章（第 {page} 页）",
      tagPageSuffix: "第 {page} 页",
    },
    pagination: {
      prev: "上一页",
      next: "下一页",
    },
    post: {
      previous: "上一篇",
      next: "下一篇",
      share: "分享本文：",
      copy: "复制",
      copied: "已复制",
    },
    footer: {
      copyright: "版权所有",
      allRightsReserved: "保留所有权利。",
    },
    back: {
      goBack: "返回",
      goBackHome: "返回首页",
      backToTop: "返回顶部",
    },
    notFound: {
      title: "404 未找到",
      message: "页面不存在",
      goBackHome: "返回首页",
    },
    editPost: "编辑页面",
    social: {
      github: "在 GitHub 上关注 {site}",
      x: "在 X 上关注 {site}",
      mail: "给 {site} 发邮件",
      rss: "订阅 {site} 的 RSS",
    },
    share: {
      whatsapp: "通过 WhatsApp 分享本文",
      facebook: "在 Facebook 上分享本文",
      x: "在 X 上分享本文",
      telegram: "通过 Telegram 分享本文",
      pinterest: "在 Pinterest 上分享本文",
      mail: "通过邮件分享本文",
    },
    months: [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月",
    ],
    site: {
      description: "个人博客。",
    },
  },
  en: {
    nav: {
      skipToContent: "Skip to content",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      posts: "Posts",
      tags: "Tags",
      about: "About",
      archives: "Archives",
      search: "Search",
      toggleTheme: "Toggle light & dark",
      switchLanguage: "中文",
    },
    home: {
      featured: "Featured",
      recentPosts: "Recent Posts",
      allPosts: "All Posts",
    },
    posts: {
      title: "Posts",
      description: "All the articles I've posted.",
    },
    tags: {
      title: "Tags",
      description: "All the tags used in posts.",
      tagTitle: "Tag: {tag}",
      tagDescription: "All the articles with the tag “{tag}”.",
    },
    archives: {
      title: "Archives",
      description: "All the articles I've archived.",
    },
    search: {
      title: "Search",
      description: "Search any article ...",
      devWarningTitle: "DEV mode Warning!",
      devWarningBody:
        "You need to build the project at least once to see the search results during development.",
      buildCommand: "pnpm run build",
    },
    breadcrumb: {
      home: "Home",
      postsPage: "Posts (page {page})",
      tagPageSuffix: "(page {page})",
    },
    pagination: {
      prev: "Prev",
      next: "Next",
    },
    post: {
      previous: "Previous Post",
      next: "Next Post",
      share: "Share this post on:",
      copy: "Copy",
      copied: "Copied",
    },
    footer: {
      copyright: "Copyright",
      allRightsReserved: "All rights reserved.",
    },
    back: {
      goBack: "Go back",
      goBackHome: "Go back home",
      backToTop: "Back to Top",
    },
    notFound: {
      title: "404 Not Found",
      message: "Page Not Found",
      goBackHome: "Go back home",
    },
    editPost: "Edit page",
    social: {
      github: "{site} on GitHub",
      x: "{site} on X",
      mail: "Send an email to {site}",
      rss: "Subscribe to {site} RSS feed",
    },
    share: {
      whatsapp: "Share this post via WhatsApp",
      facebook: "Share this post on Facebook",
      x: "Share this post on X",
      telegram: "Share this post via Telegram",
      pinterest: "Share this post on Pinterest",
      mail: "Share this post via email",
    },
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    site: {
      description: "A personal blog.",
    },
  },
} as const;

type FormatVars = Record<string, string | number>;

const formatMessage = (message: string, vars?: FormatVars) =>
  message.replace(/\{(\w+)\}/g, (_, key) =>
    vars && key in vars ? String(vars[key]) : ""
  );

export const getLocale = (locale?: string): Locale =>
  locale === "zh" ? "zh" : defaultLocale;

export const t = (locale: Locale, key: string, vars?: FormatVars) => {
  const parts = key.split(".");
  let current: unknown = messages[locale];
  for (const part of parts) {
    if (typeof current !== "object" || current === null) break;
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current === "string") {
    return formatMessage(current, vars);
  }

  return "";
};

export const getMessages = (locale: Locale) => messages[locale];
