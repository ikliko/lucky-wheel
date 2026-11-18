import {describe, expect, it} from 'vitest';
import {GameConfig} from '@/config/GameConfig.js';
import {pickSector} from '@/math/pickSector.js';

describe('pickSector', () => {
    it('returns the sector at the drawn index', () => {
        const first = pickSector(GameConfig.sectors, () => 0);
        const last = pickSector(GameConfig.sectors, () => 0.999);

        expect(first).toMatchObject({
            sectorIndex: 0,
            sector: {id: 'sector_0', type: 'lose'},
        });
        expect(last.sectorIndex).toBe(17);
        expect(last.sector.id).toBe('sector_17');
    });
});
