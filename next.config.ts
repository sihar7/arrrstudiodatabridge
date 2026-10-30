import type { NextConfig } from "next";

// Semua proses server ada di API (ARRRDataBridge/api, Railway); /api/v1/* di-proxy ke sana
// sehingga cookie sesi tetap milik domain web (first-party, SameSite=Lax).
const dev = process.env.NODE_ENV !== "production";
// API produksi di Railway; dev → API lokal. Bisa ditimpa env API_URL.
const api = (process.env.API_URL || (dev ? "http://localhost:8080" : "https://databridge-be.up.railway.app")).replace(/\/$/, "");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // tr.rbxcdn.com: avatar Roblox (userinfo/thumbnails)
  "img-src 'self' data: blob: https://*.rbxcdn.com",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self'${dev ? " ws: http://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
  experimental: {
    optimizePackageImports: ["iconoir-react"],
    // CSS Tailwind di-inline ke <head> → tanpa request CSS yang memblokir render (LCP mobile)
    inlineCss: true,
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};

export default nextConfig;
