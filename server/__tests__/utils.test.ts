/**
 * LOW-006: Unit tests for server/utils/*
 */

import { describe, it, expect } from 'vitest';
import { calculateEntropy } from '../utils/entropy-validator';
import { timingSafeCompare } from '../utils/timing-safe-compare';

describe('Utility Functions', () => {
  describe('Entropy Validator', () => {
    it('should calculate high entropy for random strings', () => {
      const highEntropySecret = 'aB3$xY9!mN7@pQ5#wR2*';
      const entropy = calculateEntropy(highEntropySecret);
      expect(entropy).toBeGreaterThan(3.5); // High entropy
    });

    it('should calculate low entropy for repeated patterns', () => {
      const lowEntropySecret = 'aaaaaaaaaa';
      const entropy = calculateEntropy(lowEntropySecret);
      expect(entropy).toBeLessThan(1); // Low entropy
    });

    it('should calculate medium entropy for sequential patterns', () => {
      const mediumEntropy = 'abcdefghijklmnop';
      const entropy = calculateEntropy(mediumEntropy);
      expect(entropy).toBeLessThan(3); // Medium-low entropy
    });
  });

  describe('Timing-Safe Compare', () => {
    it('should return true for matching strings', () => {
      const result = timingSafeCompare('secret123', 'secret123');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = timingSafeCompare('secret123', 'secret456');
      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = timingSafeCompare('short', 'verylongstring');
      expect(result).toBe(false);
    });

    it('should be timing-safe (constant time)', () => {
      const iterations = 1000;
      const shortStrings: number[] = [];
      const longStrings: number[] = [];

      // Measure comparison time for short strings
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        timingSafeCompare('a', 'b');
        const end = performance.now();
        shortStrings.push(end - start);
      }

      // Measure comparison time for long strings
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        timingSafeCompare('a'.repeat(100), 'b'.repeat(100));
        const end = performance.now();
        longStrings.push(end - start);
      }

      const avgShort = shortStrings.reduce((a, b) => a + b) / iterations;
      const avgLong = longStrings.reduce((a, b) => a + b) / iterations;

      // Timing should be relatively constant regardless of length
      // (within an order of magnitude)
      expect(avgLong / avgShort).toBeLessThan(10);
    });
  });
});
