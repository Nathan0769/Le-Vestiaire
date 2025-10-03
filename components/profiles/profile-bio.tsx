"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  return (
    <div className="grid gap-2">
      <Label htmlFor="profile-bio">Bio</Label>
      <Textarea
        id="profile-bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Écris quelques mots sur toi…"
        className="min-h-[70px]"
        maxLength={maxLength}
      />
      <p className="text-muted-foreground text-sm text-right">
        {value.length}/{maxLength} caractères
      </p>
    </div>
  );
}
