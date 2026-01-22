import React, { useState, useMemo, useEffect } from 'react';
import { Upload, AlertCircle, FileText, Search, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseTmxContent, normalizeTu } from './services/tmxParser';
import { ParsedTmxData, NormalizedTu } from './types';
import { TuCard } from './components/TuCard';
import { HeaderStats } from './components/HeaderStats';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTmxData | null>(null);
  const [normalizedTus, setNormalizedTus] = useState<NormalizedTu[]>([]);
  
  // Filtering & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setParsedData(null);
    setNormalizedTus([]);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Basic check for file size to warn user
        if (content.length > 50 * 1024 * 1024) {
           // In a real app, we'd suggest streaming.
           console.warn("Large file detected. Parsing may take a moment.");
        }
        
        // Timeout to allow UI to render loading state before heavy parsing blocks main thread
        setTimeout(() => {
          try {
             const rawData = parseTmxContent(content);
             setParsedData(rawData);
             
             // Normalize immediately for easier searching/rendering
             const headerSrc = rawData.tmx.header['@_srclang'] || 'en-US';
             const tus = rawData.tmx.body.tu.map((tu, idx) => normalizeTu(tu, idx, headerSrc));
             setNormalizedTus(tus);
             setLoading(false);
          } catch (parseErr) {
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
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredTus = useMemo(() => {
    if (!searchQuery) return normalizedTus;
    const lowerQuery = searchQuery.toLowerCase();
    
    return normalizedTus.filter(tu => {
      // Search in ID
      if (tu.id.toLowerCase().includes(lowerQuery)) return true;
      // Search in variants text
      return tu.variants.some(v => v.text.toLowerCase().includes(lowerQuery));
    });
  }, [normalizedTus, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTus.length / itemsPerPage);
  
  const currentTus = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTus.slice(start, start + itemsPerPage);
  }, [filteredTus, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Views ---

  if (!file || (!loading && !parsedData && !error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">TMXplorer</h1>
            <p className="text-slate-500 text-lg">
              Visualize, inspect, and analyze your Translation Memory eXchange files locally and securely.
            </p>
          </div>

          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 hover:border-blue-500 hover:bg-slate-50 transition-all cursor-pointer relative group">
            <input 
              type="file" 
              accept=".tmx,.xml" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
               <h1 className="font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">
                 {file.name}
               </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {parsedData && (
              <span className="text-sm text-slate-500 hidden sm:inline-block">
                TMX v{parsedData.tmx['@_version']}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Parsing translation units...</p>
            <p className="text-slate-400 text-sm mt-1">Large files may take a few seconds.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-lg mx-auto mt-10">
            <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
            <h3 className="text-lg font-bold text-red-700 mb-1">Parsing Error</h3>
            <p className="text-red-600">{error}</p>
            <button onClick={handleReset} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Try Again</button>
          </div>
        )}

        {!loading && !error && parsedData && (
          <>
            <HeaderStats 
              header={parsedData.tmx.header} 
              totalTus={normalizedTus.length} 
            />

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-16 bg-slate-50/95 backdrop-blur py-2 z-10 border-b border-slate-200/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search segments or IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span>Page {currentPage} of {totalPages || 1}</span>
                <span className="text-slate-300">|</span>
                <span>{filteredTus.length} results</span>
              </div>
            </div>
            
            {/* TU List */}
            <div className="space-y-4">
              {currentTus.length > 0 ? (
                currentTus.map((tu) => (
                  <TuCard key={tu.id} tu={tu} />
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
                   {/* Simplified pagination for demo */}
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic to show pages around current page could be added here
                      // Keeping it simple: Show first 5 or shift logic if needed
                      let pNum = i + 1;
                      if (currentPage > 3 && totalPages > 5) {
                         pNum = currentPage - 2 + i;
                         if (pNum > totalPages) pNum -= (pNum - totalPages);
                      }
                      
                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                            currentPage === pNum 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
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
