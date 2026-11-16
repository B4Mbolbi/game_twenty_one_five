/**
 * Пиксельная отрисовка автомобилей (fallback, когда нет спрайта).
 * Экспортирует: drawPixelLine, drawMeshWheel, drawPixelCar
 */

export function drawPixelLine(ctx, x1, y1, x2, y2, color) {
    ctx.fillStyle = color;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) {
        ctx.fillRect(Math.round(x1), Math.round(y1), 1, 1);
        return;
    }
    for (let i = 0; i <= steps; i++) {
        const x = Math.round(x1 + (dx * i) / steps);
        const y = Math.round(y1 + (dy * i) / steps);
        ctx.fillRect(x, y, 1, 1);
    }
}

// Отрисовка многоспицевого диска в стиле BBS / Mesh с низкопрофильной резиной
export function drawMeshWheel(ctx, cx, cy, angle) {
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));

    // Черная арка вокруг колеса
    ctx.fillStyle = '#090A0F';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Низкопрофильная покрышка (R=11)
    ctx.fillStyle = '#14161D';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Боковина шины
    ctx.strokeStyle = '#2B303E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.stroke();

    // Полированная полка обода
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Внутренняя темная чаша диска
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Вращающиеся перекрестные спицы BBS Mesh
    ctx.rotate(angle);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-6, -1, 12, 2);
    ctx.fillRect(-1, -6, 2, 12);
    drawPixelLine(ctx, -4, -4, 4, 4, '#CBD5E1');
    drawPixelLine(ctx, -4, 4, 4, -4, '#CBD5E1');
    ctx.fillRect(-5, -3, 2, 1);
    ctx.fillRect(3, -3, 2, 1);
    ctx.fillRect(-5, 2, 2, 1);
    ctx.fillRect(3, 2, 2, 1);

    // Центральный колпачок ступицы
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-1, -1, 2, 2);

    ctx.restore();
}

export function drawPixelCar(ctx, x, y, scale, style, colorObj, options = {}) {
    const {
        wheelAngle = 0,
        isNos = false,
        isBurnout = false,
        pitchAngle = 0,
        frame = 0
    } = options;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(pitchAngle);
    ctx.scale(scale, scale);

    // Тень под днищем
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 58, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Пламя NOS
    if (isNos) {
        const flameLen = 22 + Math.sin(frame * 1.7) * 9;
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(-60 - flameLen, 7, flameLen, 5);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-60 - flameLen * 0.65, 8, flameLen * 0.65, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-60 - flameLen * 0.35, 9, flameLen * 0.35, 1);
    }

    // Дым при пробуксовке
    if (isBurnout) {
        const smokeX = style === 'eg6' ? 32 : -36;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(241, 245, 249, 0.75)' : 'rgba(148, 163, 184, 0.65)';
            const ox = smokeX - ((frame * 3.2 + i * 7) % 34);
            const oy = 11 - ((frame * 1.0 + i * 4) % 14);
            const sz = 5 + (i % 3) * 3;
            ctx.fillRect(Math.round(ox), Math.round(oy), sz, sz);
        }
    }

    // =========================================================================
    // 1. RED JDM HATCHBACK (HONDA CIVIC EG6)
    // =========================================================================
    if (style === 'eg6') {
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-58, 9, 4, 2);
        ctx.fillStyle = '#090A0F';
        ctx.fillRect(-59, 9, 2, 2);

        ctx.fillStyle = colorObj.dark;
        ctx.fillRect(-55, 4, 111, 7);

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(-56, -4, 112, 8);
        ctx.beginPath();
        ctx.moveTo(18, -4);
        ctx.lineTo(55, -1);
        ctx.lineTo(55, 4);
        ctx.lineTo(18, 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-47, -4);
        ctx.lineTo(-42, -16);
        ctx.lineTo(-2, -16);
        ctx.lineTo(20, -4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(-48, -16, 8, 2);
        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-47, -16, 44, 1);

        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-45, -4, 62, 1);
        drawPixelLine(ctx, 18, -4, 53, -1, colorObj.accent);

        ctx.fillStyle = '#12151C';
        ctx.beginPath();
        ctx.moveTo(-41, -5);
        ctx.lineTo(-38, -14);
        ctx.lineTo(-17, -14);
        ctx.lineTo(-17, -5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-14, -5);
        ctx.lineTo(-14, -14);
        ctx.lineTo(-2, -14);
        ctx.lineTo(16, -5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(-17, -15, 3, 10);
        drawPixelLine(ctx, -42, -16, -2, -16, '#090A0F');
        drawPixelLine(ctx, -2, -16, 20, -4, '#090A0F');
        drawPixelLine(ctx, -47, -4, -42, -16, '#090A0F');

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(10, -7, 4, 3);
        ctx.fillStyle = '#090A0F';
        ctx.fillRect(10, -5, 4, 1);

        ctx.fillStyle = '#111318';
        ctx.fillRect(-55, 2, 110, 2);
        ctx.fillRect(-13, -2, 5, 2);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(23, -1, 2, 1);

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(46, 7, 10, 3);
        ctx.fillRect(-56, 9, 112, 2);

        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(49, -1, 6, 2);
        ctx.fillStyle = '#F97316';
        ctx.fillRect(45, -1, 4, 2);

        ctx.fillStyle = '#7F1D1D';
        ctx.fillRect(-55, -4, 6, 5);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(-55, -4, 5, 3);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(-54, -1, 3, 1);

        drawPixelLine(ctx, -56, -4, -56, 10, '#090A0F');
        drawPixelLine(ctx, 55, -1, 56, 10, '#090A0F');
        drawPixelLine(ctx, 20, -4, 55, -1, '#090A0F');

        drawMeshWheel(ctx, -35, 9, wheelAngle);
        drawMeshWheel(ctx, 35, 9, wheelAngle);

    // =========================================================================
    // 2. LOWERED MINI-TRUCK PICKUP
    // =========================================================================
    } else if (style === 'pickup') {
        ctx.fillStyle = colorObj.dark;
        ctx.fillRect(-56, 5, 111, 6);

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(-56, -3, 44, 9);
        ctx.beginPath();
        ctx.moveTo(22, -3);
        ctx.lineTo(54, -1);
        ctx.lineTo(54, 6);
        ctx.lineTo(22, 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-11, -17);
        ctx.lineTo(13, -17);
        ctx.lineTo(24, -3);
        ctx.lineTo(-11, -3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-56, -4, 44, 1);
        ctx.fillRect(-10, -17, 22, 1);
        drawPixelLine(ctx, 24, -3, 53, -1, colorObj.accent);

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(-12, -4, 1, 15);
        ctx.fillRect(2, -3, 1, 13);

        ctx.fillStyle = '#12151C';
        ctx.fillRect(-9, -14, 6, 10);
        ctx.beginPath();
        ctx.moveTo(-1, -14);
        ctx.lineTo(11, -14);
        ctx.lineTo(20, -4);
        ctx.lineTo(-1, -4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(-3, -15, 2, 11);
        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(15, -6, 3, 3);
        ctx.fillStyle = '#090A0F';
        ctx.fillRect(15, -4, 3, 1);

        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(3, -1, 5, 2);
        ctx.fillStyle = '#475569';
        ctx.fillRect(4, 0, 3, 1);

        ctx.fillStyle = '#64748B';
        ctx.fillRect(52, 4, 6, 3);
        ctx.fillStyle = '#090A0F';
        ctx.fillRect(51, 7, 6, 3);
        ctx.fillRect(-56, 10, 111, 1);

        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(52, -1, 3, 3);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(52, 2, 3, 2);

        ctx.fillStyle = '#991B1B';
        ctx.fillRect(-56, -2, 3, 6);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-56, -2, 2, 4);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(-56, 2, 2, 1);

        drawPixelLine(ctx, -56, -4, -12, -4, '#090A0F');
        drawPixelLine(ctx, -11, -17, -11, -4, '#090A0F');
        drawPixelLine(ctx, -11, -17, 13, -17, '#090A0F');
        drawPixelLine(ctx, 13, -17, 24, -3, '#090A0F');
        drawPixelLine(ctx, 24, -3, 54, -1, '#090A0F');
        drawPixelLine(ctx, -56, -4, -56, 10, '#090A0F');
        drawPixelLine(ctx, 54, -1, 54, 10, '#090A0F');

        drawMeshWheel(ctx, -32, 9, wheelAngle);
        drawMeshWheel(ctx, 37, 9, wheelAngle);

    // =========================================================================
    // 3. CYAN SPORTS SEDAN (ALTEZZA / IS300)
    // =========================================================================
    } else {
        ctx.fillStyle = '#475569';
        ctx.fillRect(-59, 9, 4, 2);

        ctx.fillStyle = colorObj.dark;
        ctx.fillRect(-56, 4, 114, 7);

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(-57, -3, 114, 8);
        ctx.beginPath();
        ctx.moveTo(20, -3);
        ctx.lineTo(57, 1);
        ctx.lineTo(58, 10);
        ctx.lineTo(20, 10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-43, -3);
        ctx.lineTo(-27, -15);
        ctx.lineTo(2, -15);
        ctx.lineTo(21, -3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = colorObj.body;
        ctx.fillRect(-58, -5, 7, 2);
        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-58, -5, 6, 1);

        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-26, -15, 27, 1);
        ctx.fillRect(-51, -3, 71, 1);
        drawPixelLine(ctx, 21, -3, 56, 1, colorObj.accent);

        ctx.fillStyle = '#12151C';
        ctx.beginPath();
        ctx.moveTo(-39, -4);
        ctx.lineTo(-25, -13);
        ctx.lineTo(-10, -13);
        ctx.lineTo(-10, -4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-7, -4);
        ctx.lineTo(-7, -13);
        ctx.lineTo(1, -13);
        ctx.lineTo(17, -4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(-10, -14, 3, 10);
        ctx.fillStyle = colorObj.body;
        ctx.fillRect(12, -6, 4, 3);
        ctx.fillStyle = '#090A0F';
        ctx.fillRect(12, -4, 4, 1);

        ctx.fillStyle = colorObj.dark;
        ctx.fillRect(-8, -3, 1, 12);
        ctx.fillRect(14, -3, 1, 12);
        ctx.fillRect(-25, -3, 1, 10);
        ctx.fillStyle = colorObj.accent;
        ctx.fillRect(-21, -1, 4, 1);
        ctx.fillRect(-5, -1, 4, 1);

        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(46, 0);
        ctx.lineTo(56, 1);
        ctx.lineTo(56, 3);
        ctx.lineTo(48, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(51, 1, 4, 2);
        ctx.fillStyle = '#F97316';
        ctx.fillRect(47, 1, 2, 1);

        ctx.fillStyle = '#090A0F';
        ctx.fillRect(52, 6, 6, 3);
        ctx.fillRect(-56, 10, 114, 1);

        ctx.fillStyle = '#991B1B';
        ctx.fillRect(-57, -3, 7, 5);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-57, -2, 6, 3);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(-56, -2, 3, 2);

        drawPixelLine(ctx, -58, -5, -51, -3, '#090A0F');
        drawPixelLine(ctx, -51, -3, -43, -3, '#090A0F');
        drawPixelLine(ctx, -43, -3, -27, -15, '#090A0F');
        drawPixelLine(ctx, -27, -15, 2, -15, '#090A0F');
        drawPixelLine(ctx, 2, -15, 21, -3, '#090A0F');
        drawPixelLine(ctx, 21, -3, 57, 1, '#090A0F');
        drawPixelLine(ctx, -57, -3, -57, 10, '#090A0F');
        drawPixelLine(ctx, 57, 1, 58, 10, '#090A0F');

        drawMeshWheel(ctx, -35, 9, wheelAngle);
        drawMeshWheel(ctx, 37, 9, wheelAngle);
    }

    ctx.restore();
}