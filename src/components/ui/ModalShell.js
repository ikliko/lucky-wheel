import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {DimOverlay} from '@/components/ui/DimOverlay.js';

export class ModalShell extends PIXI.Container {
    constructor({title = '', onClose = null} = {}) {
        super();

        this.onClose = onClose;

        this.overlay = new DimOverlay();
        this.addChild(this.overlay);

        this.panel = new PIXI.Container();
        this.panel.interactive = true;
        this.overlay.content.addChild(this.panel);

        this.panelBg = new PIXI.Graphics();
        this.panel.addChild(this.panelBg);

        this.title = new PIXI.Text(title, {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.modalTitleSize,
            fontWeight: '700',
        });
        this.title.anchor.set(0.5, 0);
        this.panel.addChild(this.title);

        this.overlay.dim.on('pointertap', () => this.hide());
    }

    get isOpen() {
        return this.overlay.visible;
    }

    show() {
        this.overlay.show();
    }

    hide() {
        if (!this.isOpen) {
            return;
        }

        this.overlay.hide();
        this.onClose?.();
    }

    layoutDim(screenWidth, screenHeight) {
        this.overlay.layout(screenWidth, screenHeight);
    }

    layoutPanel(screenWidth, screenHeight, panelWidth, panelHeight) {
        const pad = UiConfig.modalPadding;

        this.panelBg.clear();
        this.panelBg.lineStyle(UiConfig.cardStrokeWidth, UiConfig.colorPanelStroke, 1);
        this.panelBg.beginFill(UiConfig.colorPanelFill);
        this.panelBg.drawRoundedRect(0, 0, panelWidth, panelHeight, UiConfig.modalRadius);
        this.panelBg.endFill();

        this.title.position.set(panelWidth / 2, pad);

        this.panel.position.set(
            (screenWidth - panelWidth) / 2,
            (screenHeight - panelHeight) / 2
        );
    }
}
