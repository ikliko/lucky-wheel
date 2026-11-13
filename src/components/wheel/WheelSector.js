import * as PIXI from 'pixi.js';
import {GameConfig} from "@/config/GameConfig.js";

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

    createLabel() {
        const mid = this.geometry.midAngle(this.index)
        const labelRadius = GameConfig.wheelRadius * GameConfig.labelRadiusRatio
        const text = new PIXI.Text(this.definition.label, {
            fill: 0xffffff,
            fontSize: 26,
            fontWeight: '700',
        })

        text.anchor.set(0.5)
        text.position.set(Math.cos(mid) * labelRadius, Math.sin(mid) * labelRadius)
        text.rotation = mid + Math.PI / 2

        return text
    }
}