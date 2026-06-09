/**
 * Typed errors for the Stripe credit connector. Distinct classes let callers and
 * the audit log distinguish a *policy refusal* (approval missing) from a *bad
 * request* (invalid args) from a *bad vendor response* (mapping failure).
 */

/**
 * Thrown when an irreversible action is attempted without a recorded approval.
 * This is a hard refusal: there is no bypass path (see
 * `.claude/rules/10-security-and-secrets.md`).
 */
export class ApprovalRequiredError extends Error {
  readonly code = 'approval_required';

  constructor(runId: string) {
    super(
      `Refusing to apply credit for run "${runId}": no approval recorded. ` +
        `Irreversible actions are gated behind an explicit approval — there is no bypass.`,
    );
    this.name = 'ApprovalRequiredError';
  }
}

/** Thrown when `ApplyCreditArgs` fail validation at the connector boundary. */
export class InvalidCreditArgsError extends Error {
  readonly code = 'invalid_credit_args';

  constructor(reason: string) {
    super(`Invalid apply_credit arguments: ${reason}`);
    this.name = 'InvalidCreditArgsError';
  }
}

/** Thrown when a vendor response can't be mapped to a valid internal receipt. */
export class InvalidVendorResponseError extends Error {
  readonly code = 'invalid_vendor_response';

  constructor(reason: string) {
    super(`Invalid Stripe response: ${reason}`);
    this.name = 'InvalidVendorResponseError';
  }
}
