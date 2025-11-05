"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

type ProfileBioProps = {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
};

export function ProfileBio({
  value,
  onChange,
  maxLength = 280,
}: ProfileBioProps) {
  const t = useTranslations("Profile.bio");

  return (
    <div className="grid gap-2">
      <Label htmlFor="profile-bio">{t("label")}</Label>
      <Textarea
        id="profile-bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("placeholder")}
        className="min-h-[70px]"
        maxLength={maxLength}
      />
      <p className="text-muted-foreground text-sm text-right">
        {t("charactersCount", { current: value.length, max: maxLength })}
      </p>
    </div>
  );
}
