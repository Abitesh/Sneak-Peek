import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dialog, nativeImage } from 'electron';
import { getPersonalKnowledgeManager } from '../personalKnowledge';
import { getProjectKnowledgeManager, type ProjectInput } from './ProjectKnowledgeManager';
import { importPublicGitHubProject, parseGitHubRepository } from './GitHubProjectImporter';
const pendingDocuments=new Map<string,{path:string;expires:number}>();
const DOCUMENT_EXTENSIONS=['pdf','docx','txt','md','markdown','json','csv','html','xml','ts','tsx','js','jsx','py','java','sql','go','rs','c','cpp','yaml','yml','toml'];
type Register=(channel:string,handler:(event:any,...args:any[])=>any)=>void;
/** Renderer never supplies filesystem paths. File access comes from the native picker. */
export function registerProjectKnowledgeIpc(register:Register, analyzeDiagram?:(event:any,id:string,imageId:string)=>Promise<unknown>) {
 const guard=(fn:(...args:any[])=>any)=>async (_event:any,...args:any[])=>{try{return {success:true,value:await fn(...args)};}catch(e){return {success:false,error:e instanceof Error?e.message:'Project operation failed.'};}};
 register('projects:pick-image',guard(async(id:string)=>{
  const manager=getProjectKnowledgeManager();if(!manager.get(id))throw new Error('Project not found.');
  const picked=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Architecture diagram',extensions:['png','jpg','jpeg']}]});
  if(picked.canceled||!picked.filePaths[0])return {cancelled:true};
  const file=picked.filePaths[0],stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>8*1024*1024)throw new Error('Use a PNG/JPEG file up to 8 MB.');
  const bytes=fs.readFileSync(file),image=nativeImage.createFromBuffer(bytes);if(image.isEmpty())throw new Error('The diagram is corrupt or unsupported.');
  const size=image.getSize();if(size.width>10000||size.height>10000)throw new Error('The diagram dimensions are too large.');
  return manager.addImage(id,path.basename(file),bytes);
 }));
 register('projects:image-preview',guard((id:string,imageId:string)=>{const image=getProjectKnowledgeManager().getImage(id,imageId);return `data:${image.mime};base64,${fs.readFileSync(image.path).toString('base64')}`;}));
 register('projects:analyze-image',async(event:any,id:string,imageId:string)=>{
  if(!analyzeDiagram)return {success:false,error:'Diagram analysis is unavailable.'};
  try{await analyzeDiagram(event,id,imageId);return {success:true};}catch(e){return {success:false,error:e instanceof Error?e.message:'Diagram analysis failed.'};}
 });
 register('projects:list',guard(()=>getProjectKnowledgeManager().list()));
 register('projects:prepare-files',guard(async()=>{
  for(const [key,value] of pendingDocuments)if(value.expires<Date.now())pendingDocuments.delete(key);
  if(pendingDocuments.size>60)throw new Error('Too many pending uploads. Save or reopen Projects.');
  const selected=await dialog.showOpenDialog({properties:['openFile','multiSelections'],filters:[{name:'Project documentation',extensions:DOCUMENT_EXTENSIONS}]});
  if(selected.canceled)return [];
  if(selected.filePaths.length>12)throw new Error('Choose up to 12 documents per save.');
  return selected.filePaths.map(file=>{const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>20*1024*1024)throw new Error('Use regular documents up to 20 MB.');const token=randomUUID();pendingDocuments.set(token,{path:file,expires:Date.now()+30*60_000});return {token,name:path.basename(file)};});
 }));
 register('projects:save',guard(async(input:ProjectInput)=>{
  if(!input||typeof input!=='object')throw new Error('Invalid project.');
  const tokens=input.uploadTokens??[];
  if(!Array.isArray(tokens)||tokens.length>12||tokens.some(t=>typeof t!=='string'||!pendingDocuments.has(t)||pendingDocuments.get(t)!.expires<Date.now()))throw new Error('Upload selection expired. Choose the files again.');
  const paths=[...new Set(tokens)].map(t=>pendingDocuments.get(t)!.path);
  const projects=getProjectKnowledgeManager();
  let ready={...input};
  if(input.repositoryUrl&&(input.refreshRepository===true||!input.readme?.includes(`Repository: ${parseGitHubRepository(input.repositoryUrl).url}\n`)||!input.readme?.includes('Commit: ')||!input.readme.includes('## Source: '))){
   const imported=await importPublicGitHubProject(input.repositoryUrl);
   ready={...input,name:input.name||imported.name,description:imported.description,readme:imported.readme};
  }
  const saved=await projects.save(ready);
  const files=getPersonalKnowledgeManager();
  try {for(let i=0;i<paths.length;i++){
   const previous=new Set(files.listFiles().map((file:{id:string})=>file.id));
   const stat=fs.lstatSync(paths[i]);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>20*1024*1024)throw new Error('Selected document changed. Choose it again.');
   const file=await files.ingestFile(paths[i],'project');
   if(!projects.get(saved.id)){if(!previous.has(file.id))files.deleteFile(file.id,true);throw new Error('Project removed during upload.');}
   projects.attach(saved.id,file.id,!previous.has(file.id));
  }
  }catch(error){projects.markIndexFailed(saved.id);throw new Error(`${saved.name} was saved, but a document could not be indexed. Reopen the project and retry: ${error instanceof Error?error.message:'Document import failed.'}`);}
  tokens.forEach(t=>pendingDocuments.delete(t));
  return projects.get(saved.id);
 }));
 register('projects:import-github',guard((url:string)=>{if(typeof url!=='string')throw new Error('Repository URL required.');return importPublicGitHubProject(url);}));
 register('projects:set-enabled',guard((id:string,enabled:boolean)=>{if(typeof enabled!=='boolean')throw new Error('Invalid selection.');return getProjectKnowledgeManager().setEnabled(id,enabled);}));
 register('projects:delete',guard((id:string)=>getProjectKnowledgeManager().remove(id)));
 register('projects:reindex',guard((id:string)=>getProjectKnowledgeManager().reindex(id)));
 register('projects:pick-file',guard(async (id:string)=>{
  const projects=getProjectKnowledgeManager();if(!projects.get(id))throw new Error('Project not found.');
  const selected=await dialog.showOpenDialog({properties:['openFile'],filters:[{name:'Project documentation',extensions:['pdf','docx','txt','md','markdown','json','csv','html','xml','ts','tsx','js','jsx','py','java','sql','go','rs','c','cpp','yaml','yml','toml']}]});
  if(selected.canceled||!selected.filePaths[0])return {cancelled:true};
  const files=getPersonalKnowledgeManager(), previous=new Set(files.listFiles().map((file:{id:string})=>file.id));
  if(!projects.get(id))throw new Error('Project was removed.');
  const file=await files.ingestFile(selected.filePaths[0],'project');
  if(!projects.get(id)){if(!previous.has(file.id))files.deleteFile(file.id,true);throw new Error('Project was removed during import.');}
  return projects.attach(id,file.id,!previous.has(file.id));
 }));
}
