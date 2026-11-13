export class SceneManager {
    constructor(stage) {
        this.stage = stage;
        this.current = null;
    }

    show(scene) {
        if(this.current === scene) {
            return;
        }

        if(this.current) {
            this.current.onExit();
        }

        if(!scene.parent) {
            this.stage.addChild(scene);
        }

        scene.create();
        scene.onEnter();
        this.current = scene;
    }

    layoutScreen(screenWidth, screenHeight) {
        if(this.current) {
            this.current.layoutScreen(screenWidth, screenHeight);
        }
    }
}