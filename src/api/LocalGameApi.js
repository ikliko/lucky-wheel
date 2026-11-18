import {GameApiError} from '@/api/GameApiError.js';
import {GameConfig} from '@/config/GameConfig.js';
import {pickSector} from '@/math/pickSector.js';
import {bonusSequence} from '@/math/bonusSequence.js';
import {freeSpinsBatch} from '@/math/freeSpinsBatch.js';

export class LocalGameApi {
    #rounds = new Map();

    constructor({random = Math.random} = {}) {
        this.random = random;
        this.accessToken = null;
        this.user = null;
        this.session = null;
        this.balanceCents = 0;
        this.spinCount = 0;
    }

    setAccessToken(token) {
        this.accessToken = token || null;
    }

    async createSession() {
        this.user = {id: crypto.randomUUID()};
        this.session = {
            id: crypto.randomUUID(),
            configVersion: 'local',
            status: 'active',
            mainSpinsPlayed: 0,
            spinsRemainingInPlan: 0,
        };
        this.balanceCents = GameConfig.initialBalanceCents;
        this.spinCount = 0;
        this.#rounds.clear();

        const accessToken = crypto.randomUUID();

        return {
            user: {
                id: this.user.id,
                balanceCents: this.balanceCents,
            },
            session: {...this.session},
            accessToken,
        };
    }

    async getSession(sessionId) {
        this.#assertSessionId(sessionId);
        this.#assertToken();

        if (!this.session || this.session.id !== sessionId) {
            throw new GameApiError('Game session was not found.', {
                status: 404,
                code: 'SESSION_NOT_FOUND',
            });
        }

        return {
            user: {
                id: this.user.id,
                balanceCents: this.balanceCents,
            },
            session: {
                ...this.session,
                mainSpinsPlayed: this.spinCount,
            },
            lastRound: null,
        };
    }

    async spin({sessionId, betCents}, idempotencyKey) {
        this.#assertSessionId(sessionId);
        this.#assertBet(betCents);
        this.#assertIdempotencyKey(idempotencyKey);
        this.#assertToken();

        if (!this.session || this.session.id !== sessionId) {
            throw new GameApiError('Game session was not found.', {
                status: 404,
                code: 'SESSION_NOT_FOUND',
            });
        }

        const existing = this.#rounds.get(idempotencyKey);

        if (existing) {
            if (existing.betCents !== betCents || existing.sessionId !== sessionId) {
                throw new GameApiError(
                    'Idempotency key was already used with a different payload.',
                    {status: 409, code: 'IDEMPOTENCY_CONFLICT'}
                );
            }

            return existing;
        }

        if (!GameConfig.allowedBetsCents.includes(betCents)) {
            throw new GameApiError('Bet amount is not allowed.', {
                status: 422,
                code: 'INVALID_BET',
            });
        }

        if (this.balanceCents < betCents) {
            throw new GameApiError('Balance is lower than bet.', {
                status: 422,
                code: 'INSUFFICIENT_BALANCE',
                body: {
                    balanceCents: this.balanceCents,
                    betCents,
                },
            });
        }

        const result = this.#result(betCents);
        const balanceBeforeCents = this.balanceCents;
        const balanceAfterBetCents = balanceBeforeCents - betCents;
        const balanceAfterRoundCents = balanceAfterBetCents + result.winCents;

        this.balanceCents = balanceAfterRoundCents;
        this.spinCount += 1;

        const round = {
            roundId: crypto.randomUUID(),
            sessionId,
            configVersion: 'local',
            betCents,
            balanceBeforeCents,
            balanceAfterBetCents,
            balanceAfterRoundCents,
            winCents: result.winCents,
            result,
            plan: {
                planNumber: 1,
                spinNumber: this.spinCount,
                spinsRemaining: 0,
            },
        };

        this.#rounds.set(idempotencyKey, round);

        return round;
    }

    #result(betCents) {
        const {sector, sectorIndex} = pickSector(GameConfig.sectors, this.random);
        const result = {
            sectorId: sector.id,
            sectorIndex,
            type: sector.type,
        };

        if (sector.type === 'win') {
            result.winCents = Math.round(betCents * sector.multiplier);
        } else if (sector.type === 'bonus') {
            const bonus = bonusSequence(betCents, this.random);
            result.bonus = bonus;
            result.winCents = bonus.finalWinCents;
        } else if (sector.type === 'free_spins') {
            const freeSpins = freeSpinsBatch(betCents, this.random);
            result.freeSpins = freeSpins;
            result.winCents = freeSpins.totalWinCents;
        } else {
            result.winCents = 0;
        }

        return result;
    }

    #assertSessionId(sessionId) {
        if (typeof sessionId !== 'string' || !sessionId) {
            throw new GameApiError('Invalid session ID', {code: 'INVALID_SESSION_ID'});
        }
    }

    #assertBet(betCents) {
        if (!Number.isSafeInteger(betCents) || betCents < 1) {
            throw new GameApiError('Invalid bet', {code: 'INVALID_BET'});
        }
    }

    #assertIdempotencyKey(idempotencyKey) {
        if (typeof idempotencyKey !== 'string' || !idempotencyKey) {
            throw new GameApiError('Invalid idempotency key', {code: 'INVALID_IDEMPOTENCY_KEY'});
        }
    }

    #assertToken() {
        if (!this.accessToken) {
            throw new GameApiError('Missing access token', {code: 'MISSING_TOKEN'});
        }
    }
}
