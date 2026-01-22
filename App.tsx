import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, AlertCircle, FileText, Search, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Filter, X, List } from 'lucide-react';
import { parseTmxContent, normalizeTu } from './services/tmxParser';
import { createSearchWorker } from './services/workerUtils';
import { ParsedTmxData, NormalizedTu } from './types';
import { TuCard } from './components/TuCard';
import { HeaderStats } from './components/HeaderStats';

type SearchMode = 'text' | 'id_partial' | 'id_prefix';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTmxData | null>(null);
  
  // Master List
  const [normalizedTus, setNormalizedTus] = useState<NormalizedTu[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredIndices, setFilteredIndices] = useState<number[] | null>(null);
  
  // Batch Filter State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [isBatchActive, setIsBatchActive] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = createSearchWorker();
    
    workerRef.current.onmessage = (e) => {
      const { type, indices } = e.data;
      if (type === 'DATA_LOADED') {
        setLoading(false);
      }
      if (type === 'SEARCH_RESULTS') {
        setFilteredIndices(indices);
        setIsSearching(false);
        setCurrentPage(1);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setParsedData(null);
    setNormalizedTus([]);
    setFilteredIndices(null);
    setSearchQuery('');
    setBatchInput('');
    setIsBatchActive(false);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setTimeout(() => {
          try {
             const rawData = parseTmxContent(content);
             setParsedData(rawData);
             const headerSrc = rawData.tmx.header['@_srclang'] || 'en-US';
             const tus = rawData.tmx.body.tu.map((tu, idx) => normalizeTu(tu, idx, headerSrc));
             setNormalizedTus(tus);
             
             if (workerRef.current) {
               workerRef.current.postMessage({ type: 'LOAD_DATA', payload: tus });
             } else {
               setLoading(false);
             }

          } catch (parseErr) {
             console.error(parseErr);
             setError("Failed to parse TMX XML structure. Please check if the file is valid TMX.");
             setLoading(false);
          }
        }, 100);
      } catch (err) {
        setError("Error reading file content.");
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };

    reader.readAsText(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setNormalizedTus([]);
    setError(null);
    setSearchQuery('');
    setFilteredIndices(null);
    setCurrentPage(1);
    setBatchInput('');
    setIsBatchActive(false);
  };

  // Run Search (Standard or Batch)
  const triggerSearch = () => {
    if (!workerRef.current) return;

    if (isBatchActive) {
      // Batch mode
      const ids = batchInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        setFilteredIndices(null);
        setIsBatchActive(false);
        return;
      }
      setIsSearching(true);
      workerRef.current.postMessage({ 
        type: 'SEARCH', 
        payload: { query: '', mode: 'batch_id', batchList: ids } 
      });
    } else {
      // Standard search
      if (!searchQuery.trim()) {
        setFilteredIndices(null);
        return;
      }
      setIsSearching(true);
      workerRef.current.postMessage({ 
        type: 'SEARCH', 
        payload: { query: searchQuery, mode: searchMode } 
      });
    }
  };

  // Debounced Effect for standard search input
  useEffect(() => {
    if (isBatchActive) return; // Don't auto-search text if batch is active
    
    if (!searchQuery.trim()) {
      setFilteredIndices(null);
      return;
    }

    const timer = setTimeout(() => {
      triggerSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]);

  // Handle Batch Modal Submit
  const applyBatchFilter = () => {
    setShowBatchModal(false);
    if (!batchInput.trim()) {
      setIsBatchActive(false);
      setSearchQuery(''); // clear standard search to show nothing/all
      setFilteredIndices(null);
      return;
    }
    setIsBatchActive(true);
    setSearchQuery(''); // Clear text search visual
    triggerSearch();
  };

  const clearBatch = () => {
    setIsBatchActive(false);
    setBatchInput('');
    setFilteredIndices(null);
  };

  const totalCount = filteredIndices === null ? normalizedTus.length : filteredIndices.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  const currentTus = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    if (filteredIndices === null) {
      return normalizedTus.slice(start, end);
    } else {
      return filteredIndices.slice(start, end).map(idx => normalizedTus[idx]);
    }
  }, [normalizedTus, filteredIndices, currentPage]);

  if (!file || (!loading && !parsedData && !error && normalizedTus.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">🥝 TMXplorer</h1>
            <p className="text-slate-500 text-lg">
              Visualize, inspect, and analyze your Translation Memory eXchange files locally and securely.
            </p>
          </div>
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 hover:border-blue-500 hover:bg-slate-50 transition-all cursor-pointer relative group">
            <input type="file" accept=".tmx,.xml" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">Supported format: .tmx (XML)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Batch Filter Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <List size={18} /> Batch Filter by ID
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-sm text-slate-500 mb-2">Paste a list of x-segment-ids (one per line) to filter specifically.</p>
              <textarea 
                className="flex-1 w-full min-h-[200px] p-3 border border-slate-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder={`RingCentral.webModule.abc123\nRingCentral.webModule.xyz987`}
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button onClick={applyBatchFilter} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Apply Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReset} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
              title="Upload new file"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
               <FileText className="text-blue-600" size={20} />
               <h1 className="font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{file.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {parsedData && <span className="text-sm text-slate-500 hidden sm:inline-block">TMX v{parsedData.tmx['@_version']}</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Processing translation memory...</p>
          </div>
        )}

        {!loading && !error && parsedData && (
          <>
            <HeaderStats header={parsedData.tmx.header} totalTus={normalizedTus.length} />

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sticky top-16 bg-slate-50/95 backdrop-blur py-2 z-10 border-b border-slate-200/50">
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:max-w-3xl">
                {/* Search Controls */}
                <div className="flex flex-1 gap-0 shadow-sm rounded-lg overflow-hidden border border-slate-200">
                   {/* Search Mode Dropdown */}
                   <div className="bg-slate-50 border-r border-slate-200 px-2 flex items-center">
                     <select 
                       value={searchMode}
                       onChange={(e) => {
                         setSearchMode(e.target.value as SearchMode);
                         // If we were in batch mode, clear it
                         if (isBatchActive) clearBatch();
                       }}
                       disabled={isBatchActive}
                       className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none py-2 cursor-pointer disabled:opacity-50"
                     >
                       <option value="text">Full Text</option>
                       <option value="id_partial">ID (Partial)</option>
                       <option value="id_prefix">ID (Prefix)</option>
                     </select>
                   </div>
                   
                   {/* Search Input */}
                   <div className="relative flex-1 bg-white">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        placeholder={isBatchActive ? "Batch filter active" : "Search..."}
                        value={searchQuery}
                        disabled={isBatchActive}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-blue-50/20 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="text-blue-500 animate-spin" />
                        </div>
                      )}
                   </div>
                </div>

                {/* Batch Filter Button */}
                <button 
                  onClick={isBatchActive ? clearBatch : () => setShowBatchModal(true)}
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap
                    ${isBatchActive 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {isBatchActive ? <X size={16} /> : <Filter size={16} />}
                  {isBatchActive ? 'Clear Filter' : 'Batch Filter'}
                </button>
              </div>

              {/* Pagination Info */}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
                <span>Page {currentPage} of {totalPages || 1}</span>
                <span className="text-slate-300">|</span>
                <span>{totalCount.toLocaleString()} results</span>
              </div>
            </div>
            
            {/* TU List */}
            <div className="space-y-4">
              {currentTus.length > 0 ? (
                currentTus.map((tu) => (
                  <TuCard 
                    key={tu.id} 
                    tu={tu} 
                    searchMode={isBatchActive ? 'batch' : searchMode}
                    searchQuery={searchQuery}
                  />
                ))
              ) : (
                <div className="text-center py-20 text-slate-400">
                  <p>No translation units found matching your search.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pNum = i + 1;
                      if (currentPage > 3 && totalPages > 5) {
                         pNum = currentPage - 2 + i;
                         if (pNum > totalPages) pNum = totalPages - (4 - i);
                      }
                      if (pNum < 1) pNum = 1;
                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                            currentPage === pNum ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                   })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;