import {describe, it, expect, vi} from 'vitest';
import {WinDisplay} from '@/components/ui/WinDisplay/WinDisplay.js';
import {MoneyFormatter} from '@/utils/MoneyFormatter.js';

describe('WinDisplay', () => {

    it('hides immediately when duration is zero', async () => {
        const display = new WinDisplay({durationMs: 0});

        await display.show(250);

        expect(display.visible).toBe(false);
        expect(display.text).toBe('€2.50');
    });

    it('rejects overlapping presentations', async () => {
        vi.useFakeTimers();

        try {
            const display = new WinDisplay({durationMs: 1000});

            const first = display.show(100);

            await expect(display.show(200)).rejects.toThrow(
                'Win presentation already active'
            );

            expect(display.text).toBe('€1.00');

            await vi.advanceTimersByTimeAsync(1000);
            await first;

            expect(display.visible).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('cancel rejects the pending presentation', async () => {
        vi.useFakeTimers();

        try {
            const display = new WinDisplay({durationMs: 1000});

            const presentation = display.show(500);

            display.cancel();

            await expect(presentation).rejects.toThrow(
                'Win presentation cancelled'
            );

            expect(display.visible).toBe(false);

            const next = display.show(250);

            await vi.advanceTimersByTimeAsync(1000);
            await next;

            expect(display.visible).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('destroy cancels presentation and blocks reuse', async () => {
        vi.useFakeTimers();

        try {
            const display = new WinDisplay({durationMs: 1000});

            const presentation = display.show(500);

            display.destroy();

            await expect(presentation).rejects.toThrow(
                'Win presentation cancelled'
            );

            await expect(display.show(100)).rejects.toThrow(
                'WinDisplay is destroyed'
            );
        } finally {
            vi.useRealTimers();
        }
    });


    it('show returns a Promise', () => {
        const display = new WinDisplay({durationMs: 0});
        const result = display.show(0);

        expect(result).toBeInstanceOf(Promise);
        return result;
    });

    it('show formats win with MoneyFormatter', async () => {
        const display = new WinDisplay({durationMs: 0});

        await display.show(150);

        expect(display.text).toBe(MoneyFormatter.formatCents(150));
    });

    it('show resolves only after durationMs', async () => {
        vi.useFakeTimers();

        try {
            const display = new WinDisplay({durationMs: 1000});
            let settled = false;

            const done = display.show(200).then(() => {
                settled = true;
            });

            expect(settled).toBe(false);

            await vi.advanceTimersByTimeAsync(999);
            expect(settled).toBe(false);

            await vi.advanceTimersByTimeAsync(1);
            await done;

            expect(settled).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });

    it('show(0) still resolves (no-win presentation)', async () => {
        const display = new WinDisplay({durationMs: 0});
        await expect(display.show(0)).resolves.toBeUndefined();
    });

    it('hold keeps win visible until clear', () => {
        const display = new WinDisplay({durationMs: 1000});

        display.hold(250);
        expect(display.visible).toBe(true);
        expect(display.text).toBe('€2.50');

        display.hold(500);
        expect(display.text).toBe('€5.00');

        display.clear();
        expect(display.visible).toBe(false);
        expect(display.text).toBe('');
    });

    it('clear does not interrupt an active show', async () => {
        vi.useFakeTimers();

        try {
            const display = new WinDisplay({durationMs: 1000});
            const presentation = display.show(100);

            display.clear();
            expect(display.visible).toBe(true);

            await vi.advanceTimersByTimeAsync(1000);
            await presentation;

            expect(display.visible).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });
});
