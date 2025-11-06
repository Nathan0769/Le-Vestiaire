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
  ImageIcon,
  FileText,
  Smartphone,
  Share,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import {
  generateWishlistImage,
  downloadImage,
} from "@/lib/generate-wishlist-image";
import type { Theme } from "@/types/theme";
import type { ShareableWishlistItem } from "@/types/wishlist-share";

interface ShareFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ShareableWishlistItem[];
  title: string;
  message: string;
  theme: Theme;
}

type FormatType = "link" | "image" | "pdf";

export function ShareFormatModal({
  isOpen,
  onClose,
  selectedItems,
  title,
  message,
  theme,
}: ShareFormatModalProps) {
  const t = useTranslations("Wishlist.shareFormatModal");
  const locale = useLocale();
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
      if (format === "link") {
        await generateLink();
      } else if (format === "image") {
        await generateImage();
      } else if (format === "pdf") {
        await generatePDF();
      }
    } catch (error) {
      console.error("Erreur génération:", error);
      toast.error(t("toast.linkError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLink = async () => {
    try {
      const response = await fetch("/api/wishlist/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          theme,
          jerseys: selectedItems.map((item) => ({
            id: item.jersey.id,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du lien");
      }

      const { shortUrl } = await response.json();
      setGeneratedLink(shortUrl);
      toast.success(t("toast.linkGenerated"));
    } catch (error) {
      console.error("Erreur génération lien:", error);
      toast.error(t("toast.linkError"));
      throw error;
    }
  };

  const generateImage = async () => {
    try {
      const data = {
        title,
        message,
        items: selectedItems.map((item) => ({
          id: item.jersey.id,
          name: item.jersey.name,
          imageUrl: item.jersey.imageUrl,
          type: item.jersey.type,
          season: item.jersey.season,
          clubName: item.jersey.club.name,
        })),
      };

      const blob = await generateWishlistImage({
        title: data.title,
        message: data.message,
        items: data.items,
        theme: theme,
        locale: locale,
      });

      const now = new Date();
      const filename = `wishlist-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.png`;

      downloadImage(blob, filename);
      toast.success(t("toast.imageDownloaded"));
    } catch (error) {
      console.error("Erreur génération image:", error);
      toast.error(t("toast.imageError"));
      throw error;
    }
  };

  const generatePDF = async () => {
    try {
      const data = {
        title,
        message,
        items: selectedItems.map((item) => ({
          id: item.jersey.id,
          name: item.jersey.name,
          imageUrl: item.jersey.imageUrl,
          type: item.jersey.type,
          season: item.jersey.season,
          clubName: item.jersey.club.name,
        })),
        theme,
        locale,
      };

      // Appeler la nouvelle API Puppeteer
      const response = await fetch("/api/wishlist/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("toast.pdfError"));
      }

      // Récupérer le blob du PDF
      const blob = await response.blob();

      // Télécharger le PDF
      const now = new Date();
      const filename = `wishlist-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t("toast.pdfDownloaded"));
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error(t("toast.pdfError"));
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
    {
      id: "image",
      icon: ImageIcon,
      title: t("formats.image.title"),
      description: t("formats.image.description"),
      color: "bg-green-500/20 text-green-700 border-green-200",
    },
    {
      id: "pdf",
      icon: FileText,
      title: t("formats.pdf.title"),
      description: t("formats.pdf.description"),
      color: "bg-orange-500/20 text-orange-700 border-orange-200",
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
                    {selectedFormat === "link"
                      ? t("creatingLink")
                      : selectedFormat === "image"
                      ? t("creatingImage")
                      : t("creatingPdf")}
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
