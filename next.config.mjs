/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Dev-only: allow HMR/dev resources from the hosts used to reach the dev server.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.2", "localhost"],
};

export default nextConfig;
