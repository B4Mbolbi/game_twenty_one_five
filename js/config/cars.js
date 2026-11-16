import { CAR_COLORS } from './colors.js';

// Встроенный фолбэк-каталог (если fetch недоступен / manifest не найден)
const FALLBACK_CARS = [];

export let CAR_CATALOG = [...FALLBACK_CARS];
export const spriteImages = {}; // id -> HTMLImageElement

/**
 * Загружает каталог из cars/manifest.json + cars/<id>/car.json + sprite.png
 * Возвращает Promise, который резолвится после загрузки всех спрайтов.
 */
export async function loadCarCatalog() {
    try {
        const manifestRes = await fetch('cars/manifest.json', { cache: 'no-store' });
        if (!manifestRes.ok) throw new Error('manifest not found');
        const manifest = await manifestRes.json();
        const ids = Array.isArray(manifest.cars) ? manifest.cars : [];

        const loaded = [];
        for (const id of ids) {
            try {
                const cfgRes = await fetch(`cars/${id}/car.json`, { cache: 'no-store' });
                if (!cfgRes.ok) continue;
                const cfg = await cfgRes.json();
                cfg.id = id;
                // значения по умолчанию
                cfg.name = cfg.name || id.toUpperCase();
                cfg.style = cfg.style || 'eg6';
                cfg.defaultColorIdx = cfg.defaultColorIdx ?? 0;
                cfg.price = cfg.price ?? 0;
                cfg.baseHp = cfg.baseHp ?? 170;
                cfg.baseWeight = cfg.baseWeight ?? 1010;
                cfg.baseMaxRpm = cfg.baseMaxRpm ?? 8600;
                cfg.desc = cfg.desc || 'Автомобиль из пользовательской папки.';
                cfg.spriteScale = cfg.spriteScale ?? 2.0;
                cfg.spriteAnchorY = cfg.spriteAnchorY ?? 0.5;

                 // Загружаем спрайты для всех цветов
                cfg.spritesLoaded = {}; // Сюда сложим картинки
                
                if (cfg.sprites) {
                    for (const colorIdx in cfg.sprites) {
                        const fileName = cfg.sprites[colorIdx];
                        try {
                            const img = await loadImage(`cars/${id}/${fileName}`);
                            cfg.spritesLoaded[colorIdx] = img;
                        } catch (e) {
                            console.warn(`Не удалось загрузить спрайт ${fileName} для ${id}`);
                        }
                    }
                }

                loaded.push(cfg);
            } catch (e) {
                console.warn(`Не удалось загрузить машину "${id}":`, e);
            }
        }

        if (loaded.length > 0) {
            // Объединяем: пользовательские машины + фолбэк (если нет дубликатов)
            const loadedIds = new Set(loaded.map(c => c.id));
            const merged = [...loaded];
            for (const fb of FALLBACK_CARS) {
                if (!loadedIds.has(fb.id)) merged.push(fb);
            }
            CAR_CATALOG = merged;
        }
    } catch (e) {
        console.warn('Каталог cars/manifest.json не найден, используется встроенный:', e);
    }
    return CAR_CATALOG;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}