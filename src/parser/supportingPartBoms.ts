export type SupportingPartDefinition = {
  role: string;
  mpn: string;
  manufacturer?: string;
  quantity?: number;
  note?: string;
  source?: string;
  parserInput?: { manufacturerUrl?: string; datasheetText?: string };
};

export type SupportingBomDefinition = {
  id: string;
  title: string;
  appliesTo: string[];
  sourceNote: string;
  parts: SupportingPartDefinition[];
};

export const SUPPORTING_PART_BOMS: SupportingBomDefinition[] = [
  {
    id: 'ti-tps62840-demo',
    title: 'TPS62840 typical supporting parts',
    appliesTo: ['TPS62840', 'TPS62840DLCR', 'TPS62840DLCT', 'TPS62840YBGR', 'TPS62840YBGT'],
    sourceNote: 'Demo mapping based on TI TPS62840 datasheet typical application components. User should validate values for their final Vin/Vout/load design.',
    parts: [
      { role: 'Input capacitor', mpn: 'GRM155R61A475MEAAD', manufacturer: 'Murata', quantity: 1, note: '4.7uF 10V X5R 0402 input capacitor from TI typical application table.' },
      { role: 'Output capacitor', mpn: 'GRM155R60G106ME44D', manufacturer: 'Murata', quantity: 1, note: '10uF 4V X5R 0402 output capacitor from TI typical application table.' },
      { role: 'Inductor', mpn: 'DFE201612E-2R2M=P2', manufacturer: 'Murata', quantity: 1, note: '2.2uH Murata DFE201612E inductor from TI typical application table.' }
    ]
  }
];

export function normalizeMpnForSupportBom(mpn: string): string {
  return mpn.toUpperCase().trim().replace(/\s+/g, '').replace(/[()]/g, '');
}

export function findSupportingBom(mpn: string): SupportingBomDefinition | null {
  const normalized = normalizeMpnForSupportBom(mpn);
  return SUPPORTING_PART_BOMS.find((bom) => bom.appliesTo.some((candidate) => normalized === normalizeMpnForSupportBom(candidate))) ?? null;
}

export function uniqueSupportParts(parts: SupportingPartDefinition[]): SupportingPartDefinition[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const key = normalizeMpnForSupportBom(part.mpn);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
