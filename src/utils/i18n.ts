import type { CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { defaultLocale, locales, type Locale, getLocale } from "@/i18n";

const LOCALE_SUFFIX = /\.(zh|en)$/;
const LOCALE_FILE_SUFFIX = /\.(zh|en)\.md$/;

export const localizePath = (locale: Locale, path: string) => {
  const cleanPath = path.replace(/^\/+/, "");
  return getRelativeLocaleUrl(locale, cleanPath);
};

export const getAlternateLocale = (locale: Locale): Locale =>
  locale === "en" ? "zh" : "en";

export const getLanguageSwitchUrl = (
  currentLocale: Locale,
  pathname: string
) => {
  const alternateLocale = getAlternateLocale(currentLocale);

  // Remove leading slash and current locale prefix if present
  let path = pathname.replace(/^\/+/, "");

  // Remove current locale prefix from path
  for (const loc of locales) {
    if (path.startsWith(`${loc}/`)) {
      path = path.slice(loc.length + 1);
      break;
    } else if (path === loc) {
      path = "";
      break;
    }
  }

  return localizePath(alternateLocale, path);
};

export const stripLocaleSuffix = (value: string) =>
  value.replace(LOCALE_SUFFIX, "");

export const getEntryLocale = (
  entry: Pick<CollectionEntry<"blog">, "filePath">
): Locale => {
  const match = entry.filePath?.match(LOCALE_FILE_SUFFIX);
  return getLocale(match?.[1] ?? defaultLocale);
};

export const filterPostsByLocale = (
  posts: CollectionEntry<"blog">[],
  locale: Locale
) => posts.filter(post => getEntryLocale(post) === locale);
