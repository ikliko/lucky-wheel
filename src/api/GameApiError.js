
export class GameApiError extends Error {
    constructor(message, {
        status = 0,
        code = 'API_ERROR',
        body = null,
    } = {}) {
        super(message);

        this.name = 'GameApiError';
        this.status = status;
        this.code = code;
        this.body = body;
    }
}
