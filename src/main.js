import {GameApplication} from '@/core/GameApplication.js';

const game = new GameApplication();

game.start().catch((error) => {
    console.error('Failed to boot game', error);
});
