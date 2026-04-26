import type { Handler } from './_lib/types';

const stripHtml = (html: string): string =>
  html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const handler: Handler = async (event) => {
  try {
    const { url } = JSON.parse(event.body ?? '{}') as { url?: string };
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'Missing url' }) };
    const res = await fetch(url, { headers: { 'user-agent': 'ComponentParserWorkspace/1.0' } });
    const html = await res.text();
    return { statusCode: 200, body: JSON.stringify({ text: stripHtml(html).slice(0, 20000) }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
};
