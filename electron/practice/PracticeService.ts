import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ProjectKnowledgeManager } from '../projects/ProjectKnowledgeManager';
export const PRACTICE_BANK:Record<string,string[]>={
 technical:['Explain the difference between a process and a thread.','When would you use a cache, and what can go wrong?','How do you investigate a slow API?'],
 coding:['Implement binary search and explain its boundary cases.','Find two numbers whose sum matches a target. Explain complexity.','Design an LRU cache and test its eviction behavior.'],
 fundamentals:['Explain database transactions and isolation levels.','Compare a mutex with a counting semaphore.','Explain TCP versus UDP and when each is appropriate.'],
 system_design:['Design a URL shortener. Start by clarifying requirements.','Design a location-based dispatch service and discuss failure modes.','Design a notification service for millions of users.'],
 behavioral:['Describe a difficult technical decision using a real example.','Tell me about a setback and what you learned.','How did you handle disagreement within a team?'],
 resume:['Introduce yourself using only your actual experience.','Which accomplishment can you explain with evidence?','What did you personally contribute to your most relevant project?'],
 followup:['Explain the implementation flow.','What alternatives did you consider?','What limitation would you address next?'],
};
export interface PracticeSession {id:string;category:string;createdAt:string;updatedAt:string;projectIds:string[];questions:Array<{id:string;text:string;projectId?:string;answer:string;feedback?:string}>}
/** Offline practice state. It never records audio or invokes a provider. */
export class PracticeService {
 constructor(private db:Database.Database,private projects:ProjectKnowledgeManager){db.exec('CREATE TABLE IF NOT EXISTS practice_sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, content_json TEXT NOT NULL)');}
 list():PracticeSession[]{return (this.db.prepare('SELECT content_json FROM practice_sessions ORDER BY updated_at DESC LIMIT 100').all() as any[]).map(row=>JSON.parse(row.content_json));}
 get(id:string):PracticeSession|undefined {const row=this.db.prepare('SELECT content_json FROM practice_sessions WHERE id=?').get(id) as any;return row?JSON.parse(row.content_json):undefined;}
 create(category:string,projectIds:string[]=[]):PracticeSession {
  if(!Object.hasOwn(PRACTICE_BANK,category)&&category!=='projects')throw new Error('Unknown practice category.');
  if(!Array.isArray(projectIds)||projectIds.length>8||projectIds.some(id=>typeof id!=='string'||!this.projects.get(id)?.enabled))throw new Error('Selected project is unavailable.');
  if(category==='projects'&&!projectIds.length)throw new Error('Select at least one available project.');
  const questions=category==='projects'?projectIds.flatMap(id=>{
   const name=this.projects.get(id)!.name;
   return [`Explain what ${name} does to a nontechnical person.`,`Explain the architecture and implementation flow of ${name}.`,`What did you personally contribute to ${name}?`,`Which technology choices and trade-offs in ${name} can you support with evidence?`].map(text=>({id:randomUUID(),text,projectId:id,answer:''}));
  }):PRACTICE_BANK[category].map(text=>({id:randomUUID(),text,answer:''}));
  const now=new Date().toISOString(),session={id:randomUUID(),category,createdAt:now,updatedAt:now,projectIds:[...new Set(projectIds)],questions};
  this.db.prepare('INSERT INTO practice_sessions(id,created_at,updated_at,content_json) VALUES (?,?,?,?)').run(session.id,now,now,JSON.stringify(session));return session;
 }
 answer(id:string,questionId:string,answer:string,feedback?:string){
  const session=this.get(id);if(!session)throw new Error('Practice session not found.');
  const question=session.questions.find(q=>q.id===questionId);if(!question)throw new Error('Practice question not found.');
  if(typeof answer!=='string'||answer.length>32000||feedback!==undefined&&(typeof feedback!=='string'||feedback.length>32000))throw new Error('Practice text is too large.');
  question.answer=answer;if(feedback!==undefined)question.feedback=feedback;session.updatedAt=new Date().toISOString();
  this.db.prepare('UPDATE practice_sessions SET updated_at=?,content_json=? WHERE id=?').run(session.updatedAt,JSON.stringify(session),id);return session;
 }
 remove(id:string){return this.db.prepare('DELETE FROM practice_sessions WHERE id=?').run(id).changes>0;}
 review(id:string){const session=this.get(id);if(!session)throw new Error('Practice session not found.');return {answered:session.questions.filter(q=>q.answer.trim()).length,total:session.questions.length,
  observations:session.questions.map(q=>({id:q.id,question:q.text,hasAnswer:Boolean(q.answer.trim()),wordCount:q.answer.trim()?q.answer.trim().split(/\s+/).length:0,hasAiFeedback:Boolean(q.feedback),sourceAvailable:!q.projectId||Boolean(this.projects.get(q.projectId)?.enabled)}))};}
}
