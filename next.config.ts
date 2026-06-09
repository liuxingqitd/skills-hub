import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: workspaceRoot,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = { poll: 5000, aggregateTimeout: 1000 };
    }
    return config;
  }
};

export default nextConfig;
