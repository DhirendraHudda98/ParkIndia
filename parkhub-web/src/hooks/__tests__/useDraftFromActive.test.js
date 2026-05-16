import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDraftFromActive } from '../useDraftFromActive';
const P1 = { id: 'p1', title: 'AGB', body: 'Alter Text' };
const P1_REFETCH = { id: 'p1', title: 'AGB', body: 'Alter Text' }; // same id, new ref
const P1_UPSTREAM_EDIT = { id: 'p1', title: 'AGB', body: 'Server schreibt drüber' };
const P2 = { id: 'p2', title: 'Datenschutz', body: 'DSGVO' };
describe('useDraftFromActive', () => {
    it('seeds draft from active on initial mount', () => {
        const { result } = renderHook(() => useDraftFromActive(P1, { derive: (p) => p.body }));
        const [draft] = result.current;
        expect(draft).toBe('Alter Text');
    });
    it('initial mount with undefined active yields undefined draft', () => {
        const { result } = renderHook(() => useDraftFromActive(undefined, { derive: (p) => p.body }));
        const [draft] = result.current;
        expect(draft).toBeUndefined();
    });
    it('does NOT reset draft when parent rerenders with same id (regression guard)', () => {
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: P1 } });
        act(() => {
            const [, setDraft] = result.current;
            setDraft('User-Edit unterwegs');
        });
        expect(result.current[0]).toBe('User-Edit unterwegs');
        // Simulate react-query refetch: same id, brand-new array → new object ref.
        rerender({ active: P1_REFETCH });
        expect(result.current[0]).toBe('User-Edit unterwegs');
        // Even an upstream body mutation on the SAME id should not clobber the draft.
        rerender({ active: P1_UPSTREAM_EDIT });
        expect(result.current[0]).toBe('User-Edit unterwegs');
    });
    it('persists user edits via setDraft', () => {
        const { result } = renderHook(() => useDraftFromActive(P1, { derive: (p) => p.body }));
        act(() => {
            const [, setDraft] = result.current;
            setDraft('Neuer Inhalt');
        });
        expect(result.current[0]).toBe('Neuer Inhalt');
    });
    it('re-initialises draft from new active when id changes', () => {
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: P1 } });
        act(() => {
            const [, setDraft] = result.current;
            setDraft('In-flight edit on P1');
        });
        rerender({ active: P2 });
        expect(result.current[0]).toBe('DSGVO');
    });
    it('clears draft when active becomes undefined', () => {
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: P1 } });
        expect(result.current[0]).toBe('Alter Text');
        rerender({ active: undefined });
        expect(result.current[0]).toBeUndefined();
    });
    it('re-seeds when going from undefined → defined', () => {
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: undefined } });
        expect(result.current[0]).toBeUndefined();
        rerender({ active: P2 });
        expect(result.current[0]).toBe('DSGVO');
    });
    it('default derive snapshots the whole active object', () => {
        const { result } = renderHook(() => useDraftFromActive(P1));
        const [draft] = result.current;
        expect(draft).toEqual(P1);
        // Shallow clone — separate identity so caller can mutate without leaking.
        expect(draft).not.toBe(P1);
    });
    it('respects custom idKey', () => {
        const a = { slug: 'agb', body: 'one' };
        const a2 = { slug: 'agb', body: 'server-edit' }; // same slug
        const b = { slug: 'dsg', body: 'two' };
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, {
            idKey: 'slug',
            derive: (p) => p.body,
        }), { initialProps: { active: a } });
        act(() => result.current[1]('user typed'));
        rerender({ active: a2 });
        expect(result.current[0]).toBe('user typed');
        rerender({ active: b });
        expect(result.current[0]).toBe('two');
    });
    it('exposes isDirty + reset meta', () => {
        const { result } = renderHook(() => useDraftFromActive(P1, { derive: (p) => p.body }));
        expect(result.current[2].isDirty).toBe(false);
        expect(result.current[2].pristine).toBe('Alter Text');
        act(() => result.current[1]('changed'));
        expect(result.current[2].isDirty).toBe(true);
        act(() => result.current[2].reset());
        expect(result.current[0]).toBe('Alter Text');
        expect(result.current[2].isDirty).toBe(false);
    });
    // ─── Hardening (PR #424 follow-up: copilot review edge cases) ───
    it('default derive handles arrays via spread (not object-spread)', () => {
        // Object-spread on an array would produce { '0': 'a', '1': 'b' } silently.
        const arr = { id: 'x', tags: ['a', 'b'] };
        const { result } = renderHook(() => useDraftFromActive(arr, { derive: (p) => p.tags }));
        const [draft] = result.current;
        expect(Array.isArray(draft)).toBe(true);
        expect(draft).toEqual(['a', 'b']);
    });
    it('falls back to reference equality when active has no id and no idKey', () => {
        const a = { kind: 'anon', body: 'one' };
        const b = { kind: 'anon', body: 'two' };
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: a } });
        act(() => result.current[1]('user typed'));
        // Rerender with the SAME reference — should not clobber edit.
        rerender({ active: a });
        expect(result.current[0]).toBe('user typed');
        // New reference — should re-seed.
        rerender({ active: b });
        expect(result.current[0]).toBe('two');
    });
    it('isDirty stays false when active is undefined (seeded sentinel)', () => {
        // Without the `seededRef`, `pristineRef.current === undefined` would be
        // ambiguous: was the draft never seeded, or seeded with undefined?
        const { result, rerender } = renderHook(({ active }) => useDraftFromActive(active, { derive: (p) => p.body }), { initialProps: { active: undefined } });
        expect(result.current[2].isDirty).toBe(false);
        rerender({ active: P1 });
        expect(result.current[2].isDirty).toBe(false);
        expect(result.current[2].pristine).toBe('Alter Text');
        act(() => result.current[1]('edited'));
        expect(result.current[2].isDirty).toBe(true);
        rerender({ active: undefined });
        // Cleared back to unseeded — isDirty false even though draft is undefined.
        expect(result.current[2].isDirty).toBe(false);
        expect(result.current[2].pristine).toBeUndefined();
    });
});
