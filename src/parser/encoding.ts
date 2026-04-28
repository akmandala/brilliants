export const formatDecimalToken = (value: number): string =>
  value
    .toString()
    .replace('.', 'P')
    .replace(/P0+$/, 'P0')
    .replace(/(P\d*?)0+$/, '$1');

export const encodeDimension = (length: number, width: number, height?: number): string => {
  const lw = `${formatDecimalToken(length)}X${formatDecimalToken(width)}`;
  return height ? `${lw}-H${formatDecimalToken(height).replace(/^0P/, 'P')}` : lw;
};

const pitchMap: Record<string, string> = {
  '0.30': 'P30',
  '0.35': 'P35',
  '0.40': 'P40',
  '0.50': 'P50',
  '0.65': 'P65',
  '0.80': 'P80',
  '0.95': 'P95',
  '1.00': 'P100',
  '1.27': 'P127',
  '2.00': 'P200',
  '2.54': 'P254',
  '3.96': 'P396'
};

export const encodePitch = (pitchMm: number): string => {
  const fixed = pitchMm.toFixed(2);
  return pitchMap[fixed] ?? `P${Math.round(pitchMm * 100).toString()}`;
};

export const normalizeMpn = (mpn: string): string => mpn.trim().toUpperCase().replace(/\s+/g, '');

export const parseDimensions = (text?: string): { length?: number; width?: number; height?: number } => {
  if (!text) return {};
  const dims = text.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*(?:mm)?/);
  const height = text.match(/(?:height|h)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm/i);
  return {
    length: dims?.[1] ? Number(dims[1]) : undefined,
    width: dims?.[2] ? Number(dims[2]) : undefined,
    height: height?.[1] ? Number(height[1]) : undefined
  };
};
