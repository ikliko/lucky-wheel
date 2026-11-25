import {SoundsConfig} from '@/config/SoundsConfig.js';

const live = new Set();
const SFX_IDS = new Set(['tick', 'win']);

export class SoundsManager {
    #sfxEnabled;
    #musicEnabled;
    #entries = new Map();
    #destroyed = false;

    constructor(config = SoundsConfig) {
        const on = config.enabledByDefault !== false;
        this.#sfxEnabled = on;
        this.#musicEnabled = on;

        for (const [id, def] of Object.entries(config.sounds)) {
            const audio = new Audio(def.src);
            audio.preload = 'auto';
            audio.loop = Boolean(def.loop);
            audio.volume = def.volume ?? 1;
            this.#entries.set(id, {
                audio,
                volume: def.volume ?? 1,
            });
        }

        live.add(this);
    }

    static stopAll() {
        for (const manager of [...live]) {
            manager.destroy();
        }
    }

    get sfxEnabled() {
        return this.#sfxEnabled;
    }

    get musicEnabled() {
        return this.#musicEnabled;
    }

    /** Master: both channels (loading gate / old callers). */
    get enabled() {
        return this.#sfxEnabled && this.#musicEnabled;
    }

    setEnabled(enabled) {
        this.setSfxEnabled(enabled);
        this.setMusicEnabled(enabled);
    }

    setSfxEnabled(enabled) {
        this.#sfxEnabled = Boolean(enabled);

        if (!this.#sfxEnabled) {
            for (const id of SFX_IDS) {
                this.stop(id);
            }
        }
    }

    setMusicEnabled(enabled) {
        this.#musicEnabled = Boolean(enabled);

        if (!this.#musicEnabled) {
            this.stop('bgm');
            return;
        }

        this.ensureBgm();
    }

    play(id) {
        const entry = this.#entries.get(id);

        if (!entry || this.#destroyed) {
            return;
        }

        const allowed = id === 'bgm' ? this.#musicEnabled : this.#sfxEnabled;

        if (!allowed) {
            return;
        }

        const {audio} = entry;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = entry.volume;
        void audio.play().catch(() => {});
    }

    stop(id) {
        const entry = this.#entries.get(id);

        if (!entry) {
            return;
        }

        entry.audio.pause();
        entry.audio.currentTime = 0;
    }

    ensureBgm() {
        if (!this.#musicEnabled || this.#destroyed) {
            return;
        }

        const entry = this.#entries.get('bgm');

        if (!entry || !entry.audio.paused) {
            return;
        }

        void entry.audio.play().catch(() => {});
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.#sfxEnabled = false;
        this.#musicEnabled = false;
        live.delete(this);

        for (const entry of this.#entries.values()) {
            this.#release(entry.audio);
        }

        this.#entries.clear();
    }

    #release(audio) {
        try {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        } catch {
        }
    }
}