import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

export class WinDisplay {
    #timer = null;
    #rejectPending = null;
    #destroyed = false;

    constructor({durationMs = 1200} = {}) {
        this.durationMs = durationMs;
        this.text = '';
        this.visible = false;
    }

    show(winCents) {
        if (this.#destroyed) {
            return Promise.reject(
                new Error('WinDisplay is destroyed')
            );
        }

        if (this.#rejectPending) {
            return Promise.reject(
                new Error('Win presentation already active')
            );
        }

        this.text = MoneyFormatter.formatCents(winCents);
        this.visible = true;

        if (this.durationMs <= 0) {
            this.visible = false;
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.#rejectPending = reject;

            this.#timer = setTimeout(() => {
                this.#timer = null;
                this.#rejectPending = null;
                this.visible = false;
                resolve();
            }, this.durationMs);
        });
    }

    cancel() {
        if (!this.#rejectPending) {
            this.visible = false;
            return;
        }

        clearTimeout(this.#timer);

        this.#timer = null;
        this.visible = false;

        const reject = this.#rejectPending;
        this.#rejectPending = null;

        reject(new Error('Win presentation cancelled'));
    }

    destroy() {
        this.cancel();
        this.#destroyed = true;
    }
}
