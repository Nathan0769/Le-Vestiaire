"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOCIAL_NETWORKS } from "@/lib/social-links";

export type SocialLinksValue = {
  instagramHandle: string;
  twitterHandle: string;
  tiktokHandle: string;
  youtubeHandle: string;
  twitchHandle: string;
};

type Props = {
  value: SocialLinksValue;
  onChange: (next: SocialLinksValue) => void;
};

export function SocialLinksSection({ value, onChange }: Props) {
  const t = useTranslations("Profile.socialLinks");

  return (
    <div className="grid gap-3">
      <Label className="text-sm font-medium">{t("title")}</Label>
      <div className="grid gap-2">
        {SOCIAL_NETWORKS.map((net) => {
          const Icon = net.icon;
          const fieldValue = value[net.field];
          const isInvalid = fieldValue !== "" && !net.regex.test(fieldValue);

          return (
            <div key={net.key} className="grid gap-1">
              <div className="flex items-center gap-2">
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: net.color }}
                />
                <span className="text-muted-foreground text-sm">@</span>
                <Input
                  value={fieldValue}
                  onChange={(e) =>
                    onChange({ ...value, [net.field]: e.target.value })
                  }
                  placeholder={net.label}
                  aria-invalid={isInvalid}
                  className="flex-1"
                />
              </div>
              {isInvalid && (
                <p className="text-destructive text-xs pl-7">
                  {t("invalidHandle", { network: net.label })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
