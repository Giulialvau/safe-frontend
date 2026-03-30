import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/Login", destination: "/login", permanent: true },
      { source: "/LOGIN", destination: "/login", permanent: true },
    ];
  },
};

export default nextConfig;
