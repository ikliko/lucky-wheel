import {describe, it, expect} from 'vitest';
import {WheelGeometry} from '@/utils/WheelGeometry.js';

describe('WheelGeometry.rotationToCenterSector', () => {
    const geometry = new WheelGeometry(18);

    it('keeps positive travel for direction 1', () => {
        const end = geometry.rotationToCenterSector(3, 0, 1, 1);

        expect(end).toBeGreaterThan(0);
        expect(geometry.normalizeAngle(end))
            .toBeCloseTo(geometry.normalizeAngle(-3 * geometry.sweep));
    });

    it('uses negative travel for direction -1', () => {
        const end = geometry.rotationToCenterSector(3, 0, 1, -1);

        expect(end).toBeLessThan(0);
        expect(geometry.normalizeAngle(end))
            .toBeCloseTo(geometry.normalizeAngle(-3 * geometry.sweep));
    });

    it('scales extra turns by direction', () => {
        const forward = geometry.rotationToCenterSector(0, 0, 2, 1);
        const reverse = geometry.rotationToCenterSector(0, 0, 2, -1);

        expect(forward).toBeCloseTo(4 * Math.PI);
        expect(reverse).toBeCloseTo(-4 * Math.PI);
    });
});
