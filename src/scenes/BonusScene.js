import * as PIXI from 'pixi.js';
import {GameConfig} from '@/config/GameConfig.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';
import {BaseScene} from '@/scenes/BaseScene.js';
import {BonusCollection} from '@/components/bonus/BonusCollection.js';
import {BonusGrid} from '@/components/bonus/BonusGrid.js';

export class BonusScene extends BaseScene {
    #created = false;
    #pickResolve = null;
    #holdTimer = null;

    constructor(resources) {
        super();

        this.resources = resources;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.boardRoot = null;
        this.boardSprite = null;
        this.dim = null;
        this.grid = null;
        this.prize = null;
        this.collections = new Map();
    }

    create() {
        if (this.#created) {
            return;
        }

        this.dim = new PIXI.Graphics();
        this.dim.interactive = true;
        this.addChild(this.dim);

        this.boardRoot = new PIXI.Container();
        this.boardSprite = new PIXI.Sprite(this.#texture('boardBg'));
        this.boardSprite.anchor.set(0.5);
        this.boardRoot.addChild(this.boardSprite);

        for (const symbol of GameConfig.bonusSymbols) {
            const collection = new BonusCollection(
                this.#texture(symbol.texture),
                symbol.multiplier,
            );
            this.collections.set(symbol.id, collection);
            this.boardRoot.addChild(collection);
        }

        this.grid = new BonusGrid(
            this.#texture('tileHidden'),
            index => this.#onPick(index),
        );
        this.boardRoot.addChild(this.grid);

        this.prize = new PIXI.Text('', {
            fill: 0xffd54f,
            fontSize: 48,
            fontWeight: '700',
        });
        this.prize.anchor.set(0.5);
        this.prize.visible = false;
        this.boardRoot.addChild(this.prize);

        this.addChild(this.boardRoot);
        this.#created = true;
        this.#layout();
    }

    reset() {
        this.create();
        this.#clearPickWait();
        clearTimeout(this.#holdTimer);
        this.#holdTimer = null;
        this.grid.reset();

        for (const collection of this.collections.values()) {
            collection.reset();
        }

        this.prize.text = '';
        this.prize.visible = false;
    }

    waitForPick() {
        this.#clearPickWait();

        return new Promise(resolve => {
            this.#pickResolve = resolve;
        });
    }

    reveal(cellIndex, symbolId) {
        this.grid.reveal(cellIndex, this.#texture(this.#symbol(symbolId).texture));
    }

    setCollectionCount(symbolId, count) {
        this.collections.get(symbolId).setCount(count);
    }

    showResult(winningCollection, finalWinCents) {
        this.grid.lock();

        for (const [id, collection] of this.collections) {
            collection.setDimmed(id !== winningCollection);
        }

        this.prize.text = MoneyFormatter.formatCents(finalWinCents);
        this.prize.visible = true;
    }

    holdResult() {
        return new Promise(resolve => {
            this.#holdTimer = setTimeout(() => {
                this.#holdTimer = null;
                resolve();
            }, GameConfig.bonusHoldMs);
        });
    }

    layoutScreen(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.#layout();
    }

    #onPick(index) {
        if (!this.#pickResolve) {
            return;
        }

        const resolve = this.#pickResolve;
        this.#pickResolve = null;
        resolve(index);
    }

    #clearPickWait() {
        this.#pickResolve = null;
    }

    #layout() {
        if (!this.#created || this.screenWidth < 1 || this.screenHeight < 1) {
            return;
        }

        this.dim.clear();
        this.dim.beginFill(0x07060d, 0.62);
        this.dim.drawRect(0, 0, this.screenWidth, this.screenHeight);
        this.dim.endFill();

        const boardWidth = this.boardSprite.texture.width;
        const boardHeight = this.boardSprite.texture.height;
        const fit = Math.min(this.screenWidth, this.screenHeight) * 0.9
            / Math.max(boardWidth, boardHeight);
        const stride = boardWidth * 0.23;
        const columnX = boardWidth * 0.27;

        this.boardRoot.scale.set(fit);
        this.boardRoot.position.set(this.screenWidth / 2, this.screenHeight / 2);

        GameConfig.bonusSymbols.forEach((symbol, index) => {
            const collection = this.collections.get(symbol.id);
            collection.layout(stride * 0.7);
            collection.position.set((index - 1) * columnX, -boardHeight * 0.3);
        });

        this.grid.layout(stride);
        this.grid.position.set(0, boardHeight * 0.14);

        this.prize.style.fontSize = Math.round(boardWidth * 0.048);
        this.prize.position.set(0, -boardHeight * 0.44);
    }

    #symbol(id) {
        const symbol = GameConfig.bonusSymbols.find(item => item.id === id);

        if (!symbol) {
            throw new Error(`Unknown bonus symbol: ${id}`);
        }

        return symbol;
    }

    #texture(name) {
        const texture = this.resources[name]?.texture;

        if (!texture) {
            throw new Error(`Missing bonus texture: ${name}`);
        }

        return texture;
    }

    destroy(options) {
        this.#clearPickWait();
        clearTimeout(this.#holdTimer);
        this.#holdTimer = null;
        super.destroy(options);
    }
}
