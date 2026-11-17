import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';

export class BonusCollection extends PIXI.Container {
    constructor(texture, multiplier) {
        super();

        this.count = 0;
        this.dotRadius = 6;

        this.label = new PIXI.Text(`×${multiplier}`, {
            fill: 0xe8eef7,
            fontSize: 42,
            fontWeight: '700',
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);

        this.icon = new PIXI.Sprite(texture);
        this.icon.anchor.set(0.5);
        this.addChild(this.icon);

        this.dots = Array.from({length: GameConfig.bonusWinCount}, () => {
            const dot = new PIXI.Graphics();
            this.addChild(dot);
            return dot;
        });
    }

    layout(iconSize) {
        const dotRadius = Math.max(6, iconSize * 0.07);
        const dotGap = dotRadius * 3.4;

        this.dotRadius = dotRadius;
        this.label.style.fontSize = Math.round(iconSize * 0.32);
        this.label.position.set(0, -iconSize * 0.82);
        this.icon.width = iconSize;
        this.icon.height = iconSize;

        this.dots.forEach((dot, index) => {
            dot.position.set((index - 1) * dotGap, iconSize * 0.7);
        });

        this.setCount(this.count);
    }

    setCount(count) {
        this.count = count;

        this.dots.forEach((dot, index) => {
            const filled = index < count;

            dot.clear();
            dot.beginFill(filled ? 0xf7f8fb : 0x8d95a6, filled ? 1 : 0.55);
            dot.drawCircle(0, 0, this.dotRadius);
            dot.endFill();
        });
    }

    setDimmed(dimmed) {
        this.alpha = dimmed ? 0.4 : 1;
    }

    reset() {
        this.setDimmed(false);
        this.setCount(0);
    }
}
