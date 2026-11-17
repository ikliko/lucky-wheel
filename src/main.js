import {GameApplication} from '@/core/GameApplication.js';

const game = new GameApplication();

const shutdown = () => game.destroy();
window.addEventListener('pagehide', shutdown);

if (import.meta.hot) {
    import.meta.hot.dispose(shutdown);
}

game.start().catch((error) => {
    console.error('Failed to boot game', error);
});
