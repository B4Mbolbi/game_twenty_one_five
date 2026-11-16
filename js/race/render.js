import { drawPixelCar } from '../render/pixelCar.js';
import { drawSpriteCar } from '../render/spriteCar.js';
import { renderTachometer } from '../render/tachometer.js'; // <-- ДОБАВИТЬ ЭТО
import { getRace, controls, RACE_DISTANCE } from './physics.js';
import { UI_COLORS } from '../config/constants.js'; // Если вы используете constants.js
import { RENDER_CONFIG } from '../config/gameConfig.js'; // Если вы используете gameConfig.js

export function renderRaceHUD() {
    const race = getRace();
    if (!race) return;
    const p = race.player;
    const ai = race.ai;

    document.getElementById('playerDistText').textContent = Math.min(402, Math.floor(p.dist));
    document.getElementById('aiDistText').textContent = Math.min(402, Math.floor(ai.dist));

    const pPct = Math.min(96, (p.dist / RACE_DISTANCE) * 96);
    const aiPct = Math.min(96, (ai.dist / RACE_DISTANCE) * 96);
    document.getElementById('playerProgressBar').style.left = `${pPct}%`;
    document.getElementById('aiProgressBar').style.left = `${aiPct}%`;

    document.getElementById('speedDisplay').textContent = Math.round(p.speed * 3.6);
    document.getElementById('gearDisplay').textContent = p.gear === 0 ? 'N' : p.gear;
    document.getElementById('rpmText').textContent = Math.round(p.rpm);

    const rpmRatio = p.rpm / p.stats.maxRpm;
    const maxBar = 0.6 + (p.stats.turboLevel - 1) * 0.35;
    const currentBar = p.gear > 0 && controls.gas ? Math.max(0, (rpmRatio - 0.35) / 0.65) * maxBar : 0;
    document.getElementById('boostDisplay').textContent = `${currentBar.toFixed(1)} BAR`;

    renderTachometer(p.rpm, p.stats.maxRpm, p.gear === 0);

    const shiftLight = document.getElementById('shiftLight');
    if (p.gear >= 1 && p.gear < 6 && rpmRatio >= 0.83) {
        shiftLight.className = 'py-1 border border-rose-400 bg-rose-600 text-center text-[8px] text-white shift-flash';
    } else {
        shiftLight.className = 'py-1 border border-slate-700 bg-slate-900 text-center text-[8px] text-slate-500';
    }

    document.getElementById('nosPctText').textContent = `${Math.ceil(p.nosAmount)}%`;
    document.getElementById('nosFillBar').style.height = `${p.nosAmount}%`;
    document.getElementById('nosBtn').disabled = p.nosAmount <= 0 || p.gear === 0;
}

export function renderRaceCanvas() {
    const race = getRace();
    if (!race) return;
    const canvas = document.getElementById('raceCanvas');
    const ctx = canvas.getContext('2d');

    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
    }

    const w = canvas.width, h = canvas.height;
    const p = race.player, ai = race.ai;
    const pxPerMeter = 18;
    const cameraMeters = p.dist;

    ctx.save();

    // Небо
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.44);
    skyGrad.addColorStop(0, '#070810');
    skyGrad.addColorStop(1, '#191d3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.44);

    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(w * 0.8, h * 0.08, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w * 0.15, h * 0.1, 2, 2);
    ctx.fillRect(w * 0.35, h * 0.06, 2, 2);
    ctx.fillRect(w * 0.62, h * 0.12, 2, 2);

    // Город
    const cityOffset = (cameraMeters * 2.2) % 240;
    for (let bx = -cityOffset - 60; bx < w + 60; bx += 40) {
        const bh = 32 + (Math.abs(Math.sin(bx * 0.12)) * 42);
        ctx.fillStyle = '#101324';
        ctx.fillRect(bx, h * 0.44 - bh, 34, bh);
        ctx.fillStyle = Math.floor(bx) % 2 === 0 ? '#38bdf8' : '#fbbf24';
        if (Math.floor(bx) % 3 === 0) ctx.fillRect(bx + 8, h * 0.44 - bh + 10, 4, 4);
        if (Math.floor(bx) % 2 === 0) ctx.fillRect(bx + 20, h * 0.44 - bh + 20, 4, 4);
    }

    // Трибуны
    const standOffset = (cameraMeters * pxPerMeter * 0.55) % 160;
    for (let sx = -standOffset; sx < w + 160; sx += 160) {
        ctx.fillStyle = '#1b1f33';
        ctx.fillRect(sx, h * 0.36, 120, h * 0.08);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(sx + 15, h * 0.38, 4, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx + 55, h * 0.39, 4, 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx + 95, h * 0.38, 4, 4);
    }

    ctx.fillStyle = '#272c42';
    ctx.fillRect(0, h * 0.44, w, h * 0.08);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, h * 0.44, w, 2);

    // Фонари
    const poleSpacing = 140;
    const poleOffset = (cameraMeters * pxPerMeter * 0.75) % poleSpacing;
    for (let px = w - poleOffset; px > -20; px -= poleSpacing) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(px, h * 0.26, 4, h * 0.22);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(px - 4, h * 0.26, 12, 4);
    }

    // Асфальт
    const roadTop = h * 0.52;
    const roadHeight = h * 0.48;
    ctx.fillStyle = UI_COLORS.roadColor;
    ctx.fillRect(0, roadTop, w, roadHeight);

    // Разделительная линия (посередине между машинами)
    const laneDividerY = roadTop + roadHeight * RENDER_CONFIG.race.lineYRatio;
    const dashPeriod = 70;
    const dashOffset = (cameraMeters * pxPerMeter) % dashPeriod;
    ctx.fillStyle = '#94a3b8';
    for (let dx = -dashOffset; dx < w; dx += dashPeriod) {
        ctx.fillRect(dx, laneDividerY, 36, 4);
    }
    // Уменьшили масштаб (0.65)
    const carScale = 0.19;
    const aiScreenX = (w * 0.28) + (ai.dist - cameraMeters) * pxPerMeter;
    const aiScreenY = roadTop + roadHeight * RENDER_CONFIG.race.aiYRatio;
    const playerScreenX = w * 0.28;
    const playerScreenY = roadTop + roadHeight * RENDER_CONFIG.race.playerYRatio;
    const pitch = (controls.gas && p.gear > 0 && race.phase === 'racing') ? -0.025 : 0;

    drawSpriteCar(ctx, aiScreenX, aiScreenY, RENDER_CONFIG.race.carScale * 0.92, ai.carDef, {
        wheelAngle: ai.wheelAngle, frame: race.frame, colorIdx: ai.colorIdx || 0
    });

    const startLineX = playerScreenX + (0 - cameraMeters) * pxPerMeter + 45;
    const finishLineX = playerScreenX + (RACE_DISTANCE - cameraMeters) * pxPerMeter + 45;

    if (startLineX > -30 && startLineX < w + 30) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(startLineX, roadTop, 6, roadHeight);
    }
    if (finishLineX > -40 && finishLineX < w + 40) {
        const cellSize = 8;
        for (let fy = roadTop; fy < roadTop + roadHeight; fy += cellSize) {
            for (let fx = 0; fx < 24; fx += cellSize) {
                const isWhite = ((Math.floor(fy / cellSize) + Math.floor(fx / cellSize)) % 2) === 0;
                ctx.fillStyle = isWhite ? '#ffffff' : '#090a0f';
                ctx.fillRect(finishLineX + fx, fy, cellSize, cellSize);
            }
        }
    }
    if (aiScreenX > -120 && aiScreenX < w + 120) {
        const drawnAi = drawSpriteCar(ctx, aiScreenX, aiScreenY, carScale * 0.92, ai.carDef, {
            wheelAngle: ai.wheelAngle, frame: race.frame,
            colorIdx: ai.colorIdx || 0
        });
        if (!drawnAi) {
            drawPixelCar(ctx, aiScreenX, aiScreenY, carScale * 0.92, ai.carDef.style, ai.colorObj, {
                wheelAngle: ai.wheelAngle, frame: race.frame
            });
        }
    }

    // --- ОТРИСОВКА ИГРОКА ---
    drawSpriteCar(ctx, playerScreenX, playerScreenY, RENDER_CONFIG.race.carScale, p.carDef, {
        wheelAngle: p.wheelAngle, isNos: p.isNosActive, isBurnout: p.isWheelspin,
        pitchAngle: pitch, frame: race.frame, colorIdx: p.stats.state.colorIdx
    });

    ctx.restore();
}