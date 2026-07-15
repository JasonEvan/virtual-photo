import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gcviglqdisttvcvntmwu.supabase.co",
      },
    ],
  },
};

export default nextConfig;
