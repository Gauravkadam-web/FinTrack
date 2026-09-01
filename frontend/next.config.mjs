/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.OUTPUT_STANDALONE === "true" || (process.env.NODE_ENV === "production" && process.platform !== "win32")
    ? { output: "standalone" }
    : {}),
};

export default nextConfig;
