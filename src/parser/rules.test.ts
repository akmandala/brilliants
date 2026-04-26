import { describe, expect, it } from 'vitest';
import { encodeDimension, encodePitch } from './encoding';
import { buildFootprintName, detectFamily } from './rules';
import { validateDescriptionLength } from './descriptions';

describe('encoding', () => {
  it('encodes dimensions', () => {
    expect(encodeDimension(2.7, 2.2, 0.8)).toBe('2P7X2P2-HP8');
  });

  it('encodes pitch map', () => {
    expect(encodePitch(0.5)).toBe('P50');
    expect(encodePitch(1.27)).toBe('P127');
  });
});

describe('naming', () => {
  it('builds passive names', () => {
    expect(buildFootprintName({ family: 'Chip Passive / Chip LED', type: 'RES', size: '0402', length: 1.05, width: 0.55, height: 0.35 })).toContain('RES-0402');
  });

  it('builds leadless names', () => {
    expect(buildFootprintName({ family: 'Leadless / Area-Array / SMD Resonator', type: 'QFN', pinCount: 16, pitch: 0.5, length: 3.1, width: 3.1, height: 0.8 })).toBe('QFN-16-P50-3P1X3P1-HP8');
  });

  it('collapses SOP/QFP family detection', () => {
    expect(detectFamily('SN74LVC1T45', 'TSSOP')).toBe('Leaded SMD');
    expect(detectFamily('STM32', 'LQFP')).toBe('Leaded SMD');
  });

  it('builds connector names', () => {
    expect(buildFootprintName({ family: 'FPC / FFC Connector', length: 17.4, width: 4.5, height: 2.0, familyToken: 'FH12' })).toContain('CONFPC');
  });
});

describe('description', () => {
  it('enforces max length', () => {
    const input = 'x'.repeat(260);
    expect(validateDescriptionLength(input).length).toBeLessThanOrEqual(255);
  });
});
