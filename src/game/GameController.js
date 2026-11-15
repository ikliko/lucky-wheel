import {GameState, GameStateMachine} from "@/game/GameStateMachine.js";
import {GameConfig} from "@/config/GameConfig.js";

export class GameController {
    constructor(wheelScene, stateMachine = new GameStateMachine()) {
        this.wheelScene = wheelScene;
        this.stateMachine = stateMachine;
    }

    boot() {
        this.stateMachine.transition(GameState.IDLE);
    }

    onSpinPressed() {
        if (!this.stateMachine.isIdle) return;

        void this.#runBaseSpin();
    }

    async #runBaseSpin() {
        const sectorIndex = this.getSectorIndex();
        const winCents = 0;

        try {
            this.stateMachine.transition(GameState.SPINNING);
            await this.wheelScene.spinTo(sectorIndex);
            this.stateMachine.transition(GameState.SHOWING_WIN);

            console.log('win stub', {sectorIndex, winCents});
            this.stateMachine.transition(GameState.IDLE);
        } catch (e) {
            console.error('Spin failed:', e);
            if (this.stateMachine.canTransition(GameState.ERROR)) {
                this.stateMachine.transition(GameState.ERROR);
            }
        }
    }

    getSectorIndex() {
        return Math.floor(Math.random() * GameConfig.sectorCount);
    }
}