import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module; must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.1.9"],
};

export default nextConfig;
