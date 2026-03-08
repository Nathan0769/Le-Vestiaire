"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href={href}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => router.back()}>
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}
