// Job and application helpers shared by the services, the context and the screens.

export const MODES = ['Remote', 'Hybrid', 'On-site'] as const;
export const APPLICATION_STATUSES = ['Submitted', 'Reviewing', 'Interview', 'Offer', 'Rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
// postedBy value for the built-in catalog listings (written by an admin, not by a member).
export const CATALOG_OWNER = 'catalog';

export type JobInput = {
  title: string;
  company: string;
  location?: string;
  mode?: string;
  salaryMin?: string | number | null;
  salaryMax?: string | number | null;
  skills?: string | string[] | null;
  requirements?: string | string[] | null;
  desc?: string;
};

// Firestore timestamps expose toMillis(); pending server timestamps are null until committed.
export function toMillis(ts: any, fallback = 0): number {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : fallback;
}

export function splitList(value: string | string[] | null | undefined, separator: RegExp = /[,\n]/): string[] {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(separator);
  const seen = new Set<string>();
  const out: string[] = [];
  raw.forEach((item) => {
    const clean = String(item).trim();
    const key = clean.toLowerCase();
    if (clean && !seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  });
  return out;
}

// Returns a whole-dollar amount, null when left blank, or undefined when the input is not a valid amount.
export function parseAmount(raw: string | number | null | undefined): number | null | undefined {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : undefined;
  const cleaned = raw.replace(/[,$\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

export function validateJobInput(input: JobInput): string | null {
  const title = (input.title ?? '').trim();
  if (!title) return 'Add a job title.';
  if (title.length > 120) return 'Keep the job title under 120 characters.';
  if (!(input.company ?? '').trim()) return 'Add the company name.';
  if (input.mode && !(MODES as readonly string[]).includes(input.mode)) return 'Choose a work mode.';
  const min = parseAmount(input.salaryMin);
  const max = parseAmount(input.salaryMax);
  if (min === undefined || max === undefined) return 'Salary must be a whole number of dollars per year.';
  if (min !== null && max !== null && min > max) return 'The minimum salary is higher than the maximum.';
  if ((input.desc ?? '').length > 5000) return 'Keep the description under 5,000 characters.';
  return null;
}

// The fields a job document stores. Callers must validate first.
export function jobPayload(input: JobInput) {
  return {
    title: input.title.trim(),
    company: input.company.trim(),
    location: (input.location ?? '').trim(),
    mode: input.mode && (MODES as readonly string[]).includes(input.mode) ? input.mode : 'Remote',
    salaryMin: parseAmount(input.salaryMin) ?? null,
    salaryMax: parseAmount(input.salaryMax) ?? null,
    skills: splitList(input.skills),
    requirements: splitList(input.requirements, /\n/),
    desc: (input.desc ?? '').trim(),
  };
}

const money = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);

export function formatSalary(min?: number | null, max?: number | null): string {
  const lo = Number.isFinite(min) ? (min as number) : null;
  const hi = Number.isFinite(max) ? (max as number) : null;
  if (lo === null && hi === null) return 'Salary not listed';
  if (lo !== null && hi !== null) return `${money(lo)} - ${money(hi)}`;
  return lo !== null ? `From ${money(lo)}` : `Up to ${money(hi as number)}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Copy and icon for the notification sent to an applicant when the poster changes their status.
export function applicationNotice(status: string, title: string, company: string): {text: string; icon: string} {
  switch (status) {
    case 'Reviewing':
      return {text: `${company} is reviewing your application for ${title}`, icon: 'eye-outline'};
    case 'Interview':
      return {text: `${company} wants to interview you for ${title}`, icon: 'calendar'};
    case 'Offer':
      return {text: `${company} sent you an offer for ${title}`, icon: 'trophy-outline'};
    case 'Rejected':
      return {text: `${company} won’t be moving forward with your application for ${title}`, icon: 'close-circle-outline'};
    default:
      return {text: `Your application for ${title} at ${company} was reset to Submitted`, icon: 'paper-plane-outline'};
  }
}
