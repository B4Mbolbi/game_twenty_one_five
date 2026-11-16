export function getCarStats(carId, catalog, gameState) {
    // ЗАЩИТА: если каталог пуст или машина не найдена
    const base = catalog.find(c => c.id === carId);
    if (!base) {
        console.warn(`Машина "${carId}" не найдена в каталоге! Возвращаем фолбэк.`);
        // Возвращаем первую попавшуюся машину из каталога или дефолт
        const fallback = catalog[0] || {
            id: 'fallback', name: 'UNKNOWN', style: 'eg6',
            baseHp: 100, baseWeight: 1000, baseMaxRpm: 8000
        };
        return {
            base: fallback,
            state: gameState.cars[carId] || { unlocked: true, colorIdx: 0, bestTime: null, upgrades: { engine: 1, turbo: 1, gearbox: 1, tires: 1, nos: 1 } },
            hp: fallback.baseHp, weight: fallback.baseWeight, maxRpm: fallback.baseMaxRpm,
            carClass: 'D', classColor: 'bg-slate-400 text-black',
            gripLevel: 1, nosLevel: 1, gearboxLevel: 1, turboLevel: 1
        };
    }

    const state = gameState.cars[carId];
    const u = {
        engine: 1, turbo: 1, gearbox: 1, tires: 1, nos: 1,
        ...state.upgrades
    };

    const hp = Math.round(base.baseHp + (u.engine - 1) * 58 + (u.turbo - 1) * 52);
    const weight = Math.round(base.baseWeight - (u.gearbox - 1) * 20 - (u.engine - 1) * 12);
    const maxRpm = base.baseMaxRpm + (u.engine - 1) * 250;

    const ratio = hp / (weight / 1000);
    let carClass = 'D';
    let classColor = 'bg-slate-400 text-black';
    if (ratio >= 660) { carClass = 'S'; classColor = 'bg-rose-500 text-white'; }
    else if (ratio >= 490) { carClass = 'A'; classColor = 'bg-amber-400 text-black'; }
    else if (ratio >= 350) { carClass = 'B'; classColor = 'bg-purple-500 text-white'; }
    else if (ratio >= 225) { carClass = 'C'; classColor = 'bg-cyan-400 text-black'; }

    return {
        base, state, hp, weight, maxRpm, carClass, classColor,
        gripLevel: u.tires, nosLevel: u.nos, gearboxLevel: u.gearbox, turboLevel: u.turbo
    };
}