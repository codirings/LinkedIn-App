// Client-side job search and filtering. Every word in the query must match somewhere on the
// job (AND across words, OR across fields); title matches rank highest.

export const JOB_FILTERS = ['All', 'Remote', 'Hybrid', 'On-site', 'Saved', 'Applied', 'Posted by me'] as const;
export type JobFilter = (typeof JOB_FILTERS)[number];

export type SearchableJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  skills: string[];
  requirements: string[];
  desc: string;
  status: string;
  mine: boolean;
  saved: boolean;
  ts: number;
};

export type SearchOptions = {
  query?: string;
  filter?: JobFilter | string;
  skills?: string[];
  appliedIds?: Set<string>;
};

export const normalize = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const tokenize = (query: string): string[] => normalize(query).split(/[\s,]+/).filter(Boolean);

// Field weights: a hit in the title is worth more than one in the description.
const FIELD_WEIGHTS: Array<[keyof FieldText, number]> = [
  ['title', 5],
  ['company', 4],
  ['skills', 3],
  ['location', 2],
  ['mode', 2],
  ['requirements', 1],
  ['desc', 1],
];

type FieldText = {title: string; company: string; skills: string; location: string; mode: string; requirements: string; desc: string};

function fieldText(job: SearchableJob): FieldText {
  return {
    title: normalize(job.title),
    company: normalize(job.company),
    skills: normalize(job.skills.join(' ')),
    location: normalize(job.location),
    mode: normalize(job.mode),
    requirements: normalize(job.requirements.join(' ')),
    desc: normalize(job.desc),
  };
}

const startsAWord = (text: string, token: string) => text.split(/[\s,/&()-]+/).some((word) => word.startsWith(token));

// Returns -1 when some query word matches nothing on the job.
export function scoreJob(job: SearchableJob, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;
  const text = fieldText(job);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const [field, weight] of FIELD_WEIGHTS) {
      const value = text[field];
      if (!value.includes(token)) continue;
      best = Math.max(best, weight + (startsAWord(value, token) ? 1 : 0));
    }
    if (best === 0) return -1;
    total += best;
  }
  if (text.title === normalize(query)) total += 10;
  return total;
}

export function countSkillMatches(job: SearchableJob, userSkills: Set<string>): number {
  return job.skills.reduce((n, skill) => (userSkills.has(normalize(skill)) ? n + 1 : n), 0);
}

export function passesFilter(job: SearchableJob, filter: string, appliedIds: Set<string>): boolean {
  switch (filter) {
    case 'Remote':
    case 'Hybrid':
    case 'On-site':
      return job.mode === filter;
    case 'Saved':
      return job.saved;
    case 'Applied':
      return appliedIds.has(job.id);
    case 'Posted by me':
      return job.mine;
    default:
      return true;
  }
}

// Open listings for everyone; closed listings only where the viewer has a stake in them.
const visibleStatus = (job: SearchableJob, filter: string, appliedIds: Set<string>) =>
  job.status !== 'closed' || job.mine || appliedIds.has(job.id) || filter === 'Applied';

export function searchJobs<T extends SearchableJob>(jobs: T[], options: SearchOptions = {}): Array<T & {skillMatch: number; score: number}> {
  const {query = '', filter = 'All', skills = [], appliedIds = new Set<string>()} = options;
  const userSkills = new Set(skills.map(normalize));
  const rows: Array<T & {skillMatch: number; score: number}> = [];
  for (const job of jobs) {
    if (!passesFilter(job, filter, appliedIds) || !visibleStatus(job, filter, appliedIds)) continue;
    const score = scoreJob(job, query);
    if (score < 0) continue;
    rows.push({...job, score, skillMatch: countSkillMatches(job, userSkills)});
  }
  rows.sort((a, b) => b.score - a.score || b.skillMatch - a.skillMatch || b.ts - a.ts);
  return rows;
}
