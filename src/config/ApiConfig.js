const mode = import.meta.env.VITE_GAME_MODE || 'api';
const baseUrl = import.meta.env.VITE_GAME_API_BASE_URL;

if (mode !== 'local' && !baseUrl) {
    throw new Error('VITE_GAME_API_BASE_URL is not set');
}

export const ApiConfig = {
    mode,
    baseUrl,
};
