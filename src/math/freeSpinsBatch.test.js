import {describe, expect, it} from 'vitest';
import {GameConfig} from '@/config/GameConfig.js';
import {freeSpinsBatch} from '@/math/freeSpinsBatch.js';

function scripted(values) {
    let index = 0;
    return () => values[index++];
}

describe('freeSpinsBatch', () => {
    it('awards three spins and never a free-spins sector', () => {
        const batch = freeSpinsBatch(100, scripted([0, 10 / 17, 0, 0, 0, 0]));

        expect(batch.retriggered).toBe(false);
        expect(batch.results).toHaveLength(GameConfig.freeSpinsAward);
        expect(batch.results.map(entry => entry.type)).toEqual(['lose', 'bonus', 'lose']);
        expect(batch.results.every(entry => entry.type !== 'free_spins')).toBe(true);
        expect(batch.results.every(entry => entry.awardedAdditionalSpins === 0)).toBe(true);
        expect(batch.results[1].sectorIndex).toBe(11);
        expect(batch.results[1].bonus.sequence).toEqual(['star', 'star', 'star']);
        expect(batch.totalWinCents).toBe(400);
        expect(batch.results.reduce((sum, entry) => sum + entry.winCents, 0)).toBe(400);
    });
});
