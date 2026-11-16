import {describe, it, expect} from 'vitest';
import {BalanceDisplay} from '@/components/ui/BalanceDisplay/BalanceDisplay.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

describe('BalanceDisplay', () => {
    it('exposes setCents', () => {
        const display = new BalanceDisplay();
        expect(typeof display.setCents).toBe('function');
    });

    it('setCents formats balance with MoneyFormatter', () => {
        const display = new BalanceDisplay();

        display.setCents(100000);

        expect(display.text).toBe(MoneyFormatter.formatCents(100000));
    });

    it('setCents updates when balance changes', () => {
        const display = new BalanceDisplay();

        display.setCents(100);
        expect(display.text).toBe('€1.00');

        display.setCents(50);
        expect(display.text).toBe('€0.50');
    });

    it('setCents(0) shows zero euros', () => {
        const display = new BalanceDisplay();
        display.setCents(0);
        expect(display.text).toBe('€0.00');
    });
});
