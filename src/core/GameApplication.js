import * as PIXI from 'pixi.js';

import {AppConfig} from '@/config/AppConfig.js';
import {AssetConfig} from '@/config/AssetConfig.js';
import {ApiConfig} from '@/config/ApiConfig.js';
import {LoadingConfig} from '@/config/LoadingConfig.js';

import {AssetManager} from '@/core/AssetManager.js';
import {SceneManager} from '@/core/SceneManager.js';
import {KeyboardControls} from '@/core/KeyboardControls.js';

import {LoadingScene} from '@/scenes/LoadingScene.js';
import {WheelScene} from '@/scenes/WheelScene.js';
import {BonusScene} from '@/scenes/BonusScene.js';
import {BonusFlow} from '@/features/BonusFlow.js';
import {GameController} from '@/game/GameController.js';

import {bootstrapSession} from '@/bootstrapSession.js';
import {SessionStorage} from '@/storage/SessionStorage.js';
import {GameApi} from '@/api/GameApi.js';

export class GameApplication {
    #starting = false;
    #started = false;
    #destroyed = false;
    #errorView = null;
    #onResize = null;

    constructor() {
        this.app = new PIXI.Application({
            ...AppConfig,
            resizeTo: window,
            resolution: window.devicePixelRatio || 1,
        });

        this.assetManager = new AssetManager(this.app.loader);
        this.sceneManager = new SceneManager(this.app.stage);

        this.loadingScene = null;
        this.wheelScene = null;
        this.bonusScene = null;
        this.controller = null;
        this.keyboard = null;
    }

    async start() {
        if (this.#destroyed || this.#starting || this.#started) {
            return;
        }

        this.#starting = true;
        this.#clearStartupError();
        this.#disposeBootArtifacts();

        try {
            const container = document.getElementById('app');

            if (!container) {
                throw new Error('Application container not found');
            }

            if (!this.app.view.parentNode) {
                container.appendChild(this.app.view);
            }

            this.#resetLoadingScene();
            this.loadingScene = new LoadingScene(this.app.ticker);
            this.sceneManager.show(this.loadingScene);
            this.#ensureResizeHook();
            this.#onResize();

            const resources = await this.assetManager.load(
                AssetConfig,
                progress => {
                    this.loadingScene.setProgress(
                        LoadingConfig.assetProgressMax * progress
                    );
                }
            );

            this.loadingScene.setProgress(LoadingConfig.pendingProgress);

            const api = new GameApi(ApiConfig.baseUrl);
            const storage = new SessionStorage();
            const boot = await bootstrapSession(api, storage);

            this.wheelScene = new WheelScene(
                resources,
                this.app.ticker,
                () => this.controller.onSpinPressed(),
                bet => this.controller.onBetSelected(bet)
            );

            this.bonusScene = new BonusScene(resources);

            this.controller = new GameController(
                this.wheelScene,
                undefined,
                {
                    api,
                    sessionId: boot.session.id,
                    balanceCents: boot.user.balanceCents,
                    bonusFlow: new BonusFlow(
                        this.sceneManager,
                        this.bonusScene,
                        this.wheelScene,
                    ),
                }
            );

            this.loadingScene.setProgress(1);
            this.sceneManager.show(this.wheelScene);
            this.wheelScene.attachOverlayHost(this.app.stage);
            this.#resetLoadingScene();
            this.#onResize();
            this.controller.boot();
            this.#ensureKeyboardHook();

            this.#started = true;
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.#disposeBootArtifacts();
            this.#showStartupError();
        } finally {
            this.#starting = false;
        }
    }

    #disposeBootArtifacts() {
        this.keyboard?.detach();
        this.keyboard = null;
        this.controller = null;

        if (this.wheelScene) {
            if (this.sceneManager.current === this.wheelScene) {
                this.sceneManager.current = null;
            }

            this.wheelScene.destroy({children: true});
            this.wheelScene = null;
        }

        if (this.bonusScene) {
            if (this.sceneManager.current === this.bonusScene) {
                this.sceneManager.current = null;
            }

            this.bonusScene.destroy({children: true});
            this.bonusScene = null;
        }
    }

    #resetLoadingScene() {
        if (!this.loadingScene) {
            return;
        }

        if (this.sceneManager.current === this.loadingScene) {
            this.sceneManager.current = null;
        }

        this.loadingScene.destroy({children: true});
        this.loadingScene = null;
    }

    #ensureResizeHook() {
        if (this.#onResize) {
            return;
        }

        this.#onResize = () => {
            this.sceneManager.layoutScreen(
                this.app.screen.width,
                this.app.screen.height
            );
        };

        this.app.renderer.on('resize', this.#onResize);
    }

    #ensureKeyboardHook() {
        if (this.keyboard) {
            return;
        }

        this.keyboard = new KeyboardControls({
            isWheelActive: () => (
                this.sceneManager.current === this.wheelScene
                && !this.wheelScene?.betOptions?.isOpen
            ),
            isBonusActive: () => this.sceneManager.current === this.bonusScene,
            onSpin: () => this.controller?.onSpinPressed(),
            onBonusPick: (cellIndex) => this.bonusScene?.pickCell(cellIndex),
        });
        this.keyboard.attach();
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

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.#disposeBootArtifacts();

        if (this.#onResize) {
            this.app.renderer.off('resize', this.#onResize);
            this.#onResize = null;
        }

        this.#clearStartupError();
        this.#resetLoadingScene();
        this.sceneManager.current = null;

        this.app.destroy(true, {children: true});
        this.#started = false;
        this.#starting = false;
    }
}
