import * as PIXI from 'pixi.js';
import {GameConfig} from "@/config/GameConfig.js";
import {MoneyFormatter} from "@/utils/MoneyFormatter.js";

export class WheelSector {
    constructor(index, definition, geometry) {
        this.index = index
        this.definition = definition
        this.geometry = geometry
    }

    get color() {
        return this.index % 2 === 0
            ? GameConfig.colors.sectorA
            : GameConfig.colors.sectorB
    }

    draw(graphics) {
        const r = GameConfig.wheelRadius
        const a0 = this.geometry.startAngle(this.index)
        const a1 = this.geometry.endAngle(this.index)

        graphics.moveTo(0, 0)
        graphics.beginFill(this.color)
        graphics.arc(0, 0, r, a0, a1)
        graphics.closePath()
        graphics.endFill()

        graphics.lineStyle(GameConfig.strokeWidth, GameConfig.colors.stroke);
        graphics.moveTo(0, 0);
        graphics.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
        graphics.moveTo(0, 0);
        graphics.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    }

    createLabel(betCents = GameConfig.defaultBetCents) {
        const mid = this.geometry.midAngle(this.index);
        const halfSweep = this.geometry.sweep / 2;
        const outer = GameConfig.wheelRadius * 0.88;
        const inner = GameConfig.wheelRadius * 0.50;
        const root = new PIXI.Container();

        const chars = [...this.#displayText(betCents)].filter((ch) => ch !== ' ');
        if (chars.length === 0) {
            return root;
        }

        chars.forEach((ch, i) => {
            const t = chars.length === 1 ? 0 : i / (chars.length - 1);
            const radius = outer - t * (outer - inner);
            const maxWidth = 2 * radius * Math.sin(halfSweep) * 0.55;
            const fontSize = Math.max(10, Math.min(36, maxWidth));

            const text = new PIXI.Text(ch, {
                fill: 0xffffff,
                fontSize,
                fontWeight: '700',
                stroke: 0x000000,
                strokeThickness: Math.max(2, fontSize * 0.14),
            });

            text.anchor.set(0.5);
            text.position.set(Math.cos(mid) * radius, Math.sin(mid) * radius);
            text.rotation = mid + Math.PI / 2;
            root.addChild(text);
        });

        return root;
    }

    #displayText(betCents) {
        const {type, multiplier, rimLabel, label} = this.definition;
        if (type === 'win') {
            const winCents = Math.round(betCents * multiplier);
            return MoneyFormatter.formatCents(winCents); // e.g. €0.50
        }
        return rimLabel || label || '';
    }
}