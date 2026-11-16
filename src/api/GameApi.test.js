import {afterEach, describe, expect, it, vi} from 'vitest';
import {GameApi} from '@/api/GameApi.js';

function jsonResponse(body, status = 200) {
    return new Response(
        typeof body === 'string' ? body : JSON.stringify(body),
        {status}
    );
}

function stubFetch(impl) {
    const fetchMock = typeof impl === 'function'
        ? vi.fn(impl)
        : vi.fn().mockResolvedValue(impl);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function createApi(token = null, options = {}) {
    const api = new GameApi('/api/game', options);
    if (token) {
        api.setAccessToken(token);
    }
    return api;
}

function lastOptions(fetchMock) {
    return fetchMock.mock.calls[0][1];
}

describe('GameApi', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('creates a session without Authorization', async () => {
        const fetchMock = stubFetch(jsonResponse({session: {id: '123'}}, 201));

        await createApi().createSession();

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/game/session',
            expect.objectContaining({method: 'POST'})
        );
        expect(lastOptions(fetchMock).headers.Authorization).toBeUndefined();
    });

    it('sends bearer token for protected requests', async () => {
        const fetchMock = stubFetch(jsonResponse({}));

        await createApi('test-token').getSession('test-session');

        expect(lastOptions(fetchMock).headers.Authorization)
            .toBe('Bearer test-token');
    });

    it('preserves HTTP status on API errors', async () => {
        stubFetch(jsonResponse({
            error: {code: 'UNAUTHENTICATED', message: 'Unauthenticated.'},
        }, 401));

        await expect(createApi('invalid-token').getSession('123'))
            .rejects.toMatchObject({
                name: 'GameApiError',
                status: 401,
                code: 'UNAUTHENTICATED',
                message: 'Unauthenticated.',
            });
    });

    it('rejects malformed JSON with a typed error', async () => {
        stubFetch(jsonResponse('<html>Server error</html>', 502));

        await expect(createApi('token').getSession('123'))
            .rejects.toMatchObject({
                status: 502,
                code: 'INVALID_RESPONSE',
            });
    });

    it('handles network failures', async () => {
        stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

        await expect(createApi().createSession())
            .rejects.toMatchObject({code: 'NETWORK_ERROR'});
    });

    it('handles request timeout', async () => {
        vi.useFakeTimers();

        stubFetch((_url, options) => new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }));

        const request = createApi(null, {timeoutMs: 100}).createSession();
        const assertion = expect(request).rejects.toMatchObject({code: 'TIMEOUT'});

        await vi.advanceTimersByTimeAsync(100);
        await assertion;
    });

    it('spins with body, bearer token, and Idempotency-Key', async () => {
        const fetchMock = stubFetch(jsonResponse({roundId: 'r1'}));
        const spinBody = {sessionId: 'session-1', betCents: 100};

        await createApi('test-token').spin(spinBody, 'idem-1');

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/game/spin',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(spinBody),
            })
        );

        const headers = lastOptions(fetchMock).headers;
        expect(headers.Authorization).toBe('Bearer test-token');
        expect(headers['Idempotency-Key']).toBe('idem-1');
    });

    it('maps nested error.message and error.code from 422 bodies', async () => {
        stubFetch(jsonResponse({
            error: {
                code: 'INSUFFICIENT_BALANCE',
                message: 'Balance is lower than bet.',
            },
        }, 422));

        await expect(
            createApi('token').spin({sessionId: 'session-1', betCents: 100}, 'idem-1')
        ).rejects.toMatchObject({
            status: 422,
            code: 'INSUFFICIENT_BALANCE',
            message: 'Balance is lower than bet.',
        });
    });
});
