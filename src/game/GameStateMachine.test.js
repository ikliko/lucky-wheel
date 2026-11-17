import {describe, it, expect} from 'vitest';
import {GameState, GameStateMachine} from '@/game/GameStateMachine.js';

describe('GameStateMachine', () => {
    it('does not allow direct state mutation', () => {
        const sm = new GameStateMachine();

        expect(() => {
            sm.state = GameState.IDLE;
        }).toThrow(TypeError);

        expect(sm.state).toBe(GameState.BOOTING);
    });

    it('starts in BOOTING', () => {
        const sm = new GameStateMachine();
        expect(sm.state).toBe(GameState.BOOTING);
    });

    it('boot path: BOOTING → IDLE', () => {
        const sm = new GameStateMachine();
        sm.transition(GameState.IDLE);
        expect(sm.isIdle).toBe(true);
    });

    it('allows IDLE → REQUESTING_SPIN → SPINNING → SHOWING_WIN → IDLE', () => {
        const sm = new GameStateMachine(GameState.IDLE);
        sm.transition(GameState.REQUESTING_SPIN);
        sm.transition(GameState.SPINNING);
        sm.transition(GameState.SHOWING_WIN);
        sm.transition(GameState.IDLE);
        expect(sm.state).toBe(GameState.IDLE);
    });

    it('throws on invalid transition', () => {
        const sm = new GameStateMachine(GameState.IDLE);
        expect(() => sm.transition(GameState.SHOWING_WIN)).toThrow(/Invalid transition/);
    });

    it('ERROR has no exits', () => {
        const sm = new GameStateMachine(GameState.SPINNING);
        sm.transition(GameState.ERROR);
        expect(sm.canTransition(GameState.IDLE)).toBe(false);
        expect(() => sm.transition(GameState.IDLE)).toThrow();
    });

    it('allows SPINNING → FREE_SPINS → SHOWING_WIN → IDLE', () => {
        const sm = new GameStateMachine(GameState.IDLE);
        sm.transition(GameState.REQUESTING_SPIN);
        sm.transition(GameState.SPINNING);
        sm.transition(GameState.FREE_SPINS);
        sm.transition(GameState.SHOWING_WIN);
        sm.transition(GameState.IDLE);
        expect(sm.state).toBe(GameState.IDLE);
    });

    it('allows SPINNING → BONUS → SHOWING_WIN', () => {
        const sm = new GameStateMachine(GameState.SPINNING);
        sm.transition(GameState.BONUS);
        sm.transition(GameState.SHOWING_WIN);
        expect(sm.state).toBe(GameState.SHOWING_WIN);
    });

    it('allows FREE_SPINS ↔ BONUS', () => {
        const sm = new GameStateMachine(GameState.FREE_SPINS);
        sm.transition(GameState.BONUS);
        sm.transition(GameState.FREE_SPINS);
        expect(sm.state).toBe(GameState.FREE_SPINS);
    });
});