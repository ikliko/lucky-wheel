import * as PIXI from 'pixi.js';

export class BonusTile extends PIXI.Container {
    constructor(hiddenTexture, onPick) {
        super();

        this.revealed = false;
        this.sprite = new PIXI.Sprite(hiddenTexture);
        this.sprite.anchor.set(0.5);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.on('pointertap', () => onPick());

        this.addChild(this.sprite);
    }

    layout(size) {
        this.sprite.width = size;
        this.sprite.height = size;
    }

    reveal(texture) {
        this.revealed = true;
        this.sprite.texture = texture;
        this.sprite.interactive = false;
        this.sprite.buttonMode = false;
        this.alpha = 1;
    }

    lock() {
        this.sprite.interactive = false;
        this.sprite.buttonMode = false;

        if (!this.revealed) {
            this.alpha = 0.4;
        }
    }

    reset(hiddenTexture) {
        this.revealed = false;
        this.alpha = 1;
        this.sprite.texture = hiddenTexture;
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
    }
}
