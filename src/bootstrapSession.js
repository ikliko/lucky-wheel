import {GameApiError} from '@/api/GameApiError.js';

function validateSessionResponse(data) {
    if (
        !data ||
        !data.user ||
        !data.session ||
        typeof data.session.id !== 'string' ||
        !Number.isSafeInteger(data.user.balanceCents) ||
        data.user.balanceCents < 0
    ) {
        throw new GameApiError(
            'Invalid session response',
            {code: 'INVALID_RESPONSE'}
        );
    }

    return data;
}

export async function bootstrapSession(api, storage) {
    const saved = storage.load();

    if (saved?.sessionId && saved?.accessToken) {
        api.setAccessToken(saved.accessToken);

        try {
            const data = validateSessionResponse(
                await api.getSession(saved.sessionId)
            );

            if (data.session.id !== saved.sessionId) {
                throw new GameApiError(
                    'Session ID mismatch',
                    {code: 'INVALID_RESPONSE'}
                );
            }

            return {
                user: data.user,
                session: data.session,
                accessToken: saved.accessToken,
                lastRound: data.lastRound ?? null,
            };
        } catch (error) {
            const invalidSession =
                error instanceof GameApiError &&
                [401, 404].includes(error.status);

            if (!invalidSession) {
                throw error;
            }

            storage.clear();
            api.setAccessToken(null);
        }
    }

    const created = await api.createSession();

    if (
        !created ||
        typeof created.accessToken !== 'string' ||
        !created.accessToken ||
        !created.user ||
        typeof created.user.id !== 'string'
    ) {
        throw new GameApiError(
            'Invalid session creation response',
            {code: 'INVALID_RESPONSE'}
        );
    }

    validateSessionResponse(created);

    storage.save({
        sessionId: created.session.id,
        accessToken: created.accessToken,
        userId: created.user.id,
    });

    api.setAccessToken(created.accessToken);

    return {
        user: created.user,
        session: created.session,
        accessToken: created.accessToken,
        lastRound: null,
    };
}
