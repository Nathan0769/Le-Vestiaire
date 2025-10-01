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
import {
  generateWishlistImage,
  downloadImage,
} from "@/lib/generate-wishlist-image";
import { generateWishlistPDF, downloadPDF } from "@/lib/generate-wishlist-pdf";
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
      toast.error("Erreur lors de la génération");
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
      toast.success("Lien généré !");
    } catch (error) {
      console.error("Erreur génération lien:", error);
      toast.error("Erreur lors de la génération du lien");
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
      });

      const now = new Date();
      const filename = `wishlist-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.png`;

      downloadImage(blob, filename);
      toast.success("Image téléchargée avec succès !");
    } catch (error) {
      console.error("Erreur génération image:", error);
      toast.error("Erreur lors de la génération de l'image");
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
      };

      const blob = await generateWishlistPDF({
        title: data.title,
        message: data.message,
        items: data.items,
        theme: theme,
      });

      const now = new Date();
      const filename = `wishlist-${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.pdf`;

      downloadPDF(blob, filename);
      toast.success("PDF téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
      throw error;
    }
  };

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Lien copié !");
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
      title: "Lien à partager",
      description: "Page web consultable sur mobile et PC",
      color: "bg-blue-500/20 text-blue-700 border-blue-200",
    },
    {
      id: "image",
      icon: ImageIcon,
      title: "Image à télécharger",
      description: "Parfait pour stories Instagram ou WhatsApp",
      color: "bg-green-500/20 text-green-700 border-green-200",
    },
    {
      id: "pdf",
      icon: FileText,
      title: "PDF à télécharger",
      description: "Document propre à imprimer ou envoyer",
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
            Comment veux-tu partager ta liste ?
          </DialogTitle>
        </DialogHeader>

        {!selectedFormat && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <h3 className="font-medium text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Badge variant="secondary">
                {selectedItems.length} maillot
                {selectedItems.length > 1 ? "s" : ""} sélectionné
                {selectedItems.length > 1 ? "s" : ""}
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
                  <h3 className="font-medium mb-2">Génération en cours...</h3>
                  <p className="text-muted-foreground text-sm">
                    Création de votre{" "}
                    {selectedFormat === "link"
                      ? "lien"
                      : selectedFormat === "image"
                      ? "image"
                      : "PDF"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">C&apos;est prêt !</h3>

                  {selectedFormat === "link" && generatedLink && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          Votre lien de partage :
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
                          {copied ? "Copié !" : "Copier le lien"}
                        </Button>

                        {hasWebShare && (
                          <Button
                            onClick={shareNative}
                            className="flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial"
                          >
                            <Smartphone className="w-4 h-4" />
                            Partager
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
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
