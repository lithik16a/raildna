import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module; must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
};

export default nextConfig;
