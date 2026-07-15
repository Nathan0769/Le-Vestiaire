"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ShareCardModal } from "./share-card-modal";

export function ShareCollectionButton() {
  const t = useTranslations("Collection.share");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 cursor-pointer w-full md:w-auto"
      >
        <Share2 className="w-4 h-4" />
        {t("button")}
      </Button>
      <ShareCardModal open={open} onOpenChange={setOpen} />
    </>
  );
}
