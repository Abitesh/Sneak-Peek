import type Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { onSourceChange } from '../personalKnowledge/SourceChangeEpoch';

/** Completed retrieval only. No shared promises, answer text or provider calls. */
export class ProjectRetrievalCache<T> {
  private entries = new Map<string, {at: number; value: T}>();
  private unsubscribe: () => void;
  hits = 0;
  misses = 0;
  constructor(private db: Database.Database, private maxEntries = 64, private ttlMs = 120_000) {
    this.unsubscribe = onSourceChange(() => this.entries.clear());
  }
  dispose() {this.entries.clear(); this.unsubscribe();}
  isAvailable(ids: readonly string[]): boolean | undefined {
    try {
      const rows = this.db.prepare(`SELECT id,file_type FROM personal_files WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[];
      if(rows.length !== new Set(ids).size || rows.some(row=>row.file_type!=='project')) return false;
      if(!this.db.prepare("SELECT 1 FROM sqlite_master WHERE name='project_knowledge_sources'").get()) return true;
      const linked=this.db.prepare(`SELECT s.file_id,p.enabled,p.index_state FROM project_knowledge_sources s JOIN project_knowledge p ON p.id=s.project_id WHERE s.file_id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[];
      return ids.every(id=>!linked.some(row=>row.file_id===id)||linked.some(row=>row.file_id===id&&row.enabled&&row.index_state==='Ready'));
    } catch {return undefined;}
  }
  /** Fresh SQLite state, not a previously captured project selection. */
  key(ids: readonly string[], requestKey: unknown): string | undefined {
    if (!ids.length || ids.length > 64) return undefined;
    try {
      const files = this.db.prepare(`SELECT id,content_hash,updated_at,file_type FROM personal_files WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id`).all(...ids) as any[];
      if (files.length !== new Set(ids).size || files.some(file => file.file_type !== 'project')) return undefined;
      const hasProjects = this.db.prepare("SELECT 1 FROM sqlite_master WHERE name='project_knowledge_sources'").get();
      const availability = hasProjects ? this.db.prepare(`SELECT s.file_id,p.id,p.enabled,p.revision,p.index_state FROM project_knowledge_sources s JOIN project_knowledge p ON p.id=s.project_id WHERE s.file_id IN (${ids.map(() => '?').join(',')}) ORDER BY s.file_id,p.id`).all(...ids) as any[] : [];
      for (const id of ids) {
        const linked = availability.filter(row => row.file_id === id);
        if (linked.length && !linked.some(row => row.enabled && row.index_state === 'Ready')) return undefined;
      }
      const hasCanonical = this.db.prepare("SELECT 1 FROM sqlite_master WHERE name='rag_documents'").get();
      const revisions = hasCanonical ? this.db.prepare(`SELECT source_id,current_revision_id,deleted_at,content_hash FROM rag_documents WHERE source_type='personal' AND source_id IN (${ids.map(() => '?').join(',')}) ORDER BY source_id`).all(...ids) : [];
      return createHash('sha256').update(JSON.stringify([requestKey, files, availability, revisions])).digest('hex');
    } catch {return undefined;} // Incomplete startup inventories are never cached.
  }
  get(key: string | undefined): T | undefined {
    if (!key) return undefined;
    const entry = this.entries.get(key);
    if (entry && Date.now() - entry.at <= this.ttlMs) {
      this.hits++; this.entries.delete(key); this.entries.set(key, entry);
      return structuredClone(entry.value);
    }
    this.entries.delete(key); this.misses++; return undefined;
  }
  put(key: string, value: T) {
    this.entries.delete(key);
    this.entries.set(key, {at: Date.now(), value: structuredClone(value)});
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
  }
}
