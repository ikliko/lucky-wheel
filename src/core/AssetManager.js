export class AssetManager {
    constructor(loader) {
        this.loader = loader;
        this.resources = null;
    }

    load(manifest) {
        for (const [name, url] of Object.entries(manifest)) {
            this.loader.add(name, url);
        }

        return new Promise((resolve, reject) => {
            this.loader.onError.add(reject);
            this.loader.load((_, resources) => {
                this.resources = resources;
                resolve(resources);
            });
        });
    }
}
