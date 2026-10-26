import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the city knowledge base with the chatbot function on Vercel.
  outputFileTracingIncludes: {
    "/api/chatbot": ["./data/Lowell.md"],
  },
  cacheComponents: true,
  images: {
    // Feed photos come from Wikimedia Commons (openly licensed).
    remotePatterns: [
      { protocol: "https", hostname: "thumb.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
