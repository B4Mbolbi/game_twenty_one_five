import { CAR_CATALOG } from '../config/cars.js';
import { drawSpriteCar } from './spriteCar.js';

let garageAnimFrame = 0;

export function startGaragePreviewLoop(gameState) {
    const canvas = document.getElementById('garageCanvas');
    const ctx = canvas.getContext('2d');

    function loop() {
        if (!document.getElementById('garageScreen').classList.contains('hidden')) {
            const rect = canvas.parentElement.getBoundingClientRect();
            if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
                canvas.width = Math.floor(rect.width);
                canvas.height = Math.floor(rect.height);
            }

            const w = canvas.width;
            const h = canvas.height;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, w, h);

            const groundY = Math.floor(h * 0.72);

            // --- Салон FURUKAWA AUTO ---
            ctx.fillStyle = '#1B3644';
            ctx.fillRect(0, 0, w, groundY);

            ctx.fillStyle = '#0F1F28';
            for (let gx = 20; gx < w * 0.76; gx += 46) ctx.fillRect(gx, 0, 2, groundY);
            ctx.fillRect(0, Math.floor(groundY * 0.34), Math.floor(w * 0.76), 2);

            const entX = Math.floor(w * 0.14);
            const entW = Math.floor(w * 0.48);
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(entX, Math.floor(groundY * 0.2), 10, groundY - Math.floor(groundY * 0.2));
            ctx.fillRect(entX + entW - 10, Math.floor(groundY * 0.2), 10, groundY - Math.floor(groundY * 0.2));

            const signY = Math.floor(groundY * 0.16);
            ctx.fillStyle = '#B91C1C';
            ctx.fillRect(entX - 4, signY, entW + 8, 16);
            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(entX - 4, signY + 3, entW + 8, 10);
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 7px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FURUKAWA AUTO', entX + entW / 2, signY + 11);

            ctx.fillStyle = '#162B36';
            ctx.fillRect(entX + 14, Math.floor(groundY * 0.44), entW - 28, groundY - Math.floor(groundY * 0.44));
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(entX + entW / 2 - 3, Math.floor(groundY * 0.62), 2, 14);
            ctx.fillRect(entX + entW / 2 + 1, Math.floor(groundY * 0.62), 2, 14);

            const bayX = Math.floor(w * 0.76);
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(bayX, 0, w - bayX, groundY);
            ctx.fillStyle = '#B91C1C';
            ctx.fillRect(bayX + 6, 0, w - bayX - 6, Math.floor(groundY * 0.22));
            ctx.fillStyle = '#090A0F';
            ctx.fillRect(bayX + 8, Math.floor(groundY * 0.34), w - bayX - 8, groundY - Math.floor(groundY * 0.34));
            ctx.fillStyle = '#991B1B';
            ctx.fillRect(bayX + 14, groundY - 22, 34, 16);
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(bayX + 18, groundY - 12, 22, 6);

            ctx.fillStyle = '#64748B';
            ctx.fillRect(0, groundY - 4, w, 4);
            ctx.fillStyle = '#26272B';
            ctx.fillRect(0, groundY, w, h - groundY);

            // --- Машина ---
            const carDef = CAR_CATALOG.find(c => c.id === gameState.selectedCarId);
            const scale = Math.min(2.05, w / 185);
            const cx = w * 0.47;
            const cy = groundY - 40; // Чуть подняли над полом

            // Пытаемся нарисовать спрайт
const carState = gameState.cars[gameState.selectedCarId];
const drawn = drawSpriteCar(ctx, cx, cy, scale, carDef, { 
    wheelAngle: 0, 
    frame: garageAnimFrame,
    colorIdx: carState ? carState.colorIdx : 0 // ОБЯЗАТЕЛЬНО ПЕРЕДАЕМ ЦВЕТ
});
            // Если спрайта нет — рисуем заглушку
            if (!drawn) {
                ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
                ctx.fillRect(cx - 60, cy - 30, 120, 40);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('НЕТ СПРАЙТА', cx, cy - 5);
            }

            garageAnimFrame++;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}