import { initRace, shiftGear, triggerFalseStart, updateRacePhysics, getRace, resetRace, controls } from '../race/physics.js';
import { renderRaceHUD, renderRaceCanvas } from '../race/render.js';
import { audio } from '../core/audio.js';
import { saveGame } from '../core/storage.js';
import { triggerHaptic } from '../core/telegram.js';

let gameStateRef = null;
let onSwitchToGarage = null;

export function setRaceRefs(gameState, switchToGarageCb) {
    gameStateRef = gameState;
    onSwitchToGarage = switchToGarageCb;
}

export function startRaceFlow() {
    initRace(gameStateRef, () => triggerFalseStart());
    startRaceLoop();
}

function finishRace() {
    const race = getRace();
    if (!race) return;
    race.phase = 'finished';
    audio.stopEngine();

    const p = race.player;
    const ai = race.ai;

    if (ai.finishedTime === null) {
        const remaining = Math.max(0, 402.33 - ai.dist);
        ai.finishedTime = race.elapsedTime + remaining / Math.max(10, ai.speed);
    }

    const isWin = p.finishedTime <= ai.finishedTime;
    const prevBest = p.stats.state.bestTime;
    const isNewRecord = !prevBest || p.finishedTime < prevBest;
    if (isNewRecord) p.stats.state.bestTime = p.finishedTime;

    const baseReward = isWin ? 450 : 120;
    const classBonus = { D: 0, C: 200, B: 450, A: 800, S: 1250 }[p.stats.carClass] || 0;
    const reward = isWin ? baseReward + classBonus : Math.round((baseReward + classBonus) * 0.3);

    gameStateRef.money += reward;
    saveGame(gameStateRef);
    document.getElementById('balanceDisplay').textContent = gameStateRef.money;

    const titleEl = document.getElementById('finishTitle');
    const subEl = document.getElementById('finishSubtitle');
    if (isWin) {
        titleEl.textContent = '🏆 ПОБЕДА!';
        titleEl.className = 'text-base sm:text-lg text-emerald-400';
        subEl.textContent = isNewRecord ? '🔥 НОВЫЙ ЛИЧНЫЙ РЕКОРД!' : 'ВЫ ПЕРЕСЕКЛИ ФИНИШ ПЕРВЫМ';
        triggerHaptic('success');
        audio.playUpgrade();
    } else {
        titleEl.textContent = 'ПОРАЖЕНИЕ';
        titleEl.className = 'text-base sm:text-lg text-rose-500';
        subEl.textContent = 'ПРОКАЧАЙТЕ ДЕТАЛИ В ГАРАЖЕ';
        triggerHaptic('error');
        audio.playTone(180, 'sawtooth', 0.3, 0.12);
    }

    document.getElementById('resPlayerTime').textContent = `${p.finishedTime.toFixed(3)} с`;
    document.getElementById('resAiTime').textContent = `${ai.finishedTime.toFixed(3)} с`;
    document.getElementById('resMaxSpeed').textContent = `${Math.round(p.speed * 3.6)} км/ч`;
    document.getElementById('resLaunchRating').textContent = p.launchRating;
    document.getElementById('resReward').textContent = reward;

    document.getElementById('finishModal').classList.remove('hidden');
}

let raceLoopStarted = false;
function startRaceLoop() {
    if (raceLoopStarted) return;
    raceLoopStarted = true;
    let lastTime = performance.now();

    function loop(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (!document.getElementById('raceScreen').classList.contains('hidden')) {
            updateRacePhysics(dt, finishRace);
            renderRaceHUD();
            renderRaceCanvas();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

export function bindRaceControls() {
    const shiftUpBtn = document.getElementById('shiftUpBtn');
    const shiftDownBtn = document.getElementById('shiftDownBtn');

    shiftUpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); shiftGear(1, () => triggerFalseStart()); }, { passive: false });
    shiftUpBtn.addEventListener('mousedown', (e) => { if (e.button === 0) shiftGear(1, () => triggerFalseStart()); });

    shiftDownBtn.addEventListener('touchstart', (e) => { e.preventDefault(); shiftGear(-1, () => triggerFalseStart()); }, { passive: false });
    shiftDownBtn.addEventListener('mousedown', (e) => { if (e.button === 0) shiftGear(-1, () => triggerFalseStart()); });

    function bindHold(elementId, controlKey) {
        const btn = document.getElementById(elementId);
        const setActive = (val) => (e) => {
            if (e.cancelable) e.preventDefault();
            controls[controlKey] = val;
            if (val) {
                audio.init();
                triggerHaptic(controlKey === 'nos' ? 'heavy' : 'light');
            }
        };
        btn.addEventListener('touchstart', setActive(true), { passive: false });
        btn.addEventListener('touchend', setActive(false), { passive: false });
        btn.addEventListener('touchcancel', setActive(false), { passive: false });
        btn.addEventListener('mousedown', setActive(true));
        window.addEventListener('mouseup', () => { controls[controlKey] = false; });
    }
    bindHold('gasBtn', 'gas');
    bindHold('nosBtn', 'nos');

    window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') controls.gas = true;
        if (e.code === 'ShiftLeft' || e.code === 'KeyN') controls.nos = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyE') shiftGear(1, () => triggerFalseStart());
        if (e.code === 'ArrowLeft' || e.code === 'KeyQ') shiftGear(-1, () => triggerFalseStart());
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') controls.gas = false;
        if (e.code === 'ShiftLeft' || e.code === 'KeyN') controls.nos = false;
    });

    // Кнопки модалок
    document.getElementById('backToGarageBtn').onclick = () => {
        triggerHaptic('light');
        onSwitchToGarage();
    };
    document.getElementById('rematchBtn').onclick = () => {
        triggerHaptic('medium');
        document.getElementById('finishModal').classList.add('hidden');
        initRace(gameStateRef, () => triggerFalseStart());
    };
    document.getElementById('fsGarageBtn').onclick = () => {
        triggerHaptic('light');
        onSwitchToGarage();
    };
    document.getElementById('fsRestartBtn').onclick = () => {
        triggerHaptic('medium');
        document.getElementById('falseStartModal').classList.add('hidden');
        initRace(gameStateRef, () => triggerFalseStart());
    };
}