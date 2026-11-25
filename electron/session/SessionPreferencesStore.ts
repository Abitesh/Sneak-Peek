import type Database from 'better-sqlite3';
import { DatabaseManager } from '../db/DatabaseManager';
import { normalizeSessionPreferences, type SessionPreferences } from './SessionPreferences';
export class SessionPreferencesStore {
 constructor(private db:Database.Database){db.exec("CREATE TABLE IF NOT EXISTS session_preferences(id INTEGER PRIMARY KEY CHECK(id=1),value_json TEXT NOT NULL)");}
 get():SessionPreferences {const row=this.db.prepare('SELECT value_json FROM session_preferences WHERE id=1').get() as {value_json:string}|undefined;return normalizeSessionPreferences(row?JSON.parse(row.value_json):{});}
 save(value:unknown):SessionPreferences {const p=normalizeSessionPreferences(value);this.db.prepare('INSERT INTO session_preferences VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value_json=excluded.value_json').run(JSON.stringify(p));return p;}
}
export function sessionPreferencesStore(){const db=DatabaseManager.getInstance().getDb();if(!db)throw new Error('Session settings database unavailable.');return new SessionPreferencesStore(db);}
