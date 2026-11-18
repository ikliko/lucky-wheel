export class WheelGeometry {
    constructor(sectorCount, pointerAngle = -Math.PI / 2) {
        this.sectorCount = sectorCount;
        this.pointerAngle = pointerAngle;
        this.sweep = (Math.PI * 2) / sectorCount;
    }

    sectorIndexAt(rotation) {
        const shifted = this.normalizeAngle(-rotation) + this.sweep / 2;
        return Math.floor(shifted / this.sweep) % this.sectorCount;
    }

    startAngle(index) {
        return this.pointerAngle - this.sweep / 2 + index * this.sweep;
    }

    endAngle(index) {
        return this.startAngle(index) + this.sweep;
    }

    midAngle(index) {
        return this.pointerAngle + index * this.sweep;
    }

    normalizeAngle(radians) {
        const tau = Math.PI * 2;
        return ((radians % tau) + tau) % tau;
    }

    rotationToCenterSector(
        sectorIndex,
        currentRotation,
        extraTurns = 0,
        direction = 1,
    ) {
        const targetMod = this.normalizeAngle(-sectorIndex * this.sweep);
        const currentMod = this.normalizeAngle(currentRotation);
        let travel = this.normalizeAngle(targetMod - currentMod);

        if (direction < 0 && travel !== 0) {
            travel -= Math.PI * 2;
        }

        return currentRotation + travel + direction * extraTurns * Math.PI * 2;
    }
}