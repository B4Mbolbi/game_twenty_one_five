import { initTelegram } from './core/telegram.js';
import { audio } from './core/audio.js';
import { loadCarCatalog } from './config/cars.js';
import { loadSave, saveGame } from './core/storage.js';
import { renderGarage, bindGarageControls, setGameStateRef } from './screens/garageScreen.js';
import { startGaragePreviewLoop } from './render/garage.js';
import { setRaceRefs, startRaceFlow, bindRaceControls } from './screens/raceScreen.js';
import { resetRace } from './race/physics.js';

initTelegram();

let gameState = null;

async function boot() {
    // 1. Загружаем каталог (включая пользовательские машины из cars/)
    const catalog = await loadCarCatalog();

    // 2. Загружаем сейв (дополняем записями для новых машин)
    gameState = loadSave(catalog);

    // 3. Пробрасываем ссылки
    setGameStateRef(gameState);
    setRaceRefs(gameState, switchToGarage);

    // 4. Навигация
    document.getElementById('startRaceMenuBtn').onclick = () => {
        switchToRace();
    };

    // 5. Рендер
    renderGarage();
    startGaragePreviewLoop(gameState);
    bindGarageControls(switchToRace);
    bindRaceControls();
}

function switchToRace() {
    document.getElementById('garageScreen').classList.add('hidden');
    document.getElementById('finishModal').classList.add('hidden');
    document.getElementById('falseStartModal').classList.add('hidden');
    document.getElementById('raceScreen').classList.remove('hidden');
    startRaceFlow();
}

function switchToGarage() {
    audio.stopEngine();
    resetRace();
    document.getElementById('raceScreen').classList.add('hidden');
    document.getElementById('finishModal').classList.add('hidden');
    document.getElementById('falseStartModal').classList.add('hidden');
    document.getElementById('garageScreen').classList.remove('hidden');
    renderGarage();
}

window.addEventListener('load', boot);