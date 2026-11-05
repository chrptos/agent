import type { NextConfig } from "next";

const config: NextConfig = {
  // ADK loads optional database / telemetry integrations at runtime.
  // Bundling it would require those unused optional peers during next build.
  serverExternalPackages: ["@google/adk"],
};

export default config;
