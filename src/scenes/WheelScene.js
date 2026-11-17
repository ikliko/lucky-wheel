import {Wheel} from '@/components/wheel/Wheel.js';
import {WheelPointer} from '@/components/wheel/WheelPointer.js';
import {SpinButton} from '@/components/ui/SpinButton/SpinButton.js';
import {BalanceDisplay} from '@/components/ui/BalanceDisplay/BalanceDisplay.js';
import {BalanceDisplayView} from '@/components/ui/BalanceDisplay/BalanceDisplayView.js';
import {BetSelector} from '@/components/ui/BetSelector/BetSelector.js';
import {BetSelectorView} from '@/components/ui/BetSelector/BetSelectorView.js';
import {BetOptionsModal} from '@/components/ui/BetOptionsModal.js';
import {WinDisplay} from '@/components/ui/WinDisplay/WinDisplay.js';
import {CenterStatusPanel} from '@/components/ui/CenterStatusPanel.js';
import {AnimationConfig} from '@/config/AnimationConfig.js';
import {GameConfig} from '@/config/GameConfig.js';
import {UiConfig} from '@/config/UiConfig.js';
import {BaseScene} from '@/scenes/BaseScene.js';
import {WheelAnimator} from '@/components/wheel/WheelAnimator.js';

export class WheelScene extends BaseScene {
    #created = false;
    #screenWidth = 0;
    #screenHeight = 0;

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
        this.betOptions = null;
        this.winDisplay = null;
        this.centerStatus = null;
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

        this.betSelector = new BetSelector(
            GameConfig.allowedBetsCents,
            (cents) => this.onBetSelected?.(cents),
            GameConfig.defaultBetCents
        );
        this.betView = new BetSelectorView(this.betSelector, {
            onOpenMore: () => this.openBetOptions(),
            coinsTexture: this.resources.coins?.texture,
            chevronLeftTexture: this.resources.chevronLeft?.texture,
            chevronRightTexture: this.resources.chevronRight?.texture,
        });

        this.betOptions = new BetOptionsModal({
            model: this.betSelector,
            getBalanceText: () => this.balanceDisplay.text,
            onClose: () => this.betView?.sync(),
        });

        this.winDisplay = new WinDisplay({
            durationMs: AnimationConfig.winDisplayDurationMs,
        });
        this.centerStatus = new CenterStatusPanel();

        this.addChild(this.wheel);
        this.addChild(this.pointer);
        this.addChild(this.spinButton);
        this.addChild(this.centerStatus);
        this.addChild(this.balanceView);
        this.addChild(this.betView);

        this.#layoutChrome();
        this.setSpinButtonVisible(true);
        this.#created = true;
    }

    attachOverlayHost(host) {
        if (!this.betOptions || this.betOptions.parent === host) {
            return;
        }

        host.addChild(this.betOptions);
        this.#layoutBetOptions();
    }

    openBetOptions() {
        if (!this.betOptions || !this.betSelector.enabled) {
            return;
        }

        this.betOptions.show();
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

        if (this.betOptions?.isOpen) {
            this.betOptions.sync();
        }
    }

    setBet(cents) {
        this.betSelector.setSelected(cents);
        this.betView?.sync();
        this.wheel.setBetCents(cents);

        if (this.betOptions?.isOpen) {
            this.betOptions.sync();
        }
    }

    setBetEnabled(enabled) {
        this.betSelector.setEnabled(enabled);
        this.betView?.sync();

        if (!enabled && this.betOptions?.isOpen) {
            this.betOptions.hide();
        }
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
        this.centerStatus?.setFreeSpinsRemaining(remaining);
    }

    setAccumulatedWin(cents) {
        if (!this.winDisplay) {
            return;
        }

        if (!cents) {
            this.clearAccumulatedWin();
            return;
        }

        this.winDisplay.hold(cents);
        this.#syncCenterStatus();
    }

    clearAccumulatedWin() {
        if (!this.winDisplay) {
            return;
        }

        this.winDisplay.clear();
        this.#syncCenterStatus();
    }

    async showWin(cents) {
        if (!this.winDisplay) {
            throw new Error('WinDisplay is not initialized');
        }

        try {
            const presentation = this.winDisplay.show(cents);
            this.#syncCenterStatus();
            await presentation;
        } finally {
            this.#syncCenterStatus();
        }
    }

    onEnter() {
        super.onEnter();
        this.balanceView?.sync();
        this.betView?.sync();
        this.#syncCenterStatus();
    }

    onExit() {
        if (this.betOptions?.isOpen) {
            this.betOptions.hide();
        }

        super.onExit();
    }

    destroy(options) {
        this.animator?.destroy();
        this.animator = null;

        this.winDisplay?.destroy();
        this.winDisplay = null;

        this.betOptions?.destroy({children: true});
        this.betOptions = null;

        super.destroy(options);
    }

    layoutScreen(screenWidth, screenHeight) {
        this.#screenWidth = screenWidth;
        this.#screenHeight = screenHeight;

        if (!this.#created) {
            return;
        }

        this.#layoutChrome();

        const diameter = GameConfig.wheelRadius * 2;
        const top = -(GameConfig.wheelRadius + UiConfig.pointerTopPad);
        const bottom = GameConfig.wheelRadius
            + UiConfig.chromeBetGap
            + UiConfig.cardHeight / 2
            + UiConfig.chromeBottomPad;
        const contentHeight = bottom - top;
        const contentWidth = Math.max(diameter, this.betView.rowWidth);
        const pad = UiConfig.screenPadRatio;
        const fit = Math.min(
            (screenWidth * (1 - pad * 2)) / contentWidth,
            (screenHeight * (1 - pad * 2)) / contentHeight,
        );

        this.scale.set(fit);
        this.position.set(
            screenWidth / 2,
            screenHeight * (1 - UiConfig.screenBottomPadRatio) - bottom * fit,
        );
        this.#layoutBetOptions();
    }

    #layoutChrome() {
        this.balanceView.position.set(0, UiConfig.chromeBalanceGap + GameConfig.wheelRadius);
        this.betView.position.set(0, UiConfig.chromeBetGap + GameConfig.wheelRadius);
        this.centerStatus.position.set(0, 0);
    }

    #syncCenterStatus() {
        if (!this.centerStatus || !this.winDisplay) {
            return;
        }

        this.centerStatus.setWinText(
            this.winDisplay.visible ? this.winDisplay.text : ''
        );
    }

    #layoutBetOptions() {
        if (!this.betOptions || this.#screenWidth < 1 || this.#screenHeight < 1) {
            return;
        }

        this.betOptions.position.set(0, 0);
        this.betOptions.scale.set(1);
        this.betOptions.layout(this.#screenWidth, this.#screenHeight);
    }
}
