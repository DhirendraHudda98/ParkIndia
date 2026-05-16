const registry = new Map();
const loaded = new Set();
export function registerRoute(path, loader) {
    registry.set(path, loader);
}
export function preloadRoute(path) {
    const key = '/' + path.replace(/^\//, '');
    if (loaded.has(key))
        return;
    const loader = registry.get(key);
    if (loader) {
        loaded.add(key);
        loader();
    }
}
export function preloadRoutesIdle(paths) {
    const schedule = globalThis.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
    paths.forEach((p, i) => schedule(() => preloadRoute(p), { timeout: 3000 + i * 500 }));
}
