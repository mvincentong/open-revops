import type { Recommendation, RunStatus } from '@/lib/types';
import { actionLabel, formatScore, statusLabel, toPercent } from '@/lib/format';
import { Badge, type BadgeTone } from './Badge';
import { Section } from './Section';
import styles from './RecommendationCard.module.css';

interface RecommendationCardProps {
  recommendation: Recommendation;
  status: RunStatus;
}

function statusTone(status: RunStatus): BadgeTone {
  switch (status) {
    case 'auto_executed':
      return 'good';
    case 'needs_approval':
      return 'warn';
    case 'blocked':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Section 01 — the agent's chosen action, confidence, and projected KPI movement. */
export function RecommendationCard({ recommendation, status }: RecommendationCardProps) {
  const { action_type, confidence, expected_kpi_delta } = recommendation;
  const confidencePct = toPercent(confidence);

  return (
    <Section
      label="01 · Recommendation"
      title="Recommended action"
      aside={<Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>}
    >
      <div className={styles.action}>
        <span className={styles.actionIcon} aria-hidden="true">
          ⊕
        </span>
        <div>
          <p className={styles.actionLabel}>{actionLabel(action_type)}</p>
          <p className={styles.actionType}>{action_type}</p>
        </div>
      </div>

      <div className={styles.confidence}>
        <div className={styles.confidenceHead}>
          <span className="eyebrow">Confidence</span>
          <span className={styles.confidenceValue}>{confidencePct}</span>
        </div>
        <div
          className={styles.meter}
          role="meter"
          aria-valuenow={Math.round(confidence * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Recommendation confidence"
        >
          <span className={styles.meterFill} style={{ width: confidencePct }} />
        </div>
      </div>

      <dl className={styles.kpi}>
        <div className={styles.kpiRow}>
          <dt>Target metric</dt>
          <dd className={styles.mono}>{expected_kpi_delta.metric}</dd>
        </div>
        <div className={styles.kpiRow}>
          <dt>Expected impact</dt>
          <dd className={styles.delta}>
            <span className={styles.before}>{formatScore(expected_kpi_delta.before)}</span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
            <span className={styles.after}>{formatScore(expected_kpi_delta.after)}</span>
          </dd>
        </div>
      </dl>
    </Section>
  );
}
