import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";
import { getLocale, t } from "@/i18n";
import { filterPostsByLocale, localizePath } from "@/utils/i18n";

export async function GET({ currentLocale }: { currentLocale?: string }) {
  const locale = getLocale(currentLocale);
  const posts = filterPostsByLocale(await getCollection("blog"), locale);
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: t(locale, "site.description"),
    site: SITE.website,
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: localizePath(locale, getPath(id, filePath)),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
