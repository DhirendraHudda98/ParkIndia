/**
 * Backwards-compatibility shim — the original Sidebar.tsx implementation
 * has moved to ./sidebar/MarbleSidebar.tsx. The variant-aware export
 * <V5Sidebar /> now lives in ./sidebar/index.tsx and picks Marble /
 * Columns / Minimal based on the user's setting.
 *
 * Existing imports (`import { V5Sidebar } from './Sidebar'`) keep
 * working. New code should `import { V5Sidebar } from './sidebar'`.
 */
import { useV5SettingsOptional } from './settings/SettingsProvider';
import { ColumnsSidebar } from './sidebar/ColumnsSidebar';
import { MarbleSidebar } from './sidebar/MarbleSidebar';
import { MinimalSidebar } from './sidebar/MinimalSidebar';
/**
 * Variant-aware <Sidebar /> — picks layout based on user setting.
 */
export function V5Sidebar(props) {
    const ctx = useV5SettingsOptional();
    const variant = ctx?.settings.appearance.sidebar ?? 'marble';
    if (variant === 'columns')
        return <ColumnsSidebar {...props}/>;
    if (variant === 'minimal')
        return <MinimalSidebar {...props}/>;
    return <MarbleSidebar {...props}/>;
}
export { MarbleSidebar, ColumnsSidebar, MinimalSidebar };
