/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite que el build de Vercel tenga éxito aunque haya errores de prerender
  // (las páginas protegidas con Firebase no pueden prerenderizarse estáticamente)
  experimental: {},
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  // Deshabilita la generación estática para páginas que usan Firebase en SSR
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "**" }
    ]
  }
};
module.exports = nextConfig;

