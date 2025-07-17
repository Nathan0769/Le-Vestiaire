"use client";

import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  href?: string;
  centered?: boolean;
  withText?: boolean;
  size?: number;
};

export function Logo({
  href = "/",
  centered = false,
  withText = true,
  size = 28,
}: LogoProps) {
  const containerClass = centered ? "justify-center w-full" : "";

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 font-medium ${containerClass}`}
    >
      <Image
        src="/img/logo.png"
        alt="Le Vestiaire logo"
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
      {withText && <span>Le Vestiaire</span>}
    </Link>
  );
}
