import {describe, it, expect, vi} from 'vitest';
import {BetSelector} from '@/components/ui/BetSelector/BetSelector.js';
import {GameConfig} from '@/config/GameConfig.js';

function createSelector(onSelect = vi.fn(), allowed = GameConfig.allowedBetsCents) {
    return {
        onSelect,
        selector: new BetSelector(GameConfig.quickBetsCents, onSelect, allowed),
    };
}

describe('BetSelector', () => {
    it('starts with the first quick bet selected by default', () => {
        const {selector} = createSelector();
        expect(selector.selectedBetCents).toBe(GameConfig.quickBetsCents[0]);
    });

    it('selectBet notifies onSelect with the bet amount', () => {
        const {selector, onSelect} = createSelector();

        selector.selectBet(200);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(200);
        expect(selector.selectedBetCents).toBe(200);
    });

    it('setSelected updates selection without calling onSelect', () => {
        const {selector, onSelect} = createSelector();

        selector.setSelected(500);

        expect(selector.selectedBetCents).toBe(500);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores selectBet for amounts not in allowedBetsCents', () => {
        const {selector, onSelect} = createSelector();
        const before = selector.selectedBetCents;

        selector.selectBet(123);

        expect(selector.selectedBetCents).toBe(before);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('setEnabled(false) blocks selectBet notifications', () => {
        const {selector, onSelect} = createSelector();

        selector.setEnabled(false);
        selector.selectBet(200);

        expect(onSelect).not.toHaveBeenCalled();
        expect(selector.selectedBetCents).not.toBe(200);
    });

    it('setEnabled(true) allows selectBet again', () => {
        const {selector, onSelect} = createSelector();

        selector.setEnabled(false);
        selector.setEnabled(true);
        selector.selectBet(1000);

        expect(onSelect).toHaveBeenCalledWith(1000);
        expect(selector.selectedBetCents).toBe(1000);
    });

    it('accepts non-quick allowed bet amounts', () => {
        const {selector, onSelect} = createSelector();

        selector.selectBet(150);

        expect(selector.selectedBetCents).toBe(150);
        expect(onSelect).toHaveBeenCalledWith(150);
    });
});
