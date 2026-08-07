/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rank-and-bank/sdk"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), "pino-pretty", "encoding"];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
