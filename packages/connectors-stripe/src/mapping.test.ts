import { describe, it, expect } from 'vitest';

import {
  mapBalanceTransactionToReceipt,
  type StripeBalanceTransactionLike,
} from './mapping.js';
import { InvalidVendorResponseError } from './errors.js';

const vendorTxn: StripeBalanceTransactionLike = {
  id: 'cbtxn_test_123',
  created: 1_700_000_000, // Unix epoch SECONDS (Stripe convention)
  amount: -500, // negative == credit granted to the customer
  currency: 'usd',
};

describe('mapBalanceTransactionToReceipt()', () => {
  it('maps the vendor object id onto provider_id', () => {
    expect(mapBalanceTransactionToReceipt(vendorTxn).provider_id).toBe('cbtxn_test_123');
  });

  it('converts the Unix-seconds timestamp to an ISO-8601 UTC string', () => {
    expect(mapBalanceTransactionToReceipt(vendorTxn).timestamp).toBe('2023-11-14T22:13:20.000Z');
  });

  it('reports a committed credit as a succeeded receipt', () => {
    expect(mapBalanceTransactionToReceipt(vendorTxn).status).toBe('succeeded');
  });

  it('returns only the internal receipt shape (no vendor fields leak through)', () => {
    const receipt = mapBalanceTransactionToReceipt(vendorTxn);
    expect(Object.keys(receipt).sort()).toEqual(['provider_id', 'status', 'timestamp']);
  });

  it('rejects a vendor response missing an id', () => {
    expect(() => mapBalanceTransactionToReceipt({ ...vendorTxn, id: '' })).toThrow(
      InvalidVendorResponseError,
    );
  });

  it('rejects a vendor response with a non-finite created timestamp', () => {
    expect(() => mapBalanceTransactionToReceipt({ ...vendorTxn, created: Number.NaN })).toThrow(
      InvalidVendorResponseError,
    );
  });
});
