import * as PIXI from 'pixi.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

export class BetSelectorView extends PIXI.Container {
    #chips;

    constructor(model) {
        super();

        this.model = model;
        this.#chips = new Map();

        model.quickBetsCents.forEach((cents, index) => {
            const chip = new PIXI.Text(MoneyFormatter.formatCents(cents), {
                fill: 0xffffff,
                fontSize: 22,
                fontWeight: '600',
            });
            chip.anchor.set(0.5);
            chip.position.set(
                (index - (model.quickBetsCents.length - 1) / 2) * 90,
                0,
            );
            chip.interactive = true;
            chip.buttonMode = true;
            chip.on('pointertap', () => {
                model.selectBet(cents);
                this.sync();
            });

            this.#chips.set(cents, chip);
            this.addChild(chip);
        });

        this.sync();
    }

    sync() {
        this.alpha = this.model.enabled ? 1 : 0.45;

        for (const [cents, chip] of this.#chips) {
            chip.style.fill =
                cents === this.model.selectedBetCents ? 0xffd54f : 0xffffff;
            chip.interactive = this.model.enabled;
            chip.buttonMode = this.model.enabled;
        }
    }
}
