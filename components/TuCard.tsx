import React from 'react';
import { NormalizedTu } from '../types';
import { Clock, User, Hash, Tag, Calendar, Layers } from 'lucide-react';

interface TuCardProps {
  tu: NormalizedTu;
  highlightText?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  // TMX dates are usually YYYYMMDDTHHMMSSZ
  try {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const time = dateStr.substring(9, 15);
    // Format: YYYY-MM-DD HH:MM:SS
    const formattedTime = time.length >= 6 
      ? `${time.substring(0,2)}:${time.substring(2,4)}:${time.substring(4,6)}` 
      : time;
    return `${year}-${month}-${day} ${formattedTime}`;
  } catch (e) {
    return dateStr;
  }
};

export const TuCard: React.FC<TuCardProps> = ({ tu }) => {
  // Separate variants into "Source" (matching header lang) and "Targets"
  const sourceVariant = tu.variants.find(v => v.lang === tu.srcLang) || tu.variants[0];
  const targetVariants = tu.variants.filter(v => v !== sourceVariant);
  const hasProps = Object.keys(tu.props).length > 0;

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

      {/* Main Content: Source -> Target(s) */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Segment */}
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

        {/* Target Segment(s) */}
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

      {/* Footer: Metadata Always Visible */}
      <div className="mt-auto bg-slate-50 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
         <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            
            {/* Standard Meta Info */}
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

            {tu.metadata.usageCount && (
               <div className="flex items-center gap-2">
                <Layers size={12} className="text-slate-400"/>
                <span className="text-slate-400">Usage:</span>
                <span className="font-medium text-slate-600">{tu.metadata.usageCount}</span>
              </div>
            )}

            {/* Separator if we have custom props */}
            {hasProps && (
               <div className="hidden sm:block w-px h-3 bg-slate-300 mx-2"></div>
            )}

            {/* Custom Properties */}
            {Object.entries(tu.props).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                    <Tag size={10} className="text-slate-400" />
                    <span className="font-semibold text-slate-500">{key}:</span>
                    <span className="text-slate-700 font-mono truncate max-w-[200px]" title={val}>{val}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};