import {ApiConfig} from '@/config/ApiConfig.js';
import {GameApi} from '@/api/GameApi.js';
import {LocalGameApi} from '@/api/LocalGameApi.js';

export function createGameClient() {
    console.log(ApiConfig.mode);
    return ApiConfig.mode === 'local' ? new LocalGameApi() : new GameApi(ApiConfig.baseUrl);
}
