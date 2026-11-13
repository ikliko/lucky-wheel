import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';
import {WheelGeometry} from "@/utils/WheelGeometry.js";
import {WheelSector} from "@/components/wheel/WheelSector.js";

export class Wheel extends PIXI.Container {
    constructor() {
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
        this.addChild(this.rotator);
    }

    #drawRim(sectorsLayer) {
        sectorsLayer.lineStyle(GameConfig.rimWidth, GameConfig.colors.rim);
        sectorsLayer.drawCircle(0, 0, GameConfig.wheelRadius)
    }
}