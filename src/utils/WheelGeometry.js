export class WheelGeometry {
    constructor(sectorCount, pointerAngle = -Math.PI / 2) {
        this.pointerAngle = pointerAngle;
        this.sweep = (Math.PI * 2) / sectorCount;
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

    rotationToCenterSector(sectorIndex, currentRotation, extraTurns = 0) {
        const targetMod = this.normalizeAngle(-sectorIndex * this.sweep);
        const currentMod = this.normalizeAngle(currentRotation);
        const delta = this.normalizeAngle(targetMod - currentMod);
        
        return currentRotation + delta + extraTurns * Math.PI * 2;
    }
}