import type { AgentRunResponse } from '@/lib/types';
import { actionLabel, formatScore } from '@/lib/format';
import { Section } from './Section';
import styles from './DecisionTrace.module.css';

interface DecisionTraceProps {
  response: AgentRunResponse;
  /** The account the run was triggered for (from the run request) — used for the problem line. */
  accountId: string;
}

/**
 * Section 02 — the human-readable decision trace: problem detected → alternatives
 * considered → rationale.
 *
 * The v1 run response has no explicit `problem` field, so the problem statement is composed
 * from the detected KPI (`expected_kpi_delta`) and the run's `account_id`. The chosen action
 * is highlighted alongside the alternatives the guardrail matrix permitted.
 */
export function DecisionTrace({ response, accountId }: DecisionTraceProps) {
  const { recommendation, alternatives_considered, rationale } = response;
  const { metric, before } = recommendation.expected_kpi_delta;

  return (
    <Section label="02 · Decision trace" title="Why this action">
      <ol className={styles.trace}>
        <li className={styles.step}>
          <span className={styles.marker} aria-hidden="true" />
          <div className={styles.stepBody}>
            <p className="eyebrow">Problem detected</p>
            <p className={styles.text}>
              Recoverable <code className={styles.code}>{metric}</code> of{' '}
              <strong className={styles.scoreBad}>{formatScore(before)}</strong> detected on
              account <code className={styles.code}>{accountId}</code>.
            </p>
          </div>
        </li>

        <li className={styles.step}>
          <span className={styles.marker} aria-hidden="true" />
          <div className={styles.stepBody}>
            <p className="eyebrow">Alternatives considered</p>
            <ul className={styles.alternatives}>
              <li className={styles.chosen}>
                <span className={styles.chosenTag}>chosen</span>
                {actionLabel(recommendation.action_type)}
                <code className={styles.codeFaint}>{recommendation.action_type}</code>
              </li>
              {alternatives_considered.map((alt) => (
                <li key={alt} className={styles.alternative}>
                  {actionLabel(alt)}
                  <code className={styles.codeFaint}>{alt}</code>
                </li>
              ))}
            </ul>
          </div>
        </li>

        <li className={styles.step}>
          <span className={styles.marker} aria-hidden="true" />
          <div className={styles.stepBody}>
            <p className="eyebrow">Rationale</p>
            <p className={styles.rationale}>{rationale}</p>
          </div>
        </li>
      </ol>
    </Section>
  );
}
