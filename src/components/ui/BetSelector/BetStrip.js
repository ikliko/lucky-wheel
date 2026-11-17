import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {BetCard} from '@/components/ui/BetCard.js';

export class BetStrip extends PIXI.Container {
    #cards = new Map();
    #scrollX = 0;
    #moved = false;
    #drag = null;
    #viewportWidth;
    #contentWidth;
    #stride;
    #onScroll;

    constructor(model, {onScroll} = {}) {
        super();

        this.model = model;
        this.#onScroll = onScroll;
        this.#stride = UiConfig.cardWidth + UiConfig.cardGap;

        const visible = UiConfig.betStripVisibleCount;
        this.#viewportWidth = visible * UiConfig.cardWidth
            + (visible - 1) * UiConfig.cardGap
            + UiConfig.betStripEdgePadX * 2;
        this.#contentWidth = model.allowedBetsCents.length * UiConfig.cardWidth
            + Math.max(0, model.allowedBetsCents.length - 1) * UiConfig.cardGap;

        this.interactive = true;
        this.hitArea = new PIXI.Rectangle(
            0,
            -UiConfig.cardHeight / 2,
            this.#viewportWidth,
            UiConfig.cardHeight
        );

        this.strip = new PIXI.Container();
        this.addChild(this.strip);

        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(
            0,
            -UiConfig.cardHeight / 2,
            this.#viewportWidth,
            UiConfig.cardHeight + UiConfig.betStripEdgePadY * 2
        );
        mask.endFill();
        this.addChild(mask);
        this.strip.mask = mask;

        model.allowedBetsCents.forEach((cents, index) => {
            const card = new BetCard({
                cents,
                onTap: (value) => {
                    if (this.#moved || !this.model.enabled) {
                        return;
                    }

                    model.selectBet(value);
                    this.sync();
                },
            });
            card.position.set(index * this.#stride, -UiConfig.cardHeight / 2);
            this.#cards.set(cents, card);
            this.strip.addChild(card);
        });

        this.on('pointerdown', this.#onPointerDown);
        this.on('pointermove', this.#onPointerMove);
        this.on('pointerup', this.#onPointerUp);
        this.on('pointerupoutside', this.#onPointerUp);
        this.on('pointercancel', this.#onPointerUp);
    }

    get viewportWidth() {
        return this.#viewportWidth;
    }

    get stride() {
        return this.#stride;
    }

    get canScrollLeft() {
        return this.model.enabled && this.#scrollX > 0.5;
    }

    get canScrollRight() {
        return this.model.enabled && this.#scrollX < this.#maxScroll() - 0.5;
    }

    sync() {
        const enabled = this.model.enabled;

        for (const [cents, card] of this.#cards) {
            card.setSelected(cents === this.model.selectedBetCents);
            card.setEnabled(enabled);
        }

        this.interactive = enabled;
        this.#scrollToSelected();
    }

    nudge(delta) {
        if (!this.model.enabled) {
            return;
        }

        this.#setScroll(this.#scrollX + delta);
    }

    #scrollToSelected() {
        const index = this.model.allowedBetsCents.indexOf(this.model.selectedBetCents);

        if (index < 0) {
            return;
        }

        this.#setScroll(
            index * this.#stride - (this.#viewportWidth - UiConfig.cardWidth) / 2
        );
    }

    #maxScroll() {
        return Math.max(0, this.#contentWidth - this.#viewportWidth);
    }

    #setScroll(x) {
        const max = this.#maxScroll();
        this.#scrollX = Math.max(0, Math.min(max, x));
        this.strip.x = -this.#scrollX;
        this.#onScroll?.();
    }

    #onPointerDown = (event) => {
        if (!this.model.enabled) {
            return;
        }

        const local = event.data.getLocalPosition(this);
        this.#drag = {startX: local.x, scrollX: this.#scrollX};
        this.#moved = false;
    };

    #onPointerMove = (event) => {
        if (!this.#drag) {
            return;
        }

        const local = event.data.getLocalPosition(this);
        const dx = local.x - this.#drag.startX;

        if (Math.abs(dx) > UiConfig.betStripDragThreshold) {
            this.#moved = true;
        }

        if (this.#moved) {
            this.#setScroll(this.#drag.scrollX - dx);
        }
    };

    #onPointerUp = () => {
        this.#drag = null;
    };
}
