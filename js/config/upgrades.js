export const UPGRADE_DEFS = {
    engine: { name: 'ДВИГАТЕЛЬ', desc: '+Мощность и макс. обороты RPM', baseCost: 350, costMult: 1.75 },
    turbo:  { name: 'ТУРБИНА / БУСТ', desc: '+Мощный подхват на высоких RPM', baseCost: 400, costMult: 1.8 },
    gearbox:{ name: 'КПП (SPORT)', desc: '+Быстрое переключение и ряды', baseCost: 300, costMult: 1.7 },
    tires:  { name: 'ШИНЫ / СЛИКИ', desc: '+Зацеп на старте без букса', baseCost: 280, costMult: 1.65 },
    nos:    { name: 'ЗАКИСЬ АЗОТА', desc: '+Объем баллона и тяга NOS', baseCost: 450, costMult: 1.85 }
};

export function getUpgradeCost(def, currentLevel, customCostMult) {
    const mult = customCostMult || def.costMult;
    return Math.round(def.baseCost * Math.pow(mult, currentLevel - 1));
}