export interface LookupInput {
  mpn: string;
  manufacturer?: string;
  description: string;
  family: string;
}

const queryForLookup = (input: LookupInput): string => `${input.mpn} ${input.description} ${input.family} ${input.manufacturer ?? ''}`.trim();

const buildMock = (input: LookupInput) => ({
  lookup_status: 'matched' as const,
  search_query_english: queryForLookup(input),
  best_match: {
    source: 'MOCK' as const,
    part_number: `C${Math.abs(hashCode(input.mpn)).toString().slice(0, 6)}`,
    manufacturer: input.manufacturer,
    mpn: input.mpn,
    description: input.description,
    stock: 12034,
    confidence: 0.55,
    reason: 'Mock provider enabled for UI testing.'
  },
  alternatives: [
    { source: 'MOCK', part_number: `C${Math.abs(hashCode(input.mpn + 'A')).toString().slice(0, 6)}`, confidence: 0.35 }
  ],
  notes: ['Mock data; not an official distributor result.']
});

const hashCode = (s: string) => s.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);

export const lookupLcscJlc = async (input: LookupInput) => {
  const query = queryForLookup(input);

  if (process.env.MOCK_LOOKUP_ENABLED === 'true') {
    return buildMock(input);
  }

  const lcscKey = process.env.LCSC_API_KEY;
  const lcscSecret = process.env.LCSC_API_SECRET || process.env.LCSC_SIGNATURE_SECRET;
  if (!lcscKey || !lcscSecret) {
    return {
      lookup_status: 'not_configured' as const,
      search_query_english: query,
      notes: ['LCSC_LOOKUP_NOT_CONFIGURED', 'JLC_LOOKUP_NOT_CONFIGURED']
    };
  }

  return {
    lookup_status: 'not_found' as const,
    search_query_english: query,
    notes: ['LCSC adapter is present but signature/account-specific algorithm may need adjustment.']
  };
};
