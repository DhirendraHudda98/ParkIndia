import { useEffect } from 'react';
function isEditableTarget(target) {
    if (!(target instanceof HTMLElement))
        return false;
    if (target instanceof HTMLInputElement)
        return true;
    if (target instanceof HTMLTextAreaElement)
        return true;
    if (target instanceof HTMLSelectElement)
        return true;
    if (target.isContentEditable)
        return true;
    return false;
}
export function useKeyboardShortcuts(shortcuts, enabled = true) {
    useEffect(() => {
        if (!enabled)
            return;
        if (typeof window === 'undefined')
            return;
        const handler = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey)
                return;
            if (isEditableTarget(event.target))
                return;
            // Normalise single-letter keys so we don't have to worry about
            // locale-specific Shift handling (KeyboardEvent.key returns
            // uppercase when Shift is held — we want "n" and "N" to be the
            // same shortcut unless the caller explicitly registers "N").
            const bareKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            const handlerFn = shortcuts[bareKey] ?? shortcuts[event.key];
            if (handlerFn) {
                handlerFn(event);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcuts, enabled]);
}
