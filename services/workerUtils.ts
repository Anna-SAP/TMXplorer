/**
 * This file contains the source code for the Web Worker.
 * We use a Blob approach to ensure it works without complex bundler configurations.
 */

const workerCode = `
self.onmessage = function(e) {
  const { type, payload } = e.data;

  if (type === 'LOAD_DATA') {
    // payload is NormalizedTu[]
    // We construct a structured index
    self.searchIndex = payload.map((tu, index) => {
      const sourceText = tu.variants.find(v => v.lang === tu.srcLang)?.text || '';
      const targetTexts = tu.variants.filter(v => v.lang !== tu.srcLang).map(v => v.text).join(' ');
      const segmentId = (tu.props['x-segment-id'] || '').toLowerCase(); // Normalize for search
      
      return {
        id: index, // Original index
        // Full text blob for general search
        fullText: (tu.id + ' ' + sourceText + ' ' + targetTexts + ' ' + segmentId).toLowerCase(),
        // Specific field for targeted search
        segmentId: segmentId
      };
    });
    
    self.postMessage({ type: 'DATA_LOADED', count: self.searchIndex.length });
  }

  if (type === 'SEARCH') {
    // payload: { query: string, mode: 'text' | 'id_prefix' | 'id_exact' | 'batch_id', batchList?: string[] }
    const { query, mode, batchList } = payload;
    const lowerQuery = query ? query.toLowerCase() : '';
    
    if (!lowerQuery && (!batchList || batchList.length === 0)) {
      self.postMessage({ type: 'SEARCH_RESULTS', indices: null }); // null means "show all"
      return;
    }

    const results = [];
    const limit = 2000;
    
    // Batch Mode Logic (Set lookup for speed)
    if (mode === 'batch_id' && batchList) {
       const idSet = new Set(batchList.map(id => id.toLowerCase().trim()).filter(Boolean));
       
       for (let i = 0; i < self.searchIndex.length; i++) {
         if (idSet.has(self.searchIndex[i].segmentId)) {
           results.push(self.searchIndex[i].id);
           if (results.length >= limit) break;
         }
       }
    } 
    // Segment ID Prefix Logic
    else if (mode === 'id_prefix') {
       for (let i = 0; i < self.searchIndex.length; i++) {
         if (self.searchIndex[i].segmentId.startsWith(lowerQuery)) {
           results.push(self.searchIndex[i].id);
           if (results.length >= limit) break;
         }
       }
    }
    // Segment ID Partial/Exact Logic (using includes for user friendliness, or exact if specified)
    else if (mode === 'id_partial') {
       for (let i = 0; i < self.searchIndex.length; i++) {
         if (self.searchIndex[i].segmentId.includes(lowerQuery)) {
           results.push(self.searchIndex[i].id);
           if (results.length >= limit) break;
         }
       }
    }
    // Default Full Text Logic
    else {
      for (let i = 0; i < self.searchIndex.length; i++) {
        if (self.searchIndex[i].fullText.includes(lowerQuery)) {
          results.push(self.searchIndex[i].id);
          if (results.length >= limit) break;
        }
      }
    }

    self.postMessage({ type: 'SEARCH_RESULTS', indices: results, limited: results.length >= limit });
  }
};
`;

export const createSearchWorker = () => {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};