import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';
import {WheelPointer} from '@/components/wheel/WheelPointer.js';
import {SpinButton} from '@/components/ui/SpinButton.js';
import {WheelGeometry} from "@/utils/WheelGeometry.js";
import {WheelSector} from "@/components/wheel/WheelSector.js";

export class Wheel extends PIXI.Container {
    constructor(resources, onSpin) {
        super();

        this.geometry = new WheelGeometry(GameConfig.sectorCount);
        this.rotator = new PIXI.Container();
        this.sectorsLayer = new PIXI.Graphics();
        this.labelsLayer = new PIXI.Container();

        // TODO: API MOCK - to be deleted
        const sectors = Array.from({length: 18}, (_, i) => ({
            id: `sector_${i}`,
            label: i % 2 === 0 ? 'LOSE' : `×${i}`,
        }));
        this.sectors = sectors.map((sector, i) => (
            new WheelSector(i, sector, this.geometry)
        ))

        this.sectors.forEach(sector => {
            sector.draw(this.sectorsLayer)
            this.labelsLayer.addChild(sector.createLabel());
        })

        this.#drawRim(this.sectorsLayer)

        this.rotator.addChild(this.sectorsLayer)
        this.rotator.addChild(this.labelsLayer)

        this.pointer = new WheelPointer(resources.arrow.texture);
        this.spinButton = new SpinButton(resources.btnStart.texture, onSpin);

        this.addChild(this.rotator);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);
    }

    layoutScreen(screenWidth, screenHeight) {
        const diameter = GameConfig.wheelRadius * 2
        const fit = Math.min(screenWidth, screenHeight)
            * GameConfig.wheelFitRatio / diameter

        this.scale.set(fit);
        this.position.set(screenWidth / 2, screenHeight / 2);
    }

    #drawRim(sectorsLayer) {
        sectorsLayer.lineStyle(GameConfig.rimWidth, GameConfig.colors.rim);
        sectorsLayer.drawCircle(0, 0, GameConfig.wheelRadius)
    }
}
