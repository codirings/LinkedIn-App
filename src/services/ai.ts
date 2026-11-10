import {getApp} from '@react-native-firebase/app';
import {GoogleAIBackend, getAI, getGenerativeModel} from '@react-native-firebase/ai';
import ENV from '../config/env.generated';

export type Tone = 'professional' | 'friendly' | 'bold' | 'story';

export type GenOpts = {
  prompt: string;
  words?: number;
  tone?: Tone;
  base?: string;
  maxChars?: number;
};

const MODEL = ENV.AI_MODEL || 'gemini-3.8-flash';
const CPW = 6.2;
const MIN_W = 30;

const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const asked = (p: string) => {
  const m = p.match(/(\d{2,4})\s*(?:-|\s)?\s*words?/i);
  return m ? parseInt(m[1], 10) : 0;
};

export function targetWords(o: GenOpts) {
  const cap = Math.floor((o.maxChars ?? 3000) / CPW);
  const raw = o.words || asked(o.prompt) || Math.round(40 + wc(o.prompt + ' ' + (o.base ?? '')) * 4);
  return Math.max(MIN_W, Math.min(raw, cap));
}

const shape = (n: number) => {
  if (n <= 60) return 'One tight paragraph. Open with a sharp hook, make one point, end with a short closing line.';
  if (n <= 150) return 'A hook line, then two short paragraphs with one concrete detail each, then a closing takeaway or question.';
  if (n <= 300) return 'A hook line, a short setup, three or four distinct points each backed by a specific example or number, then a closing takeaway and a question for the reader. Use blank lines between blocks.';
  return 'A hook line, a story or context section, a numbered or clearly separated set of lessons with specific examples, a counterpoint or common mistake, then a conclusion and a question for the reader. Use blank lines between blocks.';
};

const tones: Record<Tone, string> = {
  professional: 'Polished, credible, confident. No slang.',
  friendly: 'Warm, conversational, first person, approachable.',
  bold: 'Direct, opinionated, punchy sentences, a clear stance.',
  story: 'Narrative, first person, vivid scene and a lesson at the end.',
};

const sys = (n: number, tone: Tone, maxChars: number) =>
  [
    'You write high-quality social posts for a professional networking app.',
    `Target length: about ${n} words (acceptable range ${Math.round(n * 0.9)} to ${Math.round(n * 1.1)}). Never exceed ${maxChars} characters.`,
    `Structure: ${shape(n)}`,
    `Voice: ${tones[tone]}`,
    'Be specific: concrete details, examples, numbers, no filler, no cliches like "in today\'s fast-paced world".',
    'Output plain text only: no markdown, no asterisks, no headings syntax, no quotation marks around the post, no preamble or explanation.',
    'Add at most 3 relevant hashtags on the last line, only if they fit.',
  ].join('\n');

const ai = () => getAI(getApp(), {backend: new GoogleAIBackend()});

const run = async (system: string, user: string, n: number, temperature = 0.8) => {
  const model = getGenerativeModel(ai(), {
    model: MODEL,
    systemInstruction: system,
    generationConfig: {maxOutputTokens: Math.ceil(n * 2.2) + 1500, temperature},
  });
  const res = await model.generateContent(user);
  return res.response.text().trim();
};

const trim = (t: string, max: number) => {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (i > max * 0.6 ? cut.slice(0, i + 1) : cut).trim();
};

export const aiError = (e: any) => {
  const m = `${e?.code ?? ''} ${e?.message ?? e}`;
  if (/app.?check|403|PERMISSION|deactivated/i.test(m)) return 'AI is blocked for this device. Register the App Check debug token and enable Firebase AI Logic in the Firebase console.';
  if (/not.?found|404|model/i.test(m)) return `The AI model "${MODEL}" is not available for this project. Change AI_MODEL in .env.`;
  if (/quota|429|RESOURCE/i.test(m)) return 'AI usage limit reached. Wait a minute and try again.';
  if (/network|fetch|unavailable|503/i.test(m)) return 'Could not reach the AI service. Check your connection.';
  return `AI request failed. ${m.trim()}`;
};

export async function generatePost(o: GenOpts) {
  const maxChars = o.maxChars ?? 3000;
  const n = targetWords(o);
  const tone = o.tone ?? 'professional';
  const system = sys(n, tone, maxChars);
  const ask = o.base
    ? `Rewrite and improve this draft to about ${n} words, keeping the author's intent.\nExtra direction: ${o.prompt || 'none'}\n\nDRAFT:\n${o.base}`
    : `Write a post of about ${n} words about:\n${o.prompt}`;
  let out = await run(system, ask, n);
  for (let i = 0; i < 2; i++) {
    const w = wc(out);
    if (w >= n * 0.85 && w <= n * 1.15) break;
    const dir = w < n ? `Expand it to about ${n} words by adding concrete examples, detail and depth` : `Tighten it to about ${n} words by cutting filler and repetition`;
    out = await run(system, `${dir}. It is currently ${w} words. Keep the voice and the best lines.\n\nPOST:\n${out}`, n, 0.6);
  }
  return {text: trim(out, maxChars), words: wc(out), target: n};
}
