import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';

export class SpinButton extends PIXI.Sprite {
    constructor(texture, onSpin) {
        super(texture);

        this.anchor.set(0.5);
        this.scale.set(GameConfig.startLocalDiameter / this.texture.width);
        this.position.set(0, 0);
        this.interactive = true;
        this.buttonMode = true;

        this.on('pointertap', () => {
            if (typeof onSpin === 'function') {
                onSpin();
            }
        });
    }
}
