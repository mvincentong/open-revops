import { describe, it, expect, vi } from 'vitest';

import { applyCredit } from './apply-credit.js';
import { ApprovalRequiredError, InvalidCreditArgsError } from './errors.js';
import type { StripeCreditClient, CreateCreditRequest } from './port.js';
import type { StripeBalanceTransactionLike } from './mapping.js';
import type { ApplyCreditArgs } from './types.js';

/** A controllable fake of the narrow vendor port — no real Stripe SDK in unit tests. */
function fakeClient(
  impl: (request: CreateCreditRequest) => Promise<StripeBalanceTransactionLike>,
): { client: StripeCreditClient; calls: CreateCreditRequest[] } {
  const calls: CreateCreditRequest[] = [];
  const client: StripeCreditClient = {
    applyCredit: (request) => {
      calls.push(request);
      return impl(request);
    },
  };
  return { client, calls };
}

const okTxn = (over: Partial<StripeBalanceTransactionLike> = {}): StripeBalanceTransactionLike => ({
  id: 'cbtxn_ok',
  created: 1_700_000_000,
  amount: -500,
  currency: 'usd',
  ...over,
});

const approvedArgs: ApplyCreditArgs = {
  runId: 'run_42',
  accountId: 'cus_test_42',
  amountCents: 500,
  approvalRecorded: true,
};

const noSleep = () => Promise.resolve();

describe('applyCredit() — approval gate', () => {
  it('refuses to execute when approval was not recorded, and never calls the vendor', async () => {
    const { client, calls } = fakeClient(() => Promise.resolve(okTxn()));

    await expect(
      applyCredit({ ...approvedArgs, approvalRecorded: false }, { client }),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);

    expect(calls).toHaveLength(0); // no bypass path — the side effect must not happen
  });

  it('treats any non-true approval flag as a refusal (no truthy bypass)', async () => {
    const { client, calls } = fakeClient(() => Promise.resolve(okTxn()));
    // @ts-expect-error — exercising a hostile caller passing a non-boolean
    await expect(applyCredit({ ...approvedArgs, approvalRecorded: 'yes' }, { client })).rejects.toBeInstanceOf(
      ApprovalRequiredError,
    );
    expect(calls).toHaveLength(0);
  });
});

describe('applyCredit() — happy path', () => {
  it('returns an internal receipt mapped from the vendor response', async () => {
    const { client } = fakeClient(() => Promise.resolve(okTxn()));
    const receipt = await applyCredit(approvedArgs, { client });
    expect(receipt).toEqual({
      provider_id: 'cbtxn_ok',
      status: 'succeeded',
      timestamp: '2023-11-14T22:13:20.000Z',
    });
  });

  it('passes a run-derived idempotency key and a positive credit magnitude to the vendor', async () => {
    const { client, calls } = fakeClient(() => Promise.resolve(okTxn()));
    await applyCredit(approvedArgs, { client });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.idempotencyKey).toBe('run_42:apply_credit');
    expect(calls[0]?.amountCents).toBe(500);
    expect(calls[0]?.currency).toBe('usd');
  });

  it('rejects invalid arguments before any vendor call', async () => {
    const { client, calls } = fakeClient(() => Promise.resolve(okTxn()));
    await expect(
      applyCredit({ ...approvedArgs, amountCents: 0 }, { client }),
    ).rejects.toBeInstanceOf(InvalidCreditArgsError);
    expect(calls).toHaveLength(0);
  });
});

describe('applyCredit() — resilience', () => {
  it('retries a transient failure with backoff, then succeeds (idempotency makes retries safe)', async () => {
    let attempts = 0;
    const { client, calls } = fakeClient(() => {
      attempts += 1;
      if (attempts < 3) return Promise.reject(new Error('ECONNRESET'));
      return Promise.resolve(okTxn());
    });

    const receipt = await applyCredit(approvedArgs, {
      client,
      retry: { maxAttempts: 3, baseDelayMs: 1, sleep: noSleep },
    });

    expect(receipt.provider_id).toBe('cbtxn_ok');
    expect(attempts).toBe(3);
    // every retry re-sends the SAME idempotency key
    expect(new Set(calls.map((c) => c.idempotencyKey)).size).toBe(1);
  });

  it('gives up after the bounded number of attempts', async () => {
    let attempts = 0;
    const { client } = fakeClient(() => {
      attempts += 1;
      return Promise.reject(new Error('ECONNRESET'));
    });

    await expect(
      applyCredit(approvedArgs, { client, retry: { maxAttempts: 2, baseDelayMs: 1, sleep: noSleep } }),
    ).rejects.toThrow();
    expect(attempts).toBe(2);
  });

  it('times out a hung vendor call', async () => {
    const { client } = fakeClient(
      () => new Promise<StripeBalanceTransactionLike>(() => {}), // never resolves
    );
    vi.useFakeTimers();
    try {
      const promise = applyCredit(approvedArgs, {
        client,
        retry: { maxAttempts: 1, timeoutMs: 50, sleep: noSleep },
      });
      const assertion = expect(promise).rejects.toThrow(/timed out/i);
      await vi.advanceTimersByTimeAsync(60);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
