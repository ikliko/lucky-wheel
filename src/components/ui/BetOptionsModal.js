import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';
import {DimOverlay} from '@/components/ui/DimOverlay.js';
import {BetCard} from '@/components/ui/BetCard.js';

export class BetOptionsModal extends PIXI.Container {
    #cards = new Map();
    #getBalanceText;

    constructor({model, getBalanceText, onClose}) {
        super();

        this.model = model;
        this.#getBalanceText = getBalanceText;
        this.onClose = onClose;

        this.overlay = new DimOverlay();
        this.addChild(this.overlay);

        this.panel = new PIXI.Container();
        this.panel.interactive = true;
        this.overlay.content.addChild(this.panel);

        this.panelBg = new PIXI.Graphics();
        this.panel.addChild(this.panelBg);

        this.title = new PIXI.Text('BET OPTIONS', {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.modalTitleSize,
            fontWeight: '700',
        });
        this.title.anchor.set(0.5, 0);
        this.panel.addChild(this.title);

        this.grid = new PIXI.Container();
        this.panel.addChild(this.grid);

        this.footerBalance = new PIXI.Text('', {
            fill: UiConfig.colorLabel,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.modalFooterSize,
            fontWeight: '700',
        });
        this.footerBet = new PIXI.Text('', {
            fill: UiConfig.colorLabel,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.modalFooterSize,
            fontWeight: '700',
        });
        this.panel.addChild(this.footerBalance);
        this.panel.addChild(this.footerBet);

        this.#buildGrid();

        this.visible = false;
        this.interactiveChildren = false;
        this.overlay.dim.on('pointertap', () => this.hide());
    }

    show() {
        this.sync();
        this.visible = true;
        this.interactiveChildren = true;
        this.overlay.show();
    }

    hide() {
        this.overlay.hide();
        this.visible = false;
        this.interactiveChildren = false;
        this.onClose?.();
    }

    get isOpen() {
        return this.visible;
    }

    layout(screenWidth, screenHeight) {
        this.overlay.layout(screenWidth, screenHeight);
        this.#layoutPanel(screenWidth, screenHeight);
    }

    sync() {
        for (const [cents, card] of this.#cards) {
            card.setSelected(cents === this.model.selectedBetCents);
            card.setEnabled(this.model.enabled);
        }

        this.footerBalance.text = `BALANCE: ${this.#getBalanceText?.() ?? '—'}`;
        this.footerBet.text = `BET: ${MoneyFormatter.formatCents(this.model.selectedBetCents)}`;
    }

    #buildGrid() {
        for (const cents of this.model.allowedBetsCents) {
            const card = new BetCard({
                cents,
                width: UiConfig.modalCardWidth,
                height: UiConfig.modalCardHeight,
                onTap: (value) => this.#onPick(value),
            });
            this.#cards.set(cents, card);
            this.grid.addChild(card);
        }
    }

    #onPick(cents) {
        this.model.selectBet(cents);
        this.sync();
        this.hide();
    }

    #layoutPanel(screenWidth, screenHeight) {
        const cols = UiConfig.modalColumns;
        const gap = UiConfig.modalGap;
        const pad = UiConfig.modalPadding;
        const cardW = UiConfig.modalCardWidth;
        const cardH = UiConfig.modalCardHeight;
        const count = this.model.allowedBetsCents.length;
        const rows = Math.ceil(count / cols);

        const gridWidth = cols * cardW + (cols - 1) * gap;
        const gridHeight = rows * cardH + (rows - 1) * gap;
        const panelWidth = Math.min(
            gridWidth + pad * 2,
            screenWidth * UiConfig.modalMaxWidthRatio
        );
        const panelHeight = Math.min(
            pad + UiConfig.modalTitleSize + 16 + gridHeight + 28 + UiConfig.modalFooterSize + pad,
            screenHeight * UiConfig.modalMaxHeightRatio
        );

        this.panelBg.clear();
        this.panelBg.lineStyle(UiConfig.cardStrokeWidth, UiConfig.colorPanelStroke, 1);
        this.panelBg.beginFill(UiConfig.colorPanelFill);
        this.panelBg.drawRoundedRect(0, 0, panelWidth, panelHeight, UiConfig.modalRadius);
        this.panelBg.endFill();

        this.title.position.set(panelWidth / 2, pad);

        const gridTop = pad + UiConfig.modalTitleSize + 16;
        let index = 0;

        for (const cents of this.model.allowedBetsCents) {
            const card = this.#cards.get(cents);
            const col = index % cols;
            const row = Math.floor(index / cols);
            card.position.set(col * (cardW + gap), row * (cardH + gap));
            index += 1;
        }

        this.grid.position.set((panelWidth - gridWidth) / 2, gridTop);

        const footerY = panelHeight - pad - UiConfig.modalFooterSize;
        this.footerBalance.position.set(pad, footerY);
        this.footerBet.anchor.set(1, 0);
        this.footerBet.position.set(panelWidth - pad, footerY);

        this.panel.position.set(
            (screenWidth - panelWidth) / 2,
            (screenHeight - panelHeight) / 2
        );
    }
}
