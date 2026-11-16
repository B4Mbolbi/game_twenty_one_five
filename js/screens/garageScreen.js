import { CAR_COLORS } from '../config/colors.js';
import { CAR_CATALOG } from '../config/cars.js';
import { UPGRADE_DEFS, getUpgradeCost } from '../config/upgrades.js';
import { getCarStats } from '../core/stats.js';
import { saveGame } from '../core/storage.js';
import { triggerHaptic } from '../core/telegram.js';
import { audio } from '../core/audio.js';

let gameStateRef = null;
export function setGameStateRef(s) { gameStateRef = s; }

export function showToast(msg) {
    const toast = document.getElementById('toastMessage');
    toast.firstElementChild.textContent = msg;
    toast.classList.remove('opacity-0');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('opacity-0'), 2200);
}

export function renderGarage() {
    const gameState = gameStateRef;
    document.getElementById('balanceDisplay').textContent = gameState.money;

    const stats = getCarStats(gameState.selectedCarId, CAR_CATALOG, gameState);
    const { base, state, hp, weight, carClass, classColor, gripLevel } = stats;

    const badge = document.getElementById('carClassBadge');
    badge.textContent = carClass;
    badge.className = `${classColor} text-[10px] px-1.5 py-0.5 font-bold`;

    document.getElementById('carNameDisplay').textContent = base.name;
    document.getElementById('carBestTimeDisplay').textContent = state.bestTime
        ? `РЕКОРД 1/4: ${state.bestTime.toFixed(3)} с`
        : 'РЕКОРД 1/4: --.--- с';

    document.getElementById('statHp').textContent = hp;
    document.getElementById('statWeight').textContent = weight;
    document.getElementById('statGrip').textContent = gripLevel;

    // Палитра цветов
    const paletteEl = document.getElementById('colorPalette');
    paletteEl.innerHTML = '';
    CAR_COLORS.forEach((col, idx) => {
        const btn = document.createElement('button');
        btn.className = `w-3.5 h-3.5 border ${state.colorIdx === idx ? 'border-white scale-110 shadow-[0_0_5px_#fff]' : 'border-black/80'}`;
        btn.style.backgroundColor = col.body;
        btn.onclick = () => {
            if (!state.unlocked) { showToast('Сначала купите этот автомобиль!'); return; }
            state.colorIdx = idx;
            saveGame(gameState);
            triggerHaptic('light');
            audio.playTone(420, 'square', 0.05);
            renderGarage();
        };
        paletteEl.appendChild(btn);
    });

    const buyPanel = document.getElementById('buyCarPanel');
    const tuningPanel = document.getElementById('tuningPanel');
    const startBtn = document.getElementById('startRaceMenuBtn');

    if (!state.unlocked) {
        buyPanel.classList.remove('hidden');
        tuningPanel.classList.add('hidden');
        document.getElementById('carDescDisplay').textContent = base.desc;
        document.getElementById('carPriceDisplay').textContent = base.price;
        const buyBtn = document.getElementById('buyCarBtn');
        buyBtn.disabled = gameState.money < base.price;
        startBtn.disabled = true;
        startBtn.textContent = '🔒 АВТО НЕ КУПЛЕНО';
    } else {
        buyPanel.classList.add('hidden');
        tuningPanel.classList.remove('hidden');
        startBtn.disabled = false;
        startBtn.textContent = '🏁 НА СТАРТ 12.5.1 (402М)';
        renderUpgradesList(state, base); // <-- Передаем base (carDef)
    }
}

function renderUpgradesList(carState, carDef) {
    const gameState = gameStateRef;
    const list = document.getElementById('upgradesList');
    list.innerHTML = '';

    // Получаем список апгрейдов (это может быть массив или объект)
    let availableUpgrades = [];
    
    if (carDef.upgrades) {
        if (Array.isArray(carDef.upgrades)) {
            // Если в JSON массив: ["engine", "turbo"]
            availableUpgrades = carDef.upgrades;
        } else {
            // Если в JSON объект: { "engine": {...}, "turbo": {...} }
            availableUpgrades = Object.keys(carDef.upgrades);
        }
    } else {
        // Если апгрейдов нет вообще, берем все базовые
        availableUpgrades = Object.keys(UPGRADE_DEFS);
    }

    for (const key of availableUpgrades) {
        const def = UPGRADE_DEFS[key];
        if (!def) {
            console.warn(`Апгрейд "${key}" не найден в UPGRADE_DEFS!`);
            continue; // Пропускаем, если опечатка в JSON
        }

        // Получаем текущий уровень (по умолчанию 1)
        const lvl = carState.upgrades[key] || 1;
        const isMax = lvl >= 5;
        
        // Берем цену из car.json
        const custom = carDef.upgrades && carDef.upgrades[key] ? carDef.upgrades[key] : {};
        const baseCost = custom.baseCost !== undefined ? custom.baseCost : def.baseCost;
        const costMult = custom.costMult !== undefined ? custom.costMult : def.costMult;
        
        // Считаем цену для текущего уровня
        const cost = isMax ? 0 : Math.round(baseCost * Math.pow(costMult, lvl - 1));
        const canAfford = gameState.money >= cost;

        const row = document.createElement('div');
        row.className = 'bg-slate-900/95 border border-slate-700/90 p-2 flex items-center justify-between gap-2';

        let pipsHtml = '';
        for (let i = 1; i <= 5; i++) {
            pipsHtml += `<span class="inline-block w-3.5 h-1.5 mr-1 ${i <= lvl ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]' : 'bg-slate-800'}"></span>`;
        }

        row.innerHTML = `
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] text-white">${def.name}</span>
                    <span class="text-[8px] text-amber-400">УР.${lvl}/5</span>
                </div>
                <div class="text-[7px] text-slate-400 truncate mt-0.5">${def.desc}</div>
                <div class="mt-1">${pipsHtml}</div>
            </div>
            <button class="pixel-btn ${isMax ? '' : 'pixel-btn-green'} px-2.5 py-2 text-[9px] shrink-0 min-w-[74px]"
                ${isMax || !canAfford ? 'disabled' : ''}>
                ${isMax ? 'МАКС' : '$' + cost}
            </button>
        `;

        const btn = row.querySelector('button');
        if (!isMax) {
            btn.onclick = () => {
                if (gameState.money >= cost) {
                    gameState.money -= cost;
                    carState.upgrades[key] = lvl + 1;
                    saveGame(gameState);
                    triggerHaptic('success');
                    audio.playUpgrade();
                    showToast(`${def.name}: УР.${lvl + 1}!`);
                    renderGarage();
                }
            };
        }
        list.appendChild(row);
    }
}

// Обработчики кнопок навигации
export function bindGarageControls(onStartRace) {
    const gameState = gameStateRef;

    document.getElementById('prevCarBtn').onclick = () => {
        const idx = CAR_CATALOG.findIndex(c => c.id === gameState.selectedCarId);
        gameState.selectedCarId = CAR_CATALOG[(idx - 1 + CAR_CATALOG.length) % CAR_CATALOG.length].id;
        saveGame(gameState);
        triggerHaptic('light');
        audio.playTone(300, 'square', 0.05);
        renderGarage();
    };

    document.getElementById('nextCarBtn').onclick = () => {
        const idx = CAR_CATALOG.findIndex(c => c.id === gameState.selectedCarId);
        gameState.selectedCarId = CAR_CATALOG[(idx + 1) % CAR_CATALOG.length].id;
        saveGame(gameState);
        triggerHaptic('light');
        audio.playTone(300, 'square', 0.05);
        renderGarage();
    };

    document.getElementById('buyCarBtn').onclick = () => {
        const carDef = CAR_CATALOG.find(c => c.id === gameState.selectedCarId);
        if (gameState.money >= carDef.price) {
            gameState.money -= carDef.price;
            gameState.cars[carDef.id].unlocked = true;
            saveGame(gameState);
            triggerHaptic('success');
            audio.playUpgrade();
            showToast(`Куплен ${carDef.name}!`);
            renderGarage();
        }
    };

    document.getElementById('soundToggleBtn').onclick = (e) => {
        audio.enabled = !audio.enabled;
        e.target.textContent = audio.enabled ? '🔊' : '🔇';
        if (!audio.enabled) audio.stopEngine();
    };

    document.getElementById('startRaceMenuBtn').onclick = () => {
        triggerHaptic('medium');
        onStartRace();
    };
}