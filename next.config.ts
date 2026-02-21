import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow up to 20 MB per request (for document uploads via API routes)
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  // pdf-parse and tesseract.js use Node.js APIs — keep them server-side only
  serverExternalPackages: ["pdf-parse", "tesseract.js"],

  // Turbopack is the default in Next.js 16. 
  // We set an empty config here to silence the webpack-conflict warning.
  turbopack: {},
};

export default nextConfig;
