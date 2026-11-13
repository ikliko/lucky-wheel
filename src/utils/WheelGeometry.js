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
}