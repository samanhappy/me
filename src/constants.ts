import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import IconRss from "@/assets/icons/IconRss.svg";
import type { GiscusProps } from "@giscus/react";
import type { Locale } from "@/i18n";

export const getGiscusConfig = (locale: Locale): GiscusProps => ({
  repo: "samanhappy/me",
  repoId: "R_kgDOQBbEWA",
  category: "Announcements",
  categoryId: "DIC_kwDOQBbEWM4Cw9Vu",
  mapping: "pathname",
  reactionsEnabled: "0",
  emitMetadata: "0",
  inputPosition: "bottom",
  lang: locale === "zh" ? "zh-CN" : "en",
  loading: "lazy",
});

interface Social {
  id:
    | "github"
    | "x"
    | "mail"
    | "rss"
    | "whatsapp"
    | "facebook"
    | "telegram"
    | "pinterest";
  name: string;
  href: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    id: "github",
    name: "GitHub",
    href: "https://github.com/samanhappy",
    icon: IconGitHub,
  },
  {
    id: "x",
    name: "X",
    href: "https://x.com/samanhappy",
    icon: IconBrandX,
  },
  {
    id: "mail",
    name: "Mail",
    href: "mailto:samanhappy@gmail.com",
    icon: IconMail,
  },
  {
    id: "rss",
    name: "RSS",
    href: "https://samanhappy.com/rss.xml",
    icon: IconRss,
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    icon: IconWhatsapp,
  },
  {
    id: "facebook",
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    icon: IconFacebook,
  },
  {
    id: "x",
    name: "X",
    href: "https://x.com/intent/post?url=",
    icon: IconBrandX,
  },
  {
    id: "telegram",
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    icon: IconTelegram,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    icon: IconPinterest,
  },
  {
    id: "mail",
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    icon: IconMail,
  },
] as const;
