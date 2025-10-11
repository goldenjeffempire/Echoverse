/**
 * LOW-009: Performance benchmarks
 */

import { describe, bench } from 'vitest';
import { calculateEntropy } from '../utils/entropy-validator';
import { timingSafeCompare } from '../utils/timing-safe-compare';
import bcrypt from 'bcrypt';

describe('Performance Benchmarks', () => {
  describe('Entropy Calculation', () => {
    bench('calculate entropy for 32-char string', () => {
      calculateEntropy('aB3$xY9!mN7@pQ5#wR2*tG8%hK4^');
    });

    bench('calculate entropy for 64-char string', () => {
      calculateEntropy('aB3$xY9!mN7@pQ5#wR2*tG8%hK4^dL6&fJ1+sM9@vP3!zN5$wQ7*xR2#');
    });
  });

  describe('Timing-Safe Comparison', () => {
    bench('compare short strings (10 chars)', () => {
      timingSafeCompare('secret1234', 'secret5678');
    });

    bench('compare long strings (100 chars)', () => {
      timingSafeCompare('a'.repeat(100), 'b'.repeat(100));
    });
  });

  describe('Password Hashing', () => {
    const password = 'SecurePassword123!';

    bench('bcrypt hash (rounds=12)', async () => {
      await bcrypt.hash(password, 12);
    });

    bench('bcrypt compare', async () => {
      const hash = await bcrypt.hash(password, 12);
      await bcrypt.compare(password, hash);
    });
  });
});
