export type PopularComponentFamily =
  | 'RES'
  | 'CAP'
  | 'IND'
  | 'LED'
  | 'IC'
  | 'CONB2B'
  | 'CONFPC'
  | 'CONJST'
  | 'CONHDR';

export type PopularHintStrength = 'strong' | 'medium' | 'weak';

export interface PopularPartHint {
  ruleId: string;
  manufacturer?: string;
  family: PopularComponentFamily;
  componentType?: string;
  subType?: string;
  functionHint?: string;
  commonSize?: string;
  sizeSystem?: 'imperial' | 'metric';
  metricSize?: string;
  imperialSize?: string;
  series?: string;
  packageFamilyRaw?: string;
  packageFamilyNormalized?: string;
  pitchMm?: number;
  contactCount?: number;
  signalCount?: number;
  powerCount?: number;
  connectorType?: 'PLUG' | 'RCPT';
  orientation?: 'RA' | 'VT';
  mounting?: 'SMD' | 'TH';
  contactSide?: 'TOP' | 'BOT' | 'DUAL' | 'VERT';
  confidence: number;
  strength: PopularHintStrength;
  notes: string[];
  reviewFlags: string[];
}

interface GrammarRule {
  id: string;
  re: RegExp;
  family: PopularComponentFamily;
  manufacturer?: string;
  strength: PopularHintStrength;
  confidence: number;
  build: (match: RegExpExecArray, normalizedMpn: string, manufacturerHint?: string) => PopularPartHint;
}

const METRIC_TO_IMPERIAL: Record<string, string> = {
  '0402': '01005',
  '0603': '0201',
  '1005': '0402',
  '1608': '0603',
  '2012': '0805',
  '3216': '1206',
  '3225': '1210',
  '4532': '1812',
  '5025': '2010',
  '6432': '2512'
};

const SAMSUNG_CL_TO_SIZE: Record<string, string> = {
  '03': '0201',
  '05': '0402',
  '10': '0603',
  '21': '0805',
  '31': '1206',
  '32': '1210',
  '43': '1812'
};

const MURATA_MLCC_SIZE: Record<string, string> = {
  '033': '0201',
  '155': '0402',
  '188': '0603',
  '18': '0603',
  '21': '0805',
  '31': '1206',
  '32': '1210'
};

const KOA_SIZE: Record<string, string> = {
  '1E': '0402',
  '1J': '0603',
  '2A': '0805',
  '2B': '1206',
  '2E': '1210'
};

function baseHint(args: Omit<PopularPartHint, 'notes' | 'reviewFlags'> & { notes?: string[]; reviewFlags?: string[] }): PopularPartHint {
  return {
    ...args,
    notes: args.notes ?? [],
    reviewFlags: ['POPULAR_GRAMMAR_HINT_USED', ...(args.reviewFlags ?? [])]
  };
}

function normalizeMpnForPopularRules(mpn: string): string {
  return mpn.toUpperCase().trim().replace(/\s+/g, '').replace(/[()]/g, '').replace(/,/g, '');
}

function preferManufacturer(manufacturerHint: string | undefined, fallback: string): string {
  return manufacturerHint?.trim() || fallback;
}

const resistorRules: GrammarRule[] = [
  {
    id: 'yageo-rc-imperial-size',
    re: /^RC(01005|0201|0402|0603|0805|1206|1210|1218|2010|2512)[A-Z0-9]/,
    family: 'RES',
    manufacturer: 'Yageo',
    strength: 'strong',
    confidence: 0.95,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'yageo-rc-imperial-size',
        manufacturer: preferManufacturer(mh, 'Yageo'),
        family: 'RES',
        componentType: 'RES',
        commonSize: m[1],
        sizeSystem: 'imperial',
        confidence: 0.95,
        strength: 'strong',
        notes: ['Yageo RC chip resistor grammar requires RC followed by imperial chip size.', 'Do not classify RC alone as Yageo.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'samsung-rc-metric-size',
    re: /^RC(0603|1005|1608|2012|3216|3225|4532|5025|6432)[A-Z0-9]/,
    family: 'RES',
    manufacturer: 'Samsung Electro-Mechanics',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) => {
      const metric = m[1];
      return baseHint({
        ruleId: 'samsung-rc-metric-size',
        manufacturer: preferManufacturer(mh, 'Samsung Electro-Mechanics'),
        family: 'RES',
        componentType: 'RES',
        commonSize: METRIC_TO_IMPERIAL[metric],
        metricSize: metric,
        sizeSystem: 'imperial',
        confidence: 0.82,
        strength: 'medium',
        notes: ['Samsung RC resistor grammar using metric size code after RC.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'vishay-crcw',
    re: /^CRCW(01005|0201|0402|0603|0805|1206|1210|1218|2010|2512)/,
    family: 'RES',
    manufacturer: 'Vishay',
    strength: 'strong',
    confidence: 0.93,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'vishay-crcw',
        manufacturer: preferManufacturer(mh, 'Vishay'),
        family: 'RES',
        componentType: 'RES',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: 'CRCW',
        confidence: 0.93,
        strength: 'strong',
        notes: ['Vishay CRCW chip resistor with imperial size in MPN.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'stackpole-rmcf',
    re: /^RMCF(01005|0201|0402|0603|0805|1206|1210|2010|2512)/,
    family: 'RES',
    manufacturer: 'Stackpole',
    strength: 'strong',
    confidence: 0.92,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'stackpole-rmcf',
        manufacturer: preferManufacturer(mh, 'Stackpole Electronics'),
        family: 'RES',
        componentType: 'RES',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: 'RMCF',
        confidence: 0.92,
        strength: 'strong',
        notes: ['Stackpole RMCF chip resistor with imperial size in MPN.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'bourns-cr-imperial',
    re: /^CR(01005|0201|0402|0603|0805|1206)[-_A-Z0-9]/,
    family: 'RES',
    manufacturer: 'Bourns',
    strength: 'medium',
    confidence: 0.78,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'bourns-cr-imperial',
        manufacturer: preferManufacturer(mh, 'Bourns'),
        family: 'RES',
        componentType: 'RES',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: `CR${m[1]}`,
        confidence: 0.78,
        strength: 'medium',
        notes: ['Bourns CR chip resistor grammar. CR is short, so require CR followed by known chip size.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'panasonic-erj',
    re: /^ERJ[-A-Z0-9]/,
    family: 'RES',
    manufacturer: 'Panasonic',
    strength: 'medium',
    confidence: 0.78,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'panasonic-erj',
        manufacturer: preferManufacturer(mh, 'Panasonic'),
        family: 'RES',
        componentType: 'RES',
        series: 'ERJ',
        confidence: 0.78,
        strength: 'medium',
        notes: ['Panasonic ERJ chip resistor family. Size requires Panasonic code decode or datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', 'COMMON_SIZE_NOT_CONFIRMED']
      })
  },
  {
    id: 'koa-rk73',
    re: /^RK73[A-Z]?(1E|1J|2A|2B|2E)/,
    family: 'RES',
    manufacturer: 'KOA Speer',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'koa-rk73',
        manufacturer: preferManufacturer(mh, 'KOA Speer'),
        family: 'RES',
        componentType: 'RES',
        commonSize: KOA_SIZE[m[1]],
        sizeSystem: 'imperial',
        series: 'RK73',
        confidence: 0.82,
        strength: 'medium',
        notes: ['KOA RK73 resistor with package size code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  }
];

const capacitorRules: GrammarRule[] = [
  {
    id: 'murata-grm-gcm-mlcc',
    re: /^(GRM|GCM)(033|155|188|18|21|31|32)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'Murata',
    strength: 'strong',
    confidence: 0.93,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'murata-grm-gcm-mlcc',
        manufacturer: preferManufacturer(mh, 'Murata'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: MURATA_MLCC_SIZE[m[2]],
        sizeSystem: 'imperial',
        series: m[1],
        confidence: 0.93,
        strength: 'strong',
        notes: ['Murata GRM/GCM MLCC grammar with size code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'samsung-cl-mlcc',
    re: /^CL(03|05|10|21|31|32|43)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'Samsung Electro-Mechanics',
    strength: 'strong',
    confidence: 0.93,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'samsung-cl-mlcc',
        manufacturer: preferManufacturer(mh, 'Samsung Electro-Mechanics'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: SAMSUNG_CL_TO_SIZE[m[1]],
        sizeSystem: 'imperial',
        series: 'CL',
        confidence: 0.93,
        strength: 'strong',
        notes: ['Samsung CL MLCC grammar with Samsung size code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'kemet-c-imperial-mlcc',
    re: /^C(01005|0201|0402|0603|0805|1206|1210|1812|2220)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'KEMET',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'kemet-c-imperial-mlcc',
        manufacturer: preferManufacturer(mh, 'KEMET'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: `C${m[1]}`,
        confidence: 0.82,
        strength: 'medium',
        notes: ['KEMET MLCC grammar C + imperial chip size. C alone must not be used as classifier.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'tdk-c-metric-mlcc',
    re: /^C(0603|1005|1608|2012|3216|3225|4532|5750)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'TDK',
    strength: 'medium',
    confidence: 0.8,
    build: (m, _mpn, mh) => {
      const metric = m[1];
      return baseHint({
        ruleId: 'tdk-c-metric-mlcc',
        manufacturer: preferManufacturer(mh, 'TDK'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: METRIC_TO_IMPERIAL[metric],
        metricSize: metric,
        sizeSystem: 'imperial',
        series: 'C',
        confidence: 0.8,
        strength: 'medium',
        notes: ['TDK MLCC grammar C + metric size code. C alone must not be used as classifier.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'yageo-cc-mlcc',
    re: /^CC(01005|0201|0402|0603|0805|1206|1210|1812)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'Yageo',
    strength: 'strong',
    confidence: 0.9,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'yageo-cc-mlcc',
        manufacturer: preferManufacturer(mh, 'Yageo'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: 'CC',
        confidence: 0.9,
        strength: 'strong',
        notes: ['Yageo CC MLCC grammar with imperial size.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'vishay-vj-mlcc',
    re: /^VJ(0402|0603|0805|1206|1210|1812)[A-Z0-9]/,
    family: 'CAP',
    manufacturer: 'Vishay',
    strength: 'medium',
    confidence: 0.78,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'vishay-vj-mlcc',
        manufacturer: preferManufacturer(mh, 'Vishay'),
        family: 'CAP',
        componentType: 'CAP',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: 'VJ',
        confidence: 0.78,
        strength: 'medium',
        notes: ['Vishay VJ MLCC grammar with imperial size.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  }
];

const inductorRules: GrammarRule[] = [
  {
    id: 'murata-dfe-power-inductor',
    re: /^DFE(201610|201612|252012|322512|322520|404012)[A-Z]?[-_]/,
    family: 'IND',
    manufacturer: 'Murata',
    strength: 'strong',
    confidence: 0.93,
    build: (m, _mpn, mh) => {
      const code = m[1];
      const commonSize = code.slice(0, 4);
      return baseHint({
        ruleId: 'murata-dfe-power-inductor',
        manufacturer: preferManufacturer(mh, 'Murata'),
        family: 'IND',
        componentType: 'IND',
        commonSize,
        sizeSystem: 'metric',
        series: `DFE${code}`,
        confidence: 0.93,
        strength: 'strong',
        notes: ['Murata DFE metal composite/power inductor grammar with metric package code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'murata-lqp03',
    re: /^LQP03[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'Murata',
    strength: 'strong',
    confidence: 0.9,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'murata-lqp03',
        manufacturer: preferManufacturer(mh, 'Murata'),
        family: 'IND',
        componentType: 'IND',
        commonSize: '0201',
        sizeSystem: 'imperial',
        series: 'LQP03',
        confidence: 0.9,
        strength: 'strong',
        notes: ['Murata LQP03 RF/chip inductor grammar, usually 0201.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'murata-lqg15',
    re: /^LQG15[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'Murata',
    strength: 'strong',
    confidence: 0.9,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'murata-lqg15',
        manufacturer: preferManufacturer(mh, 'Murata'),
        family: 'IND',
        componentType: 'IND',
        commonSize: '0402',
        sizeSystem: 'imperial',
        series: 'LQG15',
        confidence: 0.9,
        strength: 'strong',
        notes: ['Murata LQG15 RF/chip inductor grammar, usually 0402.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'johanson-lrc-imperial',
    re: /^LRC(0201|0402|0603|0805)[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'Johanson Technology',
    strength: 'strong',
    confidence: 0.9,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'johanson-lrc-imperial',
        manufacturer: preferManufacturer(mh, 'Johanson Technology'),
        family: 'IND',
        componentType: 'IND',
        commonSize: m[1],
        sizeSystem: 'imperial',
        series: `LRC${m[1]}`,
        confidence: 0.9,
        strength: 'strong',
        notes: ['Johanson LRC chip inductor grammar with imperial size.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'tdk-mlz-metric',
    re: /^MLZ(1005|1608|2012|2520|3225)[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'TDK',
    strength: 'medium',
    confidence: 0.84,
    build: (m, _mpn, mh) => {
      const metric = m[1];
      return baseHint({
        ruleId: 'tdk-mlz-metric',
        manufacturer: preferManufacturer(mh, 'TDK'),
        family: 'IND',
        componentType: 'IND',
        commonSize: metric,
        sizeSystem: 'metric',
        imperialSize: METRIC_TO_IMPERIAL[metric],
        series: `MLZ${metric}`,
        confidence: 0.84,
        strength: 'medium',
        notes: ['TDK MLZ inductor grammar with metric size code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'tdk-tfm-power-inductor',
    re: /^TFM(160808|201610|201612|252012|322512)[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'TDK',
    strength: 'medium',
    confidence: 0.86,
    build: (m, _mpn, mh) => {
      const code = m[1];
      return baseHint({
        ruleId: 'tdk-tfm-power-inductor',
        manufacturer: preferManufacturer(mh, 'TDK'),
        family: 'IND',
        componentType: 'IND',
        commonSize: code.slice(0, 4),
        sizeSystem: 'metric',
        series: `TFM${code}`,
        confidence: 0.86,
        strength: 'medium',
        notes: ['TDK TFM thin-film/power inductor grammar with metric package code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'taiyo-yuden-lbr-metric',
    re: /^LBR(1005|1608|2012|2520)[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'Taiyo Yuden',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'taiyo-yuden-lbr-metric',
        manufacturer: preferManufacturer(mh, 'Taiyo Yuden'),
        family: 'IND',
        componentType: 'IND',
        commonSize: m[1],
        sizeSystem: 'metric',
        imperialSize: METRIC_TO_IMPERIAL[m[1]],
        series: `LBR${m[1]}`,
        confidence: 0.82,
        strength: 'medium',
        notes: ['Taiyo Yuden LBR inductor grammar with metric size code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'vishay-ihhp',
    re: /^IHHP(0806|1008|1210|1616)[A-Z0-9]/,
    family: 'IND',
    manufacturer: 'Vishay',
    strength: 'medium',
    confidence: 0.78,
    build: (m, _mpn, mh) => {
      const imperialPackage = m[1];
      const metricMap: Record<string, string> = {
        '0806': '2016',
        '1008': '2520',
        '1210': '3225',
        '1616': '4040'
      };
      return baseHint({
        ruleId: 'vishay-ihhp',
        manufacturer: preferManufacturer(mh, 'Vishay'),
        family: 'IND',
        componentType: 'IND',
        commonSize: metricMap[imperialPackage],
        sizeSystem: 'metric',
        imperialSize: imperialPackage,
        series: `IHHP${imperialPackage}`,
        confidence: 0.78,
        strength: 'medium',
        notes: ['Vishay IHHP power inductor grammar; MPN uses imperial-like package code.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      });
    }
  },
  {
    id: 'wurth-74438-power-inductor',
    re: /^74438[0-9]{6,}/,
    family: 'IND',
    manufacturer: 'Würth Elektronik',
    strength: 'weak',
    confidence: 0.6,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'wurth-74438-power-inductor',
        manufacturer: preferManufacturer(mh, 'Würth Elektronik'),
        family: 'IND',
        componentType: 'IND',
        series: 'WE-MAPI',
        confidence: 0.6,
        strength: 'weak',
        notes: ['Würth numeric MPN family likely power inductor. Dimensions and size must come from datasheet/product page.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', 'COMMON_SIZE_NOT_CONFIRMED']
      })
  }
];

const ledRules: GrammarRule[] = [
  {
    id: 'wurth-150060-chip-led',
    re: /^150060[A-Z0-9]/,
    family: 'LED',
    manufacturer: 'Würth Elektronik',
    strength: 'strong',
    confidence: 0.88,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'wurth-150060-chip-led',
        manufacturer: preferManufacturer(mh, 'Würth Elektronik'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        sizeSystem: 'imperial',
        series: 'WL-SMCW',
        confidence: 0.88,
        strength: 'strong',
        notes: ['Würth 150060 chip LED grammar, sampled as 0603 LED.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'inolux-in-s63',
    re: /^IN[-_]?S63[A-Z0-9]/,
    family: 'LED',
    manufacturer: 'Inolux',
    strength: 'strong',
    confidence: 0.88,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'inolux-in-s63',
        manufacturer: preferManufacturer(mh, 'Inolux'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        sizeSystem: 'imperial',
        series: 'IN-S63',
        confidence: 0.88,
        strength: 'strong',
        notes: ['Inolux IN-S63 chip LED grammar, sampled as 0603 LED.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'dialight-5988',
    re: /^5988[0-9A-Z]/,
    family: 'LED',
    manufacturer: 'Dialight',
    strength: 'medium',
    confidence: 0.78,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'dialight-5988',
        manufacturer: preferManufacturer(mh, 'Dialight'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        sizeSystem: 'imperial',
        series: '598',
        confidence: 0.78,
        strength: 'medium',
        notes: ['Dialight 598-series grammar sampled as 0603 LED.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'vishay-vlm-1300-chipled',
    re: /^VLM[A-Z]?1300[-_A-Z0-9]/,
    family: 'LED',
    manufacturer: 'Vishay',
    strength: 'medium',
    confidence: 0.78,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'vishay-vlm-1300-chipled',
        manufacturer: preferManufacturer(mh, 'Vishay'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        sizeSystem: 'imperial',
        series: 'CHIPLED',
        confidence: 0.78,
        strength: 'medium',
        notes: ['Vishay VLMx1300 CHIPLED grammar sampled as 0603 LED.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'liteon-ltst-c19',
    re: /^LTST[-_]?C19[A-Z0-9]/,
    family: 'LED',
    manufacturer: 'Lite-On',
    strength: 'medium',
    confidence: 0.75,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'liteon-ltst-c19',
        manufacturer: preferManufacturer(mh, 'Lite-On'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        sizeSystem: 'imperial',
        series: 'LTST-C19',
        confidence: 0.75,
        strength: 'medium',
        notes: ['Lite-On LTST-C19 family commonly used for 0603 chip LED variants.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'kingbright-1608-chip-led',
    re: /^(APG|APH|APT|KPG|KP)[A-Z0-9-]*1608[A-Z0-9-]*/,
    family: 'LED',
    manufacturer: 'Kingbright',
    strength: 'weak',
    confidence: 0.65,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'kingbright-1608-chip-led',
        manufacturer: preferManufacturer(mh, 'Kingbright'),
        family: 'LED',
        componentType: 'LED',
        commonSize: '0603',
        metricSize: '1608',
        sizeSystem: 'imperial',
        confidence: 0.65,
        strength: 'weak',
        notes: ['Kingbright-like chip LED grammar with 1608 metric size. Confirm exact family from datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  }
];

const connectorRules: GrammarRule[] = [
  {
    id: 'jae-wp26dk-b2b',
    re: /^(WP26DK)-([PS])(\d{3})[A-Z0-9-]*/,
    family: 'CONB2B',
    manufacturer: 'JAE',
    strength: 'strong',
    confidence: 0.92,
    build: (m, _mpn, mh) =>
      baseHint({
        ruleId: 'jae-wp26dk-b2b',
        manufacturer: preferManufacturer(mh, 'JAE'),
        family: 'CONB2B',
        series: m[1],
        connectorType: m[2] === 'P' ? 'PLUG' : 'RCPT',
        signalCount: Number.parseInt(m[3], 10),
        powerCount: 2,
        pitchMm: 0.35,
        confidence: 0.92,
        strength: 'strong',
        notes: ['JAE WP26DK miniature B2B grammar. P=plug, S=receptacle, numeric group=signal count, 2 power contacts.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'hirose-fh-fpc',
    re: /^(FH\d{2}[A-Z]?)-(\d+)S-([0-9]+(?:\.[0-9]+)?)(SH|SV|SVA|SHW)?/,
    family: 'CONFPC',
    manufacturer: 'Hirose',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) => {
      const series = m[1];
      const pitch = Number.parseFloat(m[3]);
      const orientation = m[4]?.startsWith('SV') ? 'VT' : 'RA';
      let contactSide: 'TOP' | 'BOT' | 'DUAL' | 'VERT' | undefined;
      if (series === 'FH12A') contactSide = 'TOP';
      else if (series === 'FH12') contactSide = 'BOT';
      return baseHint({
        ruleId: 'hirose-fh-fpc',
        manufacturer: preferManufacturer(mh, 'Hirose'),
        family: 'CONFPC',
        series,
        contactCount: Number.parseInt(m[2], 10),
        pitchMm: pitch,
        orientation,
        contactSide,
        confidence: contactSide ? 0.82 : 0.72,
        strength: 'medium',
        notes: ['Hirose FH-series FPC grammar. Contact side is series-dependent and must be confirmed from datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', ...(contactSide ? [] : ['CONTACT_SIDE_UNCONFIRMED'])]
      });
    }
  },
  {
    id: 'jst-wire-to-board-s-b',
    re: /^S(\d+)B-([A-Z0-9]+)-/,
    family: 'CONJST',
    manufacturer: 'JST',
    strength: 'strong',
    confidence: 0.9,
    build: (m, _mpn, mh) => {
      const series = m[2];
      const pitchMap: Record<string, number> = {
        SH: 1.0,
        GH: 1.25,
        ZH: 1.5,
        PH: 2.0,
        XH: 2.5,
        VH: 3.96
      };
      return baseHint({
        ruleId: 'jst-wire-to-board-s-b',
        manufacturer: preferManufacturer(mh, 'JST'),
        family: 'CONJST',
        series,
        contactCount: Number.parseInt(m[1], 10),
        pitchMm: pitchMap[series],
        mounting: 'SMD',
        orientation: 'RA',
        confidence: 0.9,
        strength: 'strong',
        notes: ['JST S<n>B-<series> grammar, commonly SMD right-angle wire-to-board header.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', ...(pitchMap[series] ? [] : ['PITCH_NOT_FOUND'])]
      });
    }
  },
  {
    id: 'jst-wire-to-board-b-b',
    re: /^B(\d+)B-([A-Z0-9]+)-/,
    family: 'CONJST',
    manufacturer: 'JST',
    strength: 'medium',
    confidence: 0.82,
    build: (m, _mpn, mh) => {
      const series = m[2];
      const pitchMap: Record<string, number> = {
        SH: 1.0,
        GH: 1.25,
        ZH: 1.5,
        PH: 2.0,
        XH: 2.5,
        VH: 3.96
      };
      return baseHint({
        ruleId: 'jst-wire-to-board-b-b',
        manufacturer: preferManufacturer(mh, 'JST'),
        family: 'CONJST',
        series,
        contactCount: Number.parseInt(m[1], 10),
        pitchMm: pitchMap[series],
        mounting: 'TH',
        orientation: 'VT',
        confidence: 0.82,
        strength: 'medium',
        notes: ['JST B<n>B-<series> grammar, commonly through-hole vertical wire-to-board header.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', ...(pitchMap[series] ? [] : ['PITCH_NOT_FOUND'])]
      });
    }
  },
  {
    id: 'samtec-tsw-header',
    re: /^TSW-(\d{3})-[A-Z0-9]+-[A-Z0-9]+-([SDTQ])(?:-|$)/,
    family: 'CONHDR',
    manufacturer: 'Samtec',
    strength: 'medium',
    confidence: 0.75,
    build: (m, _mpn, mh) => {
      const positionsPerRow = Number.parseInt(m[1].slice(1), 10);
      const rowCode = m[2];
      const rowMap: Record<string, number> = { S: 1, D: 2, T: 3, Q: 4 };
      const rows = rowMap[rowCode] ?? 1;
      return baseHint({
        ruleId: 'samtec-tsw-header',
        manufacturer: preferManufacturer(mh, 'Samtec'),
        family: 'CONHDR',
        series: 'TSW',
        pitchMm: 2.54,
        contactCount: positionsPerRow * rows,
        confidence: 0.75,
        strength: 'medium',
        notes: ['Samtec TSW pin header grammar. Confirm mount/orientation/height from datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', 'HEIGHT_NOT_FOUND']
      });
    }
  },
  {
    id: 'wurth-613-619-header',
    re: /^(613|619)\d{8,}/,
    family: 'CONHDR',
    manufacturer: 'Würth Elektronik',
    strength: 'weak',
    confidence: 0.55,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'wurth-613-619-header',
        manufacturer: preferManufacturer(mh, 'Würth Elektronik'),
        family: 'CONHDR',
        series: 'WRPHD',
        confidence: 0.55,
        strength: 'weak',
        notes: ['Würth numeric WR-PHD-like header/socket family. Needs datasheet/product page for contact count and dimensions.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', 'PIN_COUNT_NOT_FOUND', 'HEIGHT_NOT_FOUND']
      })
  }
];

const tiTpsRules: GrammarRule[] = [
  {
    id: 'ti-tps628-buck',
    re: /^TPS628\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'strong',
    confidence: 0.88,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps628-buck',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'DCDC',
        functionHint: 'Buck converter',
        confidence: 0.88,
        strength: 'strong',
        notes: ['TI TPS628xx family heuristic: buck / step-down converter candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps62-buck',
    re: /^TPS62\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.82,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps62-buck',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'DCDC',
        functionHint: 'Buck converter candidate',
        confidence: 0.82,
        strength: 'medium',
        notes: ['TI TPS62xx heuristic: usually buck/step-down converter, confirm datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps610-boost',
    re: /^TPS61\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.82,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps610-boost',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'DCDC',
        functionHint: 'Boost converter candidate',
        confidence: 0.82,
        strength: 'medium',
        notes: ['TI TPS61xx heuristic: boost/step-up converter candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps630-buck-boost',
    re: /^TPS63\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'strong',
    confidence: 0.88,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps630-buck-boost',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'DCDC',
        functionHint: 'Buck-boost converter',
        confidence: 0.88,
        strength: 'strong',
        notes: ['TI TPS63xx heuristic: buck-boost converter candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps54-56-buck',
    re: /^TPS5(4|6)\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.78,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps54-56-buck',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'DCDC',
        functionHint: 'Buck converter / switching regulator candidate',
        confidence: 0.78,
        strength: 'medium',
        notes: ['TI TPS54xx/TPS56xx heuristic: buck switching regulator candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps7-ldo',
    re: /^TPS7[A-Z0-9]\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.8,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps7-ldo',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'LDO',
        functionHint: 'Linear regulator / LDO candidate',
        confidence: 0.8,
        strength: 'medium',
        notes: ['TI TPS7x heuristic: LDO/linear regulator candidate, confirm datasheet.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps229-load-switch',
    re: /^TPS229\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'strong',
    confidence: 0.88,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps229-load-switch',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'Load Switch',
        functionHint: 'Load switch / power distribution switch',
        confidence: 0.88,
        strength: 'strong',
        notes: ['TI TPS229xx heuristic: load switch/power distribution switch.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps259-efuse',
    re: /^TPS259\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'strong',
    confidence: 0.86,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps259-efuse',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'eFuse',
        functionHint: 'eFuse / hot-swap protection candidate',
        confidence: 0.86,
        strength: 'strong',
        notes: ['TI TPS259xx heuristic: eFuse/hot-swap protection candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps25-usb-power-switch',
    re: /^TPS25\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.76,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps25-usb-power-switch',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'Power Switch',
        functionHint: 'USB/current-limited power switch candidate',
        confidence: 0.76,
        strength: 'medium',
        notes: ['TI TPS25xx heuristic: USB/current-limited power switch candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps38-37-supervisor',
    re: /^TPS3(7|8)\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.76,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps38-37-supervisor',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'Supervisor',
        functionHint: 'Voltage supervisor / monitor candidate',
        confidence: 0.76,
        strength: 'medium',
        notes: ['TI TPS37xx/TPS38xx heuristic: voltage supervisor/monitor candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps65-pmic',
    re: /^TPS65\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.72,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps65-pmic',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'PMIC',
        functionHint: 'PMIC / multi-rail power management candidate; some devices include charger or power path',
        confidence: 0.72,
        strength: 'medium',
        notes: ['TI TPS65xx heuristic: PMIC candidate. Do not call it battery charger unless datasheet confirms charger function.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps257-usbc-pd',
    re: /^TPS257\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'medium',
    confidence: 0.78,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps257-usbc-pd',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'Interface',
        functionHint: 'USB Type-C / USB PD controller candidate',
        confidence: 0.78,
        strength: 'medium',
        notes: ['TI TPS257xx heuristic: USB Type-C/USB PD controller candidate.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED']
      })
  },
  {
    id: 'ti-tps-generic-power',
    re: /^TPS\d+/,
    family: 'IC',
    manufacturer: 'Texas Instruments',
    strength: 'weak',
    confidence: 0.55,
    build: (_m, _mpn, mh) =>
      baseHint({
        ruleId: 'ti-tps-generic-power',
        manufacturer: preferManufacturer(mh, 'Texas Instruments'),
        family: 'IC',
        componentType: 'IC',
        subType: 'Power',
        functionHint: 'TI TPS power-management IC candidate',
        confidence: 0.55,
        strength: 'weak',
        notes: ['TPS prefix is broad. Use only as weak TI power-management hint.'],
        reviewFlags: ['DATASHEET_CONFIRMATION_REQUIRED', 'BROAD_TPS_PREFIX_ONLY']
      })
  }
];

const allRules: GrammarRule[] = [...resistorRules, ...capacitorRules, ...inductorRules, ...ledRules, ...connectorRules, ...tiTpsRules];

export function classifyPopularPart(mpn: string, manufacturerHint?: string): PopularPartHint | null {
  const normalized = normalizeMpnForPopularRules(mpn);

  for (const rule of allRules) {
    const match = rule.re.exec(normalized);
    if (match) {
      return rule.build(match, normalized, manufacturerHint);
    }
  }

  return null;
}

export const POPULAR_GRAMMAR_RULE_IDS = allRules.map((rule) => rule.id);
