import { SOCIAL_NETWORKS, buildSocialUrl } from "@/lib/social-links";

type Props = {
  instagramHandle?: string | null;
  twitterHandle?: string | null;
  tiktokHandle?: string | null;
  youtubeHandle?: string | null;
  twitchHandle?: string | null;
};

export function SocialLinksRow(props: Props) {
  const links = SOCIAL_NETWORKS.map((net) => ({
    net,
    handle: props[net.field],
  })).filter(
    (x): x is { net: (typeof SOCIAL_NETWORKS)[number]; handle: string } =>
      !!x.handle,
  );

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {links.map(({ net, handle }) => {
        const Icon = net.icon;
        return (
          <a
            key={net.key}
            href={buildSocialUrl(net.key, handle)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={`${net.label} : @${handle}`}
            className="hover:opacity-70 transition-opacity"
          >
            <Icon className="w-5 h-5" style={{ color: net.color }} />
          </a>
        );
      })}
    </div>
  );
}
