import {SoundsConfig} from '@/config/SoundsConfig.js';

const live = new Set();

export class SoundsManager {
    #enabled;
    #entries = new Map();
    #destroyed = false;

    constructor(config = SoundsConfig) {
        this.#enabled = config.enabledByDefault !== false;

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

    get enabled() {
        return this.#enabled;
    }

    setEnabled(enabled) {
        this.#enabled = Boolean(enabled);

        if (!this.#enabled) {
            this.#stopPlaying();
            return;
        }

        this.ensureBgm();
    }

    play(id) {
        const entry = this.#entries.get(id);

        if (!entry || !this.#enabled || this.#destroyed) {
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
        if (!this.#enabled || this.#destroyed) {
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
        this.#enabled = false;
        live.delete(this);

        for (const entry of this.#entries.values()) {
            this.#release(entry.audio);
        }

        this.#entries.clear();
    }

    #stopPlaying() {
        for (const id of this.#entries.keys()) {
            this.stop(id);
        }
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
