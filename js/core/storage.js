export const STORAGE_KEY = 'game_12_5_1_save_v3';

export const defaultGameState = {
    money: 500,
    selectedCarId: 'supra_mk5', // Ваша машина
    cars: {
        supra_mk5: { // Ключ должен совпадать с ID в car.json
            unlocked: true, 
            colorIdx: 0, 
            bestTime: null,
            upgrades: { engine: 1, turbo: 1, gearbox: 1, tires: 1, nos: 1 }
        }
    }
};

export function loadSave(catalog = []) {
    let state = structuredClone(defaultGameState);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.money === 'number' && parsed.cars) {
                state = { ...state, ...parsed };
            }
        }
    } catch (e) {}

    // Добавляем записи для новых машин из каталога
    for (const car of catalog) {
        if (!state.cars[car.id]) {
            // Оставляем как есть:
            state.cars[car.id] = {
                unlocked: false,
                colorIdx: car.defaultColorIdx ?? 0,
                bestTime: null,
                upgrades: { engine: 1, turbo: 1, gearbox: 1, tires: 1, nos: 1 }
            };
        }
    }
    return state;
}

export function saveGame(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
}