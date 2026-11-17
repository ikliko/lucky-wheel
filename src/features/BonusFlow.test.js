import {describe, it, expect, vi} from 'vitest';
import {BonusFlow} from '@/features/BonusFlow.js';

describe('BonusFlow', () => {
    it('shows the bonus board, plays, then returns to the wheel', async () => {
        const order = [];
        const bonusScene = {name: 'bonus'};
        const wheelScene = {name: 'wheel'};
        const sceneManager = {
            show: vi.fn((scene) => {
                order.push(scene.name);
            }),
        };
        const bonusController = {
            play: vi.fn(async (bonus) => {
                order.push(`play:${bonus.finalWinCents}`);
                return bonus.finalWinCents;
            }),
        };
        const flow = new BonusFlow(
            sceneManager,
            bonusScene,
            wheelScene,
            bonusController,
        );
        const bonus = {finalWinCents: 400};

        await expect(flow.play(bonus)).resolves.toBe(400);
        expect(order).toEqual(['bonus', 'play:400', 'wheel']);
    });

    it('returns to the wheel when play fails', async () => {
        const bonusScene = {name: 'bonus'};
        const wheelScene = {name: 'wheel'};
        const sceneManager = {show: vi.fn()};
        const bonusController = {
            play: vi.fn(async () => {
                throw new Error('pick failed');
            }),
        };
        const flow = new BonusFlow(
            sceneManager,
            bonusScene,
            wheelScene,
            bonusController,
        );

        await expect(flow.play({})).rejects.toThrow('pick failed');
        expect(sceneManager.show).toHaveBeenCalledWith(bonusScene);
        expect(sceneManager.show).toHaveBeenCalledWith(wheelScene);
    });
});
