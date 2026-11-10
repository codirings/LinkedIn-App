import {
  applicationNotice,
  formatSalary,
  jobPayload,
  parseAmount,
  slugify,
  splitList,
  validateJobInput,
} from '../src/utils/jobs';

describe('parseAmount', () => {
  it('reads whole dollar amounts with separators', () => {
    expect(parseAmount('150,000')).toBe(150000);
    expect(parseAmount('$ 120000')).toBe(120000);
    expect(parseAmount(90000.4)).toBe(90000);
  });

  it('returns null for blank input and undefined for invalid input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount('12k')).toBeUndefined();
    expect(parseAmount('-5')).toBeUndefined();
  });
});

describe('splitList', () => {
  it('splits on commas and newlines, trimming and removing duplicates', () => {
    expect(splitList('Figma, react,\n figma , ,')).toEqual(['Figma', 'react']);
  });

  it('keeps commas inside requirement lines when split by newline', () => {
    expect(splitList('Led a team, 3+ people\nWrites tests', /\n/)).toEqual(['Led a team, 3+ people', 'Writes tests']);
  });

  it('accepts arrays', () => {
    expect(splitList([' A ', 'a', 'B'])).toEqual(['A', 'B']);
  });
});

describe('validateJobInput', () => {
  const ok = {title: 'Designer', company: 'Acme', salaryMin: '100000', salaryMax: '120000'};

  it('accepts a complete listing', () => {
    expect(validateJobInput(ok)).toBeNull();
  });

  it('requires a title and company', () => {
    expect(validateJobInput({...ok, title: '  '})).toMatch(/job title/);
    expect(validateJobInput({...ok, company: ''})).toMatch(/company/);
  });

  it('rejects an unknown work mode and invalid salaries', () => {
    expect(validateJobInput({...ok, mode: 'Mars'})).toMatch(/work mode/);
    expect(validateJobInput({...ok, salaryMin: 'abc'})).toMatch(/whole number/);
    expect(validateJobInput({...ok, salaryMin: '130000', salaryMax: '120000'})).toMatch(/higher than the maximum/);
  });

  it('allows an open-ended salary', () => {
    expect(validateJobInput({...ok, salaryMin: '', salaryMax: ''})).toBeNull();
  });
});

describe('jobPayload', () => {
  it('normalizes text fields into the stored shape', () => {
    expect(jobPayload({
      title: ' Designer ',
      company: ' Acme ',
      mode: 'Hybrid',
      salaryMin: '100,000',
      salaryMax: '',
      skills: 'Figma, figma, React',
      requirements: 'Five years\nLed a team',
      desc: '  About  ',
    })).toEqual({
      title: 'Designer',
      company: 'Acme',
      location: '',
      mode: 'Hybrid',
      salaryMin: 100000,
      salaryMax: null,
      skills: ['Figma', 'React'],
      requirements: ['Five years', 'Led a team'],
      desc: 'About',
    });
  });

  it('falls back to Remote for an unknown mode', () => {
    expect(jobPayload({title: 'x', company: 'y', mode: 'Other'}).mode).toBe('Remote');
  });
});

describe('formatSalary', () => {
  it('formats ranges, one-sided bounds and missing values', () => {
    expect(formatSalary(160000, 210000)).toBe('$160k - $210k');
    expect(formatSalary(45000, null)).toBe('From $45k');
    expect(formatSalary(null, 90000)).toBe('Up to $90k');
    expect(formatSalary(null, null)).toBe('Salary not listed');
    expect(formatSalary(500, 800)).toBe('$500 - $800');
  });
});

describe('slugify and applicationNotice', () => {
  it('builds stable catalog ids', () => {
    expect(slugify('Harbor Payments-Backend Engineer, Payments')).toBe('harbor-payments-backend-engineer-payments');
  });

  it('writes a notice per status', () => {
    expect(applicationNotice('Interview', 'Designer', 'Acme').text).toBe('Acme wants to interview you for Designer');
    expect(applicationNotice('Offer', 'Designer', 'Acme').icon).toBe('trophy-outline');
    expect(applicationNotice('Rejected', 'Designer', 'Acme').text).toContain('won’t be moving forward');
  });
});
