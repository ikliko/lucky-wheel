import {describe, it, expect, vi} from 'vitest';
import {BonusController} from '@/features/BonusController.js';

const bonus = {
    sequence: ['star', 'circle', 'star', 'diamond', 'star'],
    winningCollection: 'star',
    finalWinCents: 1000,
};

function createBoard(picks) {
    let index = 0;

    return {
        reset: vi.fn(),
        waitForPick: vi.fn(async () => picks[index++]),
        reveal: vi.fn(),
        setCollectionCount: vi.fn(),
        showResult: vi.fn(),
        holdResult: vi.fn(async () => {}),
    };
}

describe('BonusController', () => {
    it('plays the server sequence through the board like FreeSpins plays the wheel', async () => {
        const board = createBoard([8, 8, 0, 3, 1, 5]);
        const controller = new BonusController(board);

        await expect(controller.play(bonus)).resolves.toBe(1000);

        expect(board.reset).toHaveBeenCalledOnce();
        expect(board.reveal.mock.calls).toEqual([
            [8, 'star'],
            [0, 'circle'],
            [3, 'star'],
            [1, 'diamond'],
            [5, 'star'],
        ]);
        expect(board.setCollectionCount.mock.calls).toEqual([
            ['star', 1],
            ['circle', 1],
            ['star', 2],
            ['diamond', 1],
            ['star', 3],
        ]);
        expect(board.showResult).toHaveBeenCalledWith('star', 1000);
        expect(board.holdResult).toHaveBeenCalledOnce();
        expect(board.waitForPick).toHaveBeenCalledTimes(6);
    });

    it('ignores cells outside the board without advancing the sequence', async () => {
        const board = createBoard([-1, 9, 0, 1, 2]);
        const controller = new BonusController(board);

        await controller.play({
            sequence: ['star', 'star', 'star'],
            winningCollection: 'star',
            finalWinCents: 400,
        });

        expect(board.reveal.mock.calls).toEqual([
            [0, 'star'],
            [1, 'star'],
            [2, 'star'],
        ]);
    });

    it('rejects a sequence that does not stop on the first three of a kind', async () => {
        const board = createBoard([]);
        const controller = new BonusController(board);

        await expect(controller.play({
            sequence: ['star', 'star', 'star', 'circle'],
            winningCollection: 'star',
            finalWinCents: 100,
        })).rejects.toThrow('first collection of three');

        expect(board.reset).not.toHaveBeenCalled();
    });

    it('rejects a winning collection that is not the sequence winner', async () => {
        const board = createBoard([]);
        const controller = new BonusController(board);

        await expect(controller.play({
            sequence: ['diamond', 'diamond', 'diamond'],
            winningCollection: 'star',
            finalWinCents: 100,
        })).rejects.toThrow('does not match the sequence');
    });

    it('rejects an unknown symbol or a bad prize', async () => {
        const board = createBoard([]);
        const controller = new BonusController(board);

        await expect(controller.play({
            sequence: ['star', 'star', 'nope'],
            winningCollection: 'star',
            finalWinCents: 100,
        })).rejects.toThrow('Invalid bonus sequence');

        await expect(controller.play({
            sequence: ['star', 'star', 'star'],
            winningCollection: 'star',
            finalWinCents: 1.5,
        })).rejects.toThrow('Invalid bonus finalWinCents');
    });
});
