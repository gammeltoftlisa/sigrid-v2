import type { NextConfig } from "next";

import { IMAGE_HOSTS } from "./lib/fabric/safe-listing";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy: only Sigrid's own scripts, styles, fonts and images load.
 * Product photos come through Next's image optimiser (/_next/image), so they count as 'self'.
 * Inline scripts are allowed because Next needs them for static pages; nonces would make every
 * page render per request. Development also needs 'unsafe-eval' for React's error overlay.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS only, for two years, including subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Don't guess content types; never show the site inside another site's frame
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Shops see that a visitor came from Sigrid, not which page
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Sigrid uses none of these
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response
  poweredByHeader: false,
  images: {
    // Product photos (lib/fabric/sources) and garment photography (lib/garment-photos.ts).
    // Listings with photos from any other host lose the photo (lib/fabric/safe-listing.ts).
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
