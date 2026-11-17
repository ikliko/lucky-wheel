import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {CircleIconButton} from '@/components/ui/CircleIconButton.js';
import {BetStrip} from '@/components/ui/BetSelector/BetStrip.js';

export class BetSelectorView extends PIXI.Container {
    #onOpenMore;

    constructor(model, {
        onOpenMore,
        coinsTexture,
        chevronLeftTexture,
        chevronRightTexture,
    } = {}) {
        super();

        this.model = model;
        this.#onOpenMore = onOpenMore;

        this.strip = new BetStrip(model, {
            onScroll: () => this.#syncArrows(),
        });

        this.leftArrow = this.#createArrow(chevronLeftTexture, () => {
            this.strip.nudge(-this.strip.stride);
        });
        this.rightArrow = this.#createArrow(chevronRightTexture, () => {
            this.strip.nudge(this.strip.stride);
        });
        this.moreButton = this.#createCoins(coinsTexture);

        this.#layoutRow();
        this.sync();
    }

    get rowWidth() {
        return UiConfig.betArrowSize
            + UiConfig.betArrowGap
            + this.strip.viewportWidth
            + UiConfig.betArrowGap
            + UiConfig.betArrowSize
            + UiConfig.cardGap
            + UiConfig.coinsButtonSize;
    }

    sync() {
        this.strip.sync();
        this.moreButton.setEnabled(this.model.enabled);
    }

    #layoutRow() {
        const arrowSize = UiConfig.betArrowSize;
        const gap = UiConfig.betArrowGap;
        let x = -this.rowWidth / 2;

        this.leftArrow.position.set(x, -arrowSize / 2);
        this.addChild(this.leftArrow);
        x += arrowSize + gap;

        this.strip.position.set(x, 0);
        this.addChild(this.strip);
        x += this.strip.viewportWidth + gap;

        this.rightArrow.position.set(x, -arrowSize / 2);
        this.addChild(this.rightArrow);
        x += arrowSize + UiConfig.cardGap;

        this.moreButton.position.set(x, -UiConfig.coinsButtonSize / 2);
        this.addChild(this.moreButton);
    }

    #syncArrows() {
        this.leftArrow.setEnabled(this.strip.canScrollLeft);
        this.rightArrow.setEnabled(this.strip.canScrollRight);
    }

    #createArrow(texture, onTap) {
        return new CircleIconButton({
            size: UiConfig.betArrowSize,
            texture,
            iconScale: UiConfig.betArrowIconScale,
            fill: UiConfig.chromeButtonFill,
            fillAlpha: UiConfig.chromeButtonFillAlpha,
            disabledAlpha: UiConfig.betArrowDisabledAlpha,
            onTap,
        });
    }

    #createCoins(texture) {
        return new CircleIconButton({
            size: UiConfig.coinsButtonSize,
            texture,
            iconScale: UiConfig.coinsIconScale,
            fill: UiConfig.chromeButtonFill,
            fillAlpha: UiConfig.chromeButtonFillAlpha,
            stroke: UiConfig.chromeButtonStroke,
            strokeWidth: UiConfig.chromeButtonStrokeWidth,
            onTap: () => this.#onOpenMore?.(),
        });
    }
}
