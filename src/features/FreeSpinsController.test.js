import {describe, it, expect, vi} from 'vitest';
import {FreeSpinsController} from '@/features/FreeSpinsController.js';

const win = (sectorIndex, winCents = 100) => ({
    sectorIndex,
    type: 'win',
    winCents,
    awardedAdditionalSpins: 0,
});

const lose = (sectorIndex) => ({
    sectorIndex,
    type: 'lose',
    winCents: 0,
    awardedAdditionalSpins: 0,
});

const freeSpin = (sectorIndex, awardedAdditionalSpins = 0) => ({
    sectorIndex,
    type: 'free_spins',
    winCents: 0,
    awardedAdditionalSpins,
});

const bonus = (sectorIndex, winCents = 400) => ({
    sectorIndex,
    type: 'bonus',
    winCents,
    awardedAdditionalSpins: 0,
    bonus: {
        sequence: ['star', 'star', 'star'],
        finalWinCents: winCents,
    },
});

function batch(results, totalWinCents = results.reduce((sum, r) => sum + r.winCents, 0)) {
    return {retriggered: false, totalWinCents, results};
}

function createController(hooks = {}, spinTo = vi.fn(async () => {})) {
    const wheel = {spinTo};
    return {wheel, controller: new FreeSpinsController(wheel, hooks)};
}

const THREE_SPINS = batch([win(1, 100), lose(2), win(3, 200)]);
const WITH_BONUS = batch([win(1, 100), bonus(11, 400), win(2, 100)]);
const RETRIGGERED = batch([
    lose(0),
    freeSpin(7, 3),
    lose(1),
    lose(8),
    lose(14),
    lose(12),
], 0);

describe('FreeSpinsController', () => {
    it('plays every result and returns totalWinCents', async () => {
        const {wheel, controller} = createController();

        await expect(controller.play(THREE_SPINS)).resolves.toBe(300);
        expect(wheel.spinTo.mock.calls.map(([i]) => i)).toEqual([1, 2, 3]);
    });

    it('does not invent spins when awardedAdditionalSpins is set', async () => {
        const {wheel, controller} = createController();

        await controller.play(batch([
            freeSpin(7, 3),
            win(1),
            win(2),
            win(3),
            win(4),
            win(5),
        ]));

        expect(wheel.spinTo).toHaveBeenCalledTimes(6);
    });

    it('pauses for bonus then continues', async () => {
        const order = [];
        const {controller} = createController(
            {
                onBonus: vi.fn(async () => order.push('bonus')),
                onEnterBonus: () => order.push('enter'),
                onExitBonus: () => order.push('exit'),
            },
            vi.fn(async (i) => order.push(`spin:${i}`)),
        );

        await controller.play(WITH_BONUS);

        expect(order).toEqual([
            'spin:1',
            'spin:11',
            'enter',
            'bonus',
            'exit',
            'spin:2',
        ]);
    });

    it('reports remaining spins before each play', async () => {
        const remaining = [];
        const {controller} = createController({
            onRemaining: (n) => remaining.push(n),
        });

        await controller.play(batch([win(1), win(2), win(3)]));

        expect(remaining).toEqual([3, 2, 1, 0]);
    });

    it('starts at 3 and increases only after a retrigger spin', async () => {
        const remaining = [];
        const {wheel, controller} = createController({
            onRemaining: (n) => remaining.push(n),
        });

        await controller.play(RETRIGGERED);

        expect(wheel.spinTo).toHaveBeenCalledTimes(6);
        expect(remaining).toEqual([3, 2, 4, 3, 2, 1, 0]);
    });

    it('reports accumulating win after each spin', async () => {
        const totals = [];
        const {controller} = createController({
            onAccumulatedWin: (n) => totals.push(n),
        });

        await controller.play(THREE_SPINS);

        expect(totals).toEqual([100, 100, 300]);
    });

    it('rejects incomplete free spins batches', async () => {
        const {wheel, controller} = createController();

        await expect(controller.play(batch([win(5)])))
            .rejects.toThrow('FreeSpins count mismatch');

        expect(wheel.spinTo).not.toHaveBeenCalled();
    });

    it('rejects inconsistent total winnings', async () => {
        const {wheel, controller} = createController();
        const payload = batch([win(5, 100), lose(1), win(9, 200)]);
        payload.totalWinCents = 500;

        await expect(controller.play(payload))
            .rejects.toThrow('FreeSpins total win mismatch');

        expect(wheel.spinTo).not.toHaveBeenCalled();
    });

    it('rejects bonus without configured presentation', async () => {
        const {wheel, controller} = createController();

        await expect(controller.play(batch([
            win(5, 0),
            bonus(11, 400),
            lose(1),
        ]))).rejects.toThrow('Bonus presentation is not configured');

        expect(wheel.spinTo).not.toHaveBeenCalled();
    });
});
