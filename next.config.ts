import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow up to 20 MB per request (for document uploads via API routes)
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },

  // Keep all document-processing packages as raw Node.js modules (not bundled).
  // pdfjs-dist renders PDF pages; sharp converts raw RGBA buffers to PNG for Tesseract.
  serverExternalPackages: ["pdf-parse", "tesseract.js", "pdfjs-dist", "sharp"],

  // Turbopack is the default in Next.js 16. 
  // We set an empty config here to silence the webpack-conflict warning.
  turbopack: {},
};

export default nextConfig;
