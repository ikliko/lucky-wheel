import * as PIXI from 'pixi.js';
import {Wheel} from '@/components/wheel/Wheel.js';
import {WheelPointer} from '@/components/wheel/WheelPointer.js';
import {SpinButton} from '@/components/ui/SpinButton/SpinButton.js';
import {BalanceDisplay} from '@/components/ui/BalanceDisplay/BalanceDisplay.js';
import {BalanceDisplayView} from '@/components/ui/BalanceDisplay/BalanceDisplayView.js';
import {BetSelector} from '@/components/ui/BetSelector/BetSelector.js';
import {BetSelectorView} from '@/components/ui/BetSelector/BetSelectorView.js';
import {WinDisplay} from '@/components/ui/WinDisplay/WinDisplay.js';
import {WinDisplayView} from '@/components/ui/WinDisplay/WinDisplayView.js';
import {GameConfig} from '@/config/GameConfig.js';
import {BaseScene} from '@/scenes/BaseScene.js';
import {WheelAnimator} from '@/components/wheel/WheelAnimator.js';

export class WheelScene extends BaseScene {
    #created = false;

    constructor(resources, ticker, onSpin, onBetSelected) {
        super();

        this.resources = resources;
        this.ticker = ticker;
        this.onSpin = onSpin;
        this.onBetSelected = onBetSelected;

        this.wheel = null;
        this.pointer = null;
        this.spinButton = null;
        this.animator = null;

        this.balanceDisplay = null;
        this.balanceView = null;
        this.betSelector = null;
        this.betView = null;
        this.winDisplay = null;
        this.winView = null;
        this.freeSpinsLabel = null;
        this.freeSpinsRemaining = null;
    }

    create() {
        if (this.#created) {
            return;
        }

        this.wheel = new Wheel();
        this.pointer = new WheelPointer(this.resources.arrow.texture);
        this.spinButton = new SpinButton(this.resources.btnStart.texture, this.onSpin);
        this.animator = new WheelAnimator(this.wheel, this.ticker);

        this.balanceDisplay = new BalanceDisplay();
        this.balanceView = new BalanceDisplayView(this.balanceDisplay);
        this.balanceView.position.set(0, GameConfig.wheelRadius + 40);

        this.betSelector = new BetSelector(
            GameConfig.quickBetsCents,
            (cents) => this.onBetSelected?.(cents),
            GameConfig.allowedBetsCents,
            GameConfig.defaultBetCents
        );
        this.betView = new BetSelectorView(this.betSelector);
        this.betView.position.set(0, GameConfig.wheelRadius + 85);

        this.winDisplay = new WinDisplay({durationMs: 1200});
        this.winView = new WinDisplayView(this.winDisplay);
        this.winView.position.set(0, -GameConfig.wheelRadius - 50);

        this.freeSpinsLabel = new PIXI.Text('', {
            fill: 0xffffff,
            fontSize: 36,
            fontWeight: '700',
        });
        this.freeSpinsLabel.anchor.set(0.5);
        this.freeSpinsLabel.position.set(0, -GameConfig.wheelRadius - 100);
        this.freeSpinsLabel.visible = false;

        this.addChild(this.wheel);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);
        this.addChild(this.balanceView);
        this.addChild(this.betView);
        this.addChild(this.winView);
        this.addChild(this.freeSpinsLabel);

        this.setSpinButtonVisible(true);
        this.#created = true;
    }

    async spinTo(sectorIndex) {
        if (!this.animator) {
            throw new Error('WheelAnimator is not initialized');
        }

        await this.animator.spinTo({sectorIndex});
    }

    setBalance(cents) {
        this.balanceDisplay.setCents(cents);
        this.balanceView?.sync();
    }

    setBet(cents) {
        this.betSelector.setSelected(cents);
        this.betView?.sync();
        this.wheel.setBetCents(cents);
    }

    setBetEnabled(enabled) {
        this.betSelector.setEnabled(enabled);
        this.betView?.sync();
    }

    setSpinButtonVisible(visible) {
        if (!this.spinButton) {
            return;
        }

        this.spinButton.visible = visible;
        this.spinButton.interactive = visible;
        this.spinButton.buttonMode = visible;
    }

    setFreeSpinsRemaining(remaining) {
        this.freeSpinsRemaining = remaining;
        this.#syncFreeSpinsLabel();
    }

    setAccumulatedWin(cents) {
        if (!this.winDisplay) {
            return;
        }

        this.winDisplay.hold(cents);
        this.winView?.sync();
    }

    clearAccumulatedWin() {
        if (!this.winDisplay) {
            return;
        }

        this.winDisplay.clear();
        this.winView?.sync();
    }

    async showWin(cents) {
        if (!this.winDisplay) {
            throw new Error('WinDisplay is not initialized');
        }

        try {
            const presentation = this.winDisplay.show(cents);

            this.winView?.sync();

            await presentation;
        } finally {
            this.winView?.sync();
        }
    }

    onEnter() {
        super.onEnter();
        this.balanceView?.sync();
        this.betView?.sync();
        this.winView?.sync();
        this.#syncFreeSpinsLabel();
    }

    onExit() {
        super.onExit();
    }

    #syncFreeSpinsLabel() {
        if (!this.freeSpinsLabel) {
            return;
        }

        const remaining = this.freeSpinsRemaining;

        if (!remaining || remaining < 1) {
            this.freeSpinsLabel.visible = false;
            this.freeSpinsLabel.text = '';
            return;
        }

        this.freeSpinsLabel.text = remaining === 1
            ? '1 Free Spin left'
            : `${remaining} Free Spins left`;
        this.freeSpinsLabel.visible = true;
    }

    destroy(options) {
        this.animator?.destroy();
        this.animator = null;

        this.winDisplay?.destroy();
        this.winDisplay = null;

        super.destroy(options);
    }

    layoutScreen(screenWidth, screenHeight) {
        const diameter = GameConfig.wheelRadius * 2;
        const fit = Math.min(screenWidth, screenHeight)
            * GameConfig.wheelFitRatio / diameter;
        this.scale.set(fit);
        this.position.set(screenWidth / 2, screenHeight / 2);
    }
}
