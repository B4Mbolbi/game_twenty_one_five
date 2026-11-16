import { CAR_COLORS } from '../config/colors.js';
import { CAR_CATALOG } from '../config/cars.js';
import { getCarStats } from '../core/stats.js';
import { audio } from '../core/audio.js';
import { triggerHaptic } from '../core/telegram.js';
import { saveGame } from '../core/storage.js';

export const RACE_DISTANCE = 402.33;
export const BASE_GEAR_RATIOS = [0, 3.30, 2.28, 1.70, 1.33, 1.07, 0.88];

export let race = null;
export const controls = { gas: false, nos: false };

export function getRace() { return race; }
export function resetRace() { race = null; }

export function initRace(gameState, onFalseStart) {
    const stats = getCarStats(gameState.selectedCarId, CAR_CATALOG, gameState);
    const carDef = stats.base;
    const colorObj = CAR_COLORS[stats.state.colorIdx];

    // --- НОВАЯ ЛОГИКА ВЫБОРА СОПЕРНИКА ---
    // 1. Ищем машины того же класса, что и у игрока
    let potentialOpponents = CAR_CATALOG.filter(car => {
        // Считаем базовый класс машины (без учета тюнинга)
        const ratio = car.baseHp / (car.baseWeight / 1000);
        let cls = 'D';
        if (ratio >= 660) cls = 'S';
        else if (ratio >= 490) cls = 'A';
        else if (ratio >= 350) cls = 'B';
        else if (ratio >= 225) cls = 'C';
        
        return cls === stats.carClass && car.id !== gameState.selectedCarId; // Исключаем машину игрока
    });

    // 2. Если машин того же класса нет, берем любую другую
    if (potentialOpponents.length === 0) {
        potentialOpponents = CAR_CATALOG.filter(car => car.id !== gameState.selectedCarId);
    }
    // 3. Если в каталоге всего одна машина, берем её же (зеркальный заезд)
    if (potentialOpponents.length === 0) {
        potentialOpponents = [carDef];
    }

    // Выбираем случайного соперника
    const aiCarDef = potentialOpponents[Math.floor(Math.random() * potentialOpponents.length)];
    
    // Выбираем случайный цвет для соперника
    const aiColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    // Генерируем случайный индекс цвета (для спрайтов)
    const aiColorIdx = Math.floor(Math.random() * CAR_COLORS.length);

    // 4. Настройка сложности (подгоняем мощность)
    const playerPowerToWeight = stats.hp / stats.weight;
    
    // Соперник будет чуть слабее или сильнее (от -9% до +5%)
    const aiFactor = 0.91 + Math.random() * 0.14; 
    const aiPowerToWeight = playerPowerToWeight * aiFactor;

    race = {
        phase: 'countdown',
        countdownTimer: 0,
        lightStage: 0,
        elapsedTime: 0,
        frame: 0,
        player: {
            carDef, colorObj, stats,
            dist: 0, speed: 0, maxSpeedKmh: 0, rpm: 1000, gear: 0,
            nosAmount: 100, isNosActive: false, isWheelspin: false,
            wheelAngle: 0, shiftCooldown: 0, launchRating: 'НОРМА', finishedTime: null
        },
        ai: {
            carDef: aiCarDef, 
            colorObj: aiColor,
            colorIdx: aiColorIdx, // <-- Сохраняем индекс цвета для отрисовки
            dist: 0, speed: 0,
            powerToWeight: aiPowerToWeight,
            reactionDelay: 0.12 + Math.random() * 0.20,
            wheelAngle: 0, finishedTime: null
        }
    };

    controls.gas = false;
    controls.nos = false;

    // ... (дальше идет сброс светофора и запуск звука, оставляем без изменений) ...
    ['lightY1', 'lightY2', 'lightY3'].forEach(id => {
        document.getElementById(id).className = 'w-3.5 h-3.5 rounded-full bg-amber-950 border border-amber-800';
    });
    document.getElementById('lightGreen').className = 'w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800';
    document.getElementById('lightRed').classList.add('hidden');
    document.getElementById('christmasTree').classList.remove('hidden');
    document.getElementById('launchHint').classList.remove('hidden');
    document.getElementById('raceStatusBanner').textContent = 'СВЕТОФОР...';
    document.getElementById('raceStatusBanner').className = 'text-amber-400';

    audio.startEngine();
    return { onFalseStart };
}

export function shiftGear(delta, onFalseStart) {
    if (!race || race.phase === 'finished' || race.phase === 'falsestart') return;
    const p = race.player;

    if (race.phase === 'countdown' && p.gear === 0 && delta > 0) {
        onFalseStart();
        return;
    }

    const newGear = Math.max(0, Math.min(6, p.gear + delta));
    if (newGear !== p.gear) {
        if (p.gear === 0 && newGear === 1 && race.phase === 'racing') {
            const rpmRatio = p.rpm / p.stats.maxRpm;
            if (rpmRatio >= 0.56 && rpmRatio <= 0.76) {
                p.launchRating = 'PERFECT LAUNCH!';
                p.speed += 5.0 + p.stats.gripLevel * 0.9;
                audio.playUpgrade();
                triggerHaptic('success');
            } else if (rpmRatio > 0.76) {
                p.launchRating = 'ПРОБУКСОВКА';
                p.isWheelspin = true;
                triggerHaptic('warning');
            } else {
                p.launchRating = 'СЛАБЫЙ СТАРТ';
            }
        }

        if (p.gear > 0 && newGear > 0) {
            const ratioChange = BASE_GEAR_RATIOS[newGear] / BASE_GEAR_RATIOS[p.gear];
            p.rpm = Math.max(1200, Math.min(p.stats.maxRpm, p.rpm * ratioChange));
        }

        p.gear = newGear;
        p.shiftCooldown = Math.max(0.03, 0.21 - (p.stats.gearboxLevel - 1) * 0.042);
        audio.playShift();
        triggerHaptic('medium');
    }
}

export function triggerFalseStart() {
    race.phase = 'falsestart';
    audio.stopEngine();
    document.getElementById('lightRed').classList.remove('hidden');
    document.getElementById('raceStatusBanner').textContent = 'FALSE START!';
    document.getElementById('raceStatusBanner').className = 'text-rose-500';
    document.getElementById('launchHint').classList.add('hidden');
    audio.playTone(140, 'sawtooth', 0.45, 0.16);
    triggerHaptic('error');
    document.getElementById('falseStartModal').classList.remove('hidden');
}

export function updateRacePhysics(dt, onFinish) {
    if (!race || race.phase === 'finished' || race.phase === 'falsestart') return;
    race.frame++;

    const p = race.player;
    const ai = race.ai;
    const maxRpm = p.stats.maxRpm;

    // Светофор
    if (race.phase === 'countdown') {
        race.countdownTimer += dt;
        if (race.countdownTimer >= 0.7 && race.lightStage === 0) {
            race.lightStage = 1;
            document.getElementById('lightY1').className = 'w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]';
            audio.playBeep(false);
        } else if (race.countdownTimer >= 1.4 && race.lightStage === 1) {
            race.lightStage = 2;
            document.getElementById('lightY2').className = 'w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]';
            audio.playBeep(false);
        } else if (race.countdownTimer >= 2.1 && race.lightStage === 2) {
            race.lightStage = 3;
            document.getElementById('lightY3').className = 'w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]';
            audio.playBeep(false);
        } else if (race.countdownTimer >= 2.8 && race.lightStage === 3) {
            race.lightStage = 4;
            race.phase = 'racing';
            document.getElementById('lightGreen').className = 'w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]';
            document.getElementById('raceStatusBanner').textContent = 'СТАРТ! ВКЛЮЧАЙ 1-Ю [+]';
            document.getElementById('raceStatusBanner').className = 'text-emerald-400';
            document.getElementById('launchHint').classList.add('hidden');
            audio.playBeep(true);
            triggerHaptic('heavy');
        }
    }

    if (race.phase === 'racing') {
        race.elapsedTime += dt;
        if (race.elapsedTime > 1.2) {
            document.getElementById('christmasTree').classList.add('hidden');
        }
    }

    if (p.shiftCooldown > 0) p.shiftCooldown = Math.max(0, p.shiftCooldown - dt);

    if (controls.nos && p.nosAmount > 0 && race.phase === 'racing' && p.gear > 0) {
        p.isNosActive = true;
        const drainRate = Math.max(13, 25 - (p.stats.nosLevel - 1) * 2.5);
        p.nosAmount = Math.max(0, p.nosAmount - drainRate * dt);
    } else {
        p.isNosActive = false;
    }

    if (p.gear === 0) {
        if (controls.gas) {
            p.rpm += 6400 * dt;
            if (p.rpm >= maxRpm) p.rpm = maxRpm - 240 + Math.random() * 240;
        } else {
            p.rpm = Math.max(1000, p.rpm - 4800 * dt);
        }
    } else if (race.phase === 'racing') {
        const gearRatio = BASE_GEAR_RATIOS[p.gear] * (1 - (p.stats.gearboxLevel - 1) * 0.025);
        const wheelRpm = 1000 + p.speed * gearRatio * 34;

        if (controls.gas && p.shiftCooldown <= 0) {
            const rpmNorm = p.rpm / maxRpm;
            const torqueCurve = 0.65 + 0.55 * Math.sin(Math.min(1, rpmNorm) * Math.PI * 0.85);
            const turboBoost = rpmNorm > 0.55 ? 1 + (p.stats.turboLevel - 1) * 0.09 : 1;
            const nosBoost = p.isNosActive ? (1.30 + (p.stats.nosLevel - 1) * 0.06) : 1;
            const powerFactor = (p.stats.hp / p.stats.weight) * 43;
            let accel = powerFactor * torqueCurve * (gearRatio / 2.2) * turboBoost * nosBoost;

            const gripThreshold = 13.5 + p.stats.gripLevel * 3.6;
            if (p.gear <= 2 && accel > gripThreshold && p.speed < 28) {
                p.isWheelspin = true;
                accel *= 0.68;
                p.rpm = Math.min(maxRpm, p.rpm + 3500 * dt);
            } else {
                p.isWheelspin = false;
            }

            if (p.rpm >= maxRpm - 80) {
                accel *= 0.08;
                p.rpm = maxRpm - 150 + Math.random() * 150;
            } else {
                p.rpm = Math.min(maxRpm, Math.max(wheelRpm, p.rpm + 1850 * dt));
            }

            const drag = 0.0027 * p.speed * p.speed;
            p.speed = Math.max(0, p.speed + (accel - drag) * dt);
        } else {
            p.isWheelspin = false;
            const engineBrake = 3.5 + 0.003 * p.speed * p.speed;
            p.speed = Math.max(0, p.speed - engineBrake * dt);
            p.rpm = Math.max(1000, wheelRpm);
        }

        p.dist += p.speed * dt;
        p.wheelAngle += p.speed * dt * 1.4;
        const kmh = p.speed * 3.6;
        if (kmh > p.maxSpeedKmh) p.maxSpeedKmh = kmh;
    }

    if (race.phase === 'racing' && race.elapsedTime > ai.reactionDelay) {
        const aiMaxSpeed = 63 + ai.powerToWeight * 66;
        const aiAccel = (ai.powerToWeight * 36.5) * (1 - ai.speed / aiMaxSpeed);
        ai.speed += Math.max(1.5, aiAccel) * dt;
        ai.dist += ai.speed * dt;
        ai.wheelAngle += ai.speed * dt * 1.4;
    }

    audio.updateEngine(p.rpm, maxRpm, p.isNosActive, p.stats.turboLevel);

    if (p.dist >= RACE_DISTANCE && p.finishedTime === null) p.finishedTime = race.elapsedTime;
    if (ai.dist >= RACE_DISTANCE && ai.finishedTime === null) ai.finishedTime = race.elapsedTime;

    if (p.finishedTime !== null) onFinish();
}