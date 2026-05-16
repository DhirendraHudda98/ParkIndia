import { afterEach, describe, expect, it, vi } from 'vitest';
import { startViewTransition } from './viewTransitions';
describe('startViewTransition', () => {
    const originalStartVT = document.startViewTransition;
    const originalMatchMedia = window.matchMedia;
    afterEach(() => {
        if (originalStartVT === undefined) {
            delete document.startViewTransition;
        }
        else {
            document.startViewTransition =
                originalStartVT;
        }
        window.matchMedia = originalMatchMedia;
    });
    it('calls the update callback directly when the API is missing', () => {
        delete document.startViewTransition;
        const cb = vi.fn();
        startViewTransition(cb);
        expect(cb).toHaveBeenCalledTimes(1);
    });
    it('routes the update through document.startViewTransition when present', () => {
        const transition = { finished: Promise.resolve() };
        const vt = vi.fn((cb) => {
            cb();
            return transition;
        });
        document.startViewTransition = vt;
        window.matchMedia = vi.fn().mockReturnValue({ matches: false });
        const cb = vi.fn();
        startViewTransition(cb);
        expect(vt).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledTimes(1);
    });
    it('skips the API when prefers-reduced-motion matches', () => {
        const vt = vi.fn();
        document.startViewTransition = vt;
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        const cb = vi.fn();
        startViewTransition(cb);
        expect(vt).not.toHaveBeenCalled();
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
