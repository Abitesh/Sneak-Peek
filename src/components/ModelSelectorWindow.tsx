import { loadConfiguredModels, favoriteModelChoices } from '../utils/configuredModels';
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Check, Loader2, Cpu } from 'lucide-react';
import { CODEX_CLI_MODEL, CODEX_CLI_MODEL_PRESETS, codexCliSelectorId, getCodexCliModelDisplayName, isModelAllowed, litellmModelLabel, STANDARD_CLOUD_MODELS, prettifyModelId } from '../utils/modelUtils';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { getMeetingInterfaceTheme, type MeetingInterfaceTheme } from '../lib/meetingInterfaceTheme';
import {
    clampOverlayOpacity,
    getDefaultOverlayOpacity,
    getGlassOverlayAppearance,
    getOverlayAppearance,
    OVERLAY_OPACITY_DEFAULT,
} from '../lib/overlayAppearance';

import { ProviderMark } from './ui/ProviderMark';

// Define Model Types
interface ModelOption {
    id: string;
    name: string;
    type: 'cloud' | 'local' | 'custom' | 'ollama' | 'codex-cli';
    provider?: string;
}



const ModelSelectorWindow = () => {
    const isLight = useResolvedTheme() === 'light';
    const [currentModel, setCurrentModel] = useState<string>(() => localStorage.getItem('cached-current-model') || '');
    // Meeting-interface theme (default/liquid-glass/modern) + live overlay
    // opacity — same pattern SettingsPopup.tsx already uses for its own
    // popup window (see its comment block, ~SettingsPopup.tsx:33-45 and
    // ~268-287, for the full rationale). This window previously used a
    // static isLight-only panelClass (`bg-[#1E1E1E]/80` / `bg-[#F3F4F6]/92`)
    // that never adapted to liquid-glass/modern and never tracked the user's
    // configured overlay-opacity slider — the `.overlay-shell-surface`
    // CSS class (see index.css) already wins the cascade over that literal
    // class for glass/modern via its `!important` per-theme rules, so the
    // MATERIAL already looked correct, but opacity was stuck at whatever
    // --overlay-opacity happens to cascade in by default, not the user's
    // actual live-configured value — the same gap SettingsPopup.tsx's
    // already-committed fix (7c4f3bd2) closed for that window.
    const [interfaceTheme, setInterfaceTheme] = useState<MeetingInterfaceTheme>(() => getMeetingInterfaceTheme());
    const [overlayOpacity, setOverlayOpacity] = useState<number>(() => {
        const stored = localStorage.getItem('natively_overlay_opacity');
        const parsed = stored ? parseFloat(stored) : NaN;
        const isUserSet = Number.isFinite(parsed) && parsed !== OVERLAY_OPACITY_DEFAULT;
        return isUserSet ? clampOverlayOpacity(parsed) : getDefaultOverlayOpacity();
    });

    useEffect(() => {
        const handleStorage = () => setInterfaceTheme(getMeetingInterfaceTheme());
        window.addEventListener('storage', handleStorage);
        const unsubscribe = window.electronAPI?.onMeetingInterfaceThemeChanged?.((theme: string) => {
            const valid: MeetingInterfaceTheme[] = ['default', 'liquid-glass', 'modern'];
            if (valid.includes(theme as MeetingInterfaceTheme)) {
                setInterfaceTheme(theme as MeetingInterfaceTheme);
            }
        });
        return () => {
            window.removeEventListener('storage', handleStorage);
            unsubscribe?.();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = window.electronAPI?.onOverlayOpacityChanged?.((opacity: number) => {
            setOverlayOpacity(opacity);
        });
        return () => unsubscribe?.();
    }, []);

    const isGlassTheme = interfaceTheme === 'liquid-glass';
    const appearance = useMemo(
        () =>
            isGlassTheme
                ? getGlassOverlayAppearance()
                : getOverlayAppearance(overlayOpacity, isLight ? 'light' : 'dark'),
        [isGlassTheme, overlayOpacity, isLight],
    );
    const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError,setLoadError]=useState('');

    // Load Data
    // Reading favorites never starts or restarts a local-model daemon.
    // Subscribe because the prewarmed window is reused across openings.
    useEffect(() => {
        let cancelled = false;
        // Only the NEWEST run may commit. A cold LiteLLM discovery can take up
        // to 5s, so without this an in-flight load started before a credential
        // change could land after the reload it triggered and overwrite the
        // fresher list with the stale one.
        let runToken = 0;

        const loadModels = async () => {
            const myToken = ++runToken;
            try {
                // If we already have models, don't show loading to avoid flicker
                if (availableModels.length === 0) {
                    setIsLoading(true);
                }

                const [configured,prefs]=await Promise.all([loadConfiguredModels(),window.electronAPI.sessionPreferencesGet()]);
                if (cancelled || myToken !== runToken) return;
                const visibleModels:ModelOption[]=favoriteModelChoices(configured,prefs.favorites).map(model=>({id:model.id,name:model.label,provider:model.provider,type:model.provider==='ollama'?'ollama':model.provider==='custom'?'custom':model.provider==='codex-cli'?'codex-cli':'cloud'}));
                localStorage.setItem('cached-models', JSON.stringify(visibleModels));
                setAvailableModels(visibleModels);setLoadError('');

                // 4. Get Current Active Model
                const config = await window.electronAPI?.getCurrentLlmConfig?.(); // Get runtime model
                if (!cancelled && myToken === runToken && config && config.modelId) {
                    // Compare on `modelId` (stable identifier) — using `displayName`
                    // or the legacy `model` would mismatch against option IDs and
                    // hide the selected checkmark on the custom-provider row.
                    setCurrentModel(config.modelId);
                    localStorage.setItem('cached-current-model', config.modelId);
                }

            } catch (err) {
                console.error("Failed to load models:", err);
                if(!cancelled&&myToken===runToken)setLoadError('Could not load favorites. Check AI Providers.');
            } finally {
                if (!cancelled && myToken === runToken) setIsLoading(false);
            }
        };

        loadModels();

        // Listen for changes
        const unsubscribe = window.electronAPI?.onModelChanged?.((modelId: string) => {
            setCurrentModel(modelId);
        });
        // This window is REUSED, never destroyed: ModelSelectorWindowHelper
        // pre-warms it offscreen and thereafter only hide()s and show()s it. So
        // the effect above runs ONCE per app lifetime, and without this the list
        // is frozen at its startup snapshot — a provider configured afterwards
        // (an API key, a LiteLLM proxy, a Codex sign-in) never appears until the
        // app is restarted.
        //
        // It failed SILENTLY, which is why it went unnoticed: availableModels
        // seeds from localStorage and isLoading stays false whenever that cache
        // is non-empty, so a stale list renders with no spinner and no error.
        //
        // onModelChanged above is NOT a substitute — it only moves the
        // checkmark; it never rebuilds the list.
        const unsubCredentials = window.electronAPI?.onCredentialsChanged?.(() => {
            loadModels();
        });
        const unsubPreferences=window.electronAPI.onSessionPreferencesChanged?.(()=>loadModels());
        return () => {
            cancelled = true;
            unsubscribe?.();
            unsubCredentials?.();
            unsubPreferences?.();
        };
    }, []);

    const handleSelectFn = async (modelId: string) => {
        setLoadError('');
        try {
            const result=await window.electronAPI.setDefaultModel(modelId);
            if(!result.success)throw new Error('Selection rejected');
            setCurrentModel(modelId);
            localStorage.setItem('cached-current-model',modelId);
        } catch {setLoadError('Could not select this model. Check AI Providers.');}
    };

    // Same isDarkBg concept SettingsPopup.tsx already established for this
    // exact reason: liquid-glass and modern meeting-interface themes always
    // render a dark panel regardless of the OS light/dark setting, so row
    // text/hover colors must follow the THEME, not raw OS-level `isLight` —
    // otherwise a user on a light OS theme with liquid-glass or modern
    // selected would get light-colored row text on a dark glass/modern
    // panel, unreadable low-contrast.
    const isDarkBg = interfaceTheme === 'liquid-glass' || interfaceTheme === 'modern' || !isLight;
    const panelClass = isDarkBg
        ? 'bg-[#1E1E1E]/80 border-white/10 shadow-black/40'
        : 'bg-[#F3F4F6]/92 border-black/10 shadow-black/10';

    return (
        <div className="w-fit h-fit bg-transparent flex flex-col">
            <div
                className={`w-[300px] h-[340px] backdrop-blur-md border rounded-[16px] overflow-hidden shadow-2xl p-2 flex flex-col animate-scale-in origin-top-left overlay-shell-surface ${panelClass}`}
                style={{ ...appearance.shellStyle }}
            >
                <div className="relative z-[1] flex-1 min-h-0 flex flex-col">{loadError&&<p role="alert" className="text-xs text-red-400 px-2 py-1">{loadError}</p>}
                    {isLoading ? (
                        <div className={`flex items-center justify-center py-4 overlay-text-muted ${isDarkBg ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="text-xs">Loading models...</span>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-0.5">
                            {availableModels.length === 0 ? (
                                <div className={`px-4 py-3 text-center text-xs overlay-text-muted ${isDarkBg ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {loadError||"Choose favorites in AI Providers."}
                                </div>
                            ) : (
                                availableModels.map((model) => {
                                    const isSelected = currentModel === model.id;
                                    return (
                                        <button
                                            key={model.id}
                                            onClick={() => handleSelectFn(model.id)}
                                            className={`
                                                w-full text-left px-3 py-2 flex items-center justify-between group transition-colors duration-200 rounded-lg model-selector-row
                                                ${isSelected
                                                    ? `model-selector-row-selected overlay-text-primary ${isDarkBg ? 'bg-white/10 text-white' : 'bg-black/[0.07] text-slate-900'}`
                                                    : `overlay-text-interactive ${isDarkBg ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-800'}`
                                                }
                                            `}
                                        >
                                            <ProviderMark provider={model.provider??'custom'} size={18} fallback={<Cpu size={18}/>}/><span className="text-[12px] font-medium truncate flex-1 min-w-0 ml-3">{model.name}</span>
                                            {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ml-2 ${isDarkBg ? 'text-emerald-400' : 'text-emerald-600'}`} />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelSelectorWindow;
