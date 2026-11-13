export function loadAssets(loader, manifest) {
    for (const [name, url] of Object.entries(manifest)) {
        loader.add(name, url)
    }

    return new Promise((resolve, reject) => {
        loader.onError.add(reject)
        loader.load((_, resources) => resolve(resources));
    })
}