
import React, { useState } from 'react';
import { ContentSlice } from '../types';

interface AssetCardProps {
  slice: ContentSlice;
}

const AssetCard: React.FC<AssetCardProps> = ({ slice }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `${slice.hook}\n\n${slice.body}\n\n${slice.callToAction}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getChannelColor = (channel: string) => {
    const c = channel.toLowerCase();
    if (c.includes('linkedin')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c.includes('twitter') || c.includes('x')) return 'bg-slate-900 text-white border-slate-800';
    if (c.includes('email') || c.includes('newsletter')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
      {/* Visual Asset Header */}
      <div className="relative aspect-video bg-slate-100 group overflow-hidden">
        {slice.imageUrl ? (
          <img 
            src={slice.imageUrl} 
            alt={slice.channel} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating Visual Asset</p>
          </div>
        )}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getChannelColor(slice.channel)}`}>
          {slice.channel}
        </div>
      </div>
      
      <div className="p-5 flex-grow space-y-4">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Headline</h4>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {slice.hook}
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
            {slice.body}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-orange-600">{slice.callToAction}</div>
          <div className="text-slate-400 font-medium italic">{slice.format}</div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button 
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {copied ? <span>Copied to Clipboard!</span> : <span>Copy Asset Content</span>}
        </button>
      </div>
    </div>
  );
};

export default AssetCard;
