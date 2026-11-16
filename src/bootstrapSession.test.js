
import {describe, it, expect, vi} from 'vitest';
import {bootstrapSession} from '@/bootstrapSession.js';
import {GameApiError} from '@/api/GameApiError.js';

const saved = {
    sessionId: 'session-1',
    userId: 'user-1',
    accessToken: 'token-1',
};

const sessionResponse = {
    user: {
        id: 'user-1',
        balanceCents: 100000,
    },
    session: {
        id: 'session-1',
    },
    lastRound: null,
};

function setup(error = null) {
    const api = {
        setAccessToken: vi.fn(),
        getSession: error
            ? vi.fn().mockRejectedValue(error)
            : vi.fn().mockResolvedValue(sessionResponse),
        createSession: vi.fn().mockResolvedValue({
            ...sessionResponse,
            accessToken: 'new-token',
        }),
    };

    const storage = {
        load: vi.fn().mockReturnValue(saved),
        save: vi.fn(),
        clear: vi.fn(),
    };

    return {api, storage};
}

describe('bootstrapSession', () => {
    it('restores a valid session', async () => {
        const {api, storage} = setup();

        const result = await bootstrapSession(api, storage);

        expect(result.session.id).toBe('session-1');
        expect(api.createSession).not.toHaveBeenCalled();
        expect(storage.clear).not.toHaveBeenCalled();
    });

    it.each([401, 404])(
        'replaces session on HTTP %i',
        async (status) => {
            const {api, storage} = setup(
                new GameApiError('Invalid session', {status})
            );

            await bootstrapSession(api, storage);

            expect(storage.clear).toHaveBeenCalledOnce();
            expect(api.createSession).toHaveBeenCalledOnce();
            expect(storage.save).toHaveBeenCalledOnce();
        }
    );

    it.each([500, 503])(
        'preserves session on HTTP %i',
        async (status) => {
            const {api, storage} = setup(
                new GameApiError('Server error', {status})
            );

            await expect(
                bootstrapSession(api, storage)
            ).rejects.toBeInstanceOf(GameApiError);

            expect(storage.clear).not.toHaveBeenCalled();
            expect(api.createSession).not.toHaveBeenCalled();
        }
    );

    it.each(['TIMEOUT', 'NETWORK_ERROR'])(
        'preserves session on %s',
        async (code) => {
            const {api, storage} = setup(
                new GameApiError('Connection failed', {code})
            );

            await expect(
                bootstrapSession(api, storage)
            ).rejects.toMatchObject({code});

            expect(storage.clear).not.toHaveBeenCalled();
            expect(api.createSession).not.toHaveBeenCalled();
        }
    );

    it('preserves session on malformed API response', async () => {
        const {api, storage} = setup();

        api.getSession.mockResolvedValue({
            user: null,
            session: null,
        });

        await expect(
            bootstrapSession(api, storage)
        ).rejects.toMatchObject({
            code: 'INVALID_RESPONSE',
        });

        expect(storage.clear).not.toHaveBeenCalled();
        expect(api.createSession).not.toHaveBeenCalled();
    });

    it('creates a session when none is saved', async () => {
        const {api, storage} = setup();
        storage.load.mockReturnValue(null);

        const result = await bootstrapSession(api, storage);

        expect(result.accessToken).toBe('new-token');
        expect(api.createSession).toHaveBeenCalledOnce();
        expect(storage.save).toHaveBeenCalledOnce();
    });
});
