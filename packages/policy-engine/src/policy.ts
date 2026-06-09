/**
 * Policy engine — the safety core. Decides whether an action may auto-execute,
 * needs human approval, or is blocked. Mirrors the decision procedure in
 * docs/policy-rules.md exactly. Never add a bypass path (see
 * .claude/rules/10-security-and-secrets.md).
 */

export type ActionType =
  | 'apply_credit'
  | 'send_recovery_prompt'
  | 'plan_migration'
  | 'invoice_void_or_delete';

export type PolicyStatus = 'auto_executed' | 'needs_approval' | 'blocked';

/** Which rule decided the outcome — recorded verbatim in the decision trace. */
export type PolicyRuleId =
  | 'blocked_by_matrix'
  | 'kill_switch_on'
  | 'matrix_requires_approval'
  | 'auto_execute_allowed'
  | 'confidence_below_threshold';

export interface GuardrailRule {
  readonly autoExecuteAllowed: boolean;
  readonly approvalRequired: boolean;
  readonly blocked: boolean;
}

export type GuardrailMatrix = Readonly<Record<ActionType, GuardrailRule>>;

export interface PolicyConfig {
  /** POLICY_REQUIRE_APPROVAL_ALWAYS — when true, everything needs approval. */
  readonly killSwitch: boolean;
  /** POLICY_AUTO_EXECUTE_CONFIDENCE — minimum confidence to auto-execute. */
  readonly autoExecuteConfidence: number;
  readonly matrix: GuardrailMatrix;
}

export interface PolicyInput {
  readonly actionType: ActionType;
  /** Calibrated confidence in [0, 1] from the decision step. */
  readonly confidence: number;
}

export interface PolicyDecision {
  readonly status: PolicyStatus;
  readonly decidedBy: PolicyRuleId;
}

/** Recommended guardrail defaults from docs/policy-rules.md. */
export const DEFAULT_GUARDRAIL_MATRIX: GuardrailMatrix = {
  apply_credit: { autoExecuteAllowed: false, approvalRequired: true, blocked: false },
  send_recovery_prompt: { autoExecuteAllowed: true, approvalRequired: false, blocked: false },
  plan_migration: { autoExecuteAllowed: false, approvalRequired: true, blocked: false },
  invoice_void_or_delete: { autoExecuteAllowed: false, approvalRequired: false, blocked: true },
};

/**
 * Apply the guardrail matrix, kill-switch, and confidence threshold in the
 * fixed precedence order: blocked → kill-switch → matrix approval → confidence.
 */
export function decide(input: PolicyInput, config: PolicyConfig): PolicyDecision {
  const rule = config.matrix[input.actionType];

  if (rule.blocked) {
    return { status: 'blocked', decidedBy: 'blocked_by_matrix' };
  }
  if (config.killSwitch) {
    return { status: 'needs_approval', decidedBy: 'kill_switch_on' };
  }
  if (rule.approvalRequired) {
    return { status: 'needs_approval', decidedBy: 'matrix_requires_approval' };
  }
  if (input.confidence >= config.autoExecuteConfidence) {
    return { status: 'auto_executed', decidedBy: 'auto_execute_allowed' };
  }
  return { status: 'needs_approval', decidedBy: 'confidence_below_threshold' };
}
