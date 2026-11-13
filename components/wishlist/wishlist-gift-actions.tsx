"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Gift, Heart, PackageCheck } from "lucide-react";
import type { JerseyVersion, Size } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddToCollectionModal, type AddToCollectionJersey } from "@/components/collection/modal-add-collection";
import { COLLECTION_ITEM_LIMITS, JERSEY_SIZES, JERSEY_VERSIONS } from "@/lib/collection-item-rules";
import type { AddToCollectionData } from "@/types/collection";

export interface WishlistGift {
  size: Size | null;
  version: JerseyVersion | null;
  flockName: string | null;
  flockNumber: number | null;
  priority: number;
}

interface Props {
  wishlistId: string;
  jersey: AddToCollectionJersey;
  gift: WishlistGift;
  /** Taille la plus portée dans la collection, proposée si aucune n'est choisie. */
  suggestedSize: Size | null;
}

const NONE = "none";

/** Infos cadeau d'une envie + « Je l'ai reçu » (ajout collection prérempli). */
export function WishlistGiftActions({ wishlistId, jersey, gift, suggestedSize }: Props) {
  const t = useTranslations("Wishlist.gift");
  const tVersion = useTranslations("JerseyVersion");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    size: gift.size ?? suggestedSize,
    version: gift.version,
    flockName: gift.flockName ?? "",
    flockNumber: gift.flockNumber?.toString() ?? "",
    favorite: gift.priority >= 2,
  });

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
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const addReceived = async (data: AddToCollectionData) => {
    setSaving(true);
    try {
      // La route retire l'envie de la wishlist (et sa réservation avec) à l'ajout.
      const res = await fetch(`/api/jerseys/${jersey.id}/collection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        toast.error(body.error ?? t("error"));
        return;
      }
      setReceivedOpen(false);
      toast.success(t("receivedDone"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Côte à côte s'il y a la place, sinon l'un sous l'autre (carte étroite en 4 colonnes). */}
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="flex-1 basis-32 min-w-0 cursor-pointer" onClick={() => setEditOpen(true)}>
          <Gift className="w-3.5 h-3.5" /> {t("edit")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 basis-32 min-w-0 cursor-pointer" onClick={() => setReceivedOpen(true)}>
          <PackageCheck className="w-3.5 h-3.5" /> {t("received")}
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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

          <DialogFooter>
            <Button onClick={save} disabled={saving} className="cursor-pointer">{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddToCollectionModal
        open={receivedOpen}
        onOpenChange={setReceivedOpen}
        onSubmit={addReceived}
        isLoading={saving}
        jersey={jersey}
        initialValues={{
          ...(form.size ? { size: form.size } : {}),
          ...(form.version ? { version: form.version } : {}),
          playerName: form.flockName || undefined,
          playerNumber: form.flockNumber ? Number(form.flockNumber) : undefined,
          condition: "MINT",
          isGift: true,
        }}
      />
    </>
  );
}
