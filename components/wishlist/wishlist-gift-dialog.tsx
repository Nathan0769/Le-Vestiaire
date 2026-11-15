"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import type { JerseyVersion, Size } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLLECTION_ITEM_LIMITS, JERSEY_SIZES, JERSEY_VERSIONS } from "@/lib/collection-item-rules";

export interface WishlistGift {
  size: Size | null;
  version: JerseyVersion | null;
  flockName: string | null;
  flockNumber: number | null;
  priority: number;
}

export const EMPTY_GIFT: WishlistGift = { size: null, version: null, flockName: null, flockNumber: null, priority: 1 };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlistId: string;
  gift: WishlistGift;
  /** Taille la plus portée dans la collection, proposée si aucune n'est choisie. */
  suggestedSize: Size | null;
  /** Ouverte juste après l'ajout : bouton « Plus tard » à côté d'Enregistrer. */
  afterAdd?: boolean;
  onSaved?: () => void;
}

const NONE = "none";

function initialForm(gift: WishlistGift, suggestedSize: Size | null) {
  return {
    size: gift.size ?? suggestedSize,
    version: gift.version,
    flockName: gift.flockName ?? "",
    flockNumber: gift.flockNumber?.toString() ?? "",
    favorite: gift.priority >= 2,
  };
}

/** Infos cadeau d'une envie (taille, version, flocage, coup de cœur). PATCH /api/wishlist/{id}. */
export function WishlistGiftDialog({ open, onOpenChange, wishlistId, gift, suggestedSize, afterAdd, onSaved }: Props) {
  const t = useTranslations("Wishlist.gift");
  const tVersion = useTranslations("JerseyVersion");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initialForm(gift, suggestedSize));

  // Nouvelle envie (ajout depuis la fiche) : repartir de ses valeurs.
  useEffect(() => {
    setForm(initialForm(gift, suggestedSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistId]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/wishlist/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: form.size,
          version: form.version,
          flockName: form.flockName,
          flockNumber: form.flockNumber === "" ? null : Number(form.flockNumber),
          priority: form.favorite ? 2 : 1,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("error"));
        return;
      }
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("size")}</Label>
            <Select
              value={form.size ?? NONE}
              onValueChange={(v) => setForm((f) => ({ ...f, size: v === NONE ? null : (v as Size) }))}
            >
              <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("noPreference")}</SelectItem>
                {JERSEY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("version")}</Label>
            <Select
              value={form.version ?? NONE}
              onValueChange={(v) => setForm((f) => ({ ...f, version: v === NONE ? null : (v as JerseyVersion) }))}
            >
              <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("noPreference")}</SelectItem>
                {JERSEY_VERSIONS.map((v) => (
                  <SelectItem key={v} value={v}>{tVersion(v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`flock-name-${wishlistId}`}>{t("flockName")}</Label>
            <Input
              id={`flock-name-${wishlistId}`}
              value={form.flockName}
              maxLength={COLLECTION_ITEM_LIMITS.playerNameMax}
              placeholder="MBAPPE"
              onChange={(e) => setForm((f) => ({ ...f, flockName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`flock-number-${wishlistId}`}>{t("flockNumber")}</Label>
            <Input
              id={`flock-number-${wishlistId}`}
              inputMode="numeric"
              value={form.flockNumber}
              placeholder="10"
              onChange={(e) => setForm((f) => ({ ...f, flockNumber: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
            />
          </div>
        </div>

        <label className="flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Heart className="w-4 h-4 text-rose-600" /> {t("favorite")}
          </span>
          <Switch checked={form.favorite} onCheckedChange={(v) => setForm((f) => ({ ...f, favorite: v }))} />
        </label>

        <DialogFooter className="gap-2">
          {afterAdd && (
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="cursor-pointer text-muted-foreground">
              {t("later")}
            </Button>
          )}
          <Button onClick={save} disabled={saving} className="cursor-pointer">{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
