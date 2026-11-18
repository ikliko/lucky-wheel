import {GameConfig} from '@/config/GameConfig.js';

export function bonusSequence(betCents, random = Math.random) {
    const symbols = GameConfig.bonusSymbols;
    const counts = {};
    const sequence = [];
    let winner = null;

    while (winner === null) {
        const symbol = symbols[Math.floor(random() * symbols.length)];
        sequence.push(symbol.id);
        counts[symbol.id] = (counts[symbol.id] ?? 0) + 1;

        if (counts[symbol.id] === GameConfig.bonusWinCount) {
            winner = symbol;
        }

        if (sequence.length > GameConfig.bonusMaxPicks) {
            throw new Error('BONUS sequence exceeded maximum length');
        }
    }

    const baseWinCents = betCents * GameConfig.bonusBaseMultiplier;

    return {
        sequence,
        winningCollection: winner.id,
        baseWinCents,
        multiplier: winner.multiplier,
        finalWinCents: baseWinCents * winner.multiplier,
    };
}
