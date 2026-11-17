import {describe, it, expect, vi} from 'vitest';
import {SceneManager} from '@/core/SceneManager.js';

function createScene(name) {
    return {
        name,
        parent: null,
        create: vi.fn(),
        onEnter: vi.fn(),
        onExit: vi.fn(),
        layoutScreen: vi.fn(),
    };
}

describe('SceneManager', () => {
    it('swaps scenes and lays out the active one', () => {
        const stage = {addChild: vi.fn((scene) => {
            scene.parent = stage;
        })};
        const wheel = createScene('wheel');
        const bonus = createScene('bonus');
        const manager = new SceneManager(stage);

        manager.layoutScreen(800, 600);
        manager.show(wheel);

        expect(stage.addChild).toHaveBeenCalledWith(wheel);
        expect(wheel.create).toHaveBeenCalled();
        expect(wheel.onEnter).toHaveBeenCalled();
        expect(wheel.layoutScreen).toHaveBeenCalledWith(800, 600);

        manager.show(bonus);

        expect(wheel.onExit).toHaveBeenCalled();
        expect(bonus.onEnter).toHaveBeenCalled();
        expect(bonus.layoutScreen).toHaveBeenCalledWith(800, 600);
        expect(manager.current).toBe(bonus);

        manager.show(wheel);

        expect(bonus.onExit).toHaveBeenCalled();
        expect(wheel.onEnter).toHaveBeenCalledTimes(2);
        expect(manager.current).toBe(wheel);
    });
});
