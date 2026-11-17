import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';

export class CircleIconButton extends PIXI.Container {
    #enabled = true;
    #disabledAlpha;

    constructor({
        size,
        texture = null,
        iconScale = 0.5,
        fill = 0x000000,
        fillAlpha = 0.55,
        stroke = null,
        strokeWidth = 0,
        disabledAlpha = UiConfig.disabledAlpha,
        onTap = null,
    } = {}) {
        super();

        this.#disabledAlpha = disabledAlpha;
        const radius = size / 2;

        const bg = new PIXI.Graphics();
        if (stroke != null && strokeWidth > 0) {
            bg.lineStyle(strokeWidth, stroke, 1);
        }
        bg.beginFill(fill, fillAlpha);
        bg.drawCircle(
            radius,
            radius,
            radius - (strokeWidth > 0 ? strokeWidth / 2 : 0)
        );
        bg.endFill();
        this.addChild(bg);

        if (texture) {
            const icon = new PIXI.Sprite(texture);
            icon.anchor.set(0.5);
            const scale = (size * iconScale)
                / Math.max(icon.texture.width, icon.texture.height);
            icon.scale.set(scale);
            icon.position.set(radius, radius);
            this.addChild(icon);
        }

        this.hitArea = new PIXI.Circle(radius, radius, radius);
        this.interactive = true;
        this.buttonMode = true;
        this.on('pointertap', () => {
            if (this.#enabled) {
                onTap?.();
            }
        });
    }

    setEnabled(enabled) {
        this.#enabled = Boolean(enabled);
        this.interactive = this.#enabled;
        this.buttonMode = this.#enabled;
        this.alpha = this.#enabled ? 1 : this.#disabledAlpha;
    }
}
