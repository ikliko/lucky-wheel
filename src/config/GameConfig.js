export const GameConfig = {
    gamePaneRatio: 0.6,
    wheelFitRatio: 0.6,
    arrowLocalHeight: 32,
    arrowLocalOverlap: 16,
    startLocalDiameter: 120,
    sectorCount: 18,
    freeSpinsAward: 3,
    sectors: [
        {id: 'sector_0',  type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_1',  type: 'lose',       label: 'LOSE',       multiplier: 0}, // A
        {id: 'sector_2',  type: 'win',        label: '×0.5',       multiplier: 0.5},
        {id: 'sector_3',  type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_4',  type: 'lose',       label: 'LOSE',       multiplier: 0}, // B
        {id: 'sector_5',  type: 'win',        label: '×1',         multiplier: 1},
        {id: 'sector_6',  type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_7',  type: 'free_spins', label: 'SPINS', multiplier: 0},
        {id: 'sector_8',  type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_9',  type: 'win',        label: '×2',         multiplier: 2},
        {id: 'sector_10', type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_11', type: 'bonus',      label: 'BONUS',      multiplier: 0},
        {id: 'sector_12', type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_13', type: 'win',        label: '×5',         multiplier: 5},
        {id: 'sector_14', type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_15', type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_16', type: 'lose',       label: 'LOSE',       multiplier: 0},
        {id: 'sector_17', type: 'lose',       label: 'LOSE',       multiplier: 0},
    ],
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
