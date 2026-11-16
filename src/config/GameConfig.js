export const GameConfig = {
    gamePaneRatio: 0.6,
    wheelFitRatio: 0.6,
    arrowLocalHeight: 32,
    arrowLocalOverlap: 16,
    startLocalDiameter: 120,
    sectorCount: 18,
    wheelRadius: 400,
    labelRadiusRatio: 0.8,
    initialBalanceCents: 100000,

    allowedBetsCents: [
        ...Array.from({length: 10}, (_, i) => (i + 1) * 10),
        ...Array.from({length: 18}, (_, i) => 150 + i * 50),
    ],

    quickBetsCents: [10, 50, 100, 200, 500, 1000],

    defaultBetCents: 100,
    colors: {
        sectorA: 0x3ab8eb,
        sectorB: 0xf5a623,
        stroke: 0x2a2a2a,
        rim: 0xffffff,
        hub: 0x111111,
    },
    rimWidth: 18,
    strokeWidth: 2,
};
