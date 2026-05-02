import type { ParserInput } from '../../../src/types';

export const parseWithOpenAi = async (input: ParserInput, manufacturerPageText: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');

  const schemaText = `Return valid JSON ParserResult only.`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: `You are an electronic component parser. ${schemaText}`
        },
        {
          role: 'user',
          content: JSON.stringify({ input, manufacturerPageText })
        }
      ],
      text: { format: { type: 'json_object' } }
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const json = (await response.json()) as { output_text?: string };
  const output = json.output_text ?? '{}';
  return JSON.parse(output);
};
