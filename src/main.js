import {GameApplication} from '@/core/GameApplication.js';
import {SoundsManager} from '@/core/audio/SoundsManager.js';

const game = new GameApplication();

const shutdown = () => {
    game.destroy();
    SoundsManager.stopAll();
};

window.addEventListener('pagehide', shutdown);

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        window.removeEventListener('pagehide', shutdown);
        shutdown();
    });
}

game.start().catch((error) => {
    console.error('Failed to boot game', error);
});
