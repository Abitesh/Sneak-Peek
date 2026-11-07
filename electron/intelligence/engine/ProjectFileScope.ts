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
}

export interface ProjectFileScope {
  namedProject?: string;
  projectAvailable: boolean;
  /** Undefined means there was no explicit named project in this question. */
  selectedFileIds?: string[];
  missingNamedProject: boolean;
  /** An ambiguous same-project reference was not safely resolved. */
  unresolvedReference?: boolean;
}

/** Resolve a retrieval hint only after the engine authorized exact current IDs. */
export function projectRetrievalQuery(question: string, projectName?: string, sourceIds?: readonly string[]): string {
  if (!projectName?.trim() || !sourceIds?.length) return question;
  return question.replace(/\b(?:my|your|our|the|this|that)\s+(?:(?:current|previous|last|main|existing)\s+)?(?:project|repo|repository|codebase)\b/gi, () => projectName.trim());
}

const NON_PROJECT_NAMES = new Set([
  'project', 'projects', 'the', 'this', 'that', 'my', 'your', 'our',
  'code', 'design', 'implementation', 'architecture', 'repository',
  'python', 'javascript', 'typescript', 'java', 'redis', 'sql', 'postgresql',
  'data', 'file', 'document', 'resume', 'api', 'database',
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
]);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function normalizedProjectIdentity(file: ProjectFileDescriptor): string[] {
  const raw = typeof file.projectName === 'string' && file.projectName.trim()
    ? file.projectName : String(file.fileName ?? '').replace(/\.[^.]+$/, '');
  const tokens = words(raw);
  if (!file.projectName) {
    while (tokens.length > 1 && DOCUMENT_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  }
  return tokens;
}

function projectNameFromQuestion(question: string): string | undefined {
  // Named source after an explicit preposition, including lowercase project
  // identifiers. Stop at predicate words rather than accidentally including
  // "for caching" in the project name.
  const preposition = question.match(/\b(?:in|for|on|of)\s+(?:the\s+)?([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})/i);
  const imperative = question.match(/\b(?:explain|describe|review|inspect)\s+([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})\s+(?:architecture|project|codebase|repository)\b/i);
  const subject = question.match(/\b(?:how|why|what)\s+(?:did|does|do|was|is|has|have)\s+([a-z][a-z0-9_-]{2,}(?:\s+[a-z][a-z0-9_-]{2,}){0,2})\s+(?:use|work|integrate|implement|choose|handle|support|store|scale|perform)\b/i);
  const extracted = preposition?.[1] ?? imperative?.[1] ?? subject?.[1];
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
  const selectedFileIds = projects.filter((file) => {
    const identity = normalizedProjectIdentity(file);
    return identity.length === target.length && identity.every((token, i) => token === target[i]);
  }).map((file) => String(file.id));
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
}

function referencesOnePreviousProject(question: string): boolean {
  // Deliberately singular: broad questions about "my projects" should retain
  // their existing personal-history behavior rather than inherit one file.
  return /\b(?:my|your|our|the|this|that)\s+(?:(?:current|previous|last|main|existing)\s+)?(?:project|repo|repository|codebase)\b/i.test(question);
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
): ProjectFileScope {
  const direct = resolveProjectFileScope(question, allFiles);
  if (direct.namedProject || !referencesOnePreviousProject(question)) return direct;

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

  const previous = resolveProjectFileScope(user.text, allFiles);
  // A now-deleted/retired file or an ambiguous previous question cannot grant
  // broad access. A named-but-missing project returns a zero-ID allowlist.
  if (!previous.namedProject) return unresolved;
  return previous;
}
