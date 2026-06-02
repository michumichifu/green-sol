import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Imagen Docker mínima para el despliegue en el VPS (server.js autónomo).
  output: "standalone",
  // Cuando corre el servidor de tests E2E (puerto 3100), usa su propio directorio
  // de build para no entrar en conflicto con el lock de next dev (puerto 3000).
  ...(process.env.NEXT_E2E_BUILD === "1" ? { distDir: ".next-test" } : {}),
  // Los documentos KYC (imágenes ≤5 MB, video ≤20 MB) se suben vía Server Action;
  // el límite por defecto (1 MB) no alcanza.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
