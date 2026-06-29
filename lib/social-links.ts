import { z } from "zod";
import {
  FaInstagram,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaTwitch,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

export type SocialNetworkKey =
  | "instagram"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "twitch";

export type SocialHandleField =
  | "instagramHandle"
  | "twitterHandle"
  | "tiktokHandle"
  | "youtubeHandle"
  | "twitchHandle";

type NetworkConfig = {
  key: SocialNetworkKey;
  field: SocialHandleField;
  label: string;
  regex: RegExp;
  buildUrl: (handle: string) => string;
  icon: IconType;
  color: string;
};

export const SOCIAL_NETWORKS: NetworkConfig[] = [
  {
    key: "instagram",
    field: "instagramHandle",
    label: "Instagram",
    regex: /^[a-zA-Z0-9._]{1,30}$/,
    buildUrl: (h) => `https://www.instagram.com/${h}`,
    icon: FaInstagram,
    color: "#E4405F",
  },
  {
    key: "twitter",
    field: "twitterHandle",
    label: "X",
    regex: /^[a-zA-Z0-9_]{1,15}$/,
    buildUrl: (h) => `https://x.com/${h}`,
    icon: FaXTwitter,
    color: "#000000",
  },
  {
    key: "tiktok",
    field: "tiktokHandle",
    label: "TikTok",
    regex: /^[a-zA-Z0-9_.]{2,24}$/,
    buildUrl: (h) => `https://www.tiktok.com/@${h}`,
    icon: FaTiktok,
    color: "#000000",
  },
  {
    key: "youtube",
    field: "youtubeHandle",
    label: "YouTube",
    regex: /^@?[a-zA-Z0-9_.-]{3,30}$/,
    buildUrl: (h) => `https://www.youtube.com/@${h.replace(/^@/, "")}`,
    icon: FaYoutube,
    color: "#FF0000",
  },
  {
    key: "twitch",
    field: "twitchHandle",
    label: "Twitch",
    regex: /^[a-zA-Z0-9_]{4,25}$/,
    buildUrl: (h) => `https://www.twitch.tv/${h}`,
    icon: FaTwitch,
    color: "#9146FF",
  },
];

const handleField = (regex: RegExp) =>
  z
    .union([z.string().regex(regex), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : v));

export const socialLinksSchema = z.object({
  instagramHandle: handleField(SOCIAL_NETWORKS[0].regex),
  twitterHandle: handleField(SOCIAL_NETWORKS[1].regex),
  tiktokHandle: handleField(SOCIAL_NETWORKS[2].regex),
  youtubeHandle: handleField(SOCIAL_NETWORKS[3].regex),
  twitchHandle: handleField(SOCIAL_NETWORKS[4].regex),
});

export type SocialLinksInput = z.infer<typeof socialLinksSchema>;

export function buildSocialUrl(
  network: SocialNetworkKey,
  handle: string,
): string {
  const config = SOCIAL_NETWORKS.find((n) => n.key === network);
  if (!config) throw new Error(`Unknown social network: ${network}`);
  return config.buildUrl(handle);
}
