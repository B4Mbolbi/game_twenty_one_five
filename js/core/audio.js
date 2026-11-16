export class RetroSoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.engineOsc = null;
        this.engineGain = null;
        this.turboOsc = null;
        this.turboGain = null;
    }

    init() {
        if (!this.ctx && this.enabled) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type = 'square', duration = 0.1, vol = 0.08) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShift() {
        this.playTone(190, 'sawtooth', 0.08, 0.11);
        setTimeout(() => this.playTone(360, 'square', 0.08, 0.08), 35);
    }

    playUpgrade() {
        this.playTone(523.25, 'square', 0.07, 0.08);
        setTimeout(() => this.playTone(659.25, 'square', 0.07, 0.08), 65);
        setTimeout(() => this.playTone(783.99, 'square', 0.14, 0.09), 130);
    }

    playBeep(isGreen = false) {
        this.playTone(isGreen ? 880 : 440, 'square', isGreen ? 0.25 : 0.12, 0.1);
    }

    startEngine() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx || this.engineOsc) return;

        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 50;
        this.engineGain.gain.value = 0.035;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();

        this.turboOsc = this.ctx.createOscillator();
        this.turboGain = this.ctx.createGain();
        this.turboOsc.type = 'sine';
        this.turboOsc.frequency.value = 1200;
        this.turboGain.gain.value = 0.0;
        this.turboOsc.connect(this.turboGain);
        this.turboGain.connect(this.ctx.destination);
        this.turboOsc.start();
    }

    updateEngine(rpm, maxRpm, isNos, turboLevel) {
        if (!this.engineOsc || !this.ctx || !this.enabled) return;
        const ratio = Math.max(0.1, rpm / maxRpm);
        const freq = 40 + ratio * 165 + (isNos ? 40 : 0);
        this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
        this.engineGain.gain.setTargetAtTime(0.03 + ratio * 0.03, this.ctx.currentTime, 0.03);

        if (this.turboOsc && this.turboGain) {
            const boostRatio = Math.max(0, (ratio - 0.55) / 0.45);
            this.turboOsc.frequency.setTargetAtTime(1400 + boostRatio * 1800, this.ctx.currentTime, 0.04);
            this.turboGain.gain.setTargetAtTime(boostRatio * 0.012 * (1 + turboLevel * 0.2), this.ctx.currentTime, 0.04);
        }
    }

    stopEngine() {
        [this.engineOsc, this.turboOsc].forEach(osc => {
            if (osc) {
                try { osc.stop(); osc.disconnect(); } catch (e) {}
            }
        });
        this.engineOsc = null;
        this.engineGain = null;
        this.turboOsc = null;
        this.turboGain = null;
    }
}

export const audio = new RetroSoundEngine();