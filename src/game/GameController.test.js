import {describe, it, expect, vi} from 'vitest';
import {GameController} from '@/game/GameController.js';
import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';
import {GameConfig} from '@/config/GameConfig.js';

const roundFixture = {
    roundId: 'r1',
    sessionId: 'session-1',
    betCents: 100,
    balanceBeforeCents: 100000,
    balanceAfterBetCents: 99900,
    balanceAfterRoundCents: 100000,
    winCents: 100,
    result: {
        sectorId: 'sector_5',
        sectorIndex: 5,
        type: 'win',
    },
    plan: {
        planNumber: 1,
        spinNumber: 1,
        spinsRemaining: 9,
    },
};

const freeSpinsResults = [
    {sectorId: 'sector_5', sectorIndex: 5, type: 'win', awardedAdditionalSpins: 0, winCents: 100},
    {sectorId: 'sector_1', sectorIndex: 1, type: 'lose', awardedAdditionalSpins: 0, winCents: 0},
    {sectorId: 'sector_13', sectorIndex: 13, type: 'win', awardedAdditionalSpins: 0, winCents: 600},
];

const freeSpinsRoundFixture = {
    ...roundFixture,
    roundId: 'r-fs',
    balanceAfterRoundCents: 100600,
    winCents: 700,
    result: {
        sectorId: 'sector_7',
        sectorIndex: 7,
        type: 'free_spins',
        winCents: 700,
        freeSpins: {
            retriggered: false,
            totalWinCents: 700,
            results: freeSpinsResults,
        },
    },
};

function createWheelScene(spinToImpl = async () => {}) {
    return {
        spinTo: vi.fn(spinToImpl),
        showWin: vi.fn(async () => {}),
        setBalance: vi.fn(),
        setBet: vi.fn(),
        setBetEnabled: vi.fn(),
        setSpinButtonVisible: vi.fn(),
        setFreeSpinsRemaining: vi.fn(),
        setAccumulatedWin: vi.fn(),
        clearAccumulatedWin: vi.fn(),
    };
}

function createApi(spinImpl) {
    return {
        spin: vi.fn(spinImpl ?? (async () => roundFixture)),
    };
}

function createController(spinToImpl = async () => {}, options = {}) {
    const wheelScene = createWheelScene(spinToImpl);
    const stateMachine = new GameStateMachine();
    const api = options.api ?? createApi(options.spinImpl);

    const controller = new GameController(wheelScene, stateMachine, {
        api,
        sessionId: options.sessionId ?? 'session-1',
        balanceCents: options.balanceCents ?? GameConfig.initialBalanceCents,
        betCents: options.betCents ?? GameConfig.defaultBetCents,
        bonusFlow: options.bonusFlow ?? null,
    });

    if (options.boot !== false) {
        controller.boot();
    }

    return {controller, wheelScene, stateMachine, api};
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
        const {controller, wheelScene, stateMachine, api} = createController();

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
        });

        expect(api.spin).toHaveBeenCalledWith(
            {sessionId: 'session-1', betCents: GameConfig.defaultBetCents},
            expect.any(String)
        );
        expect(wheelScene.spinTo.mock.calls[0][0]).toBe(5);

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });
    });

    it('ignores repeated Start while spinning', async () => {
        const deferred = createDeferred();
        const {controller, wheelScene, stateMachine} = createController(() => deferred.promise);

        controller.onSpinPressed();
        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
        });
            expect(stateMachine.state).toBe(GameState.SPINNING);

        deferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.spinTo).toHaveBeenCalledTimes(1);
    });

    it('allows SPINNING → IDLE', () => {
        const sm = new GameStateMachine(GameState.SPINNING);
        sm.transition(GameState.IDLE);
        expect(sm.state).toBe(GameState.IDLE);
    });

    it('transitions REQUESTING_SPIN → SPINNING → SHOWING_WIN → IDLE', async () => {
        const deferred = createDeferred();
        const {controller, stateMachine} = createController(() => deferred.promise);
        const transitionSpy = vi.spyOn(stateMachine, 'transition');

        controller.onSpinPressed();

        expect(stateMachine.state).toBe(GameState.REQUESTING_SPIN);

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.SPINNING);
        });

        deferred.resolve();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(transitionSpy.mock.calls.map(([state]) => state)).toEqual([
            GameState.REQUESTING_SPIN,
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

        expect(wheelScene.showWin).toHaveBeenCalledWith(100);
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

        await vi.waitFor(() => {
            expect(wheelScene.spinTo).toHaveBeenCalledTimes(2);
        });

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
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

    it('applies server balances and passes winCents to showWin', async () => {
        const {controller, wheelScene, stateMachine} = createController();

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(controller.balanceCents).toBe(100000);
        expect(wheelScene.setBalance).toHaveBeenCalledWith(99900);
        expect(wheelScene.setBalance).toHaveBeenCalledWith(100000);
        expect(wheelScene.showWin).toHaveBeenCalledWith(100);
        expect(wheelScene.spinTo.mock.calls[0][0]).toBe(5);
    });

    it('calls showWin with 0 when server winCents is 0', async () => {
        const {controller, wheelScene, stateMachine} = createController(
            async () => {},
            {
                spinImpl: async () => ({
                    ...roundFixture,
                    winCents: 0,
                    balanceAfterRoundCents: 99900,
                }),
            }
        );

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.showWin).not.toHaveBeenCalled();
        expect(controller.balanceCents).toBe(99900);
    });

    it('keeps server balanceAfterBetCents when animation fails', async () => {
        const {controller, stateMachine} = createController(
            async () => {
                throw new Error('Animation failed');
            }
        );

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(controller.balanceCents).toBe(99900);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('keeps balanceAfterRoundCents if win presentation fails', async () => {
        const {controller, wheelScene, stateMachine} = createController();

        wheelScene.showWin.mockRejectedValue(new Error('Presentation failed'));

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(controller.balanceCents).toBe(100000);
            expect(wheelScene.showWin).toHaveBeenCalledWith(100);
            expect(wheelScene.setBetEnabled).toHaveBeenLastCalledWith(false);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('does not spin when API rejects', async () => {
        const {controller, wheelScene, stateMachine} = createController(
            async () => {},
            {
                spinImpl: async () => {
                    throw new Error('API failed');
                },
            }
        );

        const before = controller.balanceCents;
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(wheelScene.spinTo).not.toHaveBeenCalled();
            expect(controller.balanceCents).toBe(before);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('auto-plays freeSpins batch, accumulates win, then hides it', async () => {
        const {controller, wheelScene, stateMachine} = createController(async () => {}, {
            spinImpl: async () => freeSpinsRoundFixture,
        });

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.spinTo.mock.calls.map(([i]) => i)).toEqual([7, 5, 1, 13]);
        expect(wheelScene.setAccumulatedWin.mock.calls.map(([c]) => c)).toEqual([
            100, 100, 700,
        ]);
        expect(wheelScene.showWin).toHaveBeenCalledWith(700);
        expect(wheelScene.clearAccumulatedWin).toHaveBeenCalled();
        expect(controller.balanceCents).toBe(100600);
    });


    it('keeps bet locked through free spins', async () => {
        const spinDeferred = createDeferred();
        const {controller, wheelScene} = createController(() => spinDeferred.promise, {
            spinImpl: async () => freeSpinsRoundFixture,
        });

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(wheelScene.setBetEnabled).toHaveBeenCalledWith(false);
        });

        spinDeferred.resolve();

        await vi.waitFor(() => {
            expect(controller.stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.setBetEnabled).toHaveBeenLastCalledWith(true);
    });

    it('plays a base bonus through bonusFlow then shows the win', async () => {
        const bonus = {
            sequence: ['diamond', 'diamond', 'diamond'],
            winningCollection: 'diamond',
            finalWinCents: 600,
        };
        const bonusFlow = {
            play: vi.fn(async () => {}),
        };
        const {controller, wheelScene, stateMachine} = createController(async () => {}, {
            bonusFlow,
            spinImpl: async () => ({
                ...roundFixture,
                winCents: 600,
                balanceAfterRoundCents: 100500,
                result: {
                    sectorId: 'sector_11',
                    sectorIndex: 11,
                    type: 'bonus',
                    winCents: 600,
                    bonus,
                },
            }),
        });

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.spinTo.mock.calls[0][0]).toBe(11);
        expect(bonusFlow.play).toHaveBeenCalledWith(bonus);
        expect(bonusFlow.play.mock.invocationCallOrder[0])
            .toBeLessThan(wheelScene.showWin.mock.invocationCallOrder[0]);
        expect(wheelScene.showWin).toHaveBeenCalledWith(600);
        expect(controller.balanceCents).toBe(100500);
    });

    it('plays a nested free-spin bonus through bonusFlow', async () => {
        const bonus = {
            sequence: ['star', 'star', 'star'],
            winningCollection: 'star',
            finalWinCents: 400,
        };
        const seen = [];
        const bonusFlow = {
            play: vi.fn(async () => {
                seen.push(stateMachine.state);
            }),
        };
        const {controller, wheelScene, stateMachine} = createController(async () => {}, {
            bonusFlow,
            spinImpl: async () => ({
                ...roundFixture,
                winCents: 400,
                balanceAfterRoundCents: 100300,
                result: {
                    sectorId: 'sector_7',
                    sectorIndex: 7,
                    type: 'free_spins',
                    winCents: 400,
                    freeSpins: {
                        retriggered: false,
                        totalWinCents: 400,
                        results: [
                            {sectorIndex: 5, type: 'win', awardedAdditionalSpins: 0, winCents: 0},
                            {
                                sectorIndex: 11,
                                type: 'bonus',
                                awardedAdditionalSpins: 0,
                                winCents: 400,
                                bonus,
                            },
                            {sectorIndex: 1, type: 'lose', awardedAdditionalSpins: 0, winCents: 0},
                        ],
                    },
                },
            }),
        });

        controller.onSpinPressed();

        await vi.waitFor(() => {
            expect(stateMachine.state).toBe(GameState.IDLE);
        });

        expect(wheelScene.spinTo.mock.calls.map(([index]) => index)).toEqual([7, 5, 11, 1]);
        expect(bonusFlow.play).toHaveBeenCalledWith(bonus);
        expect(seen).toEqual([GameState.BONUS]);
        expect(wheelScene.showWin).toHaveBeenCalledWith(400);
    });

    it('enters ERROR when bonusFlow is missing', async () => {
        const {controller, wheelScene, stateMachine} = createController(async () => {}, {
            spinImpl: async () => ({
                ...roundFixture,
                result: {
                    sectorId: 'sector_11',
                    sectorIndex: 11,
                    type: 'bonus',
                    bonus: {sequence: ['star', 'star', 'star']},
                },
            }),
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            controller.onSpinPressed();

            await vi.waitFor(() => {
                expect(stateMachine.state).toBe(GameState.ERROR);
            });

            expect(wheelScene.showWin).not.toHaveBeenCalled();
        } finally {
            errorSpy.mockRestore();
        }
    });
});

