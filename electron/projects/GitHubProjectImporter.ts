const MAX_RESPONSE_BYTES=2_000_000;
export function parseGitHubRepository(value:string) {
 const url=new URL(value);
 if(url.protocol!=='https:'||url.hostname!=='github.com'||url.port||url.username||url.password||url.search||url.hash)throw new Error('Enter an HTTPS github.com repository URL.');
 const match=url.pathname.match(/^\/([a-z\d_.-]+)\/([a-z\d_.-]+?)(?:\.git)?\/?$/i);
 if(!match||match[1]==='.'||match[2]==='..')throw new Error('Enter a repository, not a profile or file URL.');
 return {owner:match[1],repo:match[2],url:`https://github.com/${match[1]}/${match[2]}`};
}
export function safeRepositoryPath(path:string) {
 return !/(?:^|\/)(?:\.env[^/]*|\.git|node_modules|vendor|dist|build|target|coverage|credentials?|secrets?|\.ssh|\.aws)(?:\/|$)/i.test(path)
 && !/\.(?:pem|key|p12|pfx|crt|lock|svg|png|jpg|zip|bin|exe|dmg)$/i.test(path)
 && !path.includes('..') && !path.startsWith('/');
}
export function redactRepositorySecrets(text:string) {
 return text.replace(/-----BEGIN [^-]*(?:PRIVATE KEY)[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[private key removed]')
 .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b/g,'[credential removed]')
 .replace(/((?:api[_-]?key|access[_-]?token|password|secret|authorization)\s*[=:]\s*)[^\n,;]+/gi,'$1[credential removed]');
}
/** Bounded, commit-pinned read-only import. No clone, subprocess, execution or installation. */
export async function importPublicGitHubProject(value:string, options:{fetch?:typeof fetch;signal?:AbortSignal}={}) {
 const repository=parseGitHubRepository(value), request=options.fetch ?? fetch;
 const signal=options.signal ? AbortSignal.any([options.signal,AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000);
 const api=`https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;
 async function get(path:string) {
  const response=await request(api+path,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'},redirect:'error',signal});
  if(!response.ok)throw new Error(response.status===404?'Repository unavailable or private. Public import uses no credentials; paste authorized README text or upload documentation for private repositories.':response.status===403||response.status===429?'GitHub rate limit or access restriction. Retry later; no automatic retry was sent.':`GitHub import failed (${response.status}).`);
  if(Number(response.headers.get('content-length'))>MAX_RESPONSE_BYTES)throw new Error('Repository response exceeds the import limit.');
  const reader=response.body?.getReader();if(!reader)throw new Error('GitHub returned an empty response.');
  const buffers:Uint8Array[]=[];let bytes=0;
  try{while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.length;if(bytes>MAX_RESPONSE_BYTES)throw new Error('Repository response exceeds the import limit.');buffers.push(next.value);}}
  finally{await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(buffers).toString('utf8'));
 }
 const metadata=await get('');
 const branch=await get('/commits/'+encodeURIComponent(metadata.default_branch));
 if(!/^[a-f0-9]{40}$/i.test(branch.sha))throw new Error('Repository revision is unavailable.');
 const tree=await get('/git/trees/'+branch.sha+'?recursive=1');
 const candidates=(Array.isArray(tree.tree)?tree.tree:[]).filter((f:any)=>f.type==='blob'&&f.mode==='100644'&&f.size<=45000&&safeRepositoryPath(f.path));
 const rank=(path:string)=>/^readme(?:\.|$)/i.test(path)?0:/(?:package\.json|pom\.xml|pyproject\.toml|Cargo\.toml|go\.mod|build\.gradle)$/i.test(path)?1:/docs\/|architecture|schema|migration|openapi|swagger/i.test(path)?2:/\.(?:ts|js|py|java|rs|go|sql)$/i.test(path)?3:9;
 const chosen=candidates.filter((f:any)=>rank(f.path)<9).sort((a:any,b:any)=>rank(a.path)-rank(b.path)||a.path.localeCompare(b.path)).slice(0,14);
 const sources:Array<{path:string;sha:string;text:string}>=[];let total=0;
 for(const file of chosen){
  if(signal.aborted)throw new Error('Import cancelled.');
  const blob=await get('/git/blobs/'+file.sha);
  if(blob.encoding!=='base64')continue;
  const text=redactRepositorySecrets(Buffer.from(blob.content,'base64').toString('utf8')).slice(0,12000);
  if(total+text.length>75000)break;
  sources.push({path:file.path,sha:file.sha,text});total+=text.length;
 }
 if(!sources.length)throw new Error('No supported readable project sources were found. Upload documentation instead.');
 return {name:String(metadata.name ?? repository.repo),repositoryUrl:repository.url,commit:branch.sha,
  description:redactRepositorySecrets(String(metadata.description ?? '')),
  readme:`Repository: ${repository.url}\nCommit: ${branch.sha}\nImport scope: ${sources.length} selected files${tree.truncated?'; repository tree was truncated':''}. Other implementation details remain unverified. Repository ownership is not proof of personal authorship.\n\n`+
   sources.map(s=>`## Source: ${s.path}\nRevision: ${s.sha}\n${s.text}`).join('\n\n'),
  sources:sources.map(({path,sha})=>({path,sha})),partial:Boolean(tree.truncated||candidates.length>chosen.length)};
}
