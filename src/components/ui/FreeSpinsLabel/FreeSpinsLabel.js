import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';

export class FreeSpinsLabel extends PIXI.Container {
    constructor() {
        super();

        const style = GameConfig.freeSpinsLabel;

        this.label = new PIXI.Text('', {
            fill: style.fill,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);
        this.visible = false;
    }

    setRemaining(remaining) {
        if (!remaining || remaining < 1) {
            this.visible = false;
            this.label.text = '';
            return;
        }

        this.label.text = remaining === 1
            ? '1 Free Spin left'
            : `${remaining} Free Spins left`;
        this.visible = true;
    }
}
