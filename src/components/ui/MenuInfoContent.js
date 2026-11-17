import * as PIXI from 'pixi.js';
import {UiConfig} from '@/config/UiConfig.js';
import {MenuInfoConfig} from '@/config/MenuInfoConfig.js';

export class MenuInfoContent extends PIXI.Container {
    #blocks = [];

    constructor() {
        super();

        for (const section of MenuInfoConfig.sections) {
            const heading = new PIXI.Text(section.heading, {
                fill: UiConfig.colorLabel,
                fontFamily: UiConfig.fontFamilyUi,
                fontSize: UiConfig.menuInfoHeadingSize,
                fontWeight: '700',
            });
            this.addChild(heading);

            const lines = section.lines.map(({label, text}) => {
                const row = new PIXI.Text(`${label} - ${text}`, {
                    fill: UiConfig.colorValue,
                    fontFamily: UiConfig.fontFamilyUi,
                    fontSize: UiConfig.menuInfoBodySize,
                    fontWeight: '400',
                    wordWrap: true,
                });
                this.addChild(row);
                return row;
            });

            this.#blocks.push({heading, lines});
        }
    }

    layout(width) {
        let y = 0;

        for (const {heading, lines} of this.#blocks) {
            heading.position.set(0, y);
            y += heading.height + UiConfig.menuInfoLineGap;

            for (const row of lines) {
                row.style.wordWrapWidth = width;
                row.position.set(0, y);
                y += row.height + UiConfig.menuInfoLineGap;
            }

            y += UiConfig.menuInfoSectionGap - UiConfig.menuInfoLineGap;
        }
    }
}
