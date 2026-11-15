import {AnimationConfig} from "@/config/AnimationConfig.js";

export class WheelAnimator {
    #tick = null;
    #activeReject = null;

    constructor(wheel, ticker) {
        this.wheel = wheel;
        this.ticker = ticker;
    }

    spinTo({sectorIndex, durationMs = AnimationConfig.durationMs}) {
        void sectorIndex;

        this.cancel();

        const startRotation = this.wheel.rotator.rotation;
        const endRotation = startRotation + AnimationConfig.extraTurns * Math.PI * 2;

        return new Promise((resolve, reject) => {
            let elapsed = 0;
            this.#activeReject = reject;

            this.#tick = () => {
                elapsed += this.ticker.deltaMS;
                const t = Math.min(1, elapsed / durationMs);

                this.wheel.rotator.rotation =
                    startRotation + (endRotation - startRotation) * t;

                if (t >= 1) {
                    this.wheel.rotator.rotation = endRotation;
                    this.#clearTick()
                    this.#activeReject = null;
                    resolve();
                }
            };

            this.ticker.add(this.#tick);
        });
    }

    cancel() {
        if (!this.#tick) {
            return
        }

        this.#clearTick();
        const reject = this.#activeReject;
        this.#activeReject = null;
        if (reject) {
            reject(new Error('spin cancelled'));
        }
    }

    destroy() {
        this.cancel();
        this.wheel = null;
        this.ticker = null;
    }

    #clearTick() {
        if (this.#tick && this.ticker) {
            this.ticker.remove(this.#tick);
        }

        this.#tick = null;
    }
}