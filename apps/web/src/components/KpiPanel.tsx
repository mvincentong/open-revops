import type { ExpectedKpiDelta } from '@/lib/types';
import { formatScore, reductionPercent } from '@/lib/format';
import { Badge } from './Badge';
import { Section } from './Section';
import styles from './KpiPanel.module.css';

interface KpiPanelProps {
  delta: ExpectedKpiDelta;
  /** True once an approve decision has been recorded (after → realized rather than projected). */
  realized: boolean;
}

/** Width (%) for a 0–1 risk score on the gauge track. */
function gaugeWidth(value: number): string {
  return `${Math.max(0, Math.min(1, value)) * 100}%`;
}

/** Section 04 — before/after KPI movement for the targeted metric. */
export function KpiPanel({ delta, realized }: KpiPanelProps) {
  const { metric, before, after } = delta;
  const absoluteDelta = (after - before).toFixed(2);

  return (
    <Section
      label="04 · KPI panel"
      title={metric}
      aside={
        <Badge tone={realized ? 'good' : 'info'}>{realized ? 'Realized' : 'Projected'}</Badge>
      }
    >
      <div className={styles.headline}>
        <div className={styles.figure}>
          <span className={styles.figureLabel}>Before</span>
          <span className={styles.before}>{formatScore(before)}</span>
        </div>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <div className={styles.figure}>
          <span className={styles.figureLabel}>After</span>
          <span className={styles.after}>{formatScore(after)}</span>
        </div>
        <div className={styles.deltaBadge}>
          <span className={styles.deltaValue}>{reductionPercent(before, after)}</span>
          <span className={styles.deltaAbs}>{absoluteDelta}</span>
        </div>
      </div>

      <div className={styles.gauges}>
        <div className={styles.gauge}>
          <span className={styles.gaugeLabel}>before</span>
          <div className={styles.track}>
            <span className={`${styles.fill} ${styles.fillBefore}`} style={{ width: gaugeWidth(before) }} />
          </div>
          <span className={styles.gaugeValue}>{formatScore(before)}</span>
        </div>
        <div className={styles.gauge}>
          <span className={styles.gaugeLabel}>after</span>
          <div className={styles.track}>
            <span className={`${styles.fill} ${styles.fillAfter}`} style={{ width: gaugeWidth(after) }} />
          </div>
          <span className={styles.gaugeValue}>{formatScore(after)}</span>
        </div>
      </div>

      <p className={styles.caption}>
        {realized
          ? 'Action approved — projected impact recorded against the run.'
          : 'Projected impact if the recommended action is approved and executed.'}
      </p>
    </Section>
  );
}
