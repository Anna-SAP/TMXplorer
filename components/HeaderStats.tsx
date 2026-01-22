import React from 'react';
import { TmxHeader } from '../types';
import { FileCode, Calendar, Wrench, Languages } from 'lucide-react';

interface HeaderStatsProps {
  header: TmxHeader;
  totalTus: number;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ header, totalTus }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <FileCode size={14} /> Source Language
        </span>
        <span className="text-2xl font-bold text-slate-800 mt-2">{header['@_srclang'] || 'N/A'}</span>
        <span className="text-xs text-slate-500 mt-1">Admin Lang: {header['@_adminlang'] || '-'}</span>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <Languages size={14} /> Total Units
        </span>
        <span className="text-2xl font-bold text-slate-800 mt-2">{totalTus.toLocaleString()}</span>
        <span className="text-xs text-slate-500 mt-1">Segments</span>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
           <Wrench size={14} /> Creation Tool
        </span>
        <span className="text-lg font-bold text-slate-800 mt-2 truncate" title={header['@_creationtool']}>
          {header['@_creationtool'] || 'Unknown'}
        </span>
        <span className="text-xs text-slate-500 mt-1">v{header['@_creationtoolversion'] || '?'}</span>
      </div>

       <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
           <Calendar size={14} /> Data Type
        </span>
        <span className="text-xl font-bold text-slate-800 mt-2">{header['@_datatype'] || 'Plain Text'}</span>
        <span className="text-xs text-slate-500 mt-1">SegType: {header['@_segtype'] || 'sentence'}</span>
      </div>
    </div>
  );
};