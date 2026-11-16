import {describe, it, expect, vi} from 'vitest';
import {GameController} from '@/game/GameController.js';
import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';
import {GameConfig} from '@/config/GameConfig.js';

class MockGameController extends GameController {
    getSectorIndex() {
        return 5;
    }

    getWinCents(_sectorIndex) {
        return 0;
    }
}

function createWheelScene(spinToImpl = async () => {}) {
    return {
        spinTo: vi.fn(spinToImpl),
        showWin: vi.fn(async () => {}),
        setBalance: vi.fn(),
        setBet: vi.fn(),
        setBetEnabled: vi.fn(),
    };
}

function createController(spinToImpl = async () => {}, options = {}) {
    const wheelScene = createWheelScene(spinToImpl);
    const stateMachine = new GameStateMachine();
    const controller = new MockGameController(wheelScene, stateMachine);

    if (options.boot !== false) {
        controller.boot();
    }

    return {controller, wheelScene, stateMachine};
}

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {promise, resolve, reject};
}

describe('GameController', () => {
    it('ignores Start before boot', () => {
        const {controller, wheelScene} = createController(async () => {}, {boot: false});

        controller.onSpinPressed();

        expect(wheelScene.spinTo).not.toHaveBeenCalled();
    });

    it('boot transitions to IDLE and syncs wallet UI', () => {
        const {controller, wheelScene, stateMachine} = createController();

        expect(stateMachine.state).toBe(GameState.IDLE);
        expect(stateMachine.isIdle).toBe(true);
        expect(controller.balanceCents).toBe(GameConfig.initialBalanceCents);
        expect(controller.betCents).toBe(GameConfig.defaultBetCents);
        expect(wheelScene.setBalance).toHaveBeenCalledWith(GameConfig.initialBalanceCents);
        expect(wheelScene.setBet).toHaveBeenCalledWith(GameConfig.defaultBetCents);
        expect(wheelScene.setBetEnabled).toHaveBeenCalledWith(true);
    });

    it('Start from IDLE runs exactly one spin', async () => {
        const {controller, wheelScene, stateMachine} = createController();

        controller.onSpinPressed();

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
        expect(wheelScene.spinTo).toHaveBeenCalledWith(5);

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('ignores repeated Start while spinning', async () => {
        const deferred = createDeferred();
        const {controller, wheelScene, stateMachine} = createController(() => deferred.promise);

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
        const {controller, stateMachine} = createController(() => deferred.promise);
        const transitionSpy = vi.spyOn(stateMachine, 'transition');

        controller.onSpinPressed();
        expect(stateMachine.state).toBe(GameState.SPINNING);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(transitionSpy.mock.calls.map(([state]) => state)).toEqual([
            GameState.SPINNING,
            GameState.SHOWING_WIN,
            GameState.IDLE,
        ]);
    });

    it('stays in SHOWING_WIN until showWin resolves', async () => {
        const spinDeferred = createDeferred();
        const winDeferred = createDeferred();
        const {controller, wheelScene, stateMachine} = createController(
            () => spinDeferred.promise,
        );
        wheelScene.showWin.mockImplementation(() => winDeferred.promise);

        controller.onSpinPressed();
        spinDeferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.SHOWING_WIN);
        });

        expect(wheelScene.showWin).toHaveBeenCalledWith(0);
        expect(stateMachine.state).toBe(GameState.SHOWING_WIN);

        winDeferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('enters ERROR when animation fails', async () => {
        const {controller, stateMachine} = createController(async () => {
            throw new Error('spin failed');
        });

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(errorSpy).toHaveBeenCalledWith('Spin failed:', expect.any(Error));
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('ignores Start while in ERROR', () => {
        const {controller, wheelScene, stateMachine} = createController();

        stateMachine.transition(GameState.ERROR);
        controller.onSpinPressed();

        expect(wheelScene.spinTo).not.toHaveBeenCalled();
        expect(stateMachine.state).toBe(GameState.ERROR);
    });

    it('allows another spin after the previous one completes', async () => {
        const {controller, wheelScene, stateMachine} = createController();

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

    it('debits bet locally when spin starts', async () => {
        const deferred = createDeferred();
        const {controller, wheelScene} = createController(() => deferred.promise);
        const before = controller.balanceCents;
        const bet = controller.betCents;

        controller.onSpinPressed();

        expect(controller.balanceCents).toBe(before - bet);
        expect(wheelScene.setBalance).toHaveBeenCalledWith(before - bet);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(controller.stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('blocks Start when balance is below bet', () => {
        const {controller, wheelScene} = createController();

        controller.balanceCents = 50;
        controller.betCents = 100;
        controller.onSpinPressed();

        expect(wheelScene.spinTo).not.toHaveBeenCalled();
        expect(controller.stateMachine.state).toBe(GameState.IDLE);
    });

    it('accepts a quick bet while IDLE', () => {
        const {controller, wheelScene} = createController();

        controller.onBetSelected(500);

        expect(controller.betCents).toBe(500);
        expect(wheelScene.setBet).toHaveBeenCalledWith(500);
    });

    it('ignores bet changes while spinning', async () => {
        const deferred = createDeferred();
        const {controller} = createController(() => deferred.promise);

        controller.onBetSelected(100);
        expect(controller.betCents).toBe(100);

        controller.onSpinPressed();
        controller.onBetSelected(500);

        expect(controller.betCents).toBe(100);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(controller.stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('ignores selectBet for amounts not in allowedBetsCents', () => {
        const {controller} = createController();
        const before = controller.betCents;

        controller.onBetSelected(123);

        expect(controller.betCents).toBe(before);
    });

    it('locks bet UI while spinning and unlocks after win', async () => {
        const spinDeferred = createDeferred();
        const {controller, wheelScene, stateMachine} = createController(
            () => spinDeferred.promise,
        );
        wheelScene.setBetEnabled.mockClear();

        controller.onSpinPressed();

        expect(wheelScene.setBetEnabled).toHaveBeenCalledWith(false);

        spinDeferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.setBetEnabled).toHaveBeenLastCalledWith(true);
    });

    it('keeps bet locked when entering ERROR', async () => {
        const {controller, wheelScene, stateMachine} = createController(async () => {
            throw new Error('spin failed');
        });

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            wheelScene.setBetEnabled.mockClear();
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(wheelScene.setBetEnabled).toHaveBeenCalledWith(false);
            expect(wheelScene.setBetEnabled).not.toHaveBeenCalledWith(true);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('credits winCents after spin and passes it to showWin', async () => {
        class WinningController extends MockGameController {
            getWinCents() {
                return 250;
            }
        }

        const wheelScene = createWheelScene();
        const stateMachine = new GameStateMachine();
        const controller = new WinningController(wheelScene, stateMachine);
        controller.boot();

        const before = controller.balanceCents;
        const bet = controller.betCents;

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(controller.balanceCents).toBe(before - bet + 250);
        expect(wheelScene.showWin).toHaveBeenCalledWith(250);
        expect(wheelScene.setBalance).toHaveBeenCalledWith(before - bet + 250);
    });

    it('calls showWin with 0 when there is no win', async () => {
        const {controller, wheelScene, stateMachine} = createController();

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.showWin).toHaveBeenCalledWith(0);
    });


    it('restores demo bet when wheel animation fails', async () => {
        const {controller, stateMachine} = createController(
            async () => {
                throw new Error('Animation failed');
            }
        );

        const before = controller.balanceCents;

        const errorSpy = vi.spyOn(console, 'error')
            .mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(controller.balanceCents).toBe(before);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('keeps settled win if win presentation fails', async () => {
        class WinningController extends MockGameController {
            getWinCents() {
                return 250;
            }
        }

        const wheelScene = createWheelScene();
        const stateMachine = new GameStateMachine();

        const controller = new WinningController(
            wheelScene,
            stateMachine
        );

        controller.boot();

        const before = controller.balanceCents;
        const bet = controller.betCents;

        wheelScene.showWin.mockRejectedValue(
            new Error('Presentation failed')
        );

        const errorSpy = vi.spyOn(console, 'error')
            .mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(controller.balanceCents).toBe(
                before - bet + 250
            );

            expect(wheelScene.showWin).toHaveBeenCalledWith(250);
            expect(wheelScene.setBetEnabled)
                .toHaveBeenLastCalledWith(false);
        } finally {
            errorSpy.mockRestore();
        }
    });
});

