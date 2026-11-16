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

        this.addChild(this.wheel);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);
        this.addChild(this.balanceView);
        this.addChild(this.betView);
        this.addChild(this.winView);

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

    onExit() {
        this.animator?.cancel();
        this.winDisplay?.cancel();
        this.winView?.sync();

        super.onExit();
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
