"use client";

import { useState, useRef, TouchEvent, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: Array<{
    src: string;
    alt: string;
    label?: string;
  }>;
  className?: string;
  enableFullscreen?: boolean;
}

export function ImageCarousel({
  images,
  className,
  enableFullscreen = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, goToPrevious, goToNext]);

  if (images.length === 0) return null;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      goToNext();
    }

    if (touchStartX.current - touchEndX.current < -50) {
      goToPrevious();
    }
  };

  const singleImage = images.length === 1;
  const currentImage = images[currentIndex];

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div
          className="relative aspect-square bg-white rounded-lg border overflow-hidden group"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            className="object-contain"
          />

          {enableFullscreen && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Voir en grand"
              className="absolute bottom-2 left-2 h-8 w-8 cursor-pointer bg-black/75 hover:bg-black/90 text-white shadow-sm z-10 border-0"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          {!singleImage && (
            <>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Image précédente"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 cursor-pointer hidden md:flex"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                aria-label="Image suivante"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 cursor-pointer hidden md:flex"
                onClick={goToNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {currentImage.label && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                  {currentImage.label}
                </div>
              )}
            </>
          )}
        </div>

        {!singleImage && (
          <div className="flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all cursor-pointer",
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Aller à l'image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {enableFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent
            showCloseButton={false}
            className="w-[95vw] sm:max-w-3xl p-0 border-0 bg-black/95 overflow-hidden flex flex-col gap-0"
          >
            <DialogHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3 border-b border-white/10 space-y-0">
              <DialogTitle className="text-white text-sm font-medium">
                {!singleImage
                  ? `${currentIndex + 1} / ${images.length}`
                  : currentImage.label || currentImage.alt}
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                className="h-8 w-8 cursor-pointer text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div
              className="relative w-full aspect-square sm:aspect-[4/3] bg-white"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                fill
                className="object-contain p-3 sm:p-6"
                sizes="(max-width: 768px) 95vw, 768px"
              />

              {!singleImage && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Image précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 cursor-pointer bg-white/90 hover:bg-white"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Image suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 cursor-pointer bg-white/90 hover:bg-white"
                    onClick={goToNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {!singleImage && (
              <div className="flex justify-center gap-2 px-4 py-3 border-t border-white/10 bg-black/60">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "relative h-20 w-20 rounded-md overflow-hidden bg-white border-2 transition-all cursor-pointer shrink-0",
                      index === currentIndex
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    aria-label={`Aller à l'image ${index + 1}`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
