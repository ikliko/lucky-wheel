export const GameState = {
    BOOTING: 'BOOTING',
    IDLE: 'IDLE',
    REQUESTING_SPIN: 'REQUESTING_SPIN',
    SPINNING: 'SPINNING',
    SHOWING_WIN: 'SHOWING_WIN',
    ERROR: 'ERROR',
};

const TRANSITIONS = {
    [GameState.BOOTING]: [
        GameState.IDLE,
        GameState.ERROR,
    ],
    [GameState.IDLE]: [
        GameState.REQUESTING_SPIN,
        GameState.ERROR,
    ],
    [GameState.REQUESTING_SPIN]: [
        GameState.SPINNING,
        GameState.ERROR,
    ],
    [GameState.SPINNING]: [
        GameState.SHOWING_WIN,
        GameState.ERROR,
    ],
    [GameState.SHOWING_WIN]: [
        GameState.IDLE,
        GameState.ERROR,
    ],
    [GameState.ERROR]: [],
};

export class GameStateMachine {
    #state;

    constructor(initialState = GameState.BOOTING) {
        this.#state = initialState;
    }

    get state() {
        return this.#state;
    }

    canTransition(toState) {
        return (TRANSITIONS[this.#state] || []).includes(toState);
    }

    transition(toState) {
        if (!this.canTransition(toState)) {
            throw new Error(
                `Invalid transition: ${this.#state} → ${toState}`
            );
        }

        this.#state = toState;
        return this.#state;
    }

    get isIdle() {
        return this.#state === GameState.IDLE;
    }
}
