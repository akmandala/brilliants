import type { Handler } from './_lib/types';
import { lookupLcscJlc } from './_lib/lcscJlcLookup';

export const handler: Handler = async (event) => {
  try {
    const input = JSON.parse(event.body ?? '{}') as { mpn: string; manufacturer?: string; description: string; family: string };
    const result = await lookupLcscJlc(input);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ lookup_status: 'error', search_query_english: '', notes: [(error as Error).message] })
    };
  }
};
