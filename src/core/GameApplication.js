import * as PIXI from 'pixi.js';
import {AppConfig} from '@/config/AppConfig.js';
import {AssetConfig} from '@/config/AssetConfig.js';
import {AssetManager} from '@/core/AssetManager.js';
import {SceneManager} from "@/core/SceneManager.js";
import {WheelScene} from "@/scenes/WheelScene.js";

export class GameApplication {
    constructor() {
        this.app = new PIXI.Application({
            ...AppConfig,
            resizeTo: window,
            resolution: window.devicePixelRatio || 1,
        });

        this.assetManager = new AssetManager(this.app.loader);
        this.sceneManager = new SceneManager(this.app.stage);
        this.wheelScene = null;
    }

    async start() {
        document.getElementById('app').appendChild(this.app.view);

        const resources = await this.assetManager.load(AssetConfig);

        this.wheelScene = new WheelScene(resources, this.app.ticker, () => {
            this.wheelScene.spinTo(6);
        });

        this.sceneManager.show(this.wheelScene);

        const onResize = () => {
            this.sceneManager.layoutScreen(this.app.screen.width, this.app.screen.height);
        };

        onResize();
        this.app.renderer.on('resize', onResize);
    }
}
