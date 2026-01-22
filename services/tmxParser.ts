import { XMLParser } from 'fast-xml-parser';
import { ParsedTmxData, NormalizedTu, TmxTu, TmxTuv, TmxProp } from '../types';

/**
 * Parses a raw TMX XML string into a usable JavaScript object.
 * We use fast-xml-parser for performance on large strings.
 */
export const parseTmxContent = (xmlContent: string): ParsedTmxData => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Ensure critical fields are always arrays, even if only one exists
    isArray: (name) => {
      return ['tu', 'tuv', 'prop'].indexOf(name) !== -1;
    },
    textNodeName: '#text'
  });

  try {
    const result = parser.parse(xmlContent);
    if (!result.tmx) {
      throw new Error('Invalid TMX file: Missing root <tmx> element.');
    }
    return result as ParsedTmxData;
  } catch (error) {
    console.error("XML Parsing Error", error);
    throw new Error('Failed to parse XML content.');
  }
};

/**
 * Helper to normalize segment text which might be complex (contain tags) or simple.
 */
const extractText = (seg: any): string => {
  if (typeof seg === 'string') return seg;
  if (seg && seg['#text']) return seg['#text'];
  // If seg contains nested tags (like <bpt>, <ept>), fast-xml-parser might objectify them.
  // For this viewer, we primarily want readable text. 
  // A robust implementation would recursively traverse the object to reconstruct the string.
  // This is a simplified fallback for standard text.
  return JSON.stringify(seg); 
};

/**
 * Normalizes props into a key-value map for easier UI consumption.
 */
const normalizeProps = (props?: TmxProp[] | TmxProp): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!props) return map;
  
  const list = Array.isArray(props) ? props : [props];
  list.forEach(p => {
    if (p['@_type']) {
      map[p['@_type']] = p['#text'] || '';
    }
  });
  return map;
};

/**
 * Transforms raw TMX TU objects into a normalized structure for the UI.
 * This decouples the view from the specific XML library structure.
 */
export const normalizeTu = (rawTu: TmxTu, index: number, defaultSrcLang: string): NormalizedTu => {
  const variants = rawTu.tuv.map((v: TmxTuv) => ({
    lang: v['@_xml:lang'] || 'unknown',
    text: extractText(v.seg)
  }));

  // Attempt to identify source lang if not explicitly marked, usually matches header srclang
  const srcLang = defaultSrcLang; 
  
  return {
    id: rawTu['@_tuid'] || `generated-${index}`,
    srcLang,
    variants,
    props: normalizeProps(rawTu.prop),
    metadata: {
      creationDate: rawTu['@_creationdate'],
      changeDate: rawTu['@_changedate'],
      usageCount: rawTu['@_usagecount'],
      createUser: rawTu['@_creationid'],
      changeUser: rawTu['@_changeid']
    }
  };
};
