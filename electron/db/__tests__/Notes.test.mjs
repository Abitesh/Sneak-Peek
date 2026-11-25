import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd();
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sneak-notes-retirement-'));
process.env.NATIVELY_TEST_USERDATA=dir;
const {DatabaseManager}=require('../../../dist-electron/electron/db/DatabaseManager.js');
const manager=DatabaseManager.getInstance(),db=manager.getDb();
after(()=>{manager.close();fs.rmSync(dir,{recursive:true,force:true});});
test('fresh schema retires standalone notes without touching meeting or profile stores',()=>{
 assert.equal(db.pragma('user_version',{simple:true}),39);
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='notes'").get(),undefined);
 for(const name of ['meetings','transcripts','modes','profile_custom_notes','personal_files'])assert.ok(db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(name),`${name} preserved`);
});
test('upgrade removes saved standalone notes and preserves unrelated rows, idempotently',()=>{
 db.exec("CREATE TABLE notes(id TEXT PRIMARY KEY,title TEXT,content TEXT);INSERT INTO notes VALUES('old','Legacy note','retired text')");
 db.pragma('user_version = 38');
 const before=db.prepare('SELECT COUNT(*) AS n FROM meetings').get().n;
 manager.runMigrations();manager.runMigrations();
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='notes'").get(),undefined);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM meetings').get().n,before);
});
test('retired compatibility methods cannot recreate the note table',()=>{
 assert.deepEqual(manager.listNotes(),[]);assert.equal(manager.getNote('old'),null);
 assert.throws(()=>manager.createNote('New note'),/replaced/);assert.throws(()=>manager.updateNote('old','x','y'),/replaced/);assert.equal(manager.deleteNote('old'),false);
 assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='notes'").get(),undefined);
});
test('four-square launcher opens session controls rather than standalone notes',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/Launcher.tsx'),'utf8');
 assert.match(source,/data-testid="open-session-controls"/);assert.match(source,/<SessionControlsPage/);assert.doesNotMatch(source,/import NotesPage/);
});
