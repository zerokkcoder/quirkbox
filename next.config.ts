import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The dev server blocks its dev-only resources (HMR, hydration payload) for any origin it
  // does not recognise. Playwright drives the app from 127.0.0.1, which would otherwise arrive
  // as a cross-origin request and leave every page un-hydrated.
  allowedDevOrigins: ["127.0.0.1"],
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
