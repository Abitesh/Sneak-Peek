import { STANDARD_CLOUD_MODELS, isModelAllowed, CODEX_CLI_MODEL, CODEX_CLI_MODEL_PRESETS, codexCliSelectorId } from './modelUtils';
export interface ConfiguredModel {id:string;provider:string;label:string;status:string;vision:boolean|undefined;streaming:boolean|undefined;message?:string;}
/** Configuration + cached authoritative metadata only; no generation or remote probes. */
export async function loadConfiguredModels():Promise<ConfiguredModel[]> {
 const api=window.electronAPI;
 const [creds,catalog,health,local,custom,runtime]=await Promise.all([api.getStoredCredentials(),api.getCloudFetchedModels(),api.getProviderHealth(),api.getAvailableOllamaModels().catch(()=>[]),api.getCustomProviders().catch(()=>[]),api.getProviderStatuses().catch(()=>[])]);
 const disabled=new Set(creds.disabledProviders??[]),out:ConfiguredModel[]=[];
 for(const [provider,config] of Object.entries(STANDARD_CLOUD_MODELS)){
  if(disabled.has(provider)||!config.hasKeyCheck(creds))continue;
  const fetched=catalog.models[provider]??[];
  const ids=[...new Set([...config.ids,...fetched.map(m=>m.id),...((creds as any)[config.pmKey]?[(creds as any)[config.pmKey]]:[])])];
  for(const id of ids){if(!isModelAllowed(provider,id,creds.cloudEnabledModels?.[provider]??[]))continue;const binding=health[provider]?.models.find(m=>m.id===id);const h=health[provider];const stale=Boolean(h?.lastProbeAt&&Date.now()-h.lastProbeAt>24*60*60*1000);out.push({id,provider,label:fetched.find(m=>m.id===id)?.label??config.names[config.ids.indexOf(id)]??id,status:stale?'Stale check':binding?.source==='live-probe'&&!binding.lastError?'Verified':h?.lastError?'Needs attention':fetched.some(m=>m.id===id)?'Advertised':'Configured · unchecked',vision:binding?.capabilities.vision,streaming:binding?.capabilities.streaming,message:binding?.lastError??h?.lastError?.message});}
 }
 if(!disabled.has('litellm'))for(const model of catalog.models.litellm??[]){if(isModelAllowed('litellm',model.id,creds.cloudEnabledModels?.litellm??[]))out.push({id:model.id.startsWith('litellm/')?model.id:`litellm/${model.id}`,provider:'litellm',label:model.label,status:'Advertised · check provider',vision:undefined,streaming:undefined});}
 if(!disabled.has('ollama'))for(const id of local)out.push({id:`ollama-${id}`,provider:'ollama',label:id,status:'Installed · readiness may vary',vision:health.ollama?.models.find(m=>m.id===`ollama-${id}`||m.id===id)?.capabilities.vision,streaming:undefined});
 if(!disabled.has('custom'))for(const p of custom)out.push({id:p.id,provider:'custom',label:p.name,status:'Configured · check provider',vision:undefined,streaming:undefined});
 const cli=await api.getCodexCliConfig?.().catch(()=>undefined);
 if(cli?.enabled&&!disabled.has('codex-cli')) {
  out.push({id:CODEX_CLI_MODEL.id,provider:'codex-cli',label:CODEX_CLI_MODEL.name,status:'Configured · sign-in required',vision:undefined,streaming:undefined});
  for(const model of CODEX_CLI_MODEL_PRESETS)out.push({id:codexCliSelectorId(model.id),provider:'codex-cli',label:model.name,status:'Configured · check availability',vision:undefined,streaming:undefined});
 }
 for(const model of out){
  const family=(provider:string)=>provider==='gemini_flash'||provider==='gemini_pro'?'gemini':provider;
  const state=runtime.filter(s=>s.id?.startsWith('answer:')&&family(s.details?.provider??'')===model.provider&&[model.id,model.id.replace(/^ollama-/,'')].includes(s.details?.model)).sort((a,b)=>Date.parse(b.updatedAt||'')-Date.parse(a.updatedAt||''))[0];
  if(state){const stale=Date.now()-Date.parse(state.updatedAt||'')>24*60*60*1000;model.status=stale?'Stale generation check':state.health==='ready'?'Answered successfully':'Needs attention';model.message=state.health==='ready'?undefined:state.message;}
 }
 return out;
}
