"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Shirt, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ElementType;
  animate: boolean;
}

function StatCard({ value, label, icon: Icon, animate }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!animate) return;

    const duration = 2000;
    const start = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCount(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [animate, value]);

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      {/* sr-only span carries the real value in the initial HTML for crawlers */}
      <span className="sr-only">{value.toLocaleString("fr-FR")} {label}</span>
      <span
        className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums"
        aria-hidden="true"
      >
        {count.toLocaleString("fr-FR")}
      </span>
      <span className="text-muted-foreground text-base font-medium" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

interface StatsSectionProps {
  userCount: number;
  jerseyCount: number;
  clubCount: number;
}

export function StatsSection({
  userCount,
  jerseyCount,
  clubCount,
}: StatsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const t = useTranslations("HomePage.stats");

  const stats = [
    { value: userCount, label: t("collectors"), icon: Users },
    { value: jerseyCount, label: t("jerseys"), icon: Shirt },
    { value: clubCount, label: t("clubs"), icon: Building2 },
  ];

  return (
    <section ref={ref} className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 md:gap-12">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} animate={animate} />
          ))}
        </div>
      </div>
    </section>
  );
}
