import * as PIXI from "pixi.js";

export class BaseScene extends PIXI.Container {
    constructor() {
        super();
        this.visible = false
    }

    create() {
    }

    onEnter() {
        this.visible = true;
    }

    onExit() {
        this.visible = false;
    }

    layoutScreen(_screenWidth, _screenHeight) {
    }

    destroy(_options) {
        super.destroy(_options);
    }
}