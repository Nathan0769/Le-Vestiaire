import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hioeyddfdoekpplonsxa.supabase.co",
      },
    ],
  },
};

export default nextConfig;
