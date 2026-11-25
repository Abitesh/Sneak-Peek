import { parseRepositorySources, implementationSignals } from './RepositoryEvidence';
/** Bounded, deterministic source map. Signals are attributed, not invented implementation facts. */
export function buildProjectKnowledgeOutline(input:{name:string;description?:string;stack?:string;contribution?:string;readme?:string}) {
 const text=String(input.readme ?? '');
 const paths=[...text.matchAll(/^## Source: (.+)$/gm)].map(m=>m[1]).slice(0,48);
 const section=(names:string)=>{const re=new RegExp('^#{1,4}\\s+(?:'+names+')\\s*[:\\r]?\\n([\\s\\S]*?)(?=^#{1,4}\\s|$(?![\\s\\S]))','gim');return [...text.matchAll(re)].map(m=>m[1].trim().slice(0,1600)).filter(Boolean).slice(0,3);};
 const sources=parseRepositorySources(text);
 const signals=implementationSignals(sources);
 const dependencySignals:Array<{source:string;names:string[]}>=[];
 for(const source of sources){
 const match=['',source.path,source.sha,source.text];
  if(/(?:^|\/)package\.json$/.test(match[1])){try{const pkg=JSON.parse(match[3]);const names=Object.keys({...pkg.dependencies,...pkg.devDependencies}).filter(n=>/^[\w@/.-]{1,90}$/.test(n)).slice(0,30);dependencySignals.push({source:match[1],names});}catch{/* Partial manifest is explicitly not interpreted. */}}
  if(/(?:^|\/)pom\.xml$/.test(match[1]))dependencySignals.push({source:match[1],names:[...match[3].matchAll(/<artifactId>([^<]+)<\/artifactId>/g)].map(m=>m[1]).slice(0,30)});
 }
 return {
  name:input.name,beginnerSummary:input.description||'Not supplied.',problem:section('Problem|Motivation|Purpose'),features:section('Features|Capabilities'),
  technology:{userSupplied:input.stack||'Not supplied.',manifestDependencies:dependencySignals},
  sourceCoverage:{categories:[...new Set(sources.map(source=>source.category))],files:sources.map(({text,...source})=>source),partial:sources.some(source=>source.truncated)||/^Import warning:/m.test(text)},
  implementationEvidence:signals,
  componentRelationships:signals.filter(signal=>signal.kind==='import'||signal.kind==='request'),
  architecture:section('Architecture|Design|Components'),flow:section('Flow|How it works|Implementation flow'),apisAndModules:paths.filter(p=>/api|controller|service|route/i.test(p)),
  database:paths.filter(p=>/schema|migration|database|model/i.test(p)),realtime:section('Real.time|WebSockets|Streaming'),
  specializedSystems:section('Routing|Caching|Spatial queries'),tradeoffs:section('Trade.offs|Decisions|Technology choices'),
  contribution:{statement:input.contribution||'Not supplied; repository ownership is not proof of contribution.',authority:'user-authored, requires the user to confirm accuracy'},
  challenges:section('Challenges|Limitations|Known issues'),
  likelyQuestions:[`What problem does ${input.name} solve?`,'Explain the implementation flow.','Which decisions are documented, and what alternatives are reasonable?','What did you personally implement?','How would you test failures and improve this project?'],
  evidenceLocations:paths,unknowns:['Undocumented implementation details, authorship, performance figures and decision rationales remain unverified.','A manifest dependency proves a declared dependency, not that a feature uses it.','README assertions may conflict with code; inspect the cited implementation before asserting details.'],
 };
}

/** Derived source summary, not a generated claim of complete repository coverage. */
export function deriveProjectMetadata(readme:string,description='') {
 const sources=parseRepositorySources(readme);
 const dependencies:string[]=[];
 for(const source of sources){
  if(/(?:^|\/)package\.json$/.test(source.path))try{const p=JSON.parse(source.text);dependencies.push(...Object.keys(p.dependencies??{}));}catch{}
  if(/(?:^|\/)pom\.xml$/.test(source.path))dependencies.push(...[...source.text.matchAll(/<artifactId>([^<]+)<\/artifactId>/g)].map(m=>m[1]));
  if(/requirements[^/]*\.txt$/.test(source.path))dependencies.push(...source.text.split('\n').map(l=>l.split(/[=<>!~]/)[0].trim()).filter(l=>/^[\w.-]+$/.test(l)));
 }
 const overview=sources.find(s=>/(?:^|\/)readme\.md$/i.test(s.path))?.text??readme;
 const paragraph=overview.split(/\n\s*\n/).map(p=>p.replace(/^#+.*$/gm,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim()).find(p=>p.length>50&&!/^```|^<|^\|/.test(p));
 return {description:description||paragraph?.slice(0,900)||'Saved project sources; review the implementation evidence map.',stack:[...new Set(dependencies)].slice(0,35).join(', ')};
}
