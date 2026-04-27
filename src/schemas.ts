import { z } from 'zod';

export const parserInputSchema = z.object({
  mpn: z.string().min(1),
  manufacturer: z.string().optional(),
  manufacturerUrl: z.string().url().optional().or(z.literal('')),
  datasheetFileName: z.string().optional(),
  datasheetText: z.string().optional(),
  datasheetPageCount: z.number().int().positive().optional()
});

const bestMatchSchema = z.object({
  source: z.enum(['LCSC', 'JLCPCB', 'JLCSEARCH_FALLBACK', 'MOCK']),
  part_number: z.string(),
  manufacturer: z.string().optional(),
  mpn: z.string().optional(),
  description: z.string().optional(),
  stock: z.number().optional(),
  price: z.string().optional(),
  url: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().optional()
});

export const parserResultSchema = z.object({
  input: z.object({
    mpn_original: z.string(),
    manufacturer_input: z.string().optional(),
    manufacturer_url: z.string().optional(),
    datasheet_filename: z.string().optional()
  }),
  classification: z.object({
    supported_family: z.boolean(),
    family: z.string(),
    family_confidence: z.number().min(0).max(1),
    out_of_scope_note: z.string().optional()
  }),
  identity: z.object({
    manufacturer: z.string().optional(),
    mpn_normalized: z.string(),
    component_class: z.string().optional(),
    sub_type: z.string().optional()
  }),
  package: z.object({
    footprint_name: z.string(),
    base_name: z.string().optional(),
    package_type: z.string().optional(),
    package_family_raw: z.string().optional(),
    package_family_normalized: z.string().optional(),
    common_size: z.string().optional(),
    size_system: z.string().optional(),
    pin_count: z.number().optional(),
    contact_count: z.number().optional(),
    row_count: z.number().optional(),
    pitch_mm: z.number().optional(),
    row_pitch_mm: z.number().optional(),
    length_max_mm: z.number().optional(),
    width_max_mm: z.number().optional(),
    height_max_mm: z.number().optional(),
    dimension_basis: z.string().optional(),
    termination: z.string().optional(),
    exposed_pad: z.boolean().optional(),
    footprint_variant: z.string().optional(),
    series: z.string().optional()
  }),
  extracted: z.record(z.unknown()),
  altium: z.object({
    description: z.string().max(255),
    pin_table_tsv: z.string().optional()
  }),
  lcsc_jlc: z.object({
    lookup_status: z.enum(['matched', 'not_found', 'not_configured', 'error']),
    search_query_english: z.string(),
    best_match: bestMatchSchema.optional(),
    alternatives: z
      .array(
        z.object({
          source: z.string(),
          part_number: z.string(),
          manufacturer: z.string().optional(),
          mpn: z.string().optional(),
          description: z.string().optional(),
          stock: z.number().optional(),
          confidence: z.number().optional()
        })
      )
      .optional(),
    notes: z.array(z.string()).optional()
  }),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    source: z.string()
  }),
  source_evidence: z.array(
    z.object({
      field: z.string(),
      source: z.string(),
      evidence: z.string().optional(),
      confidence: z.number().min(0).max(1)
    })
  ),
  review_flags: z.array(z.string())
});

export type ParserInputSchema = z.infer<typeof parserInputSchema>;
export type ParserResultSchema = z.infer<typeof parserResultSchema>;
