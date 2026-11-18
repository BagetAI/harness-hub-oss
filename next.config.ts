import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not advertise the framework.
  poweredByHeader: false,

  // The dashboard is never meant to be shown inside another site's frame, and
  // nothing it serves should be guessed at or leaked through the referrer.
  // These apply to every response, the connector included, where they are harmless.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
