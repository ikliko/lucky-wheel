
import { describe, it, expect, vi } from 'vitest';
import { GameController } from '@/game/GameController.js';
import {
    GameState,
    GameStateMachine,
} from '@/game/GameStateMachine.js';

class MockGameController extends GameController {
    getSectorIndex() {
        return 5;
    }
}

function createController(spinToImpl = async () => {}) {
    const wheelScene = {
        spinTo: vi.fn(spinToImpl),
    };

    const stateMachine = new GameStateMachine();

    const controller = new MockGameController(
        wheelScene,
        stateMachine
    );

    controller.boot();

    return { controller, wheelScene, stateMachine };
}

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

describe('GameController', () => {
    it('ignores Start before boot', () => {
        const wheelScene = {
            spinTo: vi.fn(),
        };

        const controller = new MockGameController(wheelScene);

        controller.onSpinPressed();

        expect(wheelScene.spinTo).not.toHaveBeenCalled();
    });

    it('boot transitions to IDLE', () => {
        const { stateMachine } = createController();

        expect(stateMachine.state).toBe(GameState.IDLE);
        expect(stateMachine.isIdle).toBe(true);
    });

    it('Start from IDLE runs exactly one spin', async () => {
        const { controller, wheelScene, stateMachine } =
            createController();

        controller.onSpinPressed();

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
        expect(wheelScene.spinTo).toHaveBeenCalledWith(5);

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('ignores repeated Start while spinning', async () => {
        const deferred = createDeferred();

        const { controller, wheelScene, stateMachine } =
            createController(() => deferred.promise);

        controller.onSpinPressed();
        controller.onSpinPressed();

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
        expect(stateMachine.state).toBe(GameState.SPINNING);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
    });

    it('transitions SPINNING → SHOWING_WIN → IDLE', async () => {
        const deferred = createDeferred();

        const { controller, stateMachine } =
            createController(() => deferred.promise);

        const transitionSpy = vi.spyOn(
            stateMachine,
            'transition'
        );

        controller.onSpinPressed();

        expect(stateMachine.state).toBe(GameState.SPINNING);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(
            transitionSpy.mock.calls.map(([state]) => state)
        ).toEqual([
            GameState.SPINNING,
            GameState.SHOWING_WIN,
            GameState.IDLE,
        ]);
    });

    it('enters ERROR when animation fails', async () => {
        const { controller, stateMachine } =
            createController(async () => {
                throw new Error('spin failed');
            });

        const errorSpy = vi.spyOn(console, 'error')
            .mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(errorSpy).toHaveBeenCalledWith(
                'Spin failed:',
                expect.any(Error)
            );
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('ignores Start while in ERROR', () => {
        const { controller, wheelScene, stateMachine } =
            createController();

        stateMachine.transition(GameState.ERROR);

        controller.onSpinPressed();

        expect(wheelScene.spinTo).not.toHaveBeenCalled();
        expect(stateMachine.state).toBe(GameState.ERROR);
    });

    it('allows another spin after the previous one completes', async () => {
        const { controller, wheelScene, stateMachine } =
            createController();

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        controller.onSpinPressed();

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(2);

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });
    });
});
