import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';
import {BonusTile} from '@/components/bonus/BonusTile.js';

export class BonusGrid extends PIXI.Container {
    constructor(hiddenTexture, onPick) {
        super();

        this.hiddenTexture = hiddenTexture;
        this.tiles = [];

        for (let index = 0; index < GameConfig.bonusCellCount; index++) {
            const tile = new BonusTile(hiddenTexture, () => onPick(index));
            this.addChild(tile);
            this.tiles.push(tile);
        }
    }

    layout(stride) {
        const tileSize = stride * 0.82;

        this.tiles.forEach((tile, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);

            tile.position.set((column - 1) * stride, (row - 1) * stride);
            tile.layout(tileSize);
        });
    }

    reveal(index, texture) {
        this.tiles[index].reveal(texture);
    }

    lock() {
        this.tiles.forEach(tile => tile.lock());
    }

    reset() {
        this.tiles.forEach(tile => tile.reset(this.hiddenTexture));
    }
}
