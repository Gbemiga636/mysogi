import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  /** Include @fontsource woff2 files in API lambdas (SVG footer typography on Vercel). */
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/@fontsource/**/files/*.woff2"],
  },
};

export default nextConfig;
