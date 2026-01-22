import React, { useState } from 'react';
import { NormalizedTu } from '../types';
import { Clock, User, Hash, Tag, Calendar, Layers, Copy, Check } from 'lucide-react';

interface TuCardProps {
  tu: NormalizedTu;
  highlightText?: string; // Currently unused but good for future ext
  searchMode?: string;
  searchQuery?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const time = dateStr.substring(9, 15);
    const formattedTime = time.length >= 6 
      ? `${time.substring(0,2)}:${time.substring(2,4)}:${time.substring(4,6)}` 
      : time;
    return `${year}-${month}-${day} ${formattedTime}`;
  } catch (e) {
    return dateStr;
  }
};

export const TuCard: React.FC<TuCardProps> = ({ tu, searchMode, searchQuery }) => {
  const sourceVariant = tu.variants.find(v => v.lang === tu.srcLang) || tu.variants[0];
  const targetVariants = tu.variants.filter(v => v !== sourceVariant);
  const hasProps = Object.keys(tu.props).length > 0;
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSegmentIdMatch = (key: string, val: string) => {
    if (key !== 'x-segment-id' || !searchQuery) return false;
    if (searchMode === 'id_partial' || searchMode === 'text') return val.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchMode === 'id_prefix') return val.toLowerCase().startsWith(searchQuery.toLowerCase());
    return false;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4 flex flex-col">
      {/* Top Bar: ID and Change Date */}
      <div className="bg-slate-50/80 px-4 py-2 flex items-center justify-between border-b border-slate-100 text-xs">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-500 shadow-sm">
              <Hash size={10} />
              <span>{tu.id}</span>
           </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          {tu.metadata.changeDate && (
            <div className="flex items-center gap-1.5" title="Last Changed">
              <Clock size={12} />
              <span className="font-mono">{formatDate(tu.metadata.changeDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100">
              {sourceVariant.lang}
            </span>
          </div>
          <p className="text-slate-900 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
            {sourceVariant.text || <span className="italic text-slate-300">Empty segment</span>}
          </p>
        </div>

        {/* Targets */}
        <div className="flex flex-col gap-4">
          {targetVariants.map((variant, idx) => (
            <div key={`${tu.id}-${variant.lang}-${idx}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-green-50 text-green-700 border border-green-100">
                  {variant.lang}
                </span>
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                 {variant.text || <span className="italic text-slate-300">Empty segment</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Metadata */}
      <div className="mt-auto bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
         <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            
            {(tu.metadata.creationDate || tu.metadata.createUser) && (
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-slate-400"/>
                <span className="text-slate-400">Created:</span>
                <span className="font-medium text-slate-600">
                   {formatDate(tu.metadata.creationDate) || '-'} 
                   {tu.metadata.createUser && <span className="text-slate-400 font-normal ml-1">by {tu.metadata.createUser}</span>}
                </span>
              </div>
            )}

            {tu.metadata.changeUser && (
              <div className="flex items-center gap-2">
                 <User size={12} className="text-slate-400"/>
                 <span className="text-slate-400">Changed by:</span>
                 <span className="font-medium text-slate-600">{tu.metadata.changeUser}</span>
              </div>
            )}

            {hasProps && (
               <div className="hidden sm:block w-px h-3 bg-slate-300 mx-2"></div>
            )}

            {Object.entries(tu.props).map(([key, val]) => {
                const value = val as string;
                const isId = key === 'x-segment-id';
                const isMatch = isSegmentIdMatch(key, value);
                
                return (
                  <div 
                    key={key} 
                    onClick={isId ? () => handleCopy(value, key) : undefined}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded shadow-sm border transition-all 
                      ${isId ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 group' : 'bg-white border-slate-200'}
                      ${isMatch ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                    `}
                    title={isId ? "Click to copy ID" : value}
                  >
                      {copiedId === key ? <Check size={10} className="text-green-600"/> : <Tag size={10} className="text-slate-400" />}
                      <span className="font-semibold text-slate-500">{key}:</span>
                      <span className={`font-mono truncate max-w-[200px] ${isId ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                        {value}
                      </span>
                      {isId && (
                        <Copy size={8} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity ml-1" />
                      )}
                  </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};
