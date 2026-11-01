import type { NextConfig } from "next";

import { IMAGE_HOSTS } from "./lib/fabric/safe-listing";

const isDev = process.env.NODE_ENV === "development";

// Clerk's address for this site is part of its publishable key, so test and live keys both work
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split("_")[2];
const clerkHost = clerkKey ? Buffer.from(clerkKey, "base64").toString().replace(/\$$/, "") : "";
const clerk = clerkHost ? `https://${clerkHost}` : "";
// Clerk's bot checks on login and sign-up
const turnstile = "https://challenges.cloudflare.com";
const clerkProtect = "https://cdn.protect.clerk.com";
// It tests the connection on several ports of a per-site address
const clerkProtectProbe = "https://*.protect.clerk.com:*";

/**
 * Content Security Policy: only Sigrid's own scripts, styles, fonts and images load, plus Clerk for
 * login. Card details are typed on Stripe's own page, so Stripe needs no exception here.
 * Product photos come through Next's image optimiser (/_next/image), so they count as 'self'.
 * Inline scripts are allowed because Next needs them for static pages; nonces would make every
 * page render per request. Development also needs 'unsafe-eval' for React's error overlay.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${clerk} ${clerkProtect} ${turnstile}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://img.clerk.com",
  "font-src 'self'",
  `connect-src 'self' ${clerk} ${clerkProtectProbe}`,
  `frame-src ${turnstile}`,
  "worker-src 'self' blob:",
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
    // plus Mood Fabrics' blog, for the photo of the example studio pattern (development)
    remotePatterns: [...IMAGE_HOSTS, "blog.moodfabrics.com"].map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    // Set by Next's security upgrade (16.4.0 → 16.4.3)
    agentUpgrade: "security",
  },
};

export default nextConfig;
