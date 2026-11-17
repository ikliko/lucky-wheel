import * as PIXI from 'pixi.js';
import {LoadingConfig} from '@/config/LoadingConfig.js';
import {BaseScene} from '@/scenes/BaseScene.js';

export class LoadingScene extends BaseScene {
    #created = false;
    #progress = 0;
    #stripeOffset = 0;
    #onTick = null;

    constructor(ticker) {
        super();

        this.ticker = ticker;
        this.screenWidth = 0;
        this.screenHeight = 0;

        this.root = null;
        this.titleRoot = null;
        this.track = null;
        this.fillMask = null;
        this.fillRoot = null;
        this.stripes = null;
    }

    create() {
        if (this.#created) {
            return;
        }

        this.root = new PIXI.Container();
        this.addChild(this.root);

        this.titleRoot = new PIXI.Container();
        this.#buildTitle();
        this.root.addChild(this.titleRoot);

        this.track = new PIXI.Graphics();
        this.#drawTrack();
        this.root.addChild(this.track);

        this.fillMask = new PIXI.Graphics();
        this.fillRoot = new PIXI.Container();
        this.fillRoot.mask = this.fillMask;
        this.root.addChild(this.fillMask);
        this.root.addChild(this.fillRoot);

        this.stripes = new PIXI.Graphics();
        this.fillRoot.addChild(this.stripes);

        this.#layoutParts();
        this.#redrawFill();

        this.#onTick = () => this.#tick();
        this.#created = true;
    }

    setProgress(progress) {
        this.#progress = Math.max(0, Math.min(1, progress));
        this.#redrawFill();
    }

    onEnter() {
        super.onEnter();

        if (this.#onTick) {
            this.ticker.add(this.#onTick);
        }
    }

    onExit() {
        if (this.#onTick) {
            this.ticker.remove(this.#onTick);
        }

        super.onExit();
    }

    layoutScreen(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        if (!this.#created) {
            return;
        }

        const contentWidth = Math.max(
            LoadingConfig.barWidth,
            this.titleRoot.width
        );
        const maxWidth = screenWidth * LoadingConfig.contentScreenRatio;
        const scale = Math.min(1, maxWidth / contentWidth);

        this.root.scale.set(scale);
        this.root.position.set(screenWidth / 2, screenHeight / 2);
    }

    destroy(options) {
        if (this.#onTick) {
            this.ticker.remove(this.#onTick);
            this.#onTick = null;
        }

        super.destroy(options);
    }

    #buildTitle() {
        let x = 0;
        const letters = [...LoadingConfig.title];

        for (let i = 0; i < letters.length; i += 1) {
            const char = letters[i];

            if (char === ' ') {
                x += LoadingConfig.titleFontSize * LoadingConfig.titleSpaceWidthRatio;
                continue;
            }

            const color = LoadingConfig.titleLetterColors[
                i % LoadingConfig.titleLetterColors.length
            ];
            const text = new PIXI.Text(char, {
                fill: color,
                fontFamily: LoadingConfig.titleFontFamily,
                fontSize: LoadingConfig.titleFontSize,
                fontWeight: LoadingConfig.titleFontWeight,
                stroke: LoadingConfig.titleStrokeColor,
                strokeThickness: LoadingConfig.titleStrokeThickness,
            });

            text.anchor.set(0, 0.5);
            text.x = x;
            this.titleRoot.addChild(text);
            x += text.width + LoadingConfig.titleLetterSpacing;
        }

        this.titleRoot.pivot.x = x / 2;
    }

    #drawTrack() {
        const r = LoadingConfig.barRadius;
        const w = LoadingConfig.barWidth;
        const h = LoadingConfig.barHeight;

        this.track.clear();
        this.track.lineStyle(
            LoadingConfig.trackStrokeWidth,
            LoadingConfig.trackStrokeColor,
            1
        );
        this.track.beginFill(LoadingConfig.trackColor);
        this.track.drawRoundedRect(-w / 2, 0, w, h, r);
        this.track.endFill();
    }

    #layoutParts() {
        const titleHeight =
            LoadingConfig.titleFontSize + LoadingConfig.titleStrokeThickness;
        const blockHeight =
            titleHeight + LoadingConfig.titleGapAboveBar + LoadingConfig.barHeight;
        const top = -blockHeight / 2;

        this.titleRoot.y = top + titleHeight / 2;
        this.track.y = top + titleHeight + LoadingConfig.titleGapAboveBar;
        this.fillRoot.y = this.track.y;
        this.fillMask.y = this.track.y;
        this.fillRoot.x = -LoadingConfig.barWidth / 2;
        this.fillMask.x = -LoadingConfig.barWidth / 2;
    }

    #redrawFill() {
        if (!this.fillMask || !this.stripes) {
            return;
        }

        const fillWidth = LoadingConfig.barWidth * this.#progress;
        const h = LoadingConfig.barHeight;
        const r = Math.min(LoadingConfig.barRadius, fillWidth / 2);

        this.fillMask.clear();

        if (fillWidth > 0) {
            this.fillMask.beginFill(LoadingConfig.fillMaskColor);
            this.fillMask.drawRoundedRect(0, 0, fillWidth, h, r);
            this.fillMask.endFill();
        }

        this.#drawStripes();
    }

    #drawStripes() {
        const h = LoadingConfig.barHeight;
        const period = LoadingConfig.stripeWidth + LoadingConfig.stripeGap;
        const span = LoadingConfig.barWidth + period * 2;
        const offset = ((this.#stripeOffset % period) + period) % period;

        this.stripes.clear();
        this.stripes.beginFill(LoadingConfig.fillColor);
        this.stripes.drawRect(0, 0, LoadingConfig.barWidth, h);
        this.stripes.endFill();

        this.stripes.beginFill(LoadingConfig.stripeColor);

        for (let x = -period + offset; x < span; x += period) {
            this.stripes.moveTo(x, 0);
            this.stripes.lineTo(x + LoadingConfig.stripeWidth, 0);
            this.stripes.lineTo(
                x + LoadingConfig.stripeWidth + h * LoadingConfig.stripeSkew,
                h
            );
            this.stripes.lineTo(x + h * LoadingConfig.stripeSkew, h);
            this.stripes.closePath();
        }

        this.stripes.endFill();
    }

    #tick() {
        if (this.#progress <= 0 || !this.visible) {
            return;
        }

        this.#stripeOffset +=
            LoadingConfig.stripeSpeedPx * (this.ticker.deltaMS / 1000);
        this.#drawStripes();
    }
}
