/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module and must not be bundled by the server compiler.
  serverExternalPackages: ['better-sqlite3'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
