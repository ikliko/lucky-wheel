import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

export class BetCard extends PIXI.Container {
    #selected = false;
    #enabled = true;
    #width;
    #height;

    constructor({cents, onTap, width = UiConfig.cardWidth, height = UiConfig.cardHeight}) {
        super();

        this.cents = cents;
        this.onTap = onTap;
        this.#width = width;
        this.#height = height;

        this.bg = new PIXI.Graphics();
        this.addChild(this.bg);

        this.label = new PIXI.Text('BET', {
            fill: UiConfig.colorLabel,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.cardLabelSize,
            fontWeight: '700',
        });
        this.label.anchor.set(0.5);
        this.addChild(this.label);

        this.value = new PIXI.Text(MoneyFormatter.formatCents(cents), {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.cardValueSize,
            fontWeight: '700',
        });
        this.value.anchor.set(0.5);
        this.addChild(this.value);

        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = new PIXI.Rectangle(0, 0, width, height);
        this.on('pointertap', () => {
            if (this.#enabled) {
                this.onTap?.(this.cents);
            }
        });

        this.#layoutText();
        this.#draw();
    }

    setSelected(selected) {
        this.#selected = Boolean(selected);
        this.#draw();
    }

    setEnabled(enabled) {
        this.#enabled = Boolean(enabled);
        this.interactive = this.#enabled;
        this.buttonMode = this.#enabled;
        this.alpha = this.#enabled ? 1 : UiConfig.disabledAlpha;
    }

    #layoutText() {
        this.label.position.set(this.#width / 2, this.#height * 0.28);
        this.value.position.set(this.#width / 2, this.#height * 0.62);
    }

    #draw() {
        const fill = this.#selected ? UiConfig.colorSelected : UiConfig.colorCardFill;
        const stroke = this.#selected ? UiConfig.colorSelected : UiConfig.colorCardStroke;

        this.bg.clear();
        this.bg.lineStyle(UiConfig.cardStrokeWidth, stroke, 1);
        this.bg.beginFill(fill);
        this.bg.drawRoundedRect(0, 0, this.#width, this.#height, UiConfig.cardRadius);
        this.bg.endFill();

        this.label.style.fill = this.#selected
            ? UiConfig.colorSelectedText
            : UiConfig.colorLabel;
        this.value.style.fill = this.#selected
            ? UiConfig.colorSelectedText
            : UiConfig.colorValue;
    }
}
