import {GameConfig} from '@/config/GameConfig.js';

const SYMBOL_IDS = new Set(GameConfig.bonusSymbols.map(symbol => symbol.id));

export class BonusController {
    constructor(board) {
        this.board = board;
    }

    async play(bonus) {
        const sequence = bonus?.sequence;

        if (
            !Array.isArray(sequence) ||
            sequence.length < GameConfig.bonusWinCount ||
            sequence.length > GameConfig.bonusMaxPicks ||
            sequence.some(id => !SYMBOL_IDS.has(id))
        ) {
            throw new Error('Invalid bonus sequence');
        }

        if (!SYMBOL_IDS.has(bonus.winningCollection)) {
            throw new Error('Invalid bonus winning collection');
        }

        if (!Number.isSafeInteger(bonus.finalWinCents) || bonus.finalWinCents < 0) {
            throw new Error('Invalid bonus finalWinCents');
        }

        const counts = {};

        for (let index = 0; index < sequence.length; index++) {
            const id = sequence[index];
            counts[id] = (counts[id] ?? 0) + 1;

            const reachedWin = counts[id] === GameConfig.bonusWinCount;
            const isLast = index === sequence.length - 1;

            if (reachedWin !== isLast) {
                throw new Error('Bonus sequence does not end on the first collection of three');
            }
        }

        if (sequence[sequence.length - 1] !== bonus.winningCollection) {
            throw new Error('Bonus winning collection does not match the sequence');
        }

        this.sequence = sequence;
        this.winningCollection = bonus.winningCollection;
        this.finalWinCents = bonus.finalWinCents;
        this.cursor = 0;
        this.opened = new Set();
        this.counts = {};

        this.board.reset();

        while (this.cursor < this.sequence.length) {
            const cellIndex = await this.board.waitForPick();
            const result = this.#pick(cellIndex);

            if (!result) {
                continue;
            }

            this.board.reveal(result.cellIndex, result.symbol);
            this.board.setCollectionCount(result.symbol, result.count);

            if (!result.finished) {
                continue;
            }

            this.board.showResult(result.winningCollection, result.finalWinCents);
            await this.board.holdResult();

            return result.finalWinCents;
        }

        throw new Error('Bonus round ended without a winner');
    }

    #pick(cellIndex) {
        if (this.cursor >= this.sequence.length) {
            return null;
        }

        if (
            !Number.isInteger(cellIndex) ||
            cellIndex < 0 ||
            cellIndex >= GameConfig.bonusCellCount ||
            this.opened.has(cellIndex)
        ) {
            return null;
        }

        const symbol = this.sequence[this.cursor];
        this.cursor += 1;
        this.opened.add(cellIndex);
        this.counts[symbol] = (this.counts[symbol] ?? 0) + 1;

        const finished = this.cursor >= this.sequence.length;

        return {
            cellIndex,
            symbol,
            count: this.counts[symbol],
            finished,
            winningCollection: finished ? this.winningCollection : null,
            finalWinCents: finished ? this.finalWinCents : null,
        };
    }
}
