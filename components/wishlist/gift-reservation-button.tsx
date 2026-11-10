"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Gift, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Jeton gardé dans le navigateur du proche : lui seul peut annuler sa réservation.
export const giftTokenKey = (shareId: string, wishlistId: string) => `gift:${shareId}:${wishlistId}`;

export function readGiftToken(shareId: string, wishlistId: string): string | null {
  try {
    return localStorage.getItem(giftTokenKey(shareId, wishlistId));
  } catch {
    return null;
  }
}

function writeGiftToken(shareId: string, wishlistId: string, token: string | null) {
  try {
    if (token) localStorage.setItem(giftTokenKey(shareId, wishlistId), token);
    else localStorage.removeItem(giftTokenKey(shareId, wishlistId));
  } catch {
    // Navigation privée stricte : la réservation reste, seule l'annulation sera impossible.
  }
}

interface Props {
  shareId: string;
  wishlistId: string;
  reservedBy: string | null;
  /** Jeton local lu au montage (null si ce navigateur n'a pas réservé). */
  initialToken: string | null;
  buttonClassName: string;
}

export function GiftReservationButton({ shareId, wishlistId, reservedBy, initialToken, buttonClassName }: Props) {
  const t = useTranslations("Wishlist.reservation");
  const [token, setToken] = useState(initialToken);
  const [reserved, setReserved] = useState(reservedBy);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reserve = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/wishlist/shares/${shareId}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId, name }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        writeGiftToken(shareId, wishlistId, body.token);
        setToken(body.token);
        setReserved(name.trim());
        setEditing(false);
      } else if (body.code === "ALREADY_RESERVED") {
        setError(t("alreadyReserved"));
      } else if (res.status === 429) {
        setError(t("tooManyRequests"));
      } else {
        setError(t("error"));
      }
    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  };

  const cancel = async () => {
    if (!token) return;
    setPending(true);
    try {
      const res = await fetch(`/api/wishlist/shares/${shareId}/reservations/${wishlistId}`, {
        method: "DELETE",
        headers: { "X-Reservation-Token": token },
      });
      if (res.ok || res.status === 404) {
        writeGiftToken(shareId, wishlistId, null);
        setToken(null);
        setReserved(null);
      }
    } finally {
      setPending(false);
    }
  };

  if (token && reserved) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900">
        <span className="flex items-center gap-1.5 font-medium">
          <Gift className="w-4 h-4" /> {t("youGiveIt")}
        </span>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="text-xs underline cursor-pointer disabled:opacity-50"
        >
          {t("cancel")}
        </button>
      </div>
    );
  }

  if (reserved) {
    return (
      <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm text-gray-700 text-center">
        {t("reservedBy", { name: reserved })}
      </div>
    );
  }

  if (editing) {
    return (
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void reserve();
        }}
      >
        <div className="flex gap-2">
          <Input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            aria-label={t("namePlaceholder")}
            className="bg-white"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setEditing(false)}
            aria-label={t("close")}
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Button type="submit" disabled={pending || !name.trim()} className={`w-full text-white cursor-pointer ${buttonClassName}`}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("confirm")}
        </Button>
        <p className="text-[11px] text-gray-500">{t("hint")}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full text-white cursor-pointer ${buttonClassName}`}
    >
      <Gift className="w-4 h-4" /> {t("cta")}
    </Button>
  );
}
