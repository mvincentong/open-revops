import type { ApprovalDecision, ApprovalResponse, RunStatus } from '@/lib/types';
import { Badge } from './Badge';
import { Section } from './Section';
import styles from './ApprovalGate.module.css';

/** UI state for the approval interaction, owned by the WarRoom orchestrator. */
export type ApprovalUiState =
  | { phase: 'idle' }
  | { phase: 'submitting'; decision: ApprovalDecision }
  | { phase: 'done'; result: ApprovalResponse }
  | { phase: 'error'; error: string };

interface ApprovalGateProps {
  runStatus: RunStatus;
  state: ApprovalUiState;
  onDecision: (decision: ApprovalDecision) => void;
}

/**
 * Section 03 — the human approval gate. Irreversible actions stop here; nothing executes
 * without a recorded `approve` decision. Approve/Deny post the approval payload via the
 * orchestrator.
 */
export function ApprovalGate({ runStatus, state, onDecision }: ApprovalGateProps) {
  if (runStatus !== 'needs_approval') {
    return (
      <Section label="03 · Approval gate" title="Human approval">
        <p className={styles.note}>
          {runStatus === 'auto_executed'
            ? 'This action met the auto-execute policy and did not require approval.'
            : 'This run is blocked by policy and cannot be approved.'}
        </p>
      </Section>
    );
  }

  const submitting = state.phase === 'submitting';
  const done = state.phase === 'done';

  return (
    <Section
      label="03 · Approval gate"
      title="Human approval"
      aside={
        done ? (
          <Badge tone={state.result.decision === 'approve' ? 'good' : 'danger'}>
            {state.result.status}
          </Badge>
        ) : (
          <Badge tone="warn">Awaiting decision</Badge>
        )
      }
    >
      <p className={styles.prompt}>
        This action is irreversible and routed for approval. Recording a decision appends an
        audit event for this run.
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.approve}`}
          onClick={() => onDecision('approve')}
          disabled={submitting || done}
          aria-busy={submitting && state.decision === 'approve'}
        >
          {submitting && state.decision === 'approve' ? 'Recording…' : 'Approve'}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.deny}`}
          onClick={() => onDecision('deny')}
          disabled={submitting || done}
          aria-busy={submitting && state.decision === 'deny'}
        >
          {submitting && state.decision === 'deny' ? 'Recording…' : 'Deny'}
        </button>
      </div>

      {state.phase === 'error' ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      {done ? (
        <dl className={styles.receipt} aria-label="Audit record">
          <div>
            <dt>event</dt>
            <dd>{state.result.audit.event_type}</dd>
          </div>
          <div>
            <dt>actor</dt>
            <dd>{state.result.audit.actor}</dd>
          </div>
          <div>
            <dt>result</dt>
            <dd
              className={
                state.result.decision === 'approve' ? styles.resultGood : styles.resultBad
              }
            >
              {state.result.audit.result}
            </dd>
          </div>
          <div>
            <dt>timestamp</dt>
            <dd>{state.result.audit.timestamp}</dd>
          </div>
        </dl>
      ) : null}
    </Section>
  );
}
