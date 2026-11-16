import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';
import {GameConfig} from '@/config/GameConfig.js';

export class GameController {
    constructor(wheelScene, stateMachine = new GameStateMachine()) {
        this.wheelScene = wheelScene;
        this.stateMachine = stateMachine;
        this.balanceCents = GameConfig.initialBalanceCents;
        this.betCents = GameConfig.defaultBetCents;
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
        let spinCompleted = false;
        let betDebited = false;

        const betCents = this.betCents;

        try {
            this.stateMachine.transition(GameState.SPINNING);
            this.#setBetLocked(true);

            const sectorIndex = this.getSectorIndex();
            const winCents = this.getWinCents(sectorIndex, betCents);

            this.balanceCents -= betCents;
            betDebited = true;
            this.#syncWalletUi();

            await this.wheelScene.spinTo(sectorIndex);
            spinCompleted = true;

            this.balanceCents += winCents;
            this.#syncWalletUi();

            this.stateMachine.transition(GameState.SHOWING_WIN);

            await this.wheelScene.showWin(winCents);

            this.stateMachine.transition(GameState.IDLE);
            this.#setBetLocked(false);
            this.#syncWalletUi();
        } catch (error) {
            console.error('Spin failed:', error);

            if (betDebited && !spinCompleted) {
                this.balanceCents += betCents;
                this.#syncWalletUi();
            }

            if (this.stateMachine.canTransition(GameState.ERROR)) {
                this.stateMachine.transition(GameState.ERROR);
            }

            this.#setBetLocked(true);
        }
    }

    getSectorIndex() {
        return Math.floor(Math.random() * GameConfig.sectorCount);
    }

    getWinCents(sectorIndex, betCents) {
        const multiplier = sectorIndex % 2 === 0 ? 0 : sectorIndex;

        return betCents * multiplier;
    }

    #syncWalletUi() {
        this.wheelScene.setBalance?.(this.balanceCents);
        this.wheelScene.setBet?.(this.betCents);
    }

    #setBetLocked(locked) {
        this.wheelScene.setBetEnabled?.(!locked);
    }
}
