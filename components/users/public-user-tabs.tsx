"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Gift } from "lucide-react";
import { useTranslations } from "next-intl";

interface PublicUserTabsProps {
  userId: string;
}

export function PublicUserTabs({ userId }: PublicUserTabsProps) {
  const pathname = usePathname();
  const t = useTranslations("PublicCollection.tabs");

  const tabs = [
    {
      label: t("collection"),
      href: `/users/${userId}/collection`,
      icon: Package,
      active: pathname.includes("/collection"),
    },
    {
      label: t("wishlist"),
      href: `/users/${userId}/wishlist`,
      icon: Gift,
      active: pathname.includes("/wishlist"),
    },
  ];

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab.active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
