export function pickSector(sectors, random = Math.random) {
    const sectorIndex = Math.floor(random() * sectors.length);
    return {sector: sectors[sectorIndex], sectorIndex};
}
