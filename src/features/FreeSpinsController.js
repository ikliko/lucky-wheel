import {GameConfig} from '@/config/GameConfig.js';

export class FreeSpinsController {
    constructor(wheel, hooks = {}) {
        this.wheel = wheel;
        this.onBonus = hooks.onBonus ?? null;
        this.onEnterBonus = hooks.onEnterBonus ?? (() => {});
        this.onExitBonus = hooks.onExitBonus ?? (() => {});
        this.onRemaining = hooks.onRemaining ?? (() => {});
        this.onAccumulatedWin = hooks.onAccumulatedWin ?? (() => {});
        this.initialAward = GameConfig.freeSpinsAward;
    }

    async play(freeSpins) {
        const results = freeSpins?.results;

        if (!Array.isArray(results) || results.length === 0) {
            throw new Error('FreeSpins batch missing results');
        }

        if (
            !Number.isSafeInteger(freeSpins.totalWinCents) ||
            freeSpins.totalWinCents < 0
        ) {
            throw new Error('Invalid FreeSpins totalWinCents');
        }

        let expectedSpins = this.initialAward;

        for (const entry of results) {
            if (
                !Number.isInteger(entry?.sectorIndex) ||
                entry.sectorIndex < 0 ||
                !Number.isSafeInteger(entry.winCents) ||
                entry.winCents < 0 ||
                !Number.isSafeInteger(entry.awardedAdditionalSpins ?? 0) ||
                (entry.awardedAdditionalSpins ?? 0) < 0
            ) {
                throw new Error('Invalid FreeSpins result');
            }

            if (entry.type === 'bonus' && !this.onBonus) {
                throw new Error('Bonus presentation is not configured');
            }

            expectedSpins += entry.awardedAdditionalSpins ?? 0;
        }

        if (results.length !== expectedSpins) {
            throw new Error(
                `FreeSpins count mismatch: expected ${expectedSpins}, received ${results.length}`
            );
        }

        const calculatedTotal = results.reduce(
            (total, entry) => total + entry.winCents,
            0
        );

        if (calculatedTotal !== freeSpins.totalWinCents) {
            throw new Error('FreeSpins total win mismatch');
        }

        let remaining = this.initialAward;
        let accumulatedWinCents = 0;

        this.onAccumulatedWin(0);

        for (const entry of results) {
            this.onRemaining(remaining);

            await this.wheel.spinTo(entry.sectorIndex);

            remaining -= 1;
            remaining += entry.awardedAdditionalSpins ?? 0;

            if (entry.type === 'bonus') {
                this.onEnterBonus();

                try {
                    await this.onBonus(entry);
                } finally {
                    this.onExitBonus();
                }
            }

            accumulatedWinCents += entry.winCents;
            this.onAccumulatedWin(accumulatedWinCents);
        }

        this.onRemaining(0);

        return freeSpins.totalWinCents;
    }
}
