import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    // The pronunciation fallback loads audio straight from translate.google.com, which
    // rejects any request that carries a Referer. Keep same-origin referrers intact.
    return ["/tools/random-name", "/:locale/tools/random-name"].map((source) => ({
      source,
      headers: [{ key: "Referrer-Policy", value: "same-origin" }],
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      "*.mdx": {
        loaders: ["@mdx-js/loader"],
        as: "*.js",
      },
    },
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
