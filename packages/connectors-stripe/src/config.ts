/**
 * Configuration for the Stripe connector. Secrets are read from the environment
 * only — never hardcoded, never read from a tracked file. Required variables are
 * documented as placeholders in `.env.example` (see
 * `.claude/rules/10-security-and-secrets.md`).
 */

/** Environment variable holding the Stripe secret key (use a test-mode key locally). */
export const STRIPE_SECRET_KEY_ENV = 'STRIPE_SECRET_KEY';

/**
 * Read the Stripe secret key from the environment, throwing a clear (non-leaking)
 * error if it is absent. The value itself is never logged.
 */
export function requireStripeSecretKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env[STRIPE_SECRET_KEY_ENV]?.trim();
  if (!key) {
    throw new Error(
      `Missing ${STRIPE_SECRET_KEY_ENV}. Set it in your environment (never hardcode it); ` +
        `see .env.example for the placeholder. Use a test-mode key for local work.`,
    );
  }
  return key;
}
