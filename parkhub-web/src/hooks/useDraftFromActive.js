import { useCallback, useEffect, useRef, useState } from 'react';
function defaultDerive(active) {
    // Arrays must be cloned with [...arr] — object spread on an array produces
    // `{ '0': ..., '1': ... }` which is silently wrong.
    if (Array.isArray(active)) {
        return [...active];
    }
    if (active !== null && typeof active === 'object') {
        return { ...active };
    }
    // Primitives pass through verbatim.
    return active;
}
/**
 * Track a draft mirror of an "active" item without clobbering in-flight edits.
 *
 * The naive shape (`useEffect(() => setDraft(active.body), [active])`) re-seeds
 * the draft every time the parent rerenders the same active object — which is
 * exactly what happens when react-query refetches the list and produces a new
 * array. The classic workaround is `[activeId]` plus an
 * `eslint-disable-next-line react-hooks/exhaustive-deps`, which silences the
 * linter but loses the dependency-tracking guarantee.
 *
 * This hook keeps the lint rule honest: it depends on the full `active`
 * reference, but uses a ref-tracked id to bail out when the discriminator has
 * not actually changed. Switching ids snapshots `derive(active)`; same id +
 * parent rerender leaves the draft alone; `active === undefined` clears the
 * draft.
 *
 * Generic over the discriminator key so callers using `slug`, `uuid`, etc.
 * can plug in without falling back to `any`. When the type has neither `id`
 * nor a custom `idKey`, the hook falls back to reference equality.
 *
 * @example Mirror a string body (the Policies screen)
 * ```ts
 * const [draft, setDraft] = useDraftFromActive(active, {
 *   derive: (p) => p.body,
 * });
 * ```
 *
 * @example Snapshot the whole record (default)
 * ```ts
 * const [draft, setDraft, { isDirty, reset }] = useDraftFromActive(active);
 * ```
 *
 * @example Custom discriminator
 * ```ts
 * useDraftFromActive(active, { idKey: 'slug', derive: (p) => p.body });
 * ```
 */
export function useDraftFromActive(active, options) {
    const idKey = options?.idKey;
    const derive = options?.derive ?? defaultDerive;
    // Discriminator strategy:
    //   1. Explicit `idKey` → read that property.
    //   2. No `idKey` but `active.id` exists at runtime → use it.
    //   3. Neither → reference equality on `active` itself (correct when the
    //      caller passes a stable parent-owned reference per logical item).
    const readId = useCallback((a) => {
        if (idKey !== undefined) {
            return a[idKey];
        }
        const maybeId = a.id;
        return maybeId !== undefined ? maybeId : a;
    }, [idKey]);
    // `seededRef` distinguishes "never seeded" from "seeded with a value that
    // happens to be undefined" — `pristineRef.current === undefined` alone is
    // ambiguous when the draft is intentionally undefined.
    const seededRef = useRef(false);
    const pristineRef = useRef(undefined);
    const lastIdRef = useRef(undefined);
    const [draft, setDraft] = useState(() => {
        if (active != null) {
            const seed = derive(active);
            pristineRef.current = seed;
            lastIdRef.current = readId(active);
            seededRef.current = true;
            return seed;
        }
        return undefined;
    });
    useEffect(() => {
        const nextId = active != null ? readId(active) : undefined;
        if (lastIdRef.current === nextId && seededRef.current === (active != null)) {
            // Same id (or both null) AND seeding state matches: preserve in-flight edits.
            return;
        }
        lastIdRef.current = nextId;
        if (active == null) {
            pristineRef.current = undefined;
            seededRef.current = false;
            setDraft(undefined);
            return;
        }
        const seed = derive(active);
        pristineRef.current = seed;
        seededRef.current = true;
        setDraft(seed);
    }, [active, derive, readId]);
    const reset = useCallback(() => {
        if (active == null) {
            pristineRef.current = undefined;
            seededRef.current = false;
            setDraft(undefined);
            return;
        }
        const seed = derive(active);
        pristineRef.current = seed;
        seededRef.current = true;
        setDraft(seed);
    }, [active, derive]);
    const isDirty = seededRef.current && !Object.is(draft, pristineRef.current);
    return [draft, setDraft, { isDirty, reset, pristine: pristineRef.current }];
}
