const KEY = 'lucky-wheel.session.v1';

export class SessionStorage {
    load() {
        try {
            const raw = localStorage.getItem(KEY);

            if (!raw) {
                return null;
            }

            const data = JSON.parse(raw);

            if (
                !data ||
                typeof data.sessionId !== 'string' ||
                !data.sessionId ||
                typeof data.accessToken !== 'string' ||
                !data.accessToken ||
                typeof data.userId !== 'string' ||
                !data.userId
            ) {
                return null;
            }

            return data;
        } catch {
            return null;
        }
    }

    save({sessionId, accessToken, userId}) {
        if (
            !sessionId ||
            !accessToken ||
            !userId
        ) {
            throw new Error('Invalid session credentials');
        }

        localStorage.setItem(
            KEY,
            JSON.stringify({
                sessionId,
                accessToken,
                userId,
            })
        );
    }

    clear() {
        localStorage.removeItem(KEY);
    }
}
