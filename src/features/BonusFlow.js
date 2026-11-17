import {BonusController} from '@/features/BonusController.js';

export class BonusFlow {
    constructor(sceneManager, bonusScene, wheelScene, bonusController = null) {
        this.sceneManager = sceneManager;
        this.bonusScene = bonusScene;
        this.wheelScene = wheelScene;
        this.bonusController = bonusController ?? new BonusController(bonusScene);
    }

    async play(bonus) {
        this.sceneManager.show(this.bonusScene);

        try {
            return await this.bonusController.play(bonus);
        } finally {
            this.sceneManager.show(this.wheelScene);
        }
    }
}
