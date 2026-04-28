export type Role = 'user' | 'assistant' | 'system';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  chatIds: string[];
}

export interface ParserInput {
  mpn: string;
  manufacturer?: string;
  manufacturerUrl?: string;
  datasheetFileName?: string;
  datasheetText?: string;
  datasheetPageCount?: number;
}

export interface ParserResult {
  input: {
    mpn_original: string;
    manufacturer_input?: string;
    manufacturer_url?: string;
    datasheet_filename?: string;
  };
  classification: {
    supported_family: boolean;
    family: string;
    family_confidence: number;
    out_of_scope_note?: string;
  };
  identity: {
    manufacturer?: string;
    mpn_normalized: string;
    component_class?: string;
    sub_type?: string;
  };
  package: {
    footprint_name: string;
    base_name?: string;
    package_type?: string;
    package_family_raw?: string;
    package_family_normalized?: string;
    common_size?: string;
    size_system?: string;
    pin_count?: number;
    contact_count?: number;
    row_count?: number;
    pitch_mm?: number;
    row_pitch_mm?: number;
    length_max_mm?: number;
    width_max_mm?: number;
    height_max_mm?: number;
    dimension_basis?: string;
    termination?: string;
    exposed_pad?: boolean;
    footprint_variant?: string;
    series?: string;
  };
  extracted: Record<string, unknown>;
  altium: {
    description: string;
    pin_table_tsv?: string;
  };
  lcsc_jlc: {
    lookup_status: 'matched' | 'not_found' | 'not_configured' | 'error';
    search_query_english: string;
    best_match?: {
      source: 'LCSC' | 'JLCPCB' | 'JLCSEARCH_FALLBACK' | 'MOCK';
      part_number: string;
      manufacturer?: string;
      mpn?: string;
      description?: string;
      stock?: number;
      price?: string;
      url?: string;
      confidence?: number;
      reason?: string;
    };
    alternatives?: Array<{
      source: string;
      part_number: string;
      manufacturer?: string;
      mpn?: string;
      description?: string;
      stock?: number;
      confidence?: number;
    }>;
    notes?: string[];
  };
  confidence: {
    overall: number;
    source: string;
  };
  source_evidence: Array<{
    field: string;
    source: string;
    evidence?: string;
    confidence: number;
  }>;
  review_flags: string[];
}

export interface Message {
  id: string;
  role: Role;
  createdAt: string;
  input?: ParserInput;
  result?: ParserResult;
  text?: string;
}

export interface Chat {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Workspace {
  projects: Record<string, Project>;
  chats: Record<string, Chat>;
  selectedProjectId?: string;
  selectedChatId?: string;
  version: number;
}
