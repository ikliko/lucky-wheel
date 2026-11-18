import {GameConfig} from '@/config/GameConfig.js';
import {pickSector} from '@/math/pickSector.js';
import {bonusSequence} from '@/math/bonusSequence.js';

export function freeSpinsBatch(betCents, random = Math.random) {
    const pool = GameConfig.sectors.filter(sector => sector.type !== 'free_spins');
    const results = [];
    let totalWinCents = 0;

    for (let step = 0; step < GameConfig.freeSpinsAward; step++) {
        const {sector} = pickSector(pool, random);
        const sectorIndex = GameConfig.sectors.indexOf(sector);
        let winCents = 0;
        let bonus = null;

        if (sector.type === 'win') {
            winCents = Math.round(betCents * sector.multiplier);
        } else if (sector.type === 'bonus') {
            bonus = bonusSequence(betCents, random);
            winCents = bonus.finalWinCents;
        }

        const entry = {
            sectorId: sector.id,
            sectorIndex,
            type: sector.type,
            awardedAdditionalSpins: 0,
            winCents,
        };

        if (bonus) {
            entry.bonus = bonus;
        }

        results.push(entry);
        totalWinCents += winCents;
    }

    return {
        results,
        totalWinCents,
        retriggered: false,
    };
}
