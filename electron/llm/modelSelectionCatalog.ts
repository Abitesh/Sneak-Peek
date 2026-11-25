/** Selection policy shared by discovery and the desktop. No probes or credentials. */
export function isInterviewChatModel(id:string):boolean {
  return Boolean(id.trim()) && !/(?:embed(?:ding)?|rerank|transcrib|whisper|(?:^|[-/_])tts(?:[-/_]|$)|speech|audio|realtime|dall-e|imagen|imagegen|(?:^|[-/_])veo(?:[-/_]|$)|moderation|guard)/i.test(id);
}
export function modelAccessDenied(message:string|undefined):boolean {
  if (/HTTP (?:429|5\d\d)|(?:insufficient|exhausted|exceeded).{0,24}(?:quota|credits)|(?:quota|credits).{0,24}(?:exhausted|exceeded)|rate.limit|timed? out|temporar(?:ily|y).{0,24}unavailable/i.test(message??'')) return false;
  return /HTTP (?:401|403|404)|not available for this key|model.{0,40}(?:not found|does not exist|not available|unavailable|not supported)|unknown model|(?:no|denied|do not have).{0,25}access|permission.denied|unsupported.{0,20}(?:chat|model)/i.test(message??'');
}
export function catalogModelProvider(id:string,catalog:Readonly<Record<string,readonly {id:string}[]>>):string|undefined {
 const providers=Object.entries(catalog).filter(([,models])=>models.some(m=>m.id===id)).map(([provider])=>provider);
 return providers.length===1?providers[0]:undefined;
}
/** Prefer the account's catalog, never a union with speculative release presets. */
export function accountChatModels(catalog:readonly {id:string;label:string}[], bindings:readonly {id:string;label:string;source:string;lastError?:string;capabilities?:{chat:boolean}}[]=[]):Array<{id:string;label:string}> {
  const rows=catalog.length?catalog:bindings.filter(b=>b.source==='live-probe'&&!b.lastError&&b.capabilities?.chat).map(b=>({id:b.id,label:b.label}));
  const seen=new Set<string>();
  return rows.filter(row=>{
    if(seen.has(row.id)||!isInterviewChatModel(row.id))return false;
    const binding=bindings.find(b=>b.id===row.id);
    if(modelAccessDenied(binding?.lastError))return false;
    seen.add(row.id);return true;
  });
}
export function favoriteModelChoices<T extends {provider:string;id:string}>(models:readonly T[],favorites:Readonly<Record<string,readonly string[]>>):T[] {
  return Object.entries(favorites).flatMap(([provider,ids])=>ids.flatMap(id=>{const model=models.find(m=>m.provider===provider&&m.id===id);return model?[model]:[];}));
}
