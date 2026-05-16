// Command registry — a plugin-native surface any module can contribute
// actions into. The Command Palette (Cmd+K) reads this registry and
// renders whatever is currently live. When a component unmounts it
// unregisters whatever it contributed, so the palette auto-prunes
// stale commands without the consumer needing to think about it.
//
// The registry is deliberately framework-free: plain TS types + a tiny
// subscription API. The React layer on top (CommandPalette.tsx) is the
// only thing that knows about React. Swap it for Solid/Vue/anything
// without touching what a module's `registerCommand(...)` call looks
// like.
//
// All state lives in memory in the browser. Nothing persisted server-
// side, nothing crossing the network. Search is a local fuzzy match.
/** Tiny bigram-friendly fuzzy score. Higher = better.
 *  Favors prefix matches on the title, then keyword hits, then
 *  substring matches. Cheap to run on a few hundred entries. */
function score(cmd, query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return 1; // no query → everything passes with neutral score
    const title = cmd.title.toLowerCase();
    if (title.startsWith(q))
        return 100;
    if (title.includes(q))
        return 70;
    if (cmd.description?.toLowerCase().includes(q))
        return 40;
    for (const kw of cmd.keywords ?? []) {
        if (kw.toLowerCase().includes(q))
            return 30;
    }
    // Last resort: character run — every character of q appears in title
    // in order, with gaps allowed. Covers "bking" → "bookings".
    let ti = 0;
    for (const ch of q) {
        const idx = title.indexOf(ch, ti);
        if (idx < 0)
            return 0;
        ti = idx + 1;
    }
    return 10;
}
function createRegistry() {
    // Using Map keyed by id gives free dedupe on re-register (e.g. hot reload).
    const commands = new Map();
    const listeners = new Set();
    const notify = () => {
        for (const l of listeners)
            l();
    };
    return {
        register(cmd) {
            commands.set(cmd.id, cmd);
            notify();
            return () => {
                if (commands.get(cmd.id) === cmd) {
                    commands.delete(cmd.id);
                    notify();
                }
            };
        },
        registerMany(cmds) {
            for (const c of cmds)
                commands.set(c.id, c);
            notify();
            return () => {
                for (const c of cmds) {
                    if (commands.get(c.id) === c)
                        commands.delete(c.id);
                }
                notify();
            };
        },
        all() {
            return [...commands.values()];
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        search(query, ctx) {
            return [...commands.values()]
                .filter((c) => (c.when ? c.when(ctx) : true))
                .map((c) => ({ c, s: score(c, query) }))
                .filter((x) => x.s > 0)
                .sort((a, b) => b.s - a.s || a.c.title.localeCompare(b.c.title))
                .map((x) => x.c);
        },
        clear() {
            commands.clear();
            notify();
        },
    };
}
/** Module-scoped singleton. Tests should instantiate their own via
 *  createRegistry() rather than importing this one. */
export const commandRegistry = createRegistry();
export { createRegistry };
