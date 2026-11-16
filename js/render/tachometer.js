export function renderTachometer(rpm, maxRpm, isNeutral) {
    const canvas = document.getElementById('tachometerCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
    }

    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h * 0.88;
    const radius = Math.min(w * 0.44, h * 0.78);

    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    if (isNeutral) {
        const startGreen = Math.PI + Math.PI * 0.56;
        const endGreen = Math.PI + Math.PI * 0.76;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startGreen, endGreen);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    const startRed = Math.PI + Math.PI * 0.83;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRed, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.stroke();

    for (let i = 0; i <= 8; i++) {
        const ang = Math.PI + (i / 8) * Math.PI;
        const x1 = cx + Math.cos(ang) * (radius - 6);
        const y1 = cy + Math.sin(ang) * (radius - 6);
        const x2 = cx + Math.cos(ang) * (radius + 2);
        const y2 = cy + Math.sin(ang) * (radius + 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i >= 7 ? '#ef4444' : '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const ratio = Math.min(1, Math.max(0, rpm / maxRpm));
    const needleAngle = Math.PI + ratio * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 4), cy + Math.sin(needleAngle) * (radius - 4));
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
}