import {useEffect,useRef,useState} from 'react';
import {loadConfiguredModels,favoriteModelChoices,type ConfiguredModel} from '../../utils/configuredModels';
import {getCodexCliModelDisplayName} from '../../utils/modelUtils';
import {ModelChoiceDropdown} from './ModelChoiceDropdown';
interface Props {currentModel:string;onSelectModel:(model:string)=>void;}
/** Same eligible favorites on every answering surface. No status wall or speculative models. */
export function ModelSelector({currentModel,onSelectModel}:Props){
 const [models,setModels]=useState<ConfiguredModel[]>([]),[all,setAll]=useState<ConfiguredModel[]>([]),[error,setError]=useState('');const version=useRef(0);
 useEffect(()=>{let live=true;async function load(){const run=++version.current;try{const [configured,p]=await Promise.all([loadConfiguredModels(),window.electronAPI.sessionPreferencesGet()]);if(live&&run===version.current){setAll(configured);setModels(favoriteModelChoices(configured,p.favorites));setError('');}}catch{if(live&&run===version.current)setError('Model selection could not load. Check AI Providers.');}}void load();const a=window.electronAPI.onCredentialsChanged?.(()=>void load()),b=window.electronAPI.onSessionPreferencesChanged?.(()=>void load()),c=window.electronAPI.onProviderStatusChanged?.(()=>void load());return()=>{live=false;version.current++;a?.();b?.();c?.();};},[]);
 const current=all.find(m=>m.id===currentModel);
 return <div className="min-w-0"><ModelChoiceDropdown label="Choose answer model" options={models} selected={[currentModel]} provider={current?.provider} onSelect={onSelectModel} placeholder={current?.label||getCodexCliModelDisplayName(currentModel)||currentModel||'Choose favorite model'}/>{error&&<p role="alert" className="text-xs text-red-400 mt-1">{error}</p>}{!models.length&&!error&&<button type="button" className="text-xs text-accent-primary mt-1" onClick={()=>void window.electronAPI.openSettingsTab('ai-providers')}>Choose favorites in AI Providers</button>}</div>;
}
