import {Wheel} from "@/components/wheel/Wheel.js";
import {WheelPointer} from "@/components/wheel/WheelPointer.js";
import {SpinButton} from "@/components/ui/SpinButton.js";
import {GameConfig} from "@/config/GameConfig.js";
import {BaseScene} from "@/scenes/BaseScene.js";

export class WheelScene extends BaseScene {
    #created = false

    constructor(resources, onSpin) {
        super();

        this.resources = resources;
        this.onSpin = onSpin;
        this.wheel = null;
        this.pointer = null;
        this.spinButton = null;
    }

    create() {
        if (this.#created) {
            return
        }

        this.wheel = new Wheel();
        this.pointer = new WheelPointer(this.resources.arrow.texture);
        this.spinButton = new SpinButton(this.resources.btnStart.texture, this.onSpin);

        this.addChild(this.wheel);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);

        this.#created = true;
    }

    layoutScreen(screenWidth, screenHeight) {
        const diameter = GameConfig.wheelRadius * 2;
        const fit = Math.min(screenWidth, screenHeight)
            * GameConfig.wheelFitRatio / diameter;
        this.scale.set(fit);
        this.position.set(screenWidth / 2, screenHeight / 2);
    }
}