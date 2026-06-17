"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import type { FriendCollectionItem } from "@/types/friend-collection";
import type { CollectionItemWithJersey } from "@/types/collection-page";
import type { JerseyVersion } from "@/types/collection";
import { ImageCarousel } from "@/components/collection/image-carousel";
import { JerseyHeader } from "@/components/collection/jersey-modal/jersey-header";
import { BadgesSummary } from "@/components/collection/jersey-modal/badges-summary";
import { MyJerseyCard } from "@/components/collection/jersey-modal/my-jersey-card";
import { AcquisitionCard } from "@/components/collection/jersey-modal/acquisition-card";
import { AuthenticationCard } from "@/components/collection/jersey-modal/authentication-card";
import { useTranslations } from "next-intl";

interface FriendCollectionJerseyModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionItem: FriendCollectionItem;
}

const VERSIONS_WITH_MATCH_INFO: JerseyVersion[] = [
  "PLAYER_ISSUE",
  "MATCH_WORN",
];

function shouldShowAuthCard(item: FriendCollectionItem): boolean {
  if (item.isSigned) return true;
  if (item.hasAuthCertificate) return true;
  if (item.matchDescription || item.matchDate) return true;
  if (VERSIONS_WITH_MATCH_INFO.includes(item.version as JerseyVersion))
    return true;
  return false;
}

export function FriendCollectionJerseyModal({
  isOpen,
  onClose,
  collectionItem,
}: FriendCollectionJerseyModalProps) {
  const t = useTranslations("Friends.modal");
  const tView = useTranslations("Collection.modal.view");

  const item = collectionItem as unknown as CollectionItemWithJersey;

  const carouselImages: { src: string; alt: string; label: string }[] = [];

  if (collectionItem.userPhotoUrl) {
    carouselImages.push({
      src: collectionItem.userPhotoUrl,
      alt: t("yourPhoto"),
      label: t("yourPhoto"),
    });
  }

  carouselImages.push({
    src: collectionItem.jersey.imageUrl,
    alt: collectionItem.jersey.name,
    label: t("officialPhoto"),
  });

  const showAuthCard = shouldShowAuthCard(collectionItem);
  const showNotes = !!collectionItem.notes;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] flex flex-col p-0 @container">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 @xl:pt-8">
          <div className="grid grid-cols-1 @xl:grid-cols-[380px_1fr] @4xl:grid-cols-[440px_1fr] gap-5 @4xl:gap-6 items-stretch">
            {/* Colonne gauche : photo dans un cadre coloré, centrée verticalement */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl bg-[#FAF5EE] p-4 @xl:p-6 flex-1 flex items-center justify-center min-h-[420px]">
                <div className="w-full">
                  <ImageCarousel images={carouselImages} />
                </div>
              </div>
            </div>

            {/* Colonne droite : header + cards empilées verticalement */}
            <div className="space-y-4">
              <JerseyHeader collectionItem={item} />

              <BadgesSummary collectionItem={item} />

              <MyJerseyCard collectionItem={item} />

              <AcquisitionCard collectionItem={item} />

              {showAuthCard && <AuthenticationCard collectionItem={item} />}

              {showNotes && (
                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {tView("personalNotes")}
                    </h4>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                    {collectionItem.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
