import {describe, it, expect, vi} from 'vitest';
import {BetSelector} from '@/components/ui/BetSelector/BetSelector.js';
import {GameConfig} from '@/config/GameConfig.js';

describe('BetSelector', () => {
    it('starts with the first quick bet selected by default', () => {
        const selector = new BetSelector(GameConfig.quickBetsCents, vi.fn());

        expect(selector.selectedBetCents).toBe(GameConfig.quickBetsCents[0]);
    });

    it('selectBet notifies onSelect with the bet amount', () => {
        const onSelect = vi.fn();
        const selector = new BetSelector(GameConfig.quickBetsCents, onSelect);

        selector.selectBet(200);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(200);
        expect(selector.selectedBetCents).toBe(200);
    });

    it('setSelected updates selection without calling onSelect', () => {
        const onSelect = vi.fn();
        const selector = new BetSelector(GameConfig.quickBetsCents, onSelect);

        selector.setSelected(500);

        expect(selector.selectedBetCents).toBe(500);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores selectBet for amounts not in allowedBetsCents', () => {
        const onSelect = vi.fn();
        const selector = new BetSelector(GameConfig.quickBetsCents, onSelect);
        const before = selector.selectedBetCents;

        selector.selectBet(123);

        expect(selector.selectedBetCents).toBe(before);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('setEnabled(false) blocks selectBet notifications', () => {
        const onSelect = vi.fn();
        const selector = new BetSelector(GameConfig.quickBetsCents, onSelect);

        selector.setEnabled(false);
        selector.selectBet(200);

        expect(onSelect).not.toHaveBeenCalled();
        expect(selector.selectedBetCents).not.toBe(200);
    });

    it('setEnabled(true) allows selectBet again', () => {
        const onSelect = vi.fn();
        const selector = new BetSelector(GameConfig.quickBetsCents, onSelect);

        selector.setEnabled(false);
        selector.setEnabled(true);
        selector.selectBet(1000);

        expect(onSelect).toHaveBeenCalledWith(1000);
        expect(selector.selectedBetCents).toBe(1000);
    });

    it('accepts non-quick allowed bet amounts', () => {
        const onSelect = vi.fn();

        const selector = new BetSelector(
            GameConfig.quickBetsCents,
            onSelect,
            GameConfig.allowedBetsCents
        );

        selector.selectBet(150);

        expect(selector.selectedBetCents).toBe(150);
        expect(onSelect).toHaveBeenCalledWith(150);
    });
});
