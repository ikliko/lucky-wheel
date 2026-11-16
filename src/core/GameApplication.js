
import * as PIXI from 'pixi.js';

import {AppConfig} from '@/config/AppConfig.js';
import {AssetConfig} from '@/config/AssetConfig.js';
import {ApiConfig} from '@/config/ApiConfig.js';

import {AssetManager} from '@/core/AssetManager.js';
import {SceneManager} from '@/core/SceneManager.js';

import {WheelScene} from '@/scenes/WheelScene.js';
import {GameController} from '@/game/GameController.js';

import {bootstrapSession} from '@/bootstrapSession.js';
import {SessionStorage} from '@/storage/SessionStorage.js';
import {GameApi} from '@/api/GameApi.js';

export class GameApplication {
    #starting = false;
    #started = false;
    #errorView = null;

    constructor() {
        this.app = new PIXI.Application({
            ...AppConfig,
            resizeTo: window,
            resolution: window.devicePixelRatio || 1,
        });

        this.assetManager = new AssetManager(this.app.loader);
        this.sceneManager = new SceneManager(this.app.stage);

        this.wheelScene = null;
        this.controller = null;
    }

    async start() {
        if (this.#starting || this.#started) {
            return;
        }

        this.#starting = true;
        this.#clearStartupError();

        try {
            const api = new GameApi(ApiConfig.baseUrl);
            const storage = new SessionStorage();

            const boot = await bootstrapSession(api, storage);
            const resources = await this.assetManager.load(AssetConfig);

            const container = document.getElementById('app');

            if (!container) {
                throw new Error('Application container not found');
            }

            if (!this.app.view.parentNode) {
                container.appendChild(this.app.view);
            }

            this.wheelScene = new WheelScene(
                resources,
                this.app.ticker,
                () => this.controller.onSpinPressed(),
                bet => this.controller.onBetSelected(bet)
            );

            this.controller = new GameController(
                this.wheelScene,
                undefined,
                {
                    api,
                    sessionId: boot.session.id,
                    balanceCents: boot.user.balanceCents,
                }
            );

            this.sceneManager.show(this.wheelScene);
            this.controller.boot();

            const onResize = () => {
                this.sceneManager.layoutScreen(
                    this.app.screen.width,
                    this.app.screen.height
                );
            };

            onResize();
            this.app.renderer.on('resize', onResize);

            this.#started = true;
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.#showStartupError();
        } finally {
            this.#starting = false;
        }
    }

    #showStartupError() {
        const container = document.getElementById('app');

        if (!container) {
            return;
        }

        const view = document.createElement('div');
        const message = document.createElement('p');
        const retry = document.createElement('button');

        message.textContent =
            'Unable to initialize the game. Please try again.';

        retry.textContent = 'Retry';
        retry.type = 'button';

        retry.addEventListener('click', () => {
            view.remove();
            this.#errorView = null;
            void this.start();
        });

        view.appendChild(message);
        view.appendChild(retry);
        container.appendChild(view);

        this.#errorView = view;
    }

    #clearStartupError() {
        this.#errorView?.remove();
        this.#errorView = null;
    }
}
