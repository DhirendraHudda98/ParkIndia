import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { useV5Settings } from '../settings';
import { useV5Toast } from '../Toast';
import { Badge, Card, SectionLabel, V5NamedIcon } from '../primitives';

export function EinstellungenV5({ navigate }) {
    const { t } = useTranslation();
    const toast = useV5Toast();
    const { settings, updateSetting, resetSettings } = useV5Settings();
    const [activeTab, setActiveTab] = useState('Erscheinungsbild');

    // System Tab state
    const [loadingSystem, setLoadingSystem] = useState(false);
    const [systemError, setSystemError] = useState(null);
    const [systemSettings, setSystemSettings] = useState({
        company_name: '',
        booking_window_days: '',
    });

    // Fetch system settings when active tab is System
    useEffect(() => {
        if (activeTab === 'System') {
            setLoadingSystem(true);
            setSystemError(null);
            api.adminGetSettings()
                .then((res) => {
                    if (res && res.success) {
                        setSystemSettings(res.data || { company_name: '', booking_window_days: '' });
                    } else {
                        setSystemError(res?.error?.message || 'Fehler beim Laden');
                    }
                })
                .catch((err) => {
                    setSystemError(err.message || 'Fehler beim Laden');
                })
                .finally(() => {
                    setLoadingSystem(false);
                });
        }
    }, [activeTab]);

    const handleSaveSystemSettings = () => {
        api.adminUpdateSettings(systemSettings)
            .then((res) => {
                if (res && res.success) {
                    toast('Einstellungen gespeichert', 'success');
                } else {
                    toast(res?.error?.message || 'Fehler', 'error');
                }
            })
            .catch((err) => {
                toast(err.message || 'Fehler', 'error');
            });
    };

    const handleLanguageChange = (lang) => {
        toast('Sprache aktualisiert', 'success');
    };

    const handleToggleReducedMotion = () => {
        const current = settings.appearance.reducedMotion;
        updateSetting('appearance', 'reducedMotion', !current);
        if (!current) {
            document.documentElement.setAttribute('data-ph-reduced-motion', 'true');
        } else {
            document.documentElement.removeAttribute('data-ph-reduced-motion');
        }
    };

    const handleReset = () => {
        resetSettings();
        toast('Einstellungen zurückgesetzt', 'success');
    };

    const tabs = [
        { id: 'Erscheinungsbild', icon: 'sun' },
        { id: 'System', icon: 'settings' },
        { id: 'Funktionen', icon: 'assistant' },
        { id: 'Barrierefreiheit', icon: 'check' },
        { id: 'Datenschutz', icon: 'analytics' }
    ];

    return (
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--v5-bg)', minHeight: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--v5-txt)', margin: 0 }}>
                        {t('settings.title', 'System & Preferences')}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--v5-mut)', marginTop: 4, margin: 0 }}>
                        Manage administrative tenant parameters and tailor your personal design experience.
                    </p>
                </div>
            </div>

            <div className="v5-ani" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
                {/* Left Sidebar Menu */}
                <Card style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--v5-sur)' }}>
                    <SectionLabel style={{ paddingLeft: 8, marginBottom: 8 }}>{t('settings.categories', 'SETTINGS')}</SectionLabel>
                    <div role="tablist" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveTab(tab.id)}
                                    type="button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: isActive ? 'var(--v5-acc-muted, oklch(0.60 0.18 250 / 0.1))' : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                    }}
                                >
                                    <V5NamedIcon name={tab.icon} size={16} color={isActive ? 'var(--v5-acc)' : 'var(--v5-mut)'} />
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? 'var(--v5-acc)' : 'var(--v5-txt)'
                                    }}>
                                        {tab.id}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Right Tab Content Card */}
                <Card style={{ padding: 28, background: 'var(--v5-sur)' }}>
                    {/* 1. Erscheinungsbild Tab */}
                    {activeTab === 'Erscheinungsbild' && (
                        <div>
                            <SectionLabel>{t('settings.appearance', 'Appearance Settings')}</SectionLabel>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20 }}>
                                {/* UI Theme Modes */}
                                <div style={{ borderBottom: '1px solid var(--v5-bor)', paddingBottom: 20 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v5-txt)' }}>Theme Mode</div>
                                    <div style={{ fontSize: '12px', color: 'var(--v5-mut)', marginBottom: 12 }}>Choose the color palette of the application interface.</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['marble_light', 'marble_dark', 'void'].map((mode) => (
                                            <button
                                                key={mode}
                                                data-testid="einst-theme"
                                                data-value={mode}
                                                onClick={() => updateSetting('appearance', 'mode', mode)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: settings.appearance.mode === mode ? '2px solid var(--v5-acc)' : '1px solid var(--v5-bor)',
                                                    background: settings.appearance.mode === mode ? 'var(--v5-sur2)' : 'transparent',
                                                    color: 'var(--v5-txt)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {mode === 'marble_light' ? 'Marble' : mode === 'marble_dark' ? 'Marble Dark' : 'Void'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sidebar Variants */}
                                <div style={{ borderBottom: '1px solid var(--v5-bor)', paddingBottom: 20 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v5-txt)' }}>Sidebar Layout</div>
                                    <div style={{ fontSize: '12px', color: 'var(--v5-mut)', marginBottom: 12 }}>Select the layout variant of the main side navigation.</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['marble', 'columns', 'minimal'].map((variant) => (
                                            <button
                                                key={variant}
                                                data-testid="einst-sidebar"
                                                data-value={variant}
                                                onClick={() => updateSetting('appearance', 'sidebar', variant)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: settings.appearance.sidebar === variant ? '2px solid var(--v5-acc)' : '1px solid var(--v5-bor)',
                                                    background: settings.appearance.sidebar === variant ? 'var(--v5-sur2)' : 'transparent',
                                                    color: 'var(--v5-txt)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {variant.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Density Selection */}
                                <div style={{ borderBottom: '1px solid var(--v5-bor)', paddingBottom: 20 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v5-txt)' }}>Layout Density</div>
                                    <div style={{ fontSize: '12px', color: 'var(--v5-mut)', marginBottom: 12 }}>Adjust spacing density to fit more content.</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['compact', 'comfortable', 'spacious'].map((density) => (
                                            <button
                                                key={density}
                                                data-testid="einst-density"
                                                data-value={density}
                                                onClick={() => updateSetting('appearance', 'density', density)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: settings.appearance.density === density ? '2px solid var(--v5-acc)' : '1px solid var(--v5-bor)',
                                                    background: settings.appearance.density === density ? 'var(--v5-sur2)' : 'transparent',
                                                    color: 'var(--v5-txt)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {density.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Selection */}
                                <div style={{ borderBottom: '1px solid var(--v5-bor)', paddingBottom: 20 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v5-txt)' }}>Typography System</div>
                                    <div style={{ fontSize: '12px', color: 'var(--v5-mut)', marginBottom: 12 }}>Choose the design font family.</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['inter', 'dmmono', 'system', 'plex', 'atkinson'].map((font) => (
                                            <button
                                                key={font}
                                                data-testid="einst-font"
                                                data-value={font}
                                                onClick={() => updateSetting('appearance', 'font', font)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: settings.appearance.font === font ? '2px solid var(--v5-acc)' : '1px solid var(--v5-bor)',
                                                    background: settings.appearance.font === font ? 'var(--v5-sur2)' : 'transparent',
                                                    color: 'var(--v5-txt)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {font.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Languages */}
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v5-txt)' }}>Language Options</div>
                                    <div style={{ fontSize: '12px', color: 'var(--v5-mut)', marginBottom: 12 }}>Configure your preferred display language.</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => handleLanguageChange('de')}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--v5-bor)',
                                                background: 'transparent',
                                                color: 'var(--v5-txt)',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Deutsch
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleLanguageChange('en')}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--v5-bor)',
                                                background: 'transparent',
                                                color: 'var(--v5-txt)',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            English
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. System Tab */}
                    {activeTab === 'System' && (
                        <div>
                            <SectionLabel>{t('settings.system', 'System / Tenant Settings')}</SectionLabel>

                            {loadingSystem ? (
                                <div style={{ color: 'var(--v5-txt)', marginTop: 20 }}>Laden...</div>
                            ) : systemError ? (
                                <div style={{ color: 'var(--v5-err, #ef4444)', marginTop: 20, padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '13px', fontWeight: 500 }}>
                                    Fehler beim Laden der System-Einstellungen.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)', marginBottom: 6 }}>
                                            Company Name
                                        </label>
                                        <input
                                            data-testid="einst-company-name"
                                            value={systemSettings.company_name}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, company_name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--v5-bor)',
                                                background: 'var(--v5-sur2)',
                                                color: 'var(--v5-txt)',
                                                fontSize: '13px',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)', marginBottom: 6 }}>
                                            Booking Window (Days)
                                        </label>
                                        <input
                                            data-testid="einst-booking-window"
                                            value={systemSettings.booking_window_days}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, booking_window_days: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--v5-bor)',
                                                background: 'var(--v5-sur2)',
                                                color: 'var(--v5-txt)',
                                                fontSize: '13px',
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginTop: 10, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                        <button
                                            data-testid="einst-save"
                                            onClick={handleSaveSystemSettings}
                                            type="button"
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                background: 'var(--v5-acc)',
                                                color: 'var(--v5-accent-fg, white)',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Speichern
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Funktionen Tab */}
                    {activeTab === 'Funktionen' && (
                        <div role="tabpanel">
                            <SectionLabel>{t('settings.features', 'Feature Flags')}</SectionLabel>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                                {[
                                    { key: 'smartSuggestions', label: 'Smart Suggestions', desc: 'Predictive slot suggestions' },
                                    { key: 'optimisticUI', label: 'Optimistic UI Updates', desc: 'Updates screen instantly' },
                                    { key: 'viewTransitions', label: 'Smooth View Transitions', desc: 'Native page transition style' },
                                    { key: 'voiceCommands', label: 'Voice Command System', desc: 'Interact hands-free with voice' },
                                    { key: 'qrCheckin', label: 'QR Scan Check-in', desc: 'Gate validation code generation' },
                                    { key: 'deepLinking', label: 'Direct Deep Links', desc: 'Direct URL routing to dashboards' },
                                    { key: 'predictiveCard', label: 'Predictive Demand Matrix', desc: 'Historical utilization patterns' },
                                    { key: 'swAutoUpdate', label: 'Background Service Worker', desc: 'Pushes offline and quick updates' },
                                    { key: 'plateScan', label: 'License Plate Scanner', desc: 'Camera-based registration verify' },
                                    { key: 'semanticSearch', label: 'Semantic Search Parser', desc: 'Natural query understanding model' },
                                    { key: 'fleetSSE', label: 'Real-time SSE Streams', desc: 'Continuous park lot state update' },
                                ].map((feat) => {
                                    const val = !!settings.features[feat.key];
                                    return (
                                        <div
                                            key={feat.key}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--v5-sur2)',
                                                border: '1px solid var(--v5-bor)',
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)' }}>{feat.label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--v5-mut)', marginTop: 2 }}>{feat.desc}</div>
                                            </div>

                                            <button
                                                type="button"
                                                data-testid={`einst-feature-${feat.key}`}
                                                aria-checked={val ? 'true' : 'false'}
                                                onClick={() => updateSetting('features', feat.key, !val)}
                                                style={{
                                                    width: '46px',
                                                    height: '24px',
                                                    borderRadius: '20px',
                                                    background: val ? 'var(--v5-acc)' : 'var(--v5-bor)',
                                                    position: 'relative',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '3px',
                                                    left: val ? '25px' : '3px',
                                                    transition: 'left 0.2s ease',
                                                }} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. Barrierefreiheit Tab */}
                    {activeTab === 'Barrierefreiheit' && (
                        <div>
                            <SectionLabel>{t('settings.a11y', 'Accessibility Configuration')}</SectionLabel>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                {/* Reduced Motion Toggle */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)' }}>Reduced Motion</div>
                                        <div style={{ fontSize: '11px', color: 'var(--v5-mut)', marginTop: 2 }}>Disable fluid UI micro-animations and slide effects.</div>
                                    </div>
                                    <button
                                        type="button"
                                        data-testid="einst-reduced-motion"
                                        aria-checked={settings.appearance.reducedMotion ? 'true' : 'false'}
                                        onClick={handleToggleReducedMotion}
                                        style={{
                                            width: '46px',
                                            height: '24px',
                                            borderRadius: '20px',
                                            background: settings.appearance.reducedMotion ? 'var(--v5-acc)' : 'var(--v5-bor)',
                                            position: 'relative',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '3px',
                                            left: settings.appearance.reducedMotion ? '25px' : '3px',
                                            transition: 'left 0.2s ease',
                                        }} />
                                    </button>
                                </div>

                                {/* High Contrast Toggle */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)' }}>High Contrast Theme</div>
                                        <div style={{ fontSize: '11px', color: 'var(--v5-mut)', marginTop: 2 }}>Enforce high-contrast borders and text for visibility.</div>
                                    </div>
                                    <button
                                        type="button"
                                        data-testid="einst-high-contrast"
                                        aria-checked={settings.appearance.highContrast ? 'true' : 'false'}
                                        onClick={() => updateSetting('appearance', 'highContrast', !settings.appearance.highContrast)}
                                        style={{
                                            width: '46px',
                                            height: '24px',
                                            borderRadius: '20px',
                                            background: settings.appearance.highContrast ? 'var(--v5-acc)' : 'var(--v5-bor)',
                                            position: 'relative',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '3px',
                                            left: settings.appearance.highContrast ? '25px' : '3px',
                                            transition: 'left 0.2s ease',
                                        }} />
                                    </button>
                                </div>

                                {/* Font Scale Picker */}
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--v5-txt)', marginBottom: 8 }}>Font Scale</div>
                                    <div style={{ fontSize: '11px', color: 'var(--v5-mut)', marginBottom: 12 }}>Scale all text elements inside the browser relative to standard pixels.</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[0.875, 1.0, 1.125, 1.25].map((scale) => (
                                            <button
                                                key={scale}
                                                type="button"
                                                data-testid="einst-fontscale"
                                                onClick={() => updateSetting('appearance', 'fontScale', scale)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    border: settings.appearance.fontScale === scale ? '2px solid var(--v5-acc)' : '1px solid var(--v5-bor)',
                                                    background: settings.appearance.fontScale === scale ? 'var(--v5-sur2)' : 'transparent',
                                                    color: 'var(--v5-txt)',
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {scale * 100}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Datenschutz (Privacy) Tab */}
                    {activeTab === 'Datenschutz' && (
                        <div>
                            <SectionLabel>{t('settings.privacy', 'Data Privacy Options')}</SectionLabel>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Danger Zone</div>
                                    <p style={{ fontSize: '12px', color: 'var(--v5-mut)', marginTop: 4, marginBottom: 16 }}>
                                        Restore all personalized preferences, feature toggles, and visual parameters back to absolute defaults.
                                    </p>

                                    <button
                                        data-testid="einst-reset"
                                        onClick={handleReset}
                                        type="button"
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'opacity 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
                                        onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                                    >
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
