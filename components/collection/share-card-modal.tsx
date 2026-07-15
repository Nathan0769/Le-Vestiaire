"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Clock,
  Download,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CardType = "stats" | "top" | "recent";
type Format = "story" | "post" | "tweet";
type StatKey = "clubs" | "leagues" | "countries" | "value";

const ALL_STATS: StatKey[] = ["clubs", "leagues", "countries", "value"];

const FORMAT_ASPECT: Record<Format, { w: number; h: number }> = {
  story: { w: 9, h: 16 },
  post: { w: 1, h: 1 },
  tweet: { w: 16, h: 9 },
};

interface ShareCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCardModal({ open, onOpenChange }: ShareCardModalProps) {
  const t = useTranslations("Collection.share");

  const [type, setType] = useState<CardType>("stats");
  const [format, setFormat] = useState<Format>("story");
  const [enabledStats, setEnabledStats] = useState<Set<StatKey>>(
    new Set(ALL_STATS),
  );
  const [count, setCount] = useState<3 | 6>(6);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showUsername, setShowUsername] = useState(true);
  const [loading, setLoading] = useState(false);

  const cacheBuster = useMemo(() => (open ? Date.now() : 0), [open]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      type,
      format,
      count: String(count),
      showAvatar: String(showAvatar),
      showUsername: String(showUsername),
      _t: String(cacheBuster),
    });
    if (type === "stats") {
      params.set("stats", Array.from(enabledStats).join(","));
    }
    return params.toString();
  }, [type, format, count, showAvatar, showUsername, enabledStats, cacheBuster]);

  const cardUrl = `/api/collection/share-card?${queryString}`;

  async function fetchCardBlob(): Promise<Blob> {
    const res = await fetch(cardUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await fetchCardBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `le-vestiaire-${type}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (typeof navigator === "undefined" || !("share" in navigator)) return;
    setLoading(true);
    try {
      const blob = await fetchCardBlob();
      const file = new File([blob], `le-vestiaire-${type}-${format}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        toast.success(t("shareSuccess"));
      } else {
        await handleDownload();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error(t("downloadError"));
      }
    } finally {
      setLoading(false);
    }
  }

  const nativeShareSupported =
    typeof navigator !== "undefined" && "share" in navigator;

  const aspect = FORMAT_ASPECT[format];
  // Compute explicit width/height that fills the available viewport space while
  // respecting the aspect ratio. Aspect-ratio CSS alone is ambiguous when both
  // width and height are auto, so we derive width from a fixed max-height.
  const previewMaxHeightCss = "calc(95vh - 220px)";
  const previewWidthCss = `min(100%, calc(${previewMaxHeightCss} * ${aspect.w} / ${aspect.h}))`;

  function toggleStat(key: StatKey) {
    setEnabledStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const cardTypes: {
    key: CardType;
    icon: typeof BarChart3;
    label: string;
  }[] = [
    { key: "stats", icon: BarChart3, label: t("modal.tabs.stats") },
    { key: "top", icon: Sparkles, label: t("modal.tabs.top") },
    { key: "recent", icon: Clock, label: t("modal.tabs.recent") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t("modal.title")}</DialogTitle>
          <DialogDescription>{t("modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(420px,560px)_1fr] gap-0 md:gap-6 overflow-y-auto md:overflow-hidden">
          {/* Colonne gauche : preview (pas de scroll sur desktop, centrée verticalement) */}
          <div className="flex flex-col items-center gap-3 justify-center px-6 py-4 bg-muted/20 md:bg-transparent">
            <div className="w-full flex items-center justify-center">
              <div
                className="relative rounded-md overflow-hidden bg-black shadow-lg"
                style={{
                  width: previewWidthCss,
                  aspectRatio: `${aspect.w} / ${aspect.h}`,
                  minWidth: 160,
                }}
              >
                <Image
                  key={cardUrl}
                  src={cardUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t("modal.previewHint")}
            </p>
          </div>

          {/* Colonne droite : contrôles (scrollable sur desktop) */}
          <div className="flex flex-col gap-6 md:overflow-y-auto px-6 py-4">
              {/* Type de card */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("modal.typeLabel")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {cardTypes.map((ct) => {
                    const Icon = ct.icon;
                    const active = type === ct.key;
                    return (
                      <button
                        key={ct.key}
                        type="button"
                        onClick={() => setType(ct.key)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors cursor-pointer",
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {t("modal.formatLabel")}
                </Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">
                      {t("modal.formats.story")}
                    </SelectItem>
                    <SelectItem value="post">
                      {t("modal.formats.post")}
                    </SelectItem>
                    <SelectItem value="tweet">
                      {t("modal.formats.tweet")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personnalisation selon le type */}
              {type === "stats" && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    {t("modal.statsLabel")}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {ALL_STATS.map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={enabledStats.has(s)}
                          onCheckedChange={() => toggleStat(s)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">
                          {t(`modal.stats.${s}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(type === "top" || type === "recent") && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {t("modal.countLabel")}
                  </Label>
                  <Select
                    value={String(count)}
                    onValueChange={(v) => setCount(Number(v) as 3 | 6)}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Options communes */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">
                  {t("modal.footerLabel")}
                </Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("modal.showAvatar")}</span>
                  <Switch
                    checked={showAvatar}
                    onCheckedChange={setShowAvatar}
                    className="cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("modal.showUsername")}</span>
                  <Switch
                    checked={showUsername}
                    onCheckedChange={setShowUsername}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            disabled={!nativeShareSupported || loading}
            className="flex-1 cursor-pointer"
            title={
              !nativeShareSupported ? t("modal.shareUnavailable") : undefined
            }
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t("modal.shareNative")}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            {t("modal.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
