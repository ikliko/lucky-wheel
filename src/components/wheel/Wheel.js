import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';
import {WheelPointer} from '@/components/wheel/WheelPointer.js';
import {SpinButton} from '@/components/ui/SpinButton.js';

export class Wheel extends PIXI.Container {
    constructor(resources, onSpin) {
        super();

        this.wheelSprite = new PIXI.Sprite(resources.wheel.texture);
        this.wheelSprite.anchor.set(0.5);
        this.wheelSprite.position.set(0, 0);

        this.pointer = new WheelPointer(
            resources.arrow.texture,
            this.wheelSprite.texture.height,
        );

        this.spinButton = new SpinButton(resources.btnStart.texture, onSpin);

        this.addChild(this.wheelSprite);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);
    }

    layoutScreen(screenWidth, screenHeight) {
        const fit = Math.min(screenWidth, screenHeight)
            * GameConfig.wheelFitRatio
            / this.wheelSprite.texture.width;

        this.scale.set(fit);
        this.position.set(screenWidth / 2, screenHeight / 2);
    }
}
