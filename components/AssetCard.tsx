
import React, { useState } from 'react';
import { ContentSlice } from '../types';
import { editSliceContent } from '../services/geminiService';

interface AssetCardProps {
  slice: ContentSlice;
  brandAnalysis: any;
  onUpdate?: (updatedSlice: ContentSlice) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ slice, brandAnalysis, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCopy = () => {
    const fullText = `${slice.hook}\n\n${slice.body}\n\n${slice.callToAction}\n\n[SEO Meta]\nTitle: ${slice.seoTitle}\nKeywords: ${slice.primaryKeyword}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !onUpdate) return;
    setIsUpdating(true);
    try {
      const updates = await editSliceContent(slice, brandAnalysis, editInstruction);
      onUpdate({ ...slice, ...updates });
      setIsEditing(false);
      setEditInstruction('');
    } catch (err) {
      console.error("AI Edit failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getChannelStyle = (channel: string) => {
    const c = channel.toLowerCase();
    if (c.includes('linkedin')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c.includes('twitter') || c.includes('x')) return 'bg-slate-900 text-white border-slate-800';
    if (c.includes('email') || c.includes('newsletter')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (c.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (c.includes('tiktok')) return 'bg-slate-950 text-cyan-400 border-red-500/50';
    if (c.includes('pinterest')) return 'bg-red-50 text-red-600 border-red-200';
    if (c.includes('facebook')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (c.includes('youtube')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const cLower = slice.channel.toLowerCase();
  const isVertical = cLower.includes('reel') || 
                     cLower.includes('short') || 
                     cLower.includes('story') ||
                     cLower.includes('tiktok') ||
                     cLower.includes('pin');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group">
      <div className={`relative ${isVertical ? 'aspect-[9/16] max-h-[500px]' : 'aspect-video'} bg-slate-100 overflow-hidden flex items-center justify-center`}>
        {slice.imageUrl ? (
          <img 
            src={slice.imageUrl} 
            alt={slice.altText || slice.channel} 
            title={slice.altText}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rendering {slice.channel} Visual</p>
          </div>
        )}
        
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getChannelStyle(slice.channel)}`}>
          {slice.channel}
        </div>
      </div>
      
      <div className="p-5 flex-grow space-y-4">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Headline / Hook</h4>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-orange-600 font-bold hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                AI Edit
              </button>
            )}
          </div>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {slice.hook}
          </p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
            {slice.body}
          </p>
        </div>

        {isEditing && (
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="e.g., 'make it more punchy' or 'add a call to action for our webinar'..."
              className="w-full p-2 text-[11px] bg-white border border-orange-200 rounded-lg outline-none focus:ring-1 focus:ring-orange-500"
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-bold text-slate-500 px-2 py-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleAIEdit}
                disabled={isUpdating || !editInstruction.trim()}
                className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg disabled:opacity-50"
              >
                {isUpdating ? 'Editing...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        )}

        {showSEO && (
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center space-x-1.5 mb-1 text-indigo-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Search Optimization</span>
             </div>
             <div className="space-y-2">
                <div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase">Focus Keyword:</span>
                  <p className="text-[10px] font-semibold text-indigo-900">{slice.primaryKeyword}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase">Meta Description:</span>
                  <p className="text-[10px] leading-relaxed text-indigo-800">{slice.seoDescription}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase">Alt Text:</span>
                  <p className="text-[10px] italic text-indigo-800">"{slice.altText}"</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2">
          <div className="font-semibold text-orange-600 truncate mr-2">{slice.callToAction}</div>
          <button 
            onClick={() => setShowSEO(!showSEO)}
            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${showSEO ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            {showSEO ? 'Hide SEO' : 'Show SEO'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-2">
        <button 
          onClick={handleCopy}
          className={`flex-grow py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {copied ? <span>Copied!</span> : <span>Copy Content</span>}
        </button>
      </div>
    </div>
  );
};

export default AssetCard;
