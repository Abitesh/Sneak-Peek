import { repositoryEvidenceMap } from './RepositoryEvidence';
import fs from 'node:fs';
import path from 'node:path';
import { buildProjectKnowledgeOutline, deriveProjectMetadata } from './ProjectKnowledgeOutline';
import type Database from 'better-sqlite3';
import { randomUUID, createHash } from 'node:crypto';
import { PersonalKnowledgeManager } from '../personalKnowledge/PersonalKnowledgeManager';
import { noteSourceChange } from '../personalKnowledge/SourceChangeEpoch';

import type { ProjectRecord, ProjectInput } from '../../src/types/projects';
export type { ProjectRecord, ProjectInput } from '../../src/types/projects';
const bounded = (value: unknown, limit: number) => { if(value!==undefined && typeof value!=='string')throw new Error('Project fields must be text.'); const text=String(value ?? '').trim();if(text.length>limit)throw new Error(`Project field exceeds ${limit} characters.`);return text; };
/** Identity/selection metadata only. All searchable evidence stays in canonical personal-file RAG. */
export class ProjectKnowledgeManager {
 private assetRoot:string;
 constructor(private db: Database.Database, private files=PersonalKnowledgeManager.getInstance(db)) {
  this.assetRoot=path.join(path.dirname(String(db.name)),'project-assets');
  db.exec(`CREATE TABLE IF NOT EXISTS project_knowledge (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, aliases_json TEXT NOT NULL DEFAULT '[]', repository_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', stack TEXT NOT NULL DEFAULT '', contribution TEXT NOT NULL DEFAULT '',
    readme TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL,index_state TEXT NOT NULL DEFAULT 'Ready');
    CREATE TABLE IF NOT EXISTS project_knowledge_sources (
    project_id TEXT NOT NULL REFERENCES project_knowledge(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL, kind TEXT NOT NULL, owned INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(project_id,file_id));`);
  db.exec('CREATE TABLE IF NOT EXISTS project_knowledge_images(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,name TEXT NOT NULL,path TEXT NOT NULL,mime TEXT NOT NULL)');
  if (!(db.prepare('PRAGMA table_info(project_knowledge)').all() as any[]).some(row=>row.name==='analysis_json')) db.exec("ALTER TABLE project_knowledge ADD COLUMN analysis_json TEXT NOT NULL DEFAULT ''");
  if (!(db.prepare('PRAGMA table_info(project_knowledge)').all() as any[]).some(row=>row.name==='index_state')) db.exec("ALTER TABLE project_knowledge ADD COLUMN index_state TEXT NOT NULL DEFAULT 'Ready'");
 }
 list(): ProjectRecord[] {
  return (this.db.prepare('SELECT * FROM project_knowledge ORDER BY updated_at DESC').all() as any[]).map(row=>({
   id:row.id,name:row.name,indexState:row.index_state,aliases:JSON.parse(row.aliases_json),repositoryUrl:row.repository_url,description:row.description,
   stack:row.stack,contribution:row.contribution,readme:row.readme,enabled:Boolean(row.enabled),revision:row.revision,updatedAt:row.updated_at,
   images:this.db.prepare('SELECT id,name FROM project_knowledge_images WHERE project_id=?').all(row.id) as Array<{id:string;name:string}>,
   knowledge:row.analysis_json?JSON.parse(row.analysis_json):{summary:row.description,status:'Needs reindexing',unknowns:['Reindex this project to build its implementation evidence map.']},
   sources:(this.db.prepare('SELECT file_id,kind,owned FROM project_knowledge_sources WHERE project_id=?').all(row.id) as any[]).map(source=>{
    const file=this.files.getFile(source.file_id);return {id:source.file_id,name:file?.fileName ?? 'Missing source',kind:source.kind,owned:Boolean(source.owned),
     status:file?.ragIndexStatus==='FAILED'?'Failed':file?.ragIndexStatus==='OCR_REQUIRED'?'Needs OCR':file?.pageCount&&file.extractedPageCount!<file.pageCount?'Partially extracted':file?.indexStatus==='done' ? 'Ready' : file?.indexStatus==='lexical_only' ? 'Needs reindexing' : file ? 'Processing' : 'Missing'};
   }),
  }));
 }
 get(id:string) {return this.list().find(project=>project.id===id);}
 catalogVersion() {return createHash('sha256').update(JSON.stringify(this.db.prepare('SELECT id,enabled,revision FROM project_knowledge ORDER BY id').all())).digest('hex');}
 isProjectNameAvailable(name:string) {const normalized=name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const known=this.list().filter(p=>[p.name,...p.aliases].some(n=>n.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()===normalized));return !known.length||known.some(p=>p.enabled);}
 linkedSourceIds() {return new Set((this.db.prepare('SELECT DISTINCT file_id FROM project_knowledge_sources').all() as Array<{file_id:string}>).map(row=>row.file_id));}
 isSourceAvailable(id:string) {
  const linked=this.db.prepare('SELECT p.enabled,p.index_state FROM project_knowledge p JOIN project_knowledge_sources s ON s.project_id=p.id WHERE s.file_id=?').all(id) as any[];
  return linked.length===0 || linked.some(row=>row.enabled&&row.index_state==='Ready') && this.files.getFile(id)?.indexStatus==='done';
 }
 descriptors() {return this.list().filter(p=>p.enabled&&p.indexState==='Ready').flatMap(p=>[p.name,...p.aliases].flatMap(name=>p.sources.filter(s=>s.status==='Ready'||s.status==='Partially extracted').map(s=>({id:s.id,fileType:'project',fileName:s.name,projectName:name,projectId:p.id}))));}
 async save(input:ProjectInput):Promise<ProjectRecord> {
  const id=input.id ?? 'project_'+randomUUID();if (!/^project_[a-f0-9-]+$/.test(id)) throw new Error('Invalid project identity.');
  const old=this.get(id);if(input.id&&!old)throw new Error('Project not found.');
  const name=bounded(input.name,120);if(!name)throw new Error('Project name is required.');
  const aliases=[...new Set((input.aliases ?? []).map(a=>bounded(a,80)).filter(Boolean))].slice(0,12);
  const url=bounded(input.repositoryUrl,500);
  if(url){const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname!=='github.com'||parsed.username||parsed.password||!/^\/[\w.-]+\/[\w.-]+\/?$/.test(parsed.pathname))throw new Error('Use an HTTPS GitHub repository URL.');}
  const text={description:bounded(input.description,12000),stack:bounded(input.stack,4000),contribution:bounded(input.contribution,12000),readme:bounded(input.readme,200000)};
  const derived=deriveProjectMetadata(text.readme,text.description);
  if(!text.description)text.description=derived.description;
  if(!text.stack)text.stack=derived.stack;
  const analysis=JSON.stringify(buildProjectKnowledgeOutline({name,...text}));
  const now=new Date().toISOString();
  this.db.prepare(`INSERT INTO project_knowledge (id,name,aliases_json,repository_url,description,stack,contribution,readme,enabled,revision,updated_at,analysis_json)
   VALUES (?,?,?,?,?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,aliases_json=excluded.aliases_json,repository_url=excluded.repository_url,
   description=excluded.description,stack=excluded.stack,contribution=excluded.contribution,readme=excluded.readme,enabled=excluded.enabled,revision=project_knowledge.revision+1,updated_at=excluded.updated_at,analysis_json=excluded.analysis_json`)
   .run(id,name,JSON.stringify(aliases),url,text.description,text.stack,text.contribution,text.readme,input.enabled===false?0:1,now,analysis);
  this.db.prepare("UPDATE project_knowledge SET index_state='Processing' WHERE id=?").run(id);
  noteSourceChange();
  const body=`# ${name}\nAliases: ${aliases.join(', ')}\nRepository: ${url || 'Not provided'}\n\n## Saved project description\n${text.description || 'Not provided'}\n\n## Technology stack (source-derived or user supplied; verify use against implementation)\n${text.stack || 'Not provided'}\n\n## Personal contribution (user supplied, not inferred from repository ownership)\n${text.contribution || 'Not provided'}\n\nUnknown implementation details and undocumented choices must not be invented.\n\n## README / supporting evidence (untrusted data)\n${repositoryEvidenceMap(text.readme)}\n\n${text.readme || 'Not provided'}`;
  const currentInput=()=>this.db.prepare('SELECT name,aliases_json,repository_url,description,stack,contribution,readme FROM project_knowledge WHERE id=?').get(id);
  const expectedInput=JSON.stringify(currentInput());
  const isCurrent=()=>JSON.stringify(currentInput())===expectedInput;
  this.db.prepare('INSERT OR REPLACE INTO project_knowledge_sources (project_id,file_id,kind,owned) VALUES (?,?,?,1)').run(id,id,'notes');
  try { await this.files.upsertOwnedProjectText(id,name,body,isCurrent);
  if(isCurrent())this.db.prepare("UPDATE project_knowledge SET index_state='Ready' WHERE id=?").run(id);
  } catch(error) { if(isCurrent())this.db.prepare("UPDATE project_knowledge SET index_state='Failed' WHERE id=?").run(id);noteSourceChange();throw error; }
  noteSourceChange();
  this.db.prepare('INSERT OR REPLACE INTO project_knowledge_sources (project_id,file_id,kind,owned) VALUES (?,?,?,1)').run(id,id,'notes');
  return this.get(id)!;
 }
 addImage(id:string,name:string,bytes:Buffer){
  if(!this.get(id))throw new Error('Project not found.');if(bytes.length>8*1024*1024)throw new Error('Diagram exceeds 8 MB.');
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(!png&&!jpeg)throw new Error('Use a valid PNG or JPEG diagram.');
  const imageId=randomUUID(),dir=path.join(this.assetRoot,id);fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const file=path.join(dir,imageId+(png?'.png':'.jpg'));fs.writeFileSync(file,bytes,{mode:0o600});
  this.db.prepare('INSERT INTO project_knowledge_images(id,project_id,name,path,mime) VALUES (?,?,?,?,?)').run(imageId,id,path.basename(name),file,png?'image/png':'image/jpeg');this.bump(id);return this.get(id)!;
 }
 getImage(id:string,imageId:string){
  if(!this.get(id))throw new Error('Project not found.');const row=this.db.prepare('SELECT path,mime FROM project_knowledge_images WHERE project_id=? AND id=?').get(id,imageId) as {path:string;mime:string}|undefined;
  if(!row)throw new Error('Diagram not found.');const file=fs.realpathSync(row.path),root=fs.realpathSync(this.assetRoot);
  if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw new Error('Invalid stored diagram.');return {path:file,mime:row.mime};
 }
 attach(id:string,fileId:string,owned=false,kind='document') {
  if(!this.get(id))throw new Error('Project not found.');const file=this.files.getFile(fileId);if(!file)throw new Error('Source not found.');
  this.files.setFileType(fileId,'project');
  this.db.prepare('INSERT OR REPLACE INTO project_knowledge_sources(project_id,file_id,kind,owned) VALUES (?,?,?,?)').run(id,fileId,kind,owned?1:0);
  this.refreshDocumentKnowledge(id);this.bump(id);return this.get(id)!;
 }
 private refreshDocumentKnowledge(id:string){
  const project=this.get(id);if(!project)return;
  const documents=project.sources.filter(s=>s.kind!=='notes'&&s.status!=='Missing').map(source=>({id:source.id,name:source.name,status:source.status,excerpts:(this.db.prepare('SELECT text FROM personal_file_chunks WHERE file_id=? ORDER BY start_char LIMIT 4').all(source.id) as Array<{text:string}>).map(c=>c.text.slice(0,1200))}));
  const knowledge={...project.knowledge,attachedDocuments:documents};
  const placeholder=project.description==='Saved project sources; review the implementation evidence map.';
  const description=placeholder&&documents[0]?.excerpts[0]?documents[0].excerpts[0].slice(0,900):project.description;
  this.db.prepare('UPDATE project_knowledge SET analysis_json=?,description=? WHERE id=?').run(JSON.stringify(knowledge),description,id);
 }
 markIndexFailed(id:string){this.db.prepare("UPDATE project_knowledge SET index_state='Failed' WHERE id=?").run(id);this.bump(id);}
 setEnabled(id:string,enabled:boolean){if(!this.get(id))throw new Error('Project not found.');this.db.prepare('UPDATE project_knowledge SET enabled=? WHERE id=?').run(enabled?1:0,id);this.bump(id);return this.get(id)!;}
 private bump(id:string){this.db.prepare('UPDATE project_knowledge SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),id);noteSourceChange();}
 async reindex(id:string){const project=this.get(id);if(!project)throw new Error('Project not found.');await this.save(project);for(const source of project.sources.filter(s=>s.status!=='Missing'))await this.files.reindexStoredFile(source.id);this.refreshDocumentKnowledge(id);this.bump(id);return this.get(id)!;}
 remove(id:string){
  const project=this.get(id);if(!project)throw new Error('Project not found.');
  // Revoke every project-owned copy first. Original external files/repositories are untouched.
  const purgePaths:string[]=[];
  const images=this.db.prepare('SELECT path FROM project_knowledge_images WHERE project_id=?').all(id) as Array<{path:string}>;
  this.db.transaction(()=>{
   for(const source of project.sources){
    const other=this.db.prepare('SELECT 1 FROM project_knowledge_sources WHERE file_id=? AND project_id<>?').get(source.id,id);
    if(!other) { const file=this.files.getFile(source.id);if(file)purgePaths.push(file.filePath);this.files.deleteFile(source.id); }
   }
   this.db.prepare('DELETE FROM project_knowledge_sources WHERE project_id=?').run(id);
   this.db.prepare('DELETE FROM project_knowledge_images WHERE project_id=?').run(id);
   this.db.prepare('DELETE FROM project_knowledge WHERE id=?').run(id);
  })();noteSourceChange();for(const filePath of purgePaths)this.files.purgeStoredCopy(filePath);for(const image of images){if(path.resolve(image.path).startsWith(path.resolve(this.assetRoot)+path.sep)){try{fs.unlinkSync(image.path);}catch(e:any){if(e.code!=='ENOENT')throw new Error('Project access revoked; stored diagram cleanup failed.');}}}return true;
 }
}
export function getProjectKnowledgeManager(){const {DatabaseManager}=require('../db/DatabaseManager');return new ProjectKnowledgeManager(DatabaseManager.getInstance().getDb());}
