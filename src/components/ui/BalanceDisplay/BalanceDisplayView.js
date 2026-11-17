import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';

export class BalanceDisplayView extends PIXI.Container {
    constructor(model) {
        super();

        this.model = model;
        this.label = new PIXI.Text(model.text, {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.balanceFontSize,
            fontWeight: '700',
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);
    }

    sync() {
        this.label.text = this.model.text;
    }
}
