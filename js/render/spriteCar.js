import { RENDER_CONFIG } from '../config/gameConfig.js';
import { UI_COLORS } from '../config/constants.js';

export function drawSpriteCar(ctx, x, y, scale, carDef, options = {}) {
    const colorIdx = options.colorIdx ?? 0;
    let img = carDef.spritesLoaded ? carDef.spritesLoaded[colorIdx] : null;
    if (!img && carDef.spritesLoaded) {
        const keys = Object.keys(carDef.spritesLoaded);
        if (keys.length > 0) img = carDef.spritesLoaded[keys[0]];
    }
    if (!img) return false;

    const { wheelAngle = 0, isNos = false, isBurnout = false, pitchAngle = 0, frame = 0 } = options;

    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;
    const isRace = document.getElementById('raceScreen') && !document.getElementById('raceScreen').classList.contains('hidden');
    const cfg = isRace ? RENDER_CONFIG.race : RENDER_CONFIG.garage;

    // 1. Расчет масштаба
    const targetW = canvasW * cfg.maxWidthPct;
    const targetH = canvasH * cfg.maxHeightPct;
    const scaleW = targetW / img.width;
    const scaleH = targetH / img.height;
    let autoScale = Math.min(scaleW, scaleH) * (carDef.spriteScale ?? 1.0);
    autoScale = Math.max(0.05, autoScale);

    const drawW = img.width * autoScale;
    const drawH = img.height * autoScale;
    
    // 2. Позиционирование
    const anchorY = carDef.spriteAnchorY ?? 0.85;
    const dx = Math.round(x - drawW / 2);
    const dy = Math.round(y - drawH * anchorY);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 3. Отрисовка тени (строго под колесами)
    ctx.fillStyle = UI_COLORS.shadowColor;
    ctx.beginPath();
    ctx.ellipse(x, y + drawH * cfg.shadowOffsetY, drawW * cfg.shadowWidth, drawH * cfg.shadowHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Отражаем/наклоняем
    if (carDef.spriteFlip) {
        ctx.translate(x, y);
        ctx.scale(-1, 1);
        ctx.translate(-x, -y);
    }
    if (pitchAngle !== 0) {
        ctx.translate(x, y);
        ctx.rotate(pitchAngle);
        ctx.translate(-x, -y);
    }

    // 5. NOS
    if (isNos) {
        const flameLen = drawW * 0.15 + Math.sin(frame * 1.7) * drawW * 0.05;
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(dx - flameLen, y - drawH * 0.15, flameLen, drawH * 0.1);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(dx - flameLen * 0.6, y - drawH * 0.12, flameLen * 0.6, drawH * 0.06);
    }

    // 6. Дым
    if (isBurnout) {
        const wheelCfg = carDef.wheels || {};
        const rearXPct = wheelCfg.rearX ?? 0.25;
        const yOffsetPct = wheelCfg.yOffset ?? 0.80;
        
        const rearWheelX = dx + drawW * rearXPct; 
        const rearWheelY = dy + drawH * yOffsetPct; 

        for (let i = 0; i < 8; i++) {
            const progress = (frame * 1.5 + i * 10) % 40; 
            const ox = rearWheelX - progress * 1.5 - 10;
            const oy = rearWheelY - progress * 0.8;
            const size = 6 + progress * 0.6; 
            const opacity = 1 - (progress / 40);
            
            ctx.fillStyle = `rgba(220, 220, 220, ${opacity * 0.8})`;
            ctx.fillRect(Math.round(ox), Math.round(oy), size, size);
        }
    }

    // 7. Сама машина
    ctx.drawImage(img, dx, dy, drawW, drawH);

    // 8. Колеса
    if (wheelAngle !== 0) {
        const wheelCfg = carDef.wheels || {};
        const yOffsetPct = wheelCfg.yOffset ?? 0.80;
        const frontXPct = wheelCfg.frontX ?? 0.78;
        const rearXPct = wheelCfg.rearX ?? 0.25;
        const radiusPct = wheelCfg.radius ?? 0.10;
        const opacity = wheelCfg.opacity ?? 0.4;

        const wheelYOffset = drawH * yOffsetPct;
        const frontWheelX = dx + drawW * frontXPct;
        const rearWheelX = dx + drawW * rearXPct;
        const wheelRadius = drawH * radiusPct;

        const drawSpinningWheel = (wx, wy, radius) => {
            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(wheelAngle);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.fillRect(-2, -radius * 0.8, 4, radius * 1.6);
            }
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, opacity + 0.3)})`;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        drawSpinningWheel(frontWheelX, dy + wheelYOffset, wheelRadius);
        drawSpinningWheel(rearWheelX, dy + wheelYOffset, wheelRadius);
    }

    ctx.restore();
    return true;
}