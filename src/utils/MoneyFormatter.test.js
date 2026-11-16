import {describe, it, expect} from 'vitest';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

describe('MoneyFormatter', () => {
    it('formats zero', () => {
        expect(MoneyFormatter.formatCents(0)).toBe('€0.00');
    });

    it('formats whole euros', () => {
        expect(MoneyFormatter.formatCents(100)).toBe('€1.00');
        expect(MoneyFormatter.formatCents(100000)).toBe('€1000.00');
    });

    it('formats cents with two decimals', () => {
        expect(MoneyFormatter.formatCents(10)).toBe('€0.10');
        expect(MoneyFormatter.formatCents(150)).toBe('€1.50');
        expect(MoneyFormatter.formatCents(999)).toBe('€9.99');
    });
});
