import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';
import {GameConfig} from '@/config/GameConfig.js';
import {FreeSpinsController} from '@/features/FreeSpinsController.js';

export class GameController {
    constructor(wheelScene, stateMachine = new GameStateMachine(), {
        api = null,
        sessionId = null,
        balanceCents = GameConfig.initialBalanceCents,
        betCents = GameConfig.defaultBetCents,
        freeSpinsController = null,
        bonusFlow = null,
        sounds = null,
    } = {}) {
        this.wheelScene = wheelScene;
        this.stateMachine = stateMachine;
        this.api = api;
        this.sessionId = sessionId;
        this.balanceCents = balanceCents;
        this.betCents = betCents;
        this.bonusFlow = bonusFlow;
        this.sounds = sounds;

        this.freeSpinsController = freeSpinsController ?? new FreeSpinsController(
            {spinTo: (sectorIndex) => this.#presentSpin(sectorIndex)},
            {
                onEnterBonus: () => {
                    if (this.stateMachine.canTransition(GameState.BONUS)) {
                        this.stateMachine.transition(GameState.BONUS);
                    }
                },
                onBonus: async (entry) => {
                    await this.#playBonus(entry.bonus);
                },
                onExitBonus: () => {
                    if (this.stateMachine.canTransition(GameState.FREE_SPINS)) {
                        this.stateMachine.transition(GameState.FREE_SPINS);
                    }
                },
                onRemaining: (remaining) => {
                    this.wheelScene.setFreeSpinsRemaining(remaining);
                },
                onAccumulatedWin: (winCents) => {
                    this.wheelScene.setAccumulatedWin(winCents);
                },
            }
        );
    }

    boot() {
        this.stateMachine.transition(GameState.IDLE);
        this.#syncWalletUi();
        this.#setBetLocked(false);
        this.sounds?.ensureBgm();
    }

    onSpinPressed() {
        if (!this.stateMachine.isIdle) {
            return;
        }

        if (this.balanceCents < this.betCents) {
            return;
        }

        this.sounds?.ensureBgm();
        void this.#runBaseSpin();
    }

    onBetSelected(betCents) {
        if (!this.stateMachine.isIdle) {
            return;
        }

        if (!GameConfig.allowedBetsCents.includes(betCents)) {
            return;
        }

        this.betCents = betCents;
        this.#syncWalletUi();
    }

    async #runBaseSpin() {
        const betCents = this.betCents;

        try {
            this.stateMachine.transition(GameState.REQUESTING_SPIN);
            this.#setBetLocked(true);
            this.wheelScene.clearAccumulatedWin();

            const idempotencyKey = crypto.randomUUID();

            const round = await this.api.spin(
                {sessionId: this.sessionId, betCents},
                idempotencyKey
            );

            this.stateMachine.transition(GameState.SPINNING);

            this.balanceCents = round.balanceAfterBetCents;
            this.#syncWalletUi();

            await this.#presentSpin(round.result.sectorIndex);

            const isFreeSpins =
                round.result?.type === 'free_spins' && round.result.freeSpins;

            if (isFreeSpins) {
                this.stateMachine.transition(GameState.FREE_SPINS);
                await this.freeSpinsController.play(round.result.freeSpins);
            } else if (round.result?.type === 'bonus') {
                this.stateMachine.transition(GameState.BONUS);
                await this.#playBonus(round.result.bonus);
            }

            this.wheelScene.setFreeSpinsRemaining(null);
            this.balanceCents = round.balanceAfterRoundCents;
            this.#syncWalletUi();

            if (round.winCents) {
                this.stateMachine.transition(GameState.SHOWING_WIN);
                this.sounds?.play('win');
                await this.wheelScene.showWin(round.winCents);
            }

            this.wheelScene.clearAccumulatedWin();
            this.stateMachine.transition(GameState.IDLE);
            this.#setBetLocked(false);
            this.#syncWalletUi();
        } catch (error) {
            console.error('Spin failed:', error);
            this.sounds?.stop('tick');

            if (this.stateMachine.canTransition(GameState.ERROR)) {
                this.stateMachine.transition(GameState.ERROR);
            }

            this.#setBetLocked(true);
        }
    }

    async #presentSpin(sectorIndex) {
        try {
            await this.wheelScene.spinTo(sectorIndex, {
                onSectorChange: () => this.sounds?.play('tick'),
            });
        } finally {
            this.sounds?.stop('tick');
        }
    }

    async #playBonus(bonus) {
        if (!this.bonusFlow) {
            throw new Error('Bonus presentation is not configured');
        }

        await this.bonusFlow.play(bonus);
    }

    #syncWalletUi() {
        this.wheelScene.setBalance(this.balanceCents);
        this.wheelScene.setBet(this.betCents);
    }

    #setBetLocked(locked) {
        this.wheelScene.setBetEnabled(!locked);
        this.wheelScene.setSpinButtonVisible(!locked);
    }
}
