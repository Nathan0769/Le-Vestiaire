"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Flag, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";
import { usePendingIntent } from "@/hooks/usePendingIntent";
import { buildReturnTo } from "@/lib/auth-gate";

const CATEGORIES = ["LETTERING", "SEASON", "BRAND", "IMAGE", "OTHER"] as const;
type Category = (typeof CATEGORIES)[number];

interface JerseyReportButtonProps {
  jerseyId: string;
  isAuthenticated: boolean;
  jersey: { name: string; imageUrl: string };
}

export function JerseyReportButton({
  jerseyId,
  isAuthenticated,
  jersey,
}: JerseyReportButtonProps) {
  const t = useTranslations("Jerseys.report");
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePendingIntent("report", () => setOpen(true));

  const handleOpen = () => {
    if (!isAuthenticated) {
      setShowAuthGate(true);
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/jerseys/${jerseyId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("errorToast"));
      }
      toast.success(t("successToast"));
      setOpen(false);
      setCategory("");
      setDescription("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Flag className="w-3.5 h-3.5" />
        {t("buttonLabel")}
      </button>

      <AuthGateModal
        open={showAuthGate}
        onOpenChange={setShowAuthGate}
        intent="report"
        jersey={jersey}
        returnTo={buildReturnTo(pathname, "report")}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">{t("descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  rows={3}
                  maxLength={500}
                  placeholder={t("descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!category || isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {isSubmitting ? t("submitting") : t("submit")}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
