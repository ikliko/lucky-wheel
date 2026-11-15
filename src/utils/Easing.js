 export class Easing {
    static easeOutCubic(time) {
        return 1 - Math.pow(1 - time, 3)
    }
 }