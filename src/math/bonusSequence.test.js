import {describe, expect, it} from 'vitest';
import {GameConfig} from '@/config/GameConfig.js';
import {bonusSequence} from '@/math/bonusSequence.js';

function scripted(values) {
    let index = 0;
    return () => values[index++];
}

describe('bonusSequence', () => {
    it('ends on the first collection of three', () => {
        const bonus = bonusSequence(100, scripted([0, 0.5, 0.9, 0, 0.5, 0.9, 0]));

        expect(bonus.sequence).toEqual([
            'star', 'circle', 'diamond',
            'star', 'circle', 'diamond',
            'star',
        ]);
        expect(bonus.winningCollection).toBe('star');
        expect(bonus.sequence.at(-1)).toBe('star');
        expect(bonus.baseWinCents).toBe(200);
        expect(bonus.multiplier).toBe(2);
        expect(bonus.finalWinCents).toBe(400);
        expect(bonus.sequence.length).toBeLessThanOrEqual(GameConfig.bonusMaxPicks);
    });
});
