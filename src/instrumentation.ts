/**
 * Next.js Instrumentation Hook — runs once at server startup, BEFORE accepting
 * any traffic.  See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use this to validate required environment variables at startup time so the
 * server refuses to start with a clear message instead of failing mid-request.
 * This NEVER runs during `next build`.
 */
export async function register() {
  // Only validate on the Node.js runtime (not in the Edge runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
