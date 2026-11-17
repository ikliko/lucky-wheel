import {KeyboardConfig} from '@/config/KeyboardConfig.js';

export class KeyboardControls {
    #onKeyDown;

    constructor({isWheelActive, isBonusActive, onSpin, onBonusPick}) {
        this.isWheelActive = isWheelActive;
        this.isBonusActive = isBonusActive;
        this.onSpin = onSpin;
        this.onBonusPick = onBonusPick;
        this.#onKeyDown = (event) => this.#handle(event);
    }

    attach() {
        window.addEventListener('keydown', this.#onKeyDown);
    }

    detach() {
        window.removeEventListener('keydown', this.#onKeyDown);
    }

    #handle(event) {
        if (event.repeat) {
            return;
        }

        if (event.code === 'Space') {
            if (!this.isWheelActive?.()) {
                return;
            }

            event.preventDefault();
            this.onSpin?.();
            return;
        }

        const cellIndex = KeyboardConfig.bonusCellByCode[event.code];

        if (cellIndex === undefined) {
            return;
        }

        if (!this.isBonusActive?.()) {
            return;
        }

        event.preventDefault();
        this.onBonusPick?.(cellIndex);
    }
}
