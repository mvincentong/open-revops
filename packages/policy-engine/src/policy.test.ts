import { describe, it, expect } from 'vitest';

import { decide, DEFAULT_GUARDRAIL_MATRIX, type PolicyConfig } from './policy.js';

// Demo defaults per docs/policy-rules.md: kill-switch ON, auto-execute threshold 0.95.
const demoConfig: PolicyConfig = {
  killSwitch: true,
  autoExecuteConfidence: 0.95,
  matrix: DEFAULT_GUARDRAIL_MATRIX,
};

const killSwitchOff = (overrides: Partial<PolicyConfig> = {}): PolicyConfig => ({
  ...demoConfig,
  killSwitch: false,
  ...overrides,
});

describe('policy decide()', () => {
  it('blocks a blocked action with highest precedence (even kill-switch + full confidence)', () => {
    const d = decide({ actionType: 'invoice_void_or_delete', confidence: 1 }, demoConfig);
    expect(d.status).toBe('blocked');
    expect(d.decidedBy).toBe('blocked_by_matrix');
  });

  it('keeps a blocked action blocked even when every other gate would allow it', () => {
    const d = decide(
      { actionType: 'invoice_void_or_delete', confidence: 1 },
      killSwitchOff({ autoExecuteConfidence: 0 }),
    );
    expect(d.status).toBe('blocked');
  });

  it('forces approval for everything when the kill-switch is on', () => {
    // send_recovery_prompt would otherwise auto-execute at full confidence.
    const d = decide({ actionType: 'send_recovery_prompt', confidence: 1 }, demoConfig);
    expect(d.status).toBe('needs_approval');
    expect(d.decidedBy).toBe('kill_switch_on');
  });

  it('requires approval when the matrix requires it (apply_credit)', () => {
    const d = decide({ actionType: 'apply_credit', confidence: 1 }, killSwitchOff());
    expect(d.status).toBe('needs_approval');
    expect(d.decidedBy).toBe('matrix_requires_approval');
  });

  it('auto-executes an allowed action when confidence meets the threshold', () => {
    const d = decide({ actionType: 'send_recovery_prompt', confidence: 0.95 }, killSwitchOff());
    expect(d.status).toBe('auto_executed');
    expect(d.decidedBy).toBe('auto_execute_allowed');
  });

  it('requires approval when confidence is below the auto-execute threshold', () => {
    const d = decide({ actionType: 'send_recovery_prompt', confidence: 0.94 }, killSwitchOff());
    expect(d.status).toBe('needs_approval');
    expect(d.decidedBy).toBe('confidence_below_threshold');
  });

  it('golden path: apply_credit at 0.86 confidence under demo defaults needs approval', () => {
    const d = decide({ actionType: 'apply_credit', confidence: 0.86 }, demoConfig);
    expect(d.status).toBe('needs_approval');
  });
});
