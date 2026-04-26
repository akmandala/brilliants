import type { Handler } from './_lib/types';
import { parserInputSchema, parserResultSchema } from '../../src/schemas';
import { parseLocally } from '../../src/parser/localParser';
import { parseWithOpenAi } from './_lib/openaiParser';

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}') as { input: unknown; manufacturerPageText?: string };
    const inputParsed = parserInputSchema.parse(body.input);
    const local = parseLocally(inputParsed, body.manufacturerPageText ?? '');

    if (process.env.OPENAI_API_KEY) {
      try {
        const ai = await parseWithOpenAi(inputParsed, body.manufacturerPageText ?? '');
        const validated = parserResultSchema.safeParse(ai);
        if (validated.success) return { statusCode: 200, body: JSON.stringify(validated.data) };
        local.review_flags.push('AI_RESULT_INVALID');
      } catch {
        local.review_flags.push('AI_RESULT_INVALID');
      }
    }

    return { statusCode: 200, body: JSON.stringify(local) };
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: (error as Error).message }) };
  }
};
