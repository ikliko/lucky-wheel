import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';

export class DimOverlay extends PIXI.Container {
    constructor() {
        super();

        this.dim = new PIXI.Graphics();
        this.dim.interactive = true;
        this.content = new PIXI.Container();

        this.addChild(this.dim);
        this.addChild(this.content);

        this.visible = false;
        this.dim.interactive = false;
    }

    layout(width, height) {
        this.dim.clear();
        this.dim.beginFill(UiConfig.dimColor, UiConfig.dimAlpha);
        this.dim.drawRect(0, 0, width, height);
        this.dim.endFill();
        this.dim.hitArea = new PIXI.Rectangle(0, 0, width, height);
    }

    show() {
        this.visible = true;
        this.dim.interactive = true;
    }

    hide() {
        this.visible = false;
        this.dim.interactive = false;
    }
}
