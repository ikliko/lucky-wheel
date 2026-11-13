import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';

export class WheelPointer extends PIXI.Sprite {
    constructor(texture) {
        super(texture);

        this.anchor.set(0.5, 0);
        this.scale.set(GameConfig.arrowLocalHeight / this.texture.height);
        this.position.set(
            0,
            -GameConfig.wheelRadius - this.height + GameConfig.arrowLocalOverlap
        );
    }
}
