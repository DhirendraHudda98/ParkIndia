import { createContext, useCallback, useContext, useState } from 'react';
import { V5NamedIcon } from './primitives';
const Ctx = createContext(null);
const TOAST_COLOR = {
    success: 'var(--v5-ok)',
    error: 'var(--v5-err)',
    info: 'var(--v5-info)',
    warning: 'var(--v5-warn)',
};
const TOAST_ICON = {
    success: 'ok',
    error: 'x',
    info: 'info',
    warning: 'info',
};
/** 3.2s auto-dismiss, bottom-right stack. Matches v5 prototype spec. */
export function V5ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const push = useCallback((msg, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
    }, []);
    return (<Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" aria-atomic="true" style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'none',
        }}>
        {toasts.map((t) => (<div key={t.id} role="status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 16px',
                borderRadius: 12,
                background: 'color-mix(in oklch, var(--v5-sur) 95%, transparent)',
                backdropFilter: 'blur(12px)',
                border: `1px solid color-mix(in oklch, ${TOAST_COLOR[t.type]} 25%, transparent)`,
                boxShadow: 'var(--v5-shadow-lift)',
                animation: 'ph-v5-toast 3.2s ease forwards',
                minWidth: 240,
                maxWidth: 360,
                color: 'var(--v5-txt)',
            }}>
            <V5NamedIcon name={TOAST_ICON[t.type]} size={14} color={TOAST_COLOR[t.type]}/>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{t.msg}</span>
          </div>))}
      </div>
    </Ctx.Provider>);
}
export function useV5Toast() {
    const push = useContext(Ctx);
    if (!push)
        throw new Error('useV5Toast must be used within <V5ToastProvider>');
    return push;
}
