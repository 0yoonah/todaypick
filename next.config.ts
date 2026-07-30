import type { NextConfig } from "next";
import { FEED_IMAGE_HOSTNAMES } from "./src/config/feedImages";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: FEED_IMAGE_HOSTNAMES.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
