export class AssetManager {
    constructor(loader) {
        this.loader = loader;
        this.resources = null;
    }

    load(manifest, onProgress) {
        if (this.resources) {
            if (typeof onProgress === 'function') {
                onProgress(1);
            }

            return Promise.resolve(this.resources);
        }

        for (const [name, url] of Object.entries(manifest)) {
            this.loader.add(name, url);
        }

        return new Promise((resolve, reject) => {
            const handleProgress = (loader) => {
                if (typeof onProgress === 'function') {
                    onProgress(loader.progress / 100);
                }
            };

            const progressBinding = this.loader.onProgress.add(handleProgress);
            const errorBinding = this.loader.onError.add(reject);

            this.loader.load((_, resources) => {
                this.loader.onProgress.detach(progressBinding);
                this.loader.onError.detach(errorBinding);
                this.resources = resources;

                if (typeof onProgress === 'function') {
                    onProgress(1);
                }

                resolve(resources);
            });
        });
    }
}
