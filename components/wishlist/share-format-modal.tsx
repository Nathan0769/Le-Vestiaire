"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link,
  Smartphone,
  Share,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { Theme } from "@/types/theme";
import type { ShareableWishlistItem } from "@/types/wishlist-share";

interface ShareFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ShareableWishlistItem[];
  title: string;
  message: string;
  theme: Theme;
  /** Toute la wishlist : le lien suivra aussi les maillots ajoutés plus tard. */
  shareAll?: boolean;
}

// Lien seulement : l'image et le PDF rendaient mal et échouaient souvent (choix de Nathan, 2026-11-11).
type FormatType = "link";

export function ShareFormatModal({
  isOpen,
  onClose,
  selectedItems,
  title,
  message,
  theme,
  shareAll = false,
}: ShareFormatModalProps) {
  const t = useTranslations("Wishlist.shareFormatModal");
  type NavigatorWithShare = Navigator & {
    share?: (data: ShareData) => Promise<void>;
  };
  const hasWebShare =
    typeof window !== "undefined" &&
    typeof (navigator as NavigatorWithShare).share === "function";
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormatSelect = async (format: FormatType) => {
    setSelectedFormat(format);
    setIsGenerating(true);

    try {
      await generateLink();
    } catch (error) {
      console.error("Erreur génération:", error);
      toast.error(t("toast.linkError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLink = async () => {
    try {
      const response = await fetch("/api/wishlist/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message: message || null,
          theme,
          jerseyIds: shareAll ? [] : selectedItems.map((item) => item.jersey.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du lien");
      }

      const { url } = await response.json();
      setGeneratedLink(url);
      toast.success(t("toast.linkGenerated"));
    } catch (error) {
      console.error("Erreur génération lien:", error);
      toast.error(t("toast.linkError"));
      throw error;
    }
  };

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success(t("toast.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    if (generatedLink && hasWebShare) {
      try {
        await (navigator as NavigatorWithShare).share!({
          title: title,
          text: message,
          url: generatedLink,
        });
      } catch {
        console.log("Partage annulé");
      }
    }
  };

  const formats = [
    {
      id: "link",
      icon: Link,
      title: t("formats.link.title"),
      description: t("formats.link.description"),
      color: "bg-blue-500/20 text-blue-700 border-blue-200",
    },
  ];

  const handleClose = () => {
    setSelectedFormat(null);
    setGeneratedLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5 text-primary" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        {!selectedFormat && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h3 className="font-medium text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Badge variant="secondary">
                {t("selectedCount", { count: selectedItems.length })}
              </Badge>
            </div>

            <div className="grid gap-4">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => handleFormatSelect(format.id as FormatType)}
                    className="flex items-center gap-4 p-6 rounded-lg border border-border hover:border-primary/50 transition-colors text-left group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${format.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base mb-1">
                        {format.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {format.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedFormat && (
          <div className="text-center space-y-6">
            {isGenerating ? (
              <>
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">{t("generating")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("creatingLink")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">{t("ready")}</h3>

                  {selectedFormat === "link" && generatedLink && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          {t("yourShareLink")}
                        </p>
                        <p className="text-sm font-mono bg-background px-3 py-2 rounded border break-all">
                          {generatedLink}
                        </p>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={copyLink}
                          variant="outline"
                          className="flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial"
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copied ? t("copied") : t("copyLink")}
                        </Button>

                        {hasWebShare && (
                          <Button
                            onClick={shareNative}
                            className="flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial"
                          >
                            <Smartphone className="w-4 h-4" />
                            {t("share")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={handleClose}
              className="mt-4 cursor-pointer"
            >
              {t("close")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
