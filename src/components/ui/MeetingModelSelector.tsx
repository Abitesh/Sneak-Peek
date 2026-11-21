import { useEffect, useState } from 'react';
import { ModelSelector } from './ModelSelector';

/** Shared existing registry and persisted selection; main pins each submitted request. */
export function MeetingModelSelector() {
    const [model, setModel] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        let active = true;
        const off = window.electronAPI?.onModelChanged(id => { if (active) setModel(id); });
        window.electronAPI?.getCurrentModel().then(result => { if (active) setModel(result.model); })
            .catch(() => { if (active) setError('Model selection unavailable.'); });
        return () => { active = false; off?.(); };
    }, []);
    return <div className="relative min-w-0 max-w-[240px]" aria-label="Answer model">
        <div aria-busy={saving} className={saving ? 'pointer-events-none opacity-60' : ''}>
            <ModelSelector currentModel={model} onSelectModel={async id => {
                setSaving(true); setError('');
                try {
                    const result = await window.electronAPI.setDefaultModel(id);
                    if (!result.success) setError(result.error || 'Model could not be selected.');
                    else setModel(id);
                } catch { setError('Model selection failed. Check provider settings.'); }
                finally { setSaving(false); }
            }} />
        </div>
        {error && <div role="alert" className="absolute bottom-full mb-2 rounded bg-bg-elevated p-2 text-xs text-red-400">{error}</div>}
    </div>;
}
