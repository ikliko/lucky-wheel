import {afterEach, describe, expect, it, vi} from 'vitest';
import {GameApi} from '@/api/GameApi.js';

describe('GameApi', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('creates a session without Authorization', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({session: {id: '123'}}), {
                status: 201,
            })
        );

        vi.stubGlobal('fetch', fetchMock);

        const api = new GameApi('/api/game');
        await api.createSession();

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/game/session',
            expect.objectContaining({
                method: 'POST',
            })
        );

        const options = fetchMock.mock.calls[0][1];

        expect(options.headers.Authorization).toBeUndefined();
    });

    it('sends bearer token for protected requests', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response('{}', {status: 200})
        );

        vi.stubGlobal('fetch', fetchMock);

        const api = new GameApi('/api/game');
        api.setAccessToken('test-token');

        await api.getSession('test-session');

        const options = fetchMock.mock.calls[0][1];

        expect(options.headers.Authorization)
            .toBe('Bearer test-token');
    });

    it('preserves HTTP status on API errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({
                message: 'Unauthorized',
            }), {status: 401})
        ));

        const api = new GameApi('/api/game');
        api.setAccessToken('invalid-token');

        await expect(api.getSession('123')).rejects.toMatchObject({
            name: 'GameApiError',
            status: 401,
            code: 'HTTP_ERROR',
        });
    });

    it('rejects malformed JSON with a typed error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response('<html>Server error</html>', {
                status: 502,
            })
        ));

        const api = new GameApi('/api/game');
        api.setAccessToken('token');

        await expect(api.getSession('123')).rejects.toMatchObject({
            status: 502,
            code: 'INVALID_RESPONSE',
        });
    });

    it('handles network failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
            new TypeError('Failed to fetch')
        ));

        const api = new GameApi('/api/game');

        await expect(api.createSession()).rejects.toMatchObject({
            code: 'NETWORK_ERROR',
        });
    });

    it('handles request timeout', async () => {
        vi.useFakeTimers();

        vi.stubGlobal('fetch', vi.fn((_url, options) =>
            new Promise((_resolve, reject) => {
                options.signal.addEventListener('abort', () => {
                    reject(new DOMException(
                        'Aborted',
                        'AbortError'
                    ));
                });
            })
        ));

        const api = new GameApi('/api/game', {
            timeoutMs: 100,
        });

        const request = api.createSession();
        const assertion = expect(request).rejects.toMatchObject({
            code: 'TIMEOUT',
        });

        await vi.advanceTimersByTimeAsync(100);
        await assertion;
    });
});
