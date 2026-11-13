import * as PIXI from 'pixi.js';
import {appConfig} from '@/config/app.js';
import {loadAssets} from '@/core/assetLoader.js';
import {assetConfig} from '@/config/assetsConfig.js';
import {layoutConfig} from '@/config/layoutConfig.js';

const app = new PIXI.Application({
    ...appConfig,
    resizeTo: window,
    resolution: window.devicePixelRatio || 1,
});

document.getElementById('app').appendChild(app.view);

function layoutLocal(wheel, arrow, startButton) {
    wheel.anchor.set(0.5);
    wheel.position.set(0, 0);

    arrow.anchor.set(0.5, 0);
    arrow.scale.set(layoutConfig.arrowLocalHeight / arrow.texture.height);
    arrow.position.set(
        0,
        -wheel.texture.height / 2 - arrow.height + layoutConfig.arrowLocalOverlap,
    );

    startButton.anchor.set(0.5);
    startButton.scale.set(
        layoutConfig.startLocalDiameter / startButton.texture.width,
    );
    startButton.position.set(0, 0)
}

function layoutScreen(field, wheel) {
    const w = app.screen.width;
    const h = app.screen.height;

    const fit = Math.min(w, h) * layoutConfig.wheelFitRatio / wheel.texture.width;
    field.scale.set(fit);
    field.position.set(w / 2, h / 2);
}

async function boot() {
    const resources = await loadAssets(app.loader, assetConfig);

    const wheel = new PIXI.Sprite(resources.wheel.texture);
    const arrow = new PIXI.Sprite(resources.arrow.texture);
    const startButton = new PIXI.Sprite(resources.btnStart.texture);
    const field = new PIXI.Container();

    startButton.interactive = true
    startButton.buttonMode = true
    startButton.on('pointertap', (e) => {
        console.log('spin the wheel');
    })

    layoutLocal(wheel, arrow, startButton);

    field.addChild(wheel);
    field.addChild(arrow);
    field.addChild(startButton);

    app.stage.addChild(field);

    const onResize = () => layoutScreen(field, wheel);
    onResize()
    app.renderer.on('resize', onResize);
}

boot().catch((error) => {
    console.error('Failed to boot game', error);
});
