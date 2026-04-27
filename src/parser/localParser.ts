import type { ParserInput, ParserResult } from '../types';
import { parseDimensions, normalizeMpn } from './encoding';
import { buildDescription } from './descriptions';
import { buildPinTsv } from './pinTsv';
import { buildFootprintName, classifyReviewFlags, descriptionForFamily, detectFamily } from './rules';

export const parseLocally = (input: ParserInput, manufacturerText = ''): ParserResult => {
  const mergedText = `${input.datasheetText ?? ''}\n${manufacturerText}`;
  const family = detectFamily(input.mpn, mergedText);
  const dims = parseDimensions(mergedText);
  const supported = family !== 'Out of Scope';

  const footprint = buildFootprintName({
    family,
    type: family.includes('Chip') ? 'CAP' : family.includes('Leadless') ? 'QFN' : family.includes('Leaded') ? 'SOP' : undefined,
    size: /0402/.test(mergedText) ? '0402' : '0603',
    length: dims.length,
    width: dims.width,
    height: dims.height,
    pinCount: Number(mergedText.match(/(\d+)\s*(?:pin|pins|pos|contacts)/i)?.[1] ?? 8),
    pitch: Number(mergedText.match(/(\d+(?:\.\d+)?)\s*mm\s*pitch/i)?.[1] ?? 0.5)
  });

  const description = descriptionForFamily(family, normalizeMpn(input.mpn));
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

  return {
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
      manufacturer: input.manufacturer,
      mpn_normalized: normalizeMpn(input.mpn),
      component_class: family.includes('Connector') ? 'Connector' : 'IC',
      sub_type: family
    },
    package: {
      footprint_name: footprint,
      package_type: footprint.split('-')[0],
      package_family_normalized: family,
      package_family_raw: family,
      pin_count: Number(mergedText.match(/(\d+)\s*(?:pin|pins)/i)?.[1] ?? undefined),
      contact_count: Number(mergedText.match(/(\d+)\s*(?:pos|contacts)/i)?.[1] ?? undefined),
      pitch_mm: Number(mergedText.match(/(\d+(?:\.\d+)?)\s*mm\s*pitch/i)?.[1] ?? undefined),
      length_max_mm: dims.length,
      width_max_mm: dims.width,
      height_max_mm: dims.height,
      dimension_basis: 'best-effort extracted'
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
      overall: supported ? 0.7 : 0.4,
      source: 'rule_based'
    },
    source_evidence: [
      { field: 'family', source: input.datasheetFileName ? 'datasheet' : 'input', evidence: family, confidence: 0.7 },
      { field: 'footprint_name', source: 'heuristic', evidence: footprint, confidence: 0.6 }
    ],
    review_flags: reviewFlags
  };
};
