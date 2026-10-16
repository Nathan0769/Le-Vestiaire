"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ResolveErrorButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function resolve() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/errors/${id}/resolve`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" className="cursor-pointer" disabled={pending} onClick={resolve}>
      Résolu
    </Button>
  );
}
