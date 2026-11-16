import * as PIXI from 'pixi.js';

export class WinDisplayView extends PIXI.Container {
    constructor(model) {
        super();

        this.model = model;
        this.label = new PIXI.Text(model.text || '', {
            fill: 0xffd54f,
            fontSize: 46,
            fontWeight: '700',
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);
        this.sync();
    }

    sync() {
        this.label.text = this.model.text;
        this.visible = this.model.visible;
    }
}
