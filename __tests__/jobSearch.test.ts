import {countSkillMatches, normalize, scoreJob, searchJobs, tokenize, type SearchableJob} from '../src/utils/jobSearch';

const base = (over: Partial<SearchableJob> & {id: string}): SearchableJob => ({
  title: 'Role',
  company: 'Company',
  location: 'Remote',
  mode: 'Remote',
  skills: [],
  requirements: [],
  desc: '',
  status: 'open',
  mine: false,
  saved: false,
  ts: 1,
  ...over,
});

const jobs: SearchableJob[] = [
  base({id: 'a', title: 'Lead Product Designer', company: 'Northwind', skills: ['Figma', 'Design Systems'], location: 'San Francisco, CA', mode: 'Hybrid', ts: 10}),
  base({id: 'b', title: 'Frontend Engineer', company: 'Cobalt', skills: ['React', 'TypeScript'], ts: 30}),
  base({id: 'c', title: 'Data Scientist', company: 'Quarry', skills: ['Python', 'SQL'], desc: 'Own experimentation and forecasting', ts: 20}),
  base({id: 'd', title: 'Product Designer', company: 'Harbor', skills: ['Figma'], mode: 'On-site', location: 'New York, NY', ts: 5, status: 'closed'}),
  base({id: 'e', title: 'Design Systems Architect', company: 'Lumen', skills: ['Design Systems', 'React'], ts: 40}),
];

describe('normalize and tokenize', () => {
  it('lowercases, strips accents and trims', () => {
    expect(normalize('  Café Design ')).toBe('cafe design');
  });

  it('splits on whitespace and commas, dropping empties', () => {
    expect(tokenize('figma,  design   systems ')).toEqual(['figma', 'design', 'systems']);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('scoreJob', () => {
  it('returns -1 when any query word matches nothing', () => {
    expect(scoreJob(jobs[0], 'figma kubernetes')).toBe(-1);
  });

  it('scores title hits above description-only hits', () => {
    const titleHit = scoreJob(jobs[0], 'designer');
    const descHit = scoreJob(jobs[2], 'forecasting');
    expect(titleHit).toBeGreaterThan(descHit);
    expect(descHit).toBeGreaterThan(0);
  });

  it('gives an exact title match a bonus', () => {
    expect(scoreJob(jobs[1], 'Frontend Engineer')).toBeGreaterThan(scoreJob(jobs[1], 'frontend'));
  });

  it('is zero for an empty query', () => {
    expect(scoreJob(jobs[0], '')).toBe(0);
  });
});

describe('searchJobs', () => {
  it('requires every word in the query to match (AND across words)', () => {
    const ids = searchJobs(jobs, {query: 'design figma'}).map(j => j.id);
    expect(ids).toEqual(expect.arrayContaining(['a']));
    expect(ids).not.toContain('e'); // "Figma" is not on the Design Systems Architect listing
  });

  it('matches multi-word and partial input across title, company, skills and location', () => {
    expect(searchJobs(jobs, {query: 'cobalt'}).map(j => j.id)).toEqual(['b']);
    expect(searchJobs(jobs, {query: 'python'}).map(j => j.id)).toEqual(['c']);
    expect(searchJobs(jobs, {query: 'francisco'}).map(j => j.id)).toEqual(['a']);
  });

  it('ranks by score, then skill match, then recency', () => {
    const ids = searchJobs(jobs, {query: 'design'}).map(j => j.id);
    // Both listings match in the title; the tie breaks on recency (e is newer than a).
    expect(ids).toEqual(['e', 'a']);
    // Skill matches break ties before recency.
    expect(searchJobs(jobs, {query: 'design', skills: ['figma']}).map(j => j.id)).toEqual(['a', 'e']);
    expect(searchJobs(jobs, {query: 'figma'}).map(j => j.id)).toEqual(['a']);
  });

  it('hides closed listings unless the viewer posted them or applied', () => {
    expect(searchJobs(jobs, {query: 'harbor'}).map(j => j.id)).toEqual([]);
    expect(searchJobs(jobs, {query: 'harbor', appliedIds: new Set(['d'])}).map(j => j.id)).toEqual(['d']);
    expect(searchJobs([{...jobs[3], mine: true}], {query: 'harbor'}).map(j => j.id)).toEqual(['d']);
  });

  it('filters by work mode and by viewer state', () => {
    expect(searchJobs(jobs, {filter: 'Hybrid'}).map(j => j.id)).toEqual(['a']);
    expect(searchJobs(jobs, {filter: 'Saved'}).map(j => j.id)).toEqual([]);
    expect(searchJobs(jobs.map(j => (j.id === 'b' ? {...j, saved: true} : j)), {filter: 'Saved'}).map(j => j.id)).toEqual(['b']);
    expect(searchJobs(jobs, {filter: 'Applied', appliedIds: new Set(['e'])}).map(j => j.id)).toEqual(['e']);
    expect(searchJobs(jobs.map(j => (j.id === 'c' ? {...j, mine: true} : j)), {filter: 'Posted by me'}).map(j => j.id)).toEqual(['c']);
  });

  it('reports skill matches against the viewer profile, case-insensitively', () => {
    const [top] = searchJobs(jobs, {skills: ['figma', 'DESIGN SYSTEMS']}).filter(j => j.id === 'a');
    expect(top.skillMatch).toBe(2);
    expect(countSkillMatches(jobs[1], new Set(['react']))).toBe(1);
  });
});
