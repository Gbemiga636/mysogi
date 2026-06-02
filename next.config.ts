import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  /** Include @fontsource woff2 files in API lambdas (typeset contact footer in AI image). */
  outputFileTracingIncludes: {
    "/api/**": [
      "./src/assets/fonts/*.woff2",
      "./node_modules/@fontsource/**/files/*.woff2",
    ],
  },
};

export default nextConfig;
