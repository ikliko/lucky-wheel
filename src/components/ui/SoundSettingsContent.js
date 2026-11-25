import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';

export class SoundSettingsContent extends PIXI.Container {
    #soundsOn;
    #musicOn;
    #onSfxChange;
    #onMusicChange;
    #rows = [];

    constructor({
                    sfxEnabled = true,
                    musicEnabled = true,
                    onSfxChange = null,
                    onMusicChange = null,
                } = {}) {
        super();

        this.#soundsOn = Boolean(sfxEnabled);
        this.#musicOn = Boolean(musicEnabled);
        this.#onSfxChange = onSfxChange;
        this.#onMusicChange = onMusicChange;

        this.heading = new PIXI.Text('AUDIO', {
            fill: UiConfig.colorLabel,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.menuInfoHeadingSize,
            fontWeight: '700',
        });
        this.addChild(this.heading);

        this.dividers = new PIXI.Graphics();
        this.addChild(this.dividers);

        this.#rows = [
            this.#createRow('SOUNDS', 'sounds'),
            this.#createRow('MUSIC', 'music'),
        ];

        this.#paint();
    }

    sync({sfxEnabled, musicEnabled}) {
        this.#soundsOn = Boolean(sfxEnabled);
        this.#musicOn = Boolean(musicEnabled);
        this.#paint();
    }

    layout(width) {
        let y = 0;

        this.heading.position.set(0, y);
        y += this.heading.height + UiConfig.menuInfoSectionGap;

        this.dividers.clear();
        this.dividers.lineStyle(1, UiConfig.colorPanelStroke, 1);

        for (const row of this.#rows) {
            row.root.position.set(0, y);
            row.value.position.x = width;

            const rowH = Math.max(row.label.height, row.value.height);
            row.root.hitArea = new PIXI.Rectangle(0, 0, width, rowH);

            y += rowH + UiConfig.menuInfoLineGap;
            this.dividers.moveTo(0, y);
            this.dividers.lineTo(width, y);
            y += UiConfig.menuInfoLineGap;
        }
    }

    #createRow(labelText, id) {
        const root = new PIXI.Container();
        root.interactive = true;
        root.buttonMode = true;
        root.on('pointertap', () => this.#toggle(id));
        this.addChild(root);

        const label = new PIXI.Text(labelText, {
            fill: UiConfig.colorValue,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.menuInfoBodySize,
            fontWeight: '700',
        });
        root.addChild(label);

        const value = new PIXI.Text('', {
            fill: UiConfig.colorMuted,
            fontFamily: UiConfig.fontFamilyUi,
            fontSize: UiConfig.menuInfoBodySize,
            fontWeight: '700',
        });
        value.anchor.set(1, 0);
        root.addChild(value);

        return {id, root, label, value};
    }

    #toggle(id) {
        if (id === 'sounds') {
            this.#soundsOn = !this.#soundsOn;
            this.#onSfxChange?.(this.#soundsOn);
        } else {
            this.#musicOn = !this.#musicOn;
            this.#onMusicChange?.(this.#musicOn);
        }

        this.#paint();
    }

    #paint() {
        for (const row of this.#rows) {
            const on = row.id === 'sounds' ? this.#soundsOn : this.#musicOn;
            row.value.text = on ? 'ON' : 'OFF';
            row.value.style.fill = on
                ? UiConfig.colorSelected
                : UiConfig.colorMuted;
        }
    }
}