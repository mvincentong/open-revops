'use client';

import { useCallback, useEffect, useState } from 'react';

import { runAgent, submitApproval } from '@/lib/api-client';
import { GOLDEN_PATH_REQUEST } from '@/lib/mock';
import type { AgentRunResponse, ApprovalDecision } from '@/lib/types';
import type { ApiMode } from '@/lib/env';

import { ApprovalGate, type ApprovalUiState } from './ApprovalGate';
import { Badge } from './Badge';
import { DecisionTrace } from './DecisionTrace';
import { KpiPanel } from './KpiPanel';
import { RecommendationCard } from './RecommendationCard';
import styles from './WarRoom.module.css';

type RunUiState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'ready'; data: AgentRunResponse }
  | { phase: 'error'; error: string };

const OPERATOR = 'demo_operator';

interface WarRoomProps {
  /** Resolved server-side: whether the route handlers serve the mock or proxy the live API. */
  apiMode: ApiMode;
}

export function WarRoom({ apiMode }: WarRoomProps) {
  const [run, setRun] = useState<RunUiState>({ phase: 'idle' });
  const [approval, setApproval] = useState<ApprovalUiState>({ phase: 'idle' });

  const handleRun = useCallback(async () => {
    setRun({ phase: 'loading' });
    setApproval({ phase: 'idle' });

    const result = await runAgent(GOLDEN_PATH_REQUEST);
    if (result.ok) {
      setRun({ phase: 'ready', data: result.data });
    } else {
      setRun({ phase: 'error', error: result.error });
    }
  }, []);

  useEffect(() => {
    void handleRun();
  }, [handleRun]);

  const handleDecision = useCallback(
    async (decision: ApprovalDecision) => {
      if (run.phase !== 'ready') return;

      setApproval({ phase: 'submitting', decision });

      const result = await submitApproval({
        run_id: run.data.run_id,
        approved_by: OPERATOR,
        decision,
        notes: decision === 'approve' ? 'Proceed for demo' : 'Declined for demo',
      });

      if (result.ok) {
        setApproval({ phase: 'done', result: result.data });
      } else {
        setApproval({ phase: 'error', error: result.error });
      }
    },
    [run],
  );

  const realized = approval.phase === 'done' && approval.result.decision === 'approve';
  const runButtonLabel =
    run.phase === 'loading' ? 'Running…' : run.phase === 'ready' ? 'Re-run agent' : 'Run agent';

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            ◆
          </span>
          <div>
            <h1 className={styles.title}>Revenue War Room</h1>
            <p className={styles.subtitle}>
              Approval-safe revenue agent · account{' '}
              <code className={styles.code}>{GOLDEN_PATH_REQUEST.account_id}</code> · scenario{' '}
              <code className={styles.code}>{GOLDEN_PATH_REQUEST.scenario_id}</code>
            </p>
          </div>
        </div>
        <div className={styles.controls}>
          <Badge tone={apiMode === 'live' ? 'good' : 'info'}>
            {apiMode === 'live' ? 'Live API' : 'Mock · golden_path_v1'}
          </Badge>
          <button
            type="button"
            className={styles.run}
            onClick={() => void handleRun()}
            disabled={run.phase === 'loading'}
            aria-busy={run.phase === 'loading'}
          >
            {runButtonLabel}
          </button>
        </div>
      </header>

      {run.phase === 'loading' || run.phase === 'idle' ? (
        <div className={styles.placeholder} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Running agent on the golden path…
        </div>
      ) : null}

      {run.phase === 'error' ? (
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorTitle}>Agent run failed</p>
          <p className={styles.errorMsg}>{run.error}</p>
          <button type="button" className={styles.run} onClick={() => void handleRun()}>
            Retry
          </button>
        </div>
      ) : null}

      {run.phase === 'ready' ? (
        <main className={styles.grid}>
          <div className={styles.col}>
            <RecommendationCard recommendation={run.data.recommendation} status={run.data.status} />
            <KpiPanel delta={run.data.recommendation.expected_kpi_delta} realized={realized} />
          </div>
          <div className={styles.col}>
            <DecisionTrace response={run.data} accountId={GOLDEN_PATH_REQUEST.account_id} />
            <ApprovalGate runStatus={run.data.status} state={approval} onDecision={handleDecision} />
          </div>
        </main>
      ) : null}
    </div>
  );
}
