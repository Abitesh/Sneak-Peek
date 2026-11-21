import { MeetingModelSelector } from './ui/MeetingModelSelector';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus, Upload, RefreshCw, Trash2, Github, ArrowLeft } from 'lucide-react';
import type { ProjectRecord, ProjectInput } from '../types/projects';
const blank=():ProjectInput=>({name:'',aliases:[],repositoryUrl:'',description:'',stack:'',contribution:'',readme:'',enabled:true});
const inputClass='w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary';
const knowledgeLabel=(key:string)=>({beginnerSummary:'Summary',apisAndModules:'APIs & modules',evidenceLocations:'Source locations',specializedSystems:'Specialized systems',userSupplied:'Your notes',manifestDependencies:'Declared dependencies',likelyQuestions:'Practice questions'}[key]??key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()));
function knowledgeValue(value:unknown):ReactNode {
 if(typeof value==='string')return <p className="whitespace-pre-wrap break-words">{value}</p>;
 if(Array.isArray(value))return value.length?<ul className="space-y-1 list-disc pl-4">{value.map((item,index)=><li key={index}>{knowledgeValue(item)}</li>)}</ul>:<p>No documented evidence yet.</p>;
 if(value&&typeof value==='object')return <dl className="space-y-2">{Object.entries(value).map(([key,item])=><div key={key}><dt className="font-medium">{knowledgeLabel(key)}</dt><dd>{knowledgeValue(item)}</dd></div>)}</dl>;
 return null;
}
export function ProjectsPanel() {
 const [projects,setProjects]=useState<ProjectRecord[]>([]),[draft,setDraft]=useState<ProjectInput|null>(null);
 const [imageAnswer,setImageAnswer]=useState(''),[preview,setPreview]=useState('');
 const analyzing=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function refresh(){const result=await window.electronAPI.projectsList();if(!result.success)throw new Error(result.error);setProjects(result.value ?? []);}
 useEffect(()=>{void refresh().catch(()=>setError('Projects could not be loaded.'));return()=>{if(analyzing.current){analyzing.current=false;void window.electronAPI.cancelChatStream();}};},[]);
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');setNotice('');try{await action();await refresh();}catch(e){setError(e instanceof Error?e.message:'Project operation failed.');}finally{setBusy(false);}};
 const resultValue=(r:{success:boolean;value?:any;error?:string})=>{if(!r.success)throw new Error(r.error||'Project operation failed.');return r.value;};
 const analyzeImage=async(projectId:string,imageId:string)=>{await run(async()=>{
  analyzing.current=true;setImageAnswer('');let failure='';
  const off=[window.electronAPI.onGeminiStreamToken((chunk:string)=>{if(analyzing.current)setImageAnswer(text=>text+chunk);}),
   window.electronAPI.onGeminiStreamDone((result:any)=>{if(analyzing.current)setImageAnswer(result?.finalText??result?.text??'No diagram explanation was returned.');}),
   window.electronAPI.onGeminiStreamError((error:string)=>{if(analyzing.current)failure=error;})];
  try{const result=await window.electronAPI.projectsAnalyzeImage(projectId,imageId);if(!result.success)throw new Error(result.error);if(failure)throw new Error(failure);}
  finally{analyzing.current=false;off.forEach(stop=>stop());}
 });};
 const field=(key:keyof ProjectInput,label:string,multiline=false)=> <label className="block space-y-1 text-sm text-text-secondary" key={key}>{label}
  {multiline?<textarea className={inputClass+' min-h-[110px]'} value={String(draft?.[key]??'')} onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)}/>
   :<input className={inputClass} value={key==='aliases'?(draft?.aliases??[]).join(', '):String(draft?.[key]??'')} onChange={e=>setDraft(d=>d?{...d,[key]:key==='aliases'?e.target.value.split(',').map(v=>v.trim()):e.target.value}:d)}/>}
 </label>;
 return <section className="text-text-primary space-y-5" aria-label="Project knowledge manager">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Projects</h2><p className="text-sm text-text-secondary mt-1">Your project evidence, ready for interview follow-ups.</p></div>
   <button className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-white text-sm" onClick={()=>setDraft(blank())} disabled={busy}><Plus size={15}/>Add project</button></header>
  {error&&<p role="alert" className="rounded-lg p-3 border border-red-500/30 text-red-400 text-sm">{error}</p>}
  {preview&&<figure className="rounded-xl border border-border-subtle p-3"><img alt="Selected project architecture diagram" src={preview} className="max-h-80 max-w-full object-contain mx-auto"/><button className="text-xs mt-2" onClick={()=>setPreview('')}>Close preview</button></figure>}
  {imageAnswer&&<section className="rounded-xl border border-border-subtle p-3"><h3 className="text-sm font-medium">Diagram explanation · AI-generated, verify before using</h3><p className="text-sm whitespace-pre-wrap mt-2">{imageAnswer}</p></section>}
  {notice&&<p role="status" className="text-sm text-text-secondary">{notice}</p>}
  {draft?<form className="rounded-xl border border-border-subtle p-4 space-y-4" onSubmit={e=>{e.preventDefault();void run(async()=>{const saved=resultValue(await window.electronAPI.projectsSave(draft));setDraft(null);setNotice(`${saved.name} saved and indexed.`);});}}>
    <button type="button" className="flex items-center gap-1 text-sm text-text-secondary" onClick={()=>setDraft(null)} disabled={busy}><ArrowLeft size={14}/>All projects</button>
    {field('name','Project name')}{field('aliases','Aliases, separated by commas')}{field('repositoryUrl','GitHub repository URL (optional)')}
    <button type="button" className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm" disabled={busy||!draft.repositoryUrl} onClick={()=>void run(async()=>{
     const imported=resultValue(await window.electronAPI.projectsImportGitHub(draft.repositoryUrl!));
     setDraft(current=>current?{...current,name:current.name||imported.name,description:current.description||imported.description,readme:imported.readme}:current);
     setNotice(`Read ${imported.sources.length} files at commit ${imported.commit.slice(0,8)}. Review the evidence, then save. ${imported.partial?'This is a bounded partial import.':''}`);
    })}><Github size={15}/>Read public repository</button>
    <p className="text-xs text-text-secondary">Read-only import. No code runs. Private repositories can use a pasted README or uploaded authorized documentation. Contributions are never inferred from repository ownership.</p>
    {field('description','Description / problem solved',true)}{field('stack','Technology stack')}{field('contribution','Your contribution (only what you actually did)',true)}{field('readme','README / implementation notes and source evidence',true)}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.enabled!==false} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/>Available for interviews</label>
    <button type="submit" disabled={busy||!draft.name.trim()} className="rounded-lg bg-accent-primary px-4 py-2 text-sm text-white disabled:opacity-50">{busy?'Processing…':'Save and index'}</button>
   </form>:<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
    {!projects.length&&<div className="rounded-xl border border-dashed border-border-subtle p-6 text-text-secondary text-sm">Add a project or import a README. Your résumé’s existing project summary is preserved; connect detailed evidence here.</div>}
    {projects.map(project=><article key={project.id} className="rounded-xl border border-border-subtle p-4 space-y-3">
     <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{project.name}</h3><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={project.enabled} disabled={busy} onChange={e=>void run(async()=>{resultValue(await window.electronAPI.projectsSetEnabled(project.id,e.target.checked));})}/>Interview</label></div>
     <p className="text-sm text-text-secondary break-words">{project.description||'No description supplied.'}</p>
     <p className="text-xs text-text-secondary">{project.indexState} · Revision {project.revision} · {project.aliases.length?project.aliases.join(', '):'No aliases'}</p>
     <ul className="space-y-1 text-xs text-text-secondary">{project.sources.map(source=><li key={source.id} className="flex justify-between gap-2"><span className="truncate">{source.name}</span><span>{source.status}</span></li>)}</ul>
     {!!project.images?.length&&<div className="space-y-2 text-xs text-text-secondary"><p>Diagrams are attached locally; no OCR or cloud processing runs until you request analysis.</p><MeetingModelSelector/>{project.images.map(image=><div key={image.id} className="flex flex-wrap gap-3"><span>{image.name}</span><button disabled={busy} onClick={()=>void run(async()=>{setPreview(resultValue(await window.electronAPI.projectsImagePreview(project.id,image.id)));})}>Preview</button><button disabled={busy||!project.enabled} onClick={()=>void analyzeImage(project.id,image.id)}>Analyze diagram</button></div>)}</div>}
     {project.knowledge&&<details className="text-xs text-text-secondary"><summary className="cursor-pointer">Knowledge map & unknowns</summary><p className="mt-2">Source signals and user-authored statements; repository ownership is not proof of personal contribution.</p><dl className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto mt-3">{Object.entries(project.knowledge).filter(([key])=>key!=='name').map(([key,value])=><div className="space-y-1" key={key}><dt className="font-medium text-text-primary">{knowledgeLabel(key)}</dt><dd>{knowledgeValue(value)}</dd></div>)}</dl></details>}
     <div className="flex flex-wrap gap-3 text-xs">
      <button disabled={busy} onClick={()=>setDraft({...project})}>Edit knowledge</button>
      <button className="flex items-center gap-1" disabled={busy} onClick={()=>void run(async()=>{resultValue(await window.electronAPI.projectsPickFile(project.id));})}><Upload size={13}/>Add documents</button>
      <button disabled={busy} onClick={()=>void run(async()=>{resultValue(await window.electronAPI.projectsPickImage(project.id));})}>Add diagram</button>
      <button className="flex items-center gap-1" disabled={busy} onClick={()=>void run(async()=>{resultValue(await window.electronAPI.projectsReindex(project.id));setNotice('Current stored sources reindexed.');})}><RefreshCw size={13}/>Reindex</button>
      <button className="text-red-400 flex items-center gap-1" disabled={busy} onClick={()=>{if(confirm(`Delete ${project.name} and its indexed copies? Original external files and the GitHub repository will not be deleted.`))void run(async()=>{resultValue(await window.electronAPI.projectsDelete(project.id));});}}><Trash2 size={13}/>Delete</button>
     </div>
    </article>)}
   </div>}
 </section>;
}
