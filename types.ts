// TMX XML Structure Interfaces

export interface TmxProp {
  '@_type': string;
  '#text': string;
}

export interface TmxSeg {
  '#text': string;
}

export interface TmxTuv {
  '@_xml:lang': string;
  '@_creationdate'?: string;
  '@_creationid'?: string;
  '@_changedate'?: string;
  '@_changeid'?: string;
  seg: string | TmxSeg; // parser might return string or object depending on content
  prop?: TmxProp[] | TmxProp;
}

export interface TmxTu {
  '@_tuid'?: string;
  '@_creationdate'?: string;
  '@_creationid'?: string;
  '@_changedate'?: string;
  '@_changeid'?: string;
  '@_usagecount'?: string;
  '@_lastusagedate'?: string;
  '@_src'?: string; // Sometimes source is defined at TU level
  prop?: TmxProp[] | TmxProp;
  tuv: TmxTuv[];
}

export interface TmxHeader {
  '@_creationtool'?: string;
  '@_creationtoolversion'?: string;
  '@_segtype'?: string;
  '@_o-tmf'?: string;
  '@_adminlang'?: string;
  '@_srclang'?: string;
  '@_datatype'?: string;
  prop?: TmxProp[] | TmxProp;
}

export interface TmxBody {
  tu: TmxTu[];
}

export interface TmxRoot {
  header: TmxHeader;
  body: TmxBody;
  '@_version': string;
}

export interface ParsedTmxData {
  tmx: TmxRoot;
}

// Application Logic Types

export interface NormalizedTu {
  id: string;
  srcLang: string; // derived from header or first TUV
  variants: {
    lang: string;
    text: string;
  }[];
  props: Record<string, string>;
  metadata: {
    creationDate?: string;
    changeDate?: string;
    usageCount?: string;
    createUser?: string;
    changeUser?: string;
  };
}

export interface TmxStats {
  totalUnits: number;
  sourceLang: string;
  languages: string[];
  tool: string;
  version: string;
}
