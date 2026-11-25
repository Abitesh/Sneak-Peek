import { STANDARD_CLOUD_MODELS, isModelAllowed, CODEX_CLI_MODEL, codexCliSelectorId, litellmModelLabel } from './modelUtils';
import { accountChatModels, isInterviewChatModel, modelAccessDenied } from '../../electron/llm/modelSelectionCatalog';
export { favoriteModelChoices } from '../../electron/llm/modelSelectionCatalog';
export interface ConfiguredModel {id:string;provider:string;label:string;}
export const PROVIDER_LABELS:Record<string,string>={gemini:'Gemini',openai:'OpenAI',claude:'Claude',groq:'Groq',deepseek:'DeepSeek',nvidia_nim:'NVIDIA NIM',litellm:'LiteLLM',ollama:'Ollama',custom:'Custom', 'codex-cli':'Codex CLI'};
/** Cached account discovery and explicit configuration. Opening a picker never generates text. */
export async function loadConfiguredModels():Promise<ConfiguredModel[]> {
 const api=window.electronAPI;
 const [creds,catalog,health,local,custom,runtime,proxy]=await Promise.all([api.getStoredCredentials(),api.getCloudFetchedModels(),api.getProviderHealth(),api.getAvailableOllamaModels().catch(()=>[]),api.getCustomProviders().catch(()=>[]),api.getProviderStatuses().catch(()=>[]),api.getAvailableLiteLLMModels().catch(()=>[])]);
 const disabled=new Set(creds.disabledProviders??[]),out:ConfiguredModel[]=[];
 for(const [provider,config] of Object.entries(STANDARD_CLOUD_MODELS)){
  if(disabled.has(provider)||!config.hasKeyCheck(creds))continue;
  const h=health[provider];
  if(h?.authOk===false&&/auth|credential|api.key|permission/i.test(h.lastError?.code??''))continue;
  for(const model of accountChatModels(catalog.models[provider]??[],h?.models)){
   if(isModelAllowed(provider,model.id,creds.cloudEnabledModels?.[provider]??[]))out.push({...model,provider});
  }
 }
 if(!disabled.has('litellm'))for(const model of accountChatModels([...proxy.map(id=>({id:id.startsWith('litellm/')?id:`litellm/${id}`,label:litellmModelLabel(id)})),...(catalog.models.litellm??[]).map(m=>({id:m.id.startsWith('litellm/')?m.id:`litellm/${m.id}`,label:litellmModelLabel(m.id)}))]))if(isModelAllowed('litellm',model.id,creds.cloudEnabledModels?.litellm??[]))out.push({...model,provider:'litellm'});
 if(!disabled.has('ollama'))for(const id of local)if(isInterviewChatModel(id))out.push({id:`ollama-${id}`,provider:'ollama',label:id});
 if(!disabled.has('custom'))for(const p of custom)out.push({id:p.id,provider:'custom',label:p.name});
 const cli=await api.getCodexCliConfig?.().catch(()=>undefined);
 const login=cli?.enabled?await api.codexLoginStatus?.().catch(()=>undefined):undefined;
 if(cli?.enabled&&login?.signedIn&&!disabled.has('codex-cli')){
  out.push({id:CODEX_CLI_MODEL.id,provider:'codex-cli',label:CODEX_CLI_MODEL.name});
  for(const id of [...new Set([cli.model,cli.fastModel].filter(Boolean))])out.push({id:codexCliSelectorId(id),provider:'codex-cli',label:id});
 }
 return out.filter(model=>{
  if(new Set(out.filter(other=>other.id===model.id).map(other=>other.provider)).size>1)return false;
  const family=(p:string)=>p.startsWith('gemini_')?'gemini':p;
  const state=runtime.filter(s=>s.id?.startsWith('answer:')&&family(s.details?.provider??'')===model.provider&&[model.id,model.id.replace(/^ollama-/,'')].includes(s.details?.model)).sort((a,b)=>Date.parse(b.updatedAt||'')-Date.parse(a.updatedAt||''))[0];
  // Transient quota, rate, timeout and outage errors do not prove lost access.
  const observed=Date.parse(state?.updatedAt||'');
  const refreshed=catalog.fetchedAt[model.provider]??0;
  return !state||observed<refreshed||Date.now()-observed>24*60*60*1000||state.health==='ready'||!modelAccessDenied(state.message);
 });
}
