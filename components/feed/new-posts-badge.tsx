"use client";

import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface NewPostsBadgeProps {
  count: number;
  onClick: () => void;
}

export function NewPostsBadge({ count, onClick }: NewPostsBadgeProps) {
  const t = useTranslations("Feed");
  if (count === 0) return null;

  return (
    <div className="sticky top-4 z-10 flex justify-center pointer-events-none">
      <Button
        onClick={onClick}
        size="sm"
        className="gap-2 shadow-lg cursor-pointer pointer-events-auto"
      >
        <ArrowUp className="w-4 h-4" />
        {count === 1 ? t("newPostsSingle") : t("newPostsMany", { count })}
      </Button>
    </div>
  );
}
