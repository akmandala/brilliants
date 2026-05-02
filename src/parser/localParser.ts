import type { ParserInput, ParserResult } from '../types';
import { parseDimensions, normalizeMpn } from './encoding';
import { buildDescription } from './descriptions';
import { buildPinTsv } from './pinTsv';
import { buildFootprintName, classifyReviewFlags, detectFamily } from './rules';
import { classifyPopularPart, type PopularComponentFamily } from './popularPartGrammars';
import { findSupportingBom, uniqueSupportParts } from './supportingPartBoms';

const passiveSizeFromMpn = (mpn: string): string | undefined => {
  const token = normalizeMpn(mpn);
  if (/GRM033/.test(token)) return '0201';
  if (/GRM155/.test(token)) return '0402';
  if (/GRM188/.test(token)) return '0603';
  if (/GRM219/.test(token)) return '0805';
  if (/GRM31/.test(token)) return '1206';
  return undefined;
};

const passiveType = (mpn: string, text: string): 'RES' | 'CAP' | 'IND' | 'LED' => {
  const s = `${mpn} ${text}`.toUpperCase();
  if (/(GRM|MLCC|CERAMIC CAP|CAPACITOR|\bCAP\b)/.test(s)) return 'CAP';
  if (/(DFE|LQH|INDUCTOR|\bIND\b)/.test(s)) return 'IND';
  if (/(LTST|CHIP LED|\bLED\b)/.test(s)) return 'LED';
  return 'RES';
};

const dimensionsFromSize = (size?: string): { length?: number; width?: number; height?: number } => {
  const map: Record<string, { length: number; width: number; height: number }> = {
    '0201': { length: 0.6, width: 0.3, height: 0.3 },
    '0402': { length: 1.0, width: 0.5, height: 0.5 },
    '0603': { length: 1.6, width: 0.8, height: 0.8 },
    '0805': { length: 2.0, width: 1.25, height: 1.25 },
    '1206': { length: 3.2, width: 1.6, height: 1.6 }
  };
  return size ? map[size] ?? {} : {};
};

export const parseLocally = (input: ParserInput, manufacturerText = '', options: { includeSupportingParts?: boolean } = {}): ParserResult => {
  const includeSupportingParts = options.includeSupportingParts ?? true;
  const popularHint = classifyPopularPart(input.mpn, input.manufacturer);
  const mergedText = `${input.datasheetText ?? ''}\n${manufacturerText}`;
  const grammarFamilyMap: Record<PopularComponentFamily, ReturnType<typeof detectFamily>> = {
    RES: 'Chip Passive / Chip LED',
    CAP: 'Chip Passive / Chip LED',
    IND: 'Chip Passive / Chip LED',
    LED: 'Chip Passive / Chip LED',
    IC: 'Leadless / Area-Array / SMD Resonator',
    CONB2B: 'Miniature Board-to-Board Connector',
    CONFPC: 'FPC / FFC Connector',
    CONJST: 'JST-style Wire-to-Board Connector',
    CONHDR: 'Pin Header / Socket Header'
  };
  const family = popularHint ? grammarFamilyMap[popularHint.family] : detectFamily(input.mpn, mergedText);
  const rawDims = parseDimensions(mergedText);
  const size = popularHint?.commonSize ?? passiveSizeFromMpn(input.mpn) ?? (/0402/.test(mergedText) ? '0402' : '0603');
  const fallbackDims = family === 'Chip Passive / Chip LED' ? dimensionsFromSize(size) : {};
  const dims = {
    length: rawDims.length && rawDims.length >= 0.5 ? rawDims.length : fallbackDims.length,
    width: rawDims.width && rawDims.width >= 0.3 ? rawDims.width : fallbackDims.width,
    height: rawDims.height && rawDims.height >= 0.2 ? rawDims.height : fallbackDims.height
  };
  const supported = family !== 'Out of Scope';
  const chipType = (popularHint?.componentType as 'RES' | 'CAP' | 'IND' | 'LED' | undefined) ?? passiveType(input.mpn, mergedText);

  const footprint = buildFootprintName({
    family,
    type: family.includes('Chip') ? chipType : family.includes('Leadless') ? 'QFN' : family.includes('Leaded') ? 'SOP' : undefined,
    size,
    length: dims.length,
    width: dims.width,
    height: dims.height,
    pinCount: Number(mergedText.match(/(\d+)\s*(?:pin|pins|pos|contacts)/i)?.[1] ?? (popularHint?.contactCount ?? 8)),
    pitch: Number(mergedText.match(/(\d+(?:\.\d+)?)\s*mm\s*pitch/i)?.[1] ?? (popularHint?.pitchMm ?? 0.5)),
    familyToken: popularHint?.series
  });

  const description = family === 'Chip Passive / Chip LED'
    ? buildDescription([`${chipType}`, normalizeMpn(input.mpn), size, `H=${dims.height ?? '?'}mm`, '-55..125C'])
    : buildDescription(['IC', normalizeMpn(input.mpn), 'SMD', '-40..85C']);
  const reviewFlags = classifyReviewFlags({
    hasDatasheet: Boolean(input.datasheetText),
    hasUrl: Boolean(input.manufacturerUrl),
    dimensionsFound: Boolean(dims.length && dims.width),
    heightFound: Boolean(dims.height),
    supported
  });

  const pinTable = family.includes('Connector') || family === 'Chip Passive / Chip LED'
    ? undefined
    : buildPinTsv([
        { designator: '1', name: 'VIN' },
        { designator: '2', name: 'GND' },
        { designator: '3', name: 'EN' },
        { designator: '4', name: 'SW' }
      ]);

  const result: ParserResult = {
    input: {
      mpn_original: input.mpn,
      manufacturer_input: input.manufacturer,
      manufacturer_url: input.manufacturerUrl,
      datasheet_filename: input.datasheetFileName
    },
    classification: {
      supported_family: supported,
      family,
      family_confidence: supported ? 0.72 : 0.35,
      out_of_scope_note: supported
        ? undefined
        : 'This part is outside the currently defined automated naming families. Best-effort result generated.'
    },
    identity: {
      manufacturer: input.manufacturer ?? popularHint?.manufacturer,
      mpn_normalized: normalizeMpn(input.mpn),
      component_class: family.includes('Connector') ? 'Connector' : 'IC',
      sub_type: popularHint?.subType ?? family
    },
    package: {
      footprint_name: footprint,
      package_type: footprint.split('-')[0],
      package_family_normalized: popularHint?.packageFamilyNormalized ?? family,
      package_family_raw: popularHint?.packageFamilyRaw ?? family,
      common_size: popularHint?.commonSize,
      size_system: popularHint?.sizeSystem,
      pin_count: Number(mergedText.match(/(\d+)\s*(?:pin|pins)/i)?.[1] ?? undefined),
      contact_count: Number(mergedText.match(/(\d+)\s*(?:pos|contacts)/i)?.[1] ?? popularHint?.contactCount ?? undefined),
      row_count: popularHint?.signalCount ? 2 : undefined,
      pitch_mm: Number(mergedText.match(/(\d+(?:\.\d+)?)\s*mm\s*pitch/i)?.[1] ?? popularHint?.pitchMm ?? undefined),
      length_max_mm: dims.length,
      width_max_mm: dims.width,
      height_max_mm: dims.height,
      dimension_basis: 'best-effort extracted',
      series: popularHint?.series
    },
    extracted: {
      datasheetTextPresent: Boolean(input.datasheetText),
      manufacturerUrlPresent: Boolean(input.manufacturerUrl)
    },
    altium: {
      description: buildDescription([description]),
      pin_table_tsv: pinTable
    },
    lcsc_jlc: {
      lookup_status: 'not_configured',
      search_query_english: `${normalizeMpn(input.mpn)} ${description}`,
      notes: ['Lookup requires LCSC/JLC credentials or mock mode.']
    },
    confidence: {
      overall: Math.max(supported ? 0.7 : 0.4, popularHint?.confidence ?? 0),
      source: 'rule_based'
    },
    source_evidence: [
      { field: 'family', source: input.datasheetFileName ? 'datasheet' : 'input', evidence: family, confidence: 0.7 },
      { field: 'footprint_name', source: 'heuristic', evidence: footprint, confidence: 0.6 },
      ...(popularHint ? [{ field: 'popular_grammar_rule', source: 'popular_part_grammar', evidence: popularHint.ruleId, confidence: popularHint.confidence }] : [])
    ],
    review_flags: Array.from(new Set([...reviewFlags, ...(popularHint?.reviewFlags ?? [])]))
  };

  if (includeSupportingParts) {
    const bom = findSupportingBom(input.mpn);
    if (bom) {
      result.supporting_parts = uniqueSupportParts(bom.parts).map((part) => {
        const support = parseLocally({ mpn: part.mpn, manufacturer: part.manufacturer, ...(part.parserInput ?? {}) }, '', { includeSupportingParts: false });
        support.supportingPartMeta = {
          parentMpn: input.mpn,
          bomId: bom.id,
          bomTitle: bom.title,
          role: part.role,
          quantity: part.quantity,
          note: part.note
        };
        return support;
      });
      result.extracted = {
        ...result.extracted,
        supporting_bom: { id: bom.id, title: bom.title, sourceNote: bom.sourceNote }
      };
    }
  }
  return result;
};
