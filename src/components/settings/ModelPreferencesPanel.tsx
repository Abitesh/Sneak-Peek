import {useEffect,useRef,useState} from 'react';
import {Cpu,X} from 'lucide-react';
import {loadConfiguredModels,PROVIDER_LABELS,type ConfiguredModel} from '../../utils/configuredModels';
import {STANDARD_CLOUD_MODELS} from '../../utils/modelUtils';
import {ModelChoiceDropdown} from '../ui/ModelChoiceDropdown';
import {ProviderMark} from '../ui/ProviderMark';
/** Favorites configure shortcuts; they never change the active model or allow-list. */
export function ModelPreferencesPanel(){
 const [providers,setProviders]=useState<string[]>([]);
 const [models,setModels]=useState<ConfiguredModel[]>([]),[favorites,setFavorites]=useState<Record<string,string[]>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const version=useRef(0),alive=useRef(true),saving=useRef(false);
 async function load(){const run=++version.current;try{const [m,p,creds]=await Promise.all([loadConfiguredModels(),window.electronAPI.sessionPreferencesGet(),window.electronAPI.getStoredCredentials()]);if(alive.current&&run===version.current){setModels(m);setFavorites(p.favorites);setProviders([...new Set([...Object.entries(STANDARD_CLOUD_MODELS).filter(([provider,cfg])=>cfg.hasKeyCheck(creds)&&!creds.disabledProviders?.includes(provider)).map(([provider])=>provider),...m.map(model=>model.provider)])]);}}catch{if(alive.current&&run===version.current)setError('Could not load saved models. Refresh the provider in AI Providers.');}}
 useEffect(()=>{alive.current=true;void load();const a=window.electronAPI.onCredentialsChanged?.(()=>void load()),b=window.electronAPI.onSessionPreferencesChanged?.(()=>void load()),c=window.electronAPI.onProviderStatusChanged?.(()=>void load());return()=>{alive.current=false;version.current++;a?.();b?.();c?.();};},[]);
 async function toggle(provider:string,id:string){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{const current=await window.electronAPI.sessionPreferencesGet(),list=[...(current.favorites[provider]??[])],index=list.indexOf(id);if(index>=0)list.splice(index,1);else{if(list.length>=3)throw new Error('Choose up to three favorites. Remove one to choose another.');list.push(id);}const saved=await window.electronAPI.sessionPreferencesSave({...current,favorites:{...current.favorites,[provider]:list}},'favorites');if(alive.current)setFavorites(saved.favorites);}catch(e){if(alive.current)setError(e instanceof Error?e.message:'Favorites could not be saved.');}finally{saving.current=false;if(alive.current)setBusy(false);}}
 return <section aria-label="Model favorites" className="rounded-2xl border border-border-muted bg-bg-elevated/40 p-5 space-y-5 text-text-primary">
 <div><h3 className="font-semibold">Favorite models</h3><p className="text-sm text-text-secondary mt-1">Choose up to three per provider for your chat and session pickers.</p></div>
 {error&&<p role="alert" className="text-sm text-red-400">{error}</p>}
 {providers.map(provider=>{const options=models.filter(m=>m.provider===provider),ids=favorites[provider]??[];return <div key={provider} className="space-y-3 border-t border-border-muted pt-4">
 <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3 font-medium"><ProviderMark provider={provider} size={22} fallback={<Cpu size={22}/>}/>{PROVIDER_LABELS[provider]??provider}</div><div className="w-full sm:w-64"><ModelChoiceDropdown label={`${PROVIDER_LABELS[provider]??provider} favorite models`} provider={provider} options={options} selected={ids} multiple disabled={busy} onSelect={id=>void toggle(provider,id)} placeholder="Choose favorites"/></div></div>
 <div className="flex flex-wrap gap-2">{ids.map((id,index)=>{const model=options.find(m=>m.id===id);return <span key={id} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-bg-input border border-border-muted px-3 py-2 text-xs"><span className="text-text-secondary">{index+1}</span><span className="truncate">{model?.label??id}</span><button type="button" disabled={busy} aria-label={`Remove favorite ${id}`} onClick={()=>void toggle(provider,id)}><X size={13}/></button></span>;})}</div></div>;})}
 {!providers.length&&<p className="text-sm text-text-secondary">Connect a provider and refresh its models below to choose favorites.</p>}
 </section>;
}
