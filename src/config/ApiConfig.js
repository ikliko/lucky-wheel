const {VITE_GAME_API_BASE_URL} = import.meta.env;
if (!VITE_GAME_API_BASE_URL) {
    throw new Error('VITE_GAME_API_BASE_URL is not set');
}
export const ApiConfig = {
    baseUrl: VITE_GAME_API_BASE_URL,
};
