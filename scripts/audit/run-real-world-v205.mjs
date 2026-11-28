// Explicit opt-in macOS acceptance. No installation, credentials or remote calls.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
if (process.platform !== 'darwin') throw new Error('macOS Seatbelt required; do not run unsandboxed');
const routingOnly = process.argv.includes('--quality-routing');
const quality = routingOnly || process.argv.includes('--quality');
const args = process.argv.slice(2).filter(arg => !['--quality', '--quality-routing'].includes(arg));
if (args.length && (args.length !== 2 || args[0] !== '--repo' || !path.isAbsolute(args[1]))) throw new Error('Usage: run-real-world-v205.mjs [--quality | --quality-routing] [--repo /absolute/build-root]');
const localOllama = true;
const root=args[1] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sneak-stabilization-'));
const q=JSON.stringify;
fs.writeFileSync(path.join(temp,'sandbox.sb'), `(version 1)
(allow default)
(deny network*)
(allow network* (local unix-socket) (remote unix-socket))
${localOllama ? '(allow network-outbound (remote ip "localhost:11436"))' : ''}
(deny file-read* (subpath ${q(os.homedir())}))
(allow file-read* (subpath ${q(root)}))
(allow file-read* (subpath ${q(fs.realpathSync(path.join(root,'node_modules')))}))
(deny file-read* (regex #"[.]env"))
(allow file-read-metadata)
(deny file-write*)
(allow file-write* (subpath "/private/tmp") (subpath "/tmp") (subpath "/private/var/folders") (subpath "/var/folders") (literal "/dev/null"))
(deny process-exec)
(allow process-exec (subpath ${q(fs.realpathSync(path.join(root,'node_modules/electron')))}))
`);
const env=Object.fromEntries(['PATH','HOME','USER','LOGNAME','SHELL','TMPDIR','LANG','LC_ALL','__CF_USER_TEXT_ENCODING','DISPLAY','XPC_FLAGS','XPC_SERVICE_NAME'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
env.SNEAK_PEEK_ACCEPTANCE_ROOT=temp;
if (quality) env.SNEAK_PEEK_QUALITY = routingOnly ? 'routing' : '1';
env.CHG21_LOCAL_OLLAMA=localOllama ? '1' : '0';
console.log(`Evidence directory: ${temp}`);
const log=fs.openSync(path.join(temp,'application.log'),'w');
const child=spawn('/usr/bin/sandbox-exec',['-f',path.join(temp,'sandbox.sb'),path.join(root,'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),path.join(root,'scripts/audit/real-world-v205.cjs')],{cwd:temp,env,stdio:['ignore',log,log]});
child.on('error',e=>{console.error(e);process.exitCode=1;});
child.on('exit',code=>{fs.closeSync(log);console.log(`Acceptance exit: ${code}`);process.exitCode=code??1;});
