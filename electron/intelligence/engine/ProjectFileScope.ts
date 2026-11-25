/**
 * CHG-17: fail-closed project-file scoping using uploaded file metadata.
 *
 * The application has no stable project identity on its legacy personal_files
 * rows. We therefore accept only an explicit project phrase and a complete
 * normalized filename identity (minus known document-descriptor suffixes).
 * Prefix/shared-token matches are unsafe: "Linkship" is not "Linkship Legacy".
 * A future stable project ID may replace this conservative compatibility gate.
 */
export interface ProjectFileDescriptor {
  id?: string;
  fileName?: string;
  fileType?: string;
  projectName?: string;
  projectId?: string;
}

export interface ProjectFileScope {
  namedProject?: string;
  projectAvailable: boolean;
  /** Undefined means there was no explicit named project in this question. */
  selectedFileIds?: string[];
  missingNamedProject: boolean;
  /** An ambiguous same-project reference was not safely resolved. */
  unresolvedReference?: boolean;
  /** Focus resolved from the currently active resume, not from assistant facts. */
  profileProject?: boolean;
}

/** Resolve a retrieval hint only after the engine authorized exact current IDs. */
export function projectRetrievalQuery(question: string, projectName?: string, sourceIds?: readonly string[]): string {
  if (!projectName?.trim() || !sourceIds?.length) return question;
  if (/^(?:please\s+)?elaborate\b|^no[,.]?\s+i\s+(?:asked|meant)\b/i.test(question.trim())) return `Tell me about ${projectName.trim()}.`;
  const rewritten = question.replace(/\b(?:my|your|our|the|this|that)\s+(?:(?:current|previous|last|main|existing)\s+)?(?:project|repo|repository|codebase)\b/gi, () => projectName.trim());
  return words(rewritten).join(' ').includes(words(projectName).join(' ')) ? rewritten : `${rewritten} (project: ${projectName.trim()})`;
}

const NON_PROJECT_NAMES = new Set([
  'project', 'projects', 'the', 'this', 'that', 'my', 'your', 'our',
  'code', 'design', 'implementation', 'architecture', 'repository',
  'python', 'javascript', 'typescript', 'java', 'redis', 'sql', 'postgresql',
  'data', 'file', 'document', 'resume', 'api', 'database',
  'flow', 'complete', 'backend', 'frontend', 'its', 'their', 'implementation',
  'alternatives', 'alternative', 'others', 'other', 'options', 'option', 'frameworks',
  'yourself', 'myself', 'me', 'us', 'you', 'we', 'they', 'he', 'she', 'it',
]);
const DOCUMENT_SUFFIXES = new Set([
  'architecture', 'design', 'spec', 'specification', 'specifications',
  'notes', 'note', 'overview', 'documentation', 'document', 'readme',
  'implementation', 'project', 'codebase', 'repository', 'guide',
  'report', 'technical', 'details', 'detail', 'requirements', 'plan',
  'tests', 'test', 'pdf', 'doc', 'docx', 'txt', 'md',
]);
const QUERY_STOP_WORDS = new Set([
  'for', 'in', 'on', 'of', 'with', 'using', 'through', 'via', 'and',
  'where', 'when', 'why', 'how', 'what', 'was', 'is', 'did', 'does', 'do',
  'please', 'briefly', 'detail', 'details',
]);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function normalizedProjectIdentity(file: ProjectFileDescriptor): string[] {
  const raw = typeof file.projectName === 'string' && file.projectName.trim()
    ? file.projectName : String(file.fileName ?? '').replace(/\.[^.]+$/, '');
  const tokens = words(raw);
  if (!file.projectName) {
    // Real My Files uploads commonly include a two-word document descriptor,
    // e.g. "Linkship _Intermediate_Interview.pdf". Strip only this complete
    // descriptor; never strip generic "interview" or "answer" by itself,
    // because those could be part of a distinct project identity.
    if (tokens.length > 2 && tokens.slice(-2).join(' ') === 'intermediate interview') {
      tokens.splice(-2);
    }
    while (tokens.length > 1 && DOCUMENT_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  }
  return tokens;
}

function projectNameFromQuestion(question: string): string | undefined {
  // Named source after an explicit preposition, including lowercase project
  // identifiers. Stop at predicate words rather than accidentally including
  // "for caching" in the project name.
  const preposition = question.match(/\b(?:in|for|on|of)\s+(?:(?:the|my|your|our)\s+)?(?:(?:project|repo|repository|codebase)\s+)?([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})/i);
  const imperative = question.match(/\b(?:explain|describe|review|inspect)\s+([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})\s+(?:architecture|project|codebase|repository)\b/i);
  const subject = question.match(/\b(?:how|why|what)\s+(?:did|does|do|was|is|has|have)\s+([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})\s+(?:use|work|integrate|implement|choose|handle|support|store|scale|perform)\b/i);
  // Resolve an explicit named-project overview *before* incidental phrases
  // such as "in detail" or "for an interview". The previous preposition-first
  // order interpreted those modifiers as project names and could fall through
  // to a broad project retrieval instead of an exact file-ID allowlist.
  const overview = question.match(/\b(?:tell\s+(?:me|us)\s+about|describe|explain|elaborate|summari[sz]e|give\s+(?:me|us)\s+(?:an?\s+)?overview\s+of)\s+(?:(?:the|my|your|our)\s+)?(?:(?:project|repo|repository|codebase)\s+)?([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,3})(?:,?\s+(?:please|briefly|in\s+detail|for\s+(?:me|an?\s+interview)))?[.!?]?\s*$/i);
  // In "Why did you use Redis in Linkship?", the subject is "you", not a
  // project name. Fall back to the explicit "in Linkship" source instead.
  const subjectName = subject?.[1];
  const validSubject = subjectName && words(subjectName).every((token) => !NON_PROJECT_NAMES.has(token))
    ? subjectName : undefined;
  const extracted = overview?.[1] ?? imperative?.[1] ?? validSubject ?? preposition?.[1];
  if (!extracted) return undefined;
  const tokens = words(extracted);
  // Remove a syntactically trailing modifier and filename-style document label.
  while (tokens.length > 1 && (DOCUMENT_SUFFIXES.has(tokens[tokens.length - 1]) || QUERY_STOP_WORDS.has(tokens[tokens.length - 1]))) tokens.pop();
  const bounded = tokens.slice(0, tokens.findIndex((token) => QUERY_STOP_WORDS.has(token)) < 0
    ? tokens.length : tokens.findIndex((token) => QUERY_STOP_WORDS.has(token)));
  return bounded.length > 0 && bounded.every((token) => !NON_PROJECT_NAMES.has(token))
    ? bounded.join(' ') : undefined;
}

export function resolveProjectFileScope(question: string, allFiles: readonly ProjectFileDescriptor[]): ProjectFileScope {
  const projects = allFiles.filter((file) => file.fileType === 'project' && typeof file.id === 'string' && Boolean(file.id));
  const name = projectNameFromQuestion(question);
  if (!name) return { projectAvailable: projects.length > 0, missingNamedProject: false };
  const target = words(name);
  const stableProjects = new Set(projects.filter(file => words(file.projectName ?? '').join(' ') === target.join(' ')).map(file=>file.projectId).filter(Boolean));
  if (stableProjects.size > 1) return { namedProject:name,projectAvailable:false,selectedFileIds:[],missingNamedProject:true,unresolvedReference:true };
  const selectedFileIds = [...new Set(projects.filter((file) => {
    const identity = normalizedProjectIdentity(file);
    return identity.length === target.length && identity.every((token, i) => token === target[i]);
  }).map((file) => String(file.id)))];
  return {
    namedProject: name,
    projectAvailable: selectedFileIds.length > 0,
    selectedFileIds,
    missingNamedProject: selectedFileIds.length === 0,
  };
}


/** Only completed, same-source Q/A may supply a project identity to a follow-up. */
export interface ProjectScopeConversationTurn {
  id: string;
  role: string;
  text: string;
  finalized?: boolean;
  generationStatus?: string;
  source?: string;
  requestSequence?: number;
  metadata?: Readonly<Record<string, unknown>>;
}

function referencesOnePreviousProject(question: string): boolean {
  // Deliberately singular: broad questions about "my projects" should retain
  // their existing personal-history behavior rather than inherit one file.
  return /\b(?:my|your|our|the|this|that)\s+(?:(?:current|previous|last|main|existing)\s+)?(?:project|repo|repository|codebase)\b/i.test(question);
}

/** Referential syntax only; a completed, authorized project is still required. */
export function isProjectFollowupQuestion(question: string): boolean {
  return referencesOnePreviousProject(question)
    || /^(?:explain (?:the (?:complete |implementation |request )?flow|(?:its|the) (?:backend|frontend|architecture)|it|that|them)|how (?:does|did) (?:it|that|its (?:backend|frontend|API|database)) (?:work|communicate)|why (?:did you choose it|not (?:other frameworks|others|alternatives))|what (?:about (?:the )?database|alternatives(?: did you consider)?|was your contribution)|how did you implement that)[?.!\s]*$/i.test(question.trim())
    || /\b(?:why\s+(?:did|do)\s+(?:you|we)\s+(?:use|choose|pick)|elaborate|explain\s+(?:it|that)|no[,.]?\s+(?:i|we)\s+(?:meant|asked))\b/i.test(question);
}

/**
 * Bind a singular project follow-up to the *immediately preceding completed*
 * conversation exchange, then re-resolve it from the current authorized files.
 * Previous turns and IDs are retrieval HINTS, never authorization. Never turn
 * an unresolved "your project" into an unrestricted search of every project.
 */
export function resolveProjectFileScopeForTurn(
  question: string,
  allFiles: readonly ProjectFileDescriptor[],
  turns: readonly ProjectScopeConversationTurn[],
  currentTurnId: string,
  findProjectFilesMentioning?: (name: string) => readonly string[],
  activeProfileProjectNames: readonly string[] = [],
): ProjectFileScope {
  // Registered identities may contain generic technical words (e.g. "API").
  // Match the complete saved name/alias first; heuristics for unknown names must
  // not reject those identities or let presentation suffixes swallow the name.
  const normalizedQuestion=' '+words(question).join(' ')+' ';
  const namedManaged=allFiles.filter(file=>file.projectId&&file.projectName&&file.fileType==='project'
    && normalizedProjectIdentity(file).some(token=>token.length>=3&&!NON_PROJECT_NAMES.has(token)&&!QUERY_STOP_WORDS.has(token))
    && normalizedQuestion.includes(' '+normalizedProjectIdentity(file).join(' ')+' '));
  if(/\b(?:project|repo|repository|codebase|explain|describe|elaborate)\b/i.test(question)&&namedManaged.length){
    const identities=new Set(namedManaged.map(file=>file.projectId));
    if(identities.size===1){
      const projectId=namedManaged[0].projectId;
      const namedProject=namedManaged.sort((a,b)=>normalizedProjectIdentity(b).length-normalizedProjectIdentity(a).length)[0].projectName!;
      return {namedProject,projectAvailable:true,missingNamedProject:false,selectedFileIds:[...new Set(allFiles.filter(file=>file.projectId===projectId&&file.fileType==='project').map(file=>String(file.id)).filter(Boolean))]};
    }
    if(!/\b(?:projects|repositories)\b/i.test(question))return {projectAvailable:false,missingNamedProject:false,unresolvedReference:true,selectedFileIds:[]};
  }
  const direct = resolveProjectFileScope(question, allFiles);
  if (direct.namedProject && direct.missingNamedProject && !direct.unresolvedReference && /\b(?:project|repo|repository|codebase)\b/i.test(question)) {
    const target = words(direct.namedProject).join(' ');
    const managed = allFiles.filter(file=>file.projectId&&file.projectName&&normalizedProjectIdentity(file).join(' ').startsWith(target+' '));
    if(new Set(managed.map(file=>file.projectId)).size===1) {
      const identity=normalizedProjectIdentity(managed[0]).join(' ');
      return resolveProjectFileScope(`Explain ${identity} project`,allFiles);
    }
  }

  if (direct.unresolvedReference || direct.namedProject && !direct.missingNamedProject) return direct;
  const contextual = isProjectFollowupQuestion(question);
  if (!contextual) return direct;

  const unresolved: ProjectFileScope = {
    projectAvailable: false,
    selectedFileIds: [],
    missingNamedProject: true,
    unresolvedReference: true,
  };
  const currentIndex = turns.findIndex((turn) => turn.id === currentTurnId);
  if (currentIndex < 2) return unresolved;
  const user = turns[currentIndex - 2];
  const assistant = turns[currentIndex - 1];
  if (user.role !== 'user' || assistant.role !== 'assistant'
    || user.generationStatus !== 'completed'
    || assistant.generationStatus !== 'completed'
    || user.finalized === false || assistant.finalized === false
    || (user.source !== 'manual' && user.source !== 'meeting')
    || assistant.source !== user.source
    || (user.requestSequence !== undefined || assistant.requestSequence !== undefined)
      && user.requestSequence !== assistant.requestSequence) {
    return unresolved;
  }

  const projects = allFiles.filter(file => file.fileType === 'project' && file.id);
  const profileNames = activeProfileProjectNames.map(name => words(name).join(' ')).filter(Boolean);
  const identities = [...new Set([...projects.map(file => normalizedProjectIdentity(file).join(' ')), ...profileNames])];
  const resolveIdentity = (name: string): ProjectFileScope => {
    const exact=projects.filter(file=>normalizedProjectIdentity(file).join(' ')===name);
    const stableIds=new Set(exact.map(file=>file.projectId).filter(Boolean));
    if(stableIds.size>1)return unresolved;
    if(exact.length){const stableId=exact.find(file=>file.projectId)?.projectId;
      return {namedProject:name,projectAvailable:true,missingNamedProject:false,selectedFileIds:[...new Set(projects.filter(file=>stableId?file.projectId===stableId:normalizedProjectIdentity(file).join(' ')===name).map(file=>String(file.id)))]};}
    const match = resolveProjectFileScope('Explain ' + name + ' project', allFiles);
    return !match.projectAvailable && profileNames.includes(name)
      ? { namedProject: name, projectAvailable: false, selectedFileIds: [], missingNamedProject: false, profileProject: true } : match;
  };
  // Completed conversation supplies names only. The current catalog supplies
  // exact source IDs, and the planner still decides whether they are permitted.
  const mentioned = (text: string) => identities.filter(name =>
    (' ' + words(text).join(' ') + ' ').includes(' ' + name + ' '));
  const fromContentCatalog = (name: string): ProjectFileScope | undefined => {
    if (identities.some(identity => identity.startsWith(name + ' '))) return undefined;
    const permitted = new Set(projects.map(file => file.id));
    const ids = [...new Set(findProjectFilesMentioning?.(name) ?? [])].filter(id => permitted.has(id));
    // A generic filename can contain the named project. This is an exact local
    // existence hint, not evidence or authority. Multiple files remain ambiguous.
    return ids.length === 1 ? { namedProject: name, projectAvailable: true,
      selectedFileIds: ids, missingNamedProject: false } : undefined;
  };
  if (direct.namedProject) {
    const target = words(direct.namedProject).join(' ');
    const matches = identities.filter(name => name === target || name.startsWith(target + ' '));
    if (matches.length === 0 && turns.slice(0, currentIndex).some(turn =>
      turn.generationStatus === 'completed' && turn.finalized !== false && turn.source === user.source
      && (' ' + words(turn.text).join(' ') + ' ').includes(' ' + target + ' '))) {
      const catalog = fromContentCatalog(target);
      if (catalog) return catalog;
    }
    if (matches.length !== 1 || !turns.slice(0, currentIndex).some(turn =>
      turn.generationStatus === 'completed' && turn.finalized !== false && turn.source === user.source && mentioned(turn.text).includes(matches[0]))) return direct;
    return resolveIdentity(matches[0]);
  }
  for (let i = currentIndex - 2; i >= 0; i -= 2) {
    const priorUser = turns[i];
    const priorAnswer = turns[i + 1];
    if (priorUser.role !== 'user' || priorAnswer?.role !== 'assistant'
      || priorUser.generationStatus !== 'completed' || priorAnswer.generationStatus !== 'completed'
      || priorUser.source !== user.source || priorAnswer.source !== user.source
      || priorUser.finalized === false || priorAnswer.finalized === false
      || priorUser.requestSequence !== priorAnswer.requestSequence) return unresolved;
    // Main-process completed turns carry only the resolved name, never facts or
    // an authorization grant. Refresh it from the current catalogue each time,
    // so compacted context can retain identity without reviving a revoked source.
    const focus = typeof priorUser.metadata?.projectFocusName === 'string'
      ? words(priorUser.metadata.projectFocusName).join(' ') : undefined;
    if (focus && identities.includes(focus)) return resolveIdentity(focus);
    const previous = resolveProjectFileScope(priorUser.text, allFiles);
    if (previous.namedProject && !previous.missingNamedProject) return previous;
    if (previous.namedProject && profileNames.includes(previous.namedProject)) return resolveIdentity(previous.namedProject);
    if (previous.namedProject) {
      const expanded = identities.filter(name => name.startsWith(previous.namedProject + ' '));
      if (expanded.length === 1 && turns.slice(0, currentIndex).some(turn =>
        turn.source === user.source && turn.generationStatus === 'completed' && mentioned(turn.text).includes(expanded[0]))) return resolveIdentity(expanded[0]);
    }
    if (previous.namedProject && /\b(?:elaborate|project|architecture)\b/i.test(priorUser.text)) {
      const catalog = fromContentCatalog(previous.namedProject);
      if (catalog) return catalog;
    }
    const names = mentioned(priorAnswer.text);
    if (names.length === 1) return resolveIdentity(names[0]);
    if (names.length > 1) return unresolved;
    // A standalone topic switch ends the focus chain.
    if (!referencesOnePreviousProject(priorUser.text)
      && !/\b(?:elaborate|why did you use|why did you choose|no.*asked)\b/i.test(priorUser.text)) return unresolved;
  }
  return unresolved;
}
