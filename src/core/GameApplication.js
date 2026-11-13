import * as PIXI from 'pixi.js';
import {AppConfig} from '@/config/AppConfig.js';
import {AssetConfig} from '@/config/AssetConfig.js';
import {AssetManager} from '@/core/AssetManager.js';
import {Wheel} from '@/components/wheel/Wheel.js';

export class GameApplication {
    constructor() {
        this.app = new PIXI.Application({
            ...AppConfig,
            resizeTo: window,
            resolution: window.devicePixelRatio || 1,
        });

        this.assetManager = new AssetManager(this.app.loader);
        this.wheel = null;
    }

    async start() {
        document.getElementById('app').appendChild(this.app.view);

        const resources = await this.assetManager.load(AssetConfig);

        this.wheel = new Wheel(resources, () => {
            console.log('spin the wheel');
        });

        this.app.stage.addChild(this.wheel);

        const onResize = () => {
            this.wheel.layoutScreen(this.app.screen.width, this.app.screen.height);
        };

        onResize();
        this.app.renderer.on('resize', onResize);
    }
}
