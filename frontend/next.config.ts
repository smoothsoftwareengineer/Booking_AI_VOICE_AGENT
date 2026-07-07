import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["retell-client-js-sdk", "livekit-client"],
};

export default nextConfig;
