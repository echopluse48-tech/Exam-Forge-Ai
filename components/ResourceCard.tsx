
import React from 'react';
import { Resource, ResourceType } from '../types';

interface ResourceCardProps {
  resource: Resource;
  onRemove: (id: string) => void;
  onAnalyze?: (resource: Resource) => void;
  isAnalyzing?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onRemove, onAnalyze, isAnalyzing }) => {
  const getTagColor = (type: ResourceType) => {
    switch (type) {
      case ResourceType.TEXTBOOK: return 'bg-blue-100 text-blue-700';
      case ResourceType.SPECIFICATION: return 'bg-purple-100 text-purple-700';
      case ResourceType.SAMPLE: return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const isImage = resource.mimeType.startsWith('image/');
  const isPdf = resource.mimeType === 'application/pdf';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getTagColor(resource.type)}`}>
          {resource.type}
        </span>
        <div className="flex items-center space-x-1">
           {onAnalyze && (
            <button 
              onClick={() => onAnalyze(resource)}
              disabled={isAnalyzing}
              className={`p-1 text-slate-400 hover:text-indigo-600 transition-colors ${isAnalyzing ? 'animate-pulse' : ''}`}
              title="Analyze this content"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => onRemove(resource.id)}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {isImage ? (
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-100">
            <img src={`data:${resource.mimeType};base64,${resource.content}`} alt={resource.name} className="w-full h-full object-cover" />
          </div>
        ) : isPdf ? (
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{resource.name}</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
            {isImage ? 'Image' : isPdf ? 'PDF Doc' : 'Text'}
          </p>
        </div>
      </div>
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.1s]"></div>
            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
