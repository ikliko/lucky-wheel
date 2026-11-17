import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';
import {BetCard} from '@/components/ui/BetCard.js';
import {ModalShell} from '@/components/ui/ModalShell.js';

export class BetOptionsModal extends ModalShell {
    #cards = new Map();
    #getBalanceText;

    constructor({model, getBalanceText, onClose}) {
        super({title: 'BET OPTIONS', onClose});

        this.model = model;
        this.#getBalanceText = getBalanceText;

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
    }

    show() {
        this.sync();
        super.show();
    }

    layout(screenWidth, screenHeight) {
        this.layoutDim(screenWidth, screenHeight);
        this.#layoutContent(screenWidth, screenHeight);
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

    #layoutContent(screenWidth, screenHeight) {
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
            pad
                + UiConfig.modalTitleSize
                + UiConfig.modalTitleGap
                + gridHeight
                + 28
                + UiConfig.modalFooterSize
                + pad,
            screenHeight * UiConfig.modalMaxHeightRatio
        );

        this.layoutPanel(screenWidth, screenHeight, panelWidth, panelHeight);

        const gridTop = pad + UiConfig.modalTitleSize + UiConfig.modalTitleGap;
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
    }
}
