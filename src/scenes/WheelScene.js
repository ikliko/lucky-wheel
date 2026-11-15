import {Wheel} from "@/components/wheel/Wheel.js";
import {WheelPointer} from "@/components/wheel/WheelPointer.js";
import {SpinButton} from "@/components/ui/SpinButton.js";
import {GameConfig} from "@/config/GameConfig.js";
import {BaseScene} from "@/scenes/BaseScene.js";
import {WheelAnimator} from "@/components/wheel/WheelAnimator.js";

export class WheelScene extends BaseScene {
    #created = false;
    #spinning = false;

    constructor(resources, ticker, onSpin) {
        super();

        this.resources = resources;
        this.ticker = ticker;
        this.onSpin = onSpin;
        this.wheel = null;
        this.pointer = null;
        this.spinButton = null;
        this.animator = null;
    }

    create() {
        if (this.#created) {
            return
        }

        this.wheel = new Wheel();
        this.pointer = new WheelPointer(this.resources.arrow.texture);
        this.spinButton = new SpinButton(this.resources.btnStart.texture, this.onSpin);
        this.animator = new WheelAnimator(this.wheel, this.ticker)

        this.addChild(this.wheel);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);

        this.#created = true;
    }

    async spinTo(sectorIndex) {
        if(!this.animator || this.#spinning) {
            return;
        }

        this.#spinning = true;

        try {
            await this.animator.spinTo({sectorIndex});
        } catch  {
            // todo cancel
        } finally {
            this.#spinning = false;
        }
    }

    layoutScreen(screenWidth, screenHeight) {
        const diameter = GameConfig.wheelRadius * 2;
        const fit = Math.min(screenWidth, screenHeight)
            * GameConfig.wheelFitRatio / diameter;
        this.scale.set(fit);
        this.position.set(screenWidth / 2, screenHeight / 2);
    }
}