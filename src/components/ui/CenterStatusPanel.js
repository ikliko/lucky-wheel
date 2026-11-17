import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';

export class CenterStatusPanel extends PIXI.Container {
    constructor() {
        super();

        this.bg = new PIXI.Graphics();
        this.addChild(this.bg);

        this.winLabel = new PIXI.Text('', {
            fill: UiConfig.colorLabel,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.hubWinSize,
            fontWeight: '700',
        });
        this.winLabel.anchor.set(0.5);
        this.addChild(this.winLabel);

        this.freeSpinsLabel = new PIXI.Text('', {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.hubFreeSpinsSize,
            fontWeight: '700',
        });
        this.freeSpinsLabel.anchor.set(0.5);
        this.addChild(this.freeSpinsLabel);

        this.#drawBg();
        this.#layout();
        this.visible = false;
    }

    setWinText(text) {
        this.winLabel.text = text || '';
        this.#refresh();
    }

    setFreeSpinsRemaining(remaining) {
        if (!remaining || remaining < 1) {
            this.freeSpinsLabel.text = '';
        } else {
            this.freeSpinsLabel.text = remaining === 1
                ? '1 Free Spin left'
                : `${remaining} Free Spins left`;
        }

        this.#refresh();
    }

    #refresh() {
        const hasWin = Boolean(this.winLabel.text);
        const hasFs = Boolean(this.freeSpinsLabel.text);
        this.visible = hasWin || hasFs;
        this.#layout();
    }

    #layout() {
        const hasWin = Boolean(this.winLabel.text);
        const hasFs = Boolean(this.freeSpinsLabel.text);

        this.winLabel.visible = hasWin;
        this.freeSpinsLabel.visible = hasFs;

        if (hasWin && hasFs) {
            this.winLabel.y = -UiConfig.hubWinGap;
            this.freeSpinsLabel.y = UiConfig.hubWinSize * 0.55;
        } else if (hasWin) {
            this.winLabel.y = 0;
        } else if (hasFs) {
            this.freeSpinsLabel.y = 0;
        }
    }

    #drawBg() {
        const w = UiConfig.hubPanelWidth;
        const h = UiConfig.hubPanelHeight;

        this.bg.clear();
        this.bg.beginFill(UiConfig.colorHubPanel, UiConfig.hubPanelAlpha);
        this.bg.drawRoundedRect(-w / 2, -h / 2, w, h, UiConfig.hubPanelRadius);
        this.bg.endFill();
    }
}
