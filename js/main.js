import { initTelegram } from './core/telegram.js';
import { audio } from './core/audio.js';
import { loadCarCatalog } from './config/cars.js';
import { loadSave, saveGame, STORAGE_KEY } from './core/storage.js';
import { renderGarage, bindGarageControls, setGameStateRef } from './screens/garageScreen.js';
import { startGaragePreviewLoop } from './render/garage.js';
import { setRaceRefs, startRaceFlow, bindRaceControls } from './screens/raceScreen.js';
import { resetRace } from './race/physics.js';
import { GAME_VERSION } from './config/constants.js'; // <-- ИМПОРТ ВЕРСИИ

initTelegram();

let gameState = null;

async function boot() {
    // 1. Отображаем версию
    const versionEl = document.getElementById('gameVersionDisplay');
    if (versionEl) versionEl.textContent = GAME_VERSION;

    // 2. Загружаем каталог
    const catalog = await loadCarCatalog();

    // 3. Загружаем сейв
    gameState = loadSave(catalog);

    // 4. Пробрасываем ссылки
    setGameStateRef(gameState);
    setRaceRefs(gameState, switchToGarage);

    // 5. Навигация
    document.getElementById('startRaceMenuBtn').onclick = () => {
        switchToRace();
    };

    // 6. Кнопка сброса прогресса
    document.getElementById('resetSaveBtn').onclick = () => {
        const confirmReset = confirm('Вы уверены, что хотите сбросить весь прогресс? Все машины и деньги будут удалены.');
        if (confirmReset) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload(); // Перезагружаем страницу для применения нового сейва
        }
    };

    // 7. Рендер
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