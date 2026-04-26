import { buildDescription } from './descriptions';
import { encodeDimension, encodePitch, normalizeMpn } from './encoding';

export type Family =
  | 'Chip Passive / Chip LED'
  | 'Leadless / Area-Array / SMD Resonator'
  | 'Leaded SMD'
  | 'Miniature Board-to-Board Connector'
  | 'FPC / FFC Connector'
  | 'JST-style Wire-to-Board Connector'
  | 'Pin Header / Socket Header'
  | 'Out of Scope';

export const detectFamily = (mpn: string, text: string): Family => {
  const s = `${mpn} ${text}`.toUpperCase();
  if (/(GRM|RC|CC|RES|CAP|IND|LTST|LED)/.test(s)) return 'Chip Passive / Chip LED';
  if (/(QFN|DFN|SON|BGA|CSP|WLCSP|XTAL|LGA)/.test(s)) return 'Leadless / Area-Array / SMD Resonator';
  if (/(SOT|SOD|SOIC|SSOP|TSSOP|QFP|LQFP|MSOP|SOP)/.test(s)) return 'Leaded SMD';
  if (/(WP26|MEZZ|BOARD\s*TO\s*BOARD|HIROSE\s*BM|JAE)/.test(s)) return 'Miniature Board-to-Board Connector';
  if (/(FPC|FFC|FH12|FH42|ZIF|LIF)/.test(s)) return 'FPC / FFC Connector';
  if (/(JST|\bPH\b|\bSH\b|\bGH\b|\bXH\b|\bVH\b)/.test(s)) return 'JST-style Wire-to-Board Connector';
  if (/(HEADER|SOCKET|WR-PHD|SAMTEC|PINHDR)/.test(s)) return 'Pin Header / Socket Header';
  return 'Out of Scope';
};

export const buildFootprintName = (opts: {
  family: Family;
  type?: string;
  size?: string;
  length?: number;
  width?: number;
  height?: number;
  pinCount?: number;
  pitch?: number;
  familyToken?: string;
  extra?: string[];
}): string => {
  const dimension = opts.length && opts.width ? encodeDimension(opts.length, opts.width, opts.height) : 'UNKNOWN';
  switch (opts.family) {
    case 'Chip Passive / Chip LED':
      return [opts.type ?? 'RES', opts.size ?? '0402', dimension, ...(opts.extra ?? [])].join('-');
    case 'Leadless / Area-Array / SMD Resonator':
      return [opts.type ?? 'QFN', String(opts.pinCount ?? 8), opts.pitch ? encodePitch(opts.pitch) : 'P50', dimension, ...(opts.extra ?? [])].join('-');
    case 'Leaded SMD':
      return [opts.type ?? 'SOP', opts.pinCount ? String(opts.pinCount) : undefined, opts.pitch ? encodePitch(opts.pitch) : undefined, dimension, ...(opts.extra ?? [])]
        .filter(Boolean)
        .join('-');
    case 'Miniature Board-to-Board Connector':
      return ['CONB2B', ...(opts.extra ?? ['PLUG', '40SC', '2PWR']), dimension, opts.familyToken ?? 'SERIES'].join('-');
    case 'FPC / FFC Connector':
      return ['CONFPC', ...(opts.extra ?? ['30C', 'P50', 'BOT', 'RA']), dimension, opts.familyToken ?? 'SERIES'].join('-');
    case 'JST-style Wire-to-Board Connector':
      return ['CONJST', opts.pitch ? encodePitch(opts.pitch) : 'P254', `${opts.pinCount ?? 2}C`, dimension, opts.familyToken ?? 'SERIES'].join('-');
    case 'Pin Header / Socket Header':
      return ['CONHDR', ...(opts.extra ?? ['PIN', 'P254', '10C', '2R', 'TH', 'VT']), dimension, opts.familyToken ?? 'SERIES'].join('-');
    default:
      return `GEN-${normalizeMpn(opts.type ?? 'PART')}-${dimension}`;
  }
};

export const classifyReviewFlags = (ctx: {
  hasDatasheet: boolean;
  hasUrl: boolean;
  dimensionsFound: boolean;
  heightFound: boolean;
  supported: boolean;
}): string[] => {
  const flags: string[] = [];
  if (!ctx.hasDatasheet) flags.push('DATASHEET_NOT_FOUND');
  if (!ctx.hasUrl) flags.push('NO_EXACT_MPN_ROW');
  if (!ctx.dimensionsFound) flags.push('MAX_DIMENSION_NOT_FOUND');
  if (!ctx.heightFound) flags.push('HEIGHT_NOT_FOUND');
  if (!ctx.supported) flags.push('OUT_OF_SCOPE_BEST_EFFORT');
  return flags;
};

export const descriptionForFamily = (family: Family, token: string, temp = '-40..85C'): string => {
  switch (family) {
    case 'Chip Passive / Chip LED':
      return buildDescription(['RES', token, '0402', temp]);
    case 'Leadless / Area-Array / SMD Resonator':
      return buildDescription(['IC', token, 'QFN', temp]);
    case 'Leaded SMD':
      return buildDescription(['IC', token, 'SOP', temp]);
    case 'Miniature Board-to-Board Connector':
      return buildDescription(['CON B2B', token, '0.35mm pitch', temp]);
    case 'FPC / FFC Connector':
      return buildDescription(['CON FPC', token, '0.5mm', 'RA', temp]);
    case 'JST-style Wire-to-Board Connector':
      return buildDescription(['CON JST', token, '2.54mm', temp]);
    case 'Pin Header / Socket Header':
      return buildDescription(['CON PinHdr', token, '2.54mm', temp]);
    default:
      return buildDescription(['GENERIC', token, temp]);
  }
};
