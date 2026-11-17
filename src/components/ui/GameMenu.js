import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {CircleIconButton} from '@/components/ui/CircleIconButton.js';
import {ModalShell} from '@/components/ui/ModalShell.js';
import {MenuInfoContent} from '@/components/ui/MenuInfoContent.js';

export class GameMenu extends ModalShell {
    #iconProgress = 0;
    #iconTarget = 0;
    #iconTick = null;
    #lines = [];
    #lineGap = 0;
    #ticker;
    #onOpen;

    constructor({ticker, onOpen = null} = {}) {
        super({title: 'INFO'});

        this.#ticker = ticker;
        this.#onOpen = onOpen;

        this.info = new MenuInfoContent();
        this.panel.addChild(this.info);

        this.button = this.#createHamburger();
        this.addChild(this.button);
        this.#paintIcon(0);
    }

    show() {
        super.show();
        this.#setIconOpen(true);
        this.#onOpen?.();
    }

    hide() {
        if (!this.isOpen) {
            return;
        }

        super.hide();
        this.#setIconOpen(false);
    }

    layout(screenWidth, screenHeight) {
        this.button.position.set(UiConfig.menuButtonPad, UiConfig.menuButtonPad);
        this.layoutDim(screenWidth, screenHeight);

        const ratio = UiConfig.menuPanelSizeRatio;
        const panelWidth = screenWidth * ratio;
        const panelHeight = screenHeight * ratio;
        const pad = UiConfig.modalPadding;
        const contentTop = pad + UiConfig.modalTitleSize + UiConfig.modalTitleGap;
        const contentWidth = panelWidth - pad * 2;

        this.layoutPanel(screenWidth, screenHeight, panelWidth, panelHeight);
        this.info.position.set(pad, contentTop);
        this.info.layout(contentWidth);
    }

    destroy(options) {
        this.#stopIconTick();
        super.destroy(options);
    }

    #createHamburger() {
        const size = UiConfig.menuButtonSize;
        const button = new CircleIconButton({
            size,
            fill: UiConfig.chromeButtonFill,
            fillAlpha: UiConfig.chromeButtonFillAlpha,
            stroke: UiConfig.chromeButtonStroke,
            strokeWidth: UiConfig.chromeButtonStrokeWidth,
            onTap: () => (this.isOpen ? this.hide() : this.show()),
        });

        const lineW = size * UiConfig.menuIconLineWidthRatio;
        const lineH = Math.max(2, size * UiConfig.menuIconLineHeightRatio);
        this.#lineGap = size * UiConfig.menuIconLineGapRatio;
        const cy = size / 2;

        this.#lines = [0, 1, 2].map(() => {
            const line = new PIXI.Graphics();
            line.beginFill(UiConfig.colorValue);
            line.drawRoundedRect(-lineW / 2, -lineH / 2, lineW, lineH, 1);
            line.endFill();
            line.position.set(cy, cy);
            button.addChild(line);
            return line;
        });

        return button;
    }

    #setIconOpen(open) {
        this.#iconTarget = open ? 1 : 0;

        if (this.#iconProgress === this.#iconTarget) {
            this.#stopIconTick();
            return;
        }

        if (this.#iconTick) {
            return;
        }

        this.#iconTick = () => {
            const step = (this.#ticker.deltaMS || 16) / UiConfig.menuIconAnimMs;
            const dir = Math.sign(this.#iconTarget - this.#iconProgress);
            this.#iconProgress = Math.max(0, Math.min(1, this.#iconProgress + dir * step));
            this.#paintIcon(this.#iconProgress);

            if (this.#iconProgress === this.#iconTarget) {
                this.#stopIconTick();
            }
        };

        this.#ticker.add(this.#iconTick);
    }

    #stopIconTick() {
        if (!this.#iconTick) {
            return;
        }

        this.#ticker.remove(this.#iconTick);
        this.#iconTick = null;
    }

    #paintIcon(t) {
        const [top, mid, bot] = this.#lines;
        const cy = UiConfig.menuButtonSize / 2;
        const gap = this.#lineGap * (1 - t);

        top.position.set(cy, cy - gap);
        top.rotation = (Math.PI / 4) * t;

        mid.position.set(cy, cy);
        mid.alpha = 1 - t;

        bot.position.set(cy, cy + gap);
        bot.rotation = (-Math.PI / 4) * t;
    }
}
