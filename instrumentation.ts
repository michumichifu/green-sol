/**
 * Next.js instrumentation hook — se ejecuta una sola vez al iniciar el servidor.
 * Docs: node_modules/next/dist/docs/01-app/02-guides/instrumentation.md
 *
 * Solo se activa en el runtime Node.js (no en Edge) para poder usar setInterval
 * y los módulos de Node.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarSchedulerTasas } = await import("./lib/rates/scheduler");
    iniciarSchedulerTasas();
  }
}
