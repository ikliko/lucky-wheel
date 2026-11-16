
import {GameApiError} from '@/api/GameApiError.js';

export class GameApi {
    constructor(baseUrl, {timeoutMs = 10000} = {}) {
        if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
            throw new Error('No base url');
        }

        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.timeoutMs = timeoutMs;
        this.accessToken = null;
    }

    setAccessToken(token) {
        this.accessToken = token || null;
    }

    async createSession() {
        return this.#request('POST', '/session', {
            auth: false,
        });
    }

    async getSession(sessionId) {
        if (typeof sessionId !== 'string' || !sessionId) {
            throw new GameApiError('Invalid session ID', {
                code: 'INVALID_SESSION_ID',
            });
        }

        return this.#request(
            'GET',
            `/session/${encodeURIComponent(sessionId)}`
        );
    }

    async #request(method, path, {
        auth = true,
        body,
        headers = {},
    } = {}) {
        const finalHeaders = {
            Accept: 'application/json',
            ...headers,
        };

        if (body !== undefined) {
            finalHeaders['Content-Type'] = 'application/json';
        }

        if (auth) {
            if (!this.accessToken) {
                throw new GameApiError('Missing access token', {
                    code: 'MISSING_TOKEN',
                });
            }

            finalHeaders.Authorization = `Bearer ${this.accessToken}`;
        }

        const controller = new AbortController();
        let timedOut = false;

        const timeout = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, this.timeoutMs);

        try {
            const response = await fetch(
                `${this.baseUrl}${path}`,
                {
                    method,
                    headers: finalHeaders,
                    body: body === undefined
                        ? undefined
                        : JSON.stringify(body),
                    signal: controller.signal,
                }
            );

            const responseText = await response.text();
            let data = null;

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new GameApiError(
                        'Invalid JSON response from server',
                        {
                            status: response.status,
                            code: 'INVALID_RESPONSE',
                        }
                    );
                }
            }

            if (!response.ok) {
                throw new GameApiError(
                    data?.message || `HTTP ${response.status}`,
                    {
                        status: response.status,
                        code: 'HTTP_ERROR',
                        body: data,
                    }
                );
            }

            return data;
        } catch (error) {
            if (error instanceof GameApiError) {
                throw error;
            }

            if (timedOut) {
                throw new GameApiError('Request timed out', {
                    code: 'TIMEOUT',
                });
            }

            throw new GameApiError('Network request failed', {
                code: 'NETWORK_ERROR',
            });
        } finally {
            clearTimeout(timeout);
        }
    }
}
