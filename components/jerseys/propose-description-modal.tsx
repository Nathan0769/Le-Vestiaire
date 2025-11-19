"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProposeDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jerseyId: string;
  jerseyName: string;
  existingDescription?: string | null;
}

export function ProposeDescriptionModal({
  open,
  onOpenChange,
  jerseyId,
  jerseyName,
  existingDescription,
}: ProposeDescriptionModalProps) {
  const t = useTranslations("JerseyDetail.proposeDescription");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const minChars = 50;
  const maxChars = 2000;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    setCharCount(value.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (description.trim().length < minChars) {
      toast.error(t("errors.tooShort", { min: minChars }));
      return;
    }

    if (description.trim().length > maxChars) {
      toast.error(t("errors.tooLong", { max: maxChars }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/description/propose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("errors.generic"));
      }

      toast.success(data.message || t("success"));
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error proposing description:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.generic")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setCharCount(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const isValid = charCount >= minChars && charCount <= maxChars;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingDescription ? t("titleImprove") : t("title")}
          </DialogTitle>
          <DialogDescription>
            {existingDescription ? t("descriptionImprove", { name: jerseyName }) : t("description", { name: jerseyName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {existingDescription && (
            <div className="p-4 bg-muted rounded-lg border">
              <Label className="text-sm font-medium mb-2 block">
                {t("currentDescription")}
              </Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {existingDescription}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center justify-between">
              <span>
                {existingDescription ? t("yourImprovement") : t("yourDescription")}{" "}
                <span className="text-destructive">*</span>
              </span>
              <span
                className={`text-sm ${
                  charCount < minChars
                    ? "text-destructive"
                    : charCount > maxChars
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {charCount} / {maxChars}
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder={t("placeholder")}
              value={description}
              onChange={handleDescriptionChange}
              rows={8}
              className="resize-none"
              maxLength={maxChars}
            />
            <p className="text-xs text-muted-foreground">
              {t("hint")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("submitting")}</span>
                </div>
              ) : (
                <span>{t("submit")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
