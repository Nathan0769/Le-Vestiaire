"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SupporterVsProGuide } from "@/types/authentication";

interface ComparisonGuideProps {
  guide: SupporterVsProGuide;
}

export function ComparisonGuide({ guide }: ComparisonGuideProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{guide.title}</h1>
        <p className="text-base sm:text-lg text-muted-foreground">{guide.description}</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">{guide.context}</p>
      </div>

      <div className="space-y-4">
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 px-4 text-sm font-medium text-muted-foreground">
          <div>Critère</div>
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">Supporter</Badge>
          </div>
          <div className="flex justify-center">
            <Badge className="text-xs">Pro</Badge>
          </div>
        </div>

        <div className="grid gap-3">
          {(guide.supporterFullImage || guide.proFullImage) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base">Vue d&apos;ensemble</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 p-3 bg-muted/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Supporter
                    </span>
                    {guide.supporterFullImage && (
                      <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden">
                        <Image
                          src={guide.supporterFullImage}
                          alt="Maillot Supporter"
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      Pro
                    </span>
                    {guide.proFullImage && (
                      <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden">
                        <Image
                          src={guide.proFullImage}
                          alt="Maillot Pro"
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {guide.comparisons.map((point, index) => (
            <Card key={index}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base">{point.title}</CardTitle>
                {point.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {point.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 p-3 bg-muted/40 rounded-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Supporter
                    </span>
                    {point.supporterImage && (
                      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden">
                        <Image
                          src={point.supporterImage}
                          alt={`Supporter — ${point.title}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-sm">{point.supporter}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      Pro
                    </span>
                    {point.proImage && (
                      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden">
                        <Image
                          src={point.proImage}
                          alt={`Pro — ${point.title}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-sm">{point.pro}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
