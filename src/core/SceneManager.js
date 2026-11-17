export class SceneManager {
    constructor(stage, {onChromeElevate} = {}) {
        this.stage = stage;
        this.current = null;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.onChromeElevate = onChromeElevate;
    }

    show(scene) {
        if (this.current === scene) {
            return;
        }

        if (this.current) {
            this.current.onExit();
        }

        if (!scene.parent) {
            this.stage.addChild(scene);
        }

        scene.create();
        scene.onEnter();
        this.current = scene;

        if (this.screenWidth > 0 && this.screenHeight > 0) {
            scene.layoutScreen(this.screenWidth, this.screenHeight);
        }

        this.onChromeElevate?.();
    }

    layoutScreen(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        if (this.current) {
            this.current.layoutScreen(screenWidth, screenHeight);
        }
    }
}
