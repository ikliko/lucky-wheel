import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';
import {GameConfig} from '@/config/GameConfig.js';

export class GameController {
    constructor(wheelScene, stateMachine = new GameStateMachine(), {
        api = null,
        sessionId = null,
        balanceCents = GameConfig.initialBalanceCents,
        betCents = GameConfig.defaultBetCents,
    } = {}) {
        this.wheelScene = wheelScene;
        this.stateMachine = stateMachine;
        this.api = api;
        this.sessionId = sessionId;
        this.balanceCents = balanceCents;
        this.betCents = betCents;
    }

    boot() {
        this.stateMachine.transition(GameState.IDLE);
        this.#syncWalletUi();
        this.#setBetLocked(false);
    }

    onSpinPressed() {
        if (!this.stateMachine.isIdle) {
            return;
        }

        if (this.balanceCents < this.betCents) {
            return;
        }

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

            const idempotencyKey = crypto.randomUUID();

            const round = await this.api.spin(
                {sessionId: this.sessionId, betCents},
                idempotencyKey
            );

            this.stateMachine.transition(GameState.SPINNING);

            const sectorIndex = round.result.sectorIndex;
            const winCents = round.winCents;

            this.balanceCents = round.balanceAfterBetCents;
            this.#syncWalletUi();

            await this.wheelScene.spinTo(sectorIndex);

            this.balanceCents = round.balanceAfterRoundCents;
            this.#syncWalletUi();

            this.stateMachine.transition(GameState.SHOWING_WIN);
            await this.wheelScene.showWin(winCents);

            this.stateMachine.transition(GameState.IDLE);
            this.#setBetLocked(false);
            this.#syncWalletUi();
        } catch (error) {
            console.error('Spin failed:', error);

            if (this.stateMachine.canTransition(GameState.ERROR)) {
                this.stateMachine.transition(GameState.ERROR);
            }

            this.#setBetLocked(true);
        }
    }

    #syncWalletUi() {
        this.wheelScene.setBalance?.(this.balanceCents);
        this.wheelScene.setBet?.(this.betCents);
    }

    #setBetLocked(locked) {
        this.wheelScene.setBetEnabled?.(!locked);
    }
}
