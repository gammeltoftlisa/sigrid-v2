import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { IMAGE_HOSTS } from "./lib/fabric/safe-listing";

const isDev = process.env.NODE_ENV === "development";

// Clerk's address for this site is part of its publishable key, so test and live keys both work
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split("_")[2];
const clerkHost = clerkKey ? Buffer.from(clerkKey, "base64").toString().replace(/\$$/, "") : "";
const clerk = clerkHost ? `https://${clerkHost}` : "";
// Clerk's bot checks on login and sign-up
const turnstile = "https://challenges.cloudflare.com";
const clerkProtect = "https://cdn.protect.clerk.com https://specter.protect.clerk.com";
// It tests the connection on several ports of a per-site address
const clerkProtectProbe = "https://*.protect.clerk.com:*";
// Vercel Web Analytics loads from the site itself (/_vercel/insights) in production, and only after consent
// (components/consent.tsx). In development the package fetches its debug script from Vercel instead.
const vercelAnalyticsDev = isDev ? " https://va.vercel-scripts.com" : "";
// Stripe's card fields on the checkout page: its script, its framed fields and the bank's checks
// (3-D Secure), and its API. The card is typed inside Stripe's frames, so it never reaches Sigrid.
const stripeJs = "https://js.stripe.com https://*.js.stripe.com";
const stripeFrames = `${stripeJs} https://hooks.stripe.com`;
const stripeApi = "https://api.stripe.com";
// Error tracking from the browser (lib/sentry-options.ts), to Sentry's EU or US ingest
const sentryIngest = "https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io";

/**
 * Content Security Policy: only Sigrid's own scripts, styles, fonts and images load, plus Clerk for
 * login, and Stripe's card fields on the checkout page.
 * Product photos come through Next's image optimiser (/_next/image), so they count as 'self'.
 * Inline scripts are allowed because Next needs them for static pages; nonces would make every
 * page render per request. Development also needs 'unsafe-eval' for React's error overlay.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${clerk} ${clerkProtect} ${turnstile} ${stripeJs}${vercelAnalyticsDev}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://img.clerk.com",
  "font-src 'self'",
  `connect-src 'self' ${clerk} ${clerkProtectProbe} ${stripeApi} ${sentryIngest}`,
  `frame-src ${turnstile} ${stripeFrames}`,
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
  // Sigrid uses none of these, except payments for Apple Pay and Google Pay inside Stripe's fields
  { key: "Permissions-Policy", value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), usb=()' },
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

// Source maps go to Sentry only when its token is there (the Vercel integration sets it), so readable
// stack traces never ship to browsers. Without the token, building works exactly as before.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
