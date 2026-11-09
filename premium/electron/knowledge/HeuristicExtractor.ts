/**
 * Document-only fallback for times when an optional extraction model is down.
 * It extracts observed fields conservatively and never supplies invented ones.
 */
import { categorizeFlatSkills, coerceSkills, flattenSkills } from './skillsUtil';

const sectionHeaders: Record<string, string> = {
  'summary': 'summary', 'professional summary': 'summary', 'objective': 'summary',
  'skills': 'skills', 'core skills': 'skills', 'technical skills': 'skills', 'technical proficiencies': 'skills',
  'experience': 'experience', 'work experience': 'experience', 'professional experience': 'experience',
  'clinical experience': 'experience', 'employment history': 'experience',
  'projects': 'projects', 'selected projects': 'projects', 'technical projects': 'projects',
  'education': 'education', 'academic background': 'education',
};
const discardRule = /^[\s\-=─━_]{4,}$/;
const clean = (text: string): string => String(text ?? '').trim().replace(/^\*+|\*+$/g, '').trim();
const isContact = (s: string) => /\b(?:https?:\/\/|github\.com|linkedin\.com|\S+@\S+|www\.)/i.test(s);
const isDate = (s: string) => /\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i.test(s);
const roleNoun = /\b(?:engineer(?:ing)?|developer|designer|analyst|architect|specialist|consultant|manager|director|head|founder|intern|nurse|coordinator|vp|cto|ceo|lead|scientist|officer)\b/i;
const degree = /\b(?:b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|bachelor|master|ph\.?d\.?|associate|mba|bsn|adn)\b/i;
const sectionName = (s: string): string | null => sectionHeaders[clean(s).toLowerCase().replace(/[:：]$/, '')] ?? null;

function sections(text: string): { lines: string[]; blocks: Record<string, string[]> } {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n').map(s => s.trim());
  const blocks: Record<string, string[]> = {};
  let active = '';
  for (const line of lines) {
    const section = sectionName(line);
    if (section) { active = section; blocks[active] ??= []; continue; }
    if (active && line && !discardRule.test(line)) blocks[active].push(line);
  }
  return { lines, blocks };
}

function splitSkills(line: string): string[] {
  // Split commas only outside parentheses (e.g., SQL (PostgreSQL, MySQL)).
  const prepared = line.replace(/[▪•]/g, ',').replace(/\s+·\s+/g, ',');
  const pieces: string[] = [];
  let depth = 0, current = '';
  for (const c of prepared) {
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    if ((c === ',' || c === ';') && depth === 0) { pieces.push(current); current = ''; }
    else current += c;
  }
  pieces.push(current);
  return pieces.map(s => clean(s).replace(/^[*\-]\s*/, '').trim()).filter(Boolean)
    .map(s => s.replace(/^((?:languages?|frameworks?|databases?|cloud|devops|ai\/ml|infrastructure|tools?)\s*:?)\s+/i, '').trim())
    .map(s => s.includes('(') && (s.length > 55 || (s.match(/,/g) || []).length > 1) ? s.slice(0, s.indexOf('(')).trim() : s)
    .filter(s => s && !/^(?:languages?|frameworks?|databases?|cloud|devops|ai\/ml|infrastructure|tools?)$/i.test(s));
}

function selectName(lines: string[], email: string): string {
  for (const raw of lines.slice(0, 18)) {
    const line = clean(raw).replace(/,\s*(?:RN|BSN|CCRN|MBA|PMP|MD|PhD)(?:\s*,\s*(?:RN|BSN|CCRN|MBA|PMP|MD|PhD))*\s*$/i, '');
    if (!line || isContact(line) || sectionName(line) || discardRule.test(line) || /\d/.test(line) || line.includes('|')) continue;
    if (/^(?:professional|objective|career|resume|curriculum|summary|software engineer|senior software engineer)\b/i.test(line) && line.split(/\s+/).length > 2) continue;
    if (/^(?:RESUME|SUMMARY|SKILLS|EXPERIENCE)$/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && line.length <= 65 && words.every(w => /^[A-Z][\p{L}'".-]*$/u.test(w) || /^[A-Z]{2,}$/u.test(w))) return line;
  }
  if (email) {
    return email.split('@')[0].split(/[._-]/).filter(x => x && !/^(?:email|contact|work)$/i.test(x)).slice(0, 3).map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
  }
  return '';
}

function parseDatePair(line: string): { start_date: string | null; end_date: string | null } {
  const months: Record<string, string> = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const matches: string[] = [];
  const re = /(?:\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}|\b\d{1,2}\/\d{4}|\b\d{4}-\d{2}|\b(?:19|20)\d{2}|\bpresent\b|\bcurrent\b)/gi;
  for (const m of line.matchAll(re)) {
    const s = m[0].toLowerCase();
    if (s === 'present' || s === 'current') { matches.push('present'); continue; }
    const ym = /^(\d{4})-(\d{2})$/.exec(s);
    if (ym) { matches.push(`${ym[1]}-${ym[2]}`); continue; }
    const md = /^(\d{1,2})\/(\d{4})$/.exec(s);
    if (md) { matches.push(`${md[2]}-${md[1].padStart(2,'0')}`); continue; }
    const month = /^(\w+)\s+(\d{4})$/.exec(s);
    if (month) { matches.push(`${month[2]}-${months[month[1].slice(0,3)]}`); continue; }
    if (/^\d{4}$/.test(s)) matches.push(`${s}-01`);
  }
  return { start_date: matches[0] || null, end_date: matches[1] && matches[1] !== 'present' ? matches[1] : null };
}

function parseExperience(lines: string[]): any[] {
  const entries: any[] = [];
  let current: any = null;
  const save = () => { if (current && (current.role || current.company) && (current.role || current.bullets.length)) entries.push(current); current = null; };
  const start = (company: string, role: string, dateText: string) => {
    save(); const dates = parseDatePair(dateText);
    current = { company: clean(company), role: clean(role), ...dates, bullets: [] as string[] };
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || discardRule.test(line)) continue;
    if (/^[-•*]\s+/.test(line)) { if (current) current.bullets.push(line.replace(/^[-•*]\s+/, '')); continue; }
    const split = line.split(/\s+[—–]\s+/);
    const at = /^(.+?)\s+at\s+(.+?)(?:\s*\(([^)]*)\))?$/i.exec(line);
    if (at && roleNoun.test(at[1])) { start(at[2], at[1], at[3] || line); continue; }
    if (split.length >= 2 && roleNoun.test(line)) {
      const [a,b] = split;
      if (roleNoun.test(b) && !/\b[A-Z]{2}\b$/.test(b)) { start(a, b, line + ' ' + (lines[i+1] || '')); continue; }
      if (roleNoun.test(a) && !roleNoun.test(b)) { start(b, a, line + ' ' + (lines[i+1] || '')); continue; }
    }
    if (isDate(line) && current) {
      const dates = parseDatePair(line);
      if (dates.start_date) { current.start_date ??= dates.start_date; current.end_date ??= dates.end_date; }
      continue;
    }
    if (roleNoun.test(line) && !isContact(line) && !/^location:/i.test(line)) {
      const title = line.replace(/\s+(?:\d{1,2}\/\d{4}|\d{4}-\d{2}).*$/, '').trim();
      if (current && !current.role) { current.role = title; const d = parseDatePair(line); current.start_date ??= d.start_date; continue; }
      if (current && current.bullets.length) save();
      start('', title, line);
      continue;
    }
    if (current && !current.company && !/^(?:[A-Z][a-z]+,\s*[A-Z]{2}|\d+\s)/.test(line) && !isContact(line) && line.length < 110) {
      current.company = line.split(/\s+[—–]\s+/)[0];
    } else if (!current && line.length < 100 && !isContact(line) && !/^[A-Z][a-z]+,\s*[A-Z]{2}/.test(line)) {
      // Company-first listing; next line may contain the role and dates.
      current = { company: line.split(/\s+[—–]\s+/)[0], role: '', start_date:null, end_date:null, bullets:[] };
    }
  }
  save();
  return entries.slice(0, 30);
}

function parseProjects(lines: string[]): any[] {
  const result: any[] = [];
  for (const raw of lines) {
    const line = clean(raw).replace(/^[-•]\s+/, '');
    if (!line || discardRule.test(line)) continue;
    if (/^(?:https?:\/\/|(?:www\.)?(?:github|gitlab)\.com\/)/i.test(line)) {
      if (result.length) result[result.length - 1].url = line.split(/\s+\|\s+/)[0];
      continue;
    }
    const colon = /^([^:]{2,95}):\s*(.+)$/.exec(line);
    const name = colon ? colon[1].trim() : line.split(/\s{3,}|\s+[—–]\s+/)[0].trim();
    if (!name || name.length > 95 || /^\d/.test(name) || isContact(name) || /^(?:technologies|built with|stack)$/i.test(name)) continue;
    const columnMetadata = !colon && /\s{3,}/.test(line) && /^[A-Za-z0-9][\w-]{1,50}$/.test(name);
    if (colon || columnMetadata || (/^[\w][\w\s.()\-]{1,75}$/.test(name) && !/^[a-z]/.test(name) && result.length===0)) {
      result.push({ name, description: colon ? colon[2] : '', technologies: [], highlights:[], url:'' });
    } else if (result.length) result[result.length - 1].description += ` ${line}`;
  }
  return result.slice(0, 25);
}

function parseEducation(lines: string[]): any[] {
  const rows: any[] = [];
  let entry: any = { institution:'', degree:'', field:'', gpa:'' };
  const flush = () => { if (entry.degree || entry.institution) rows.push(entry); entry = { institution:'', degree:'', field:'', gpa:'' }; };
  for (const line of lines) {
    if (!line || discardRule.test(line)) continue;
    if (/^GPA\s*:/i.test(line)) { entry.gpa = line.replace(/^GPA\s*:/i,'').trim(); continue; }
    if (/thesis/i.test(line) || (/^(?:\w+\s+)?(?:19|20)\d{2}\b/.test(line) && !degree.test(line))) continue;
    if (degree.test(line) && !/\b(?:[A-Z][a-z]+),\s*[A-Z]{2}$/.test(line)) {
      if (entry.degree) flush();
      entry.degree = line.split(/\s{3,}/)[0].trim();
      const field = /\b(?:in|of)\s+([^,\d]+?)(?:,\s*with\s+honors|\s*\(|$)/i.exec(entry.degree);
      entry.field = field ? field[1].trim() : '';
    } else if (!entry.institution && !isContact(line) && !isDate(line)) {
      entry.institution = line;
    }
  }
  flush();
  return rows.filter(e=>e.degree || e.institution).slice(0, 15);
}

export function heuristicResumeExtract(text: string): any {
  const { lines, blocks } = sections(text);
  const email = /[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i.exec(text)?.[0] || '';
  const github = /(?:https?:\/\/)?github\.com\/[^\s|,]+/i.exec(text)?.[0] || '';
  const linkedin = /(?:https?:\/\/)?linkedin\.com\/[^\s|,]+/i.exec(text)?.[0] || '';
  const name = selectName(lines, email);
  const skillsFlat: string[] = [];
  for (const row of blocks.skills ?? []) {
    const bare = row.replace(/^(?:languages?|frameworks?|databases?|cloud|devops|ai\/ml|infrastructure|tools?)\s*:\s*/i,'');
    for (const skill of splitSkills(bare)) {
      if (!skillsFlat.some(v=>v.toLowerCase()===skill.toLowerCase())) skillsFlat.push(skill);
    }
  }
  const skills = categorizeFlatSkills(skillsFlat);
  const experience = parseExperience(blocks.experience ?? []);
  const projects = parseProjects(blocks.projects ?? []);
  const education = parseEducation(blocks.education ?? []);
  return {
    identity: { name, email, phone: /\+?\d[\d ()-]{7,}/.exec(text)?.[0] || '', location:'', linkedin, github, website:'', summary:'' },
    summary: (blocks.summary ?? []).slice(0,3).join(' ').slice(0,600),
    skills, skillsFlat: flattenSkills(skills), skills_flat: flattenSkills(skills),
    experience, experienceCount:experience.length, projects, education, educationCount:education.length,
    achievements: [], certifications: [], leadership: [], _schema_version:2, _extraction_mode:'heuristic',
  };
}

function extractBullets(sectionLines: string[]): string[] { return sectionLines.filter(x=>/^[-•*]\s+/.test(x)).map(x=>x.replace(/^[-•*]\s+/,'').trim()); }
export function heuristicJDExtract(text: string): any {
  const lines = String(text ?? '').split(/\r?\n/).map(clean).filter(Boolean);
  const titleWords = /\b(?:analyst|engineer|developer|designer|coordinator|manager|director|scientist|architect|nurse|intern|consultant|specialist)\b/i;
  let title = '', company = '', location='';
  for (const line of lines.slice(0,12)) {
    const companyMatch = /^(?:\*\*)?company\s*:\s*(.+)$/i.exec(line);
    if (companyMatch) { company=clean(companyMatch[1]); continue; }
    const locationMatch=/^(?:\*\*)?location\s*:\s*(.+)$/i.exec(line);
    if (locationMatch) { location=clean(locationMatch[1]); continue; }
    const labelled = /^(?:job\s+(?:description|title)|position|title)\s*:\s*(.+)$/i.exec(line);
    if (labelled) { title=clean(labelled[1]); continue; }
    const parts = line.split(/\s+[—–]\s+/);
    if (parts.length===2 && titleWords.test(parts[1])) { company ||=parts[0]; title ||=parts[1]; continue; }
    if (titleWords.test(line) && !title) { title=line; continue; }
    if (!company && !title && line.length<100 && !/requirements|about|responsibilities/i.test(line)) company=line;
  }
  const grouped: Record<string,string[]> = {};
  let section='';
  for (const line of lines) {
    const header = line.toLowerCase().replace(/[:：]$/,'');
    if (/^(?:requirements|qualifications|what you bring|must have|required skills)$/.test(header)) { section='requirements'; continue; }
    if (/^(?:nice to have|preferred qualifications)$/.test(header)) { section='nice_to_haves'; continue; }
    if (/^(?:responsibilities|what you will do|what you'll do)$/.test(header)) { section='responsibilities'; continue; }
    if (/^[-•*]\s+/.test(line) && section) (grouped[section] ??= []).push(line.replace(/^[-•*]\s+/,''));
  }
  const known = ['Python','TypeScript','JavaScript','Go','SQL','PostgreSQL','MySQL','Redis','Kubernetes','Docker','Terraform','AWS','React','Kafka','Snowflake'];
  const technologies = known.filter(skill => new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(text));
  const min = /\b(\d+)\+?\s*(?:years|yrs)\b/i.exec(text);
  return { title:title||'Unknown Role', company, location, description_summary:'', level:/\bsenior|director|head|staff\b/i.test(title)?'senior':'mid', employment_type:/\bcontract\b/i.test(text)?'contract':'full_time', min_years_experience:min?Number(min[1]):0,
    compensation_hint:'', requirements:grouped.requirements??[], nice_to_haves:grouped.nice_to_haves??[], responsibilities:grouped.responsibilities??[], qualifications:[], technologies, keywords:[...new Set([...technologies,...title.split(/\s+/).filter(x=>x.length>4)])], _extraction_mode:'heuristic' };
}
