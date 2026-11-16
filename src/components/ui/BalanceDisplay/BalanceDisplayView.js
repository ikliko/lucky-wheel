import * as PIXI from 'pixi.js';

export class BalanceDisplayView extends PIXI.Container {
    constructor(model) {
        super();

        this.model = model;
        this.label = new PIXI.Text(model.text, {
            fill: 0xffffff,
            fontSize: 32,
            fontWeight: '700',
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);
    }

    sync() {
        this.label.text = this.model.text;
    }
}
