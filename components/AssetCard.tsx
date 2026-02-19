
import React, { useState, useEffect } from 'react';
import { ContentSlice } from '../types';
import { editSliceContent } from '../services/geminiService';

interface AssetCardProps {
  slice: ContentSlice;
  brandAnalysis: any;
  onUpdate?: (updatedSlice: ContentSlice) => void;
}

const LOADING_MESSAGES = [
  "Auditing Content Accuracy...",
  "Calibrating AEO Snippets...",
  "Encoding GEO Citation Signals...",
  "Running AODA Compliance Audit...",
  "Rendering AI Visuals...",
  "Ready for Deployment..."
];

const AssetCard: React.FC<AssetCardProps> = ({ slice, brandAnalysis, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'aeo' | 'accuracy'>('content');
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: number;
    if (!slice.imageUrl) {
      interval = window.setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [slice.imageUrl]);

  const handleCopy = () => {
    const fullText = `${slice.hook || ''}\n\n${slice.body || ''}\n\n${slice.callToAction || ''}\n\n[AEO Snippet]\n${slice.directAnswerSnippet || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !onUpdate) return;
    setIsUpdating(true);
    try {
      const updates = await editSliceContent(slice, editInstruction);
      onUpdate({ ...slice, ...updates });
      setIsEditing(false);
      setEditInstruction('');
    } catch (err) {
      console.error("AI Edit failed", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getChannelStyle = (channel?: string) => {
    const c = (channel || 'Unknown').toLowerCase();
    if (c.includes('linkedin')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (c.includes('twitter') || c.includes('x')) return 'bg-slate-900 text-white border-slate-800';
    if (c.includes('email') || c.includes('newsletter')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const snippetWordCount = (slice.directAnswerSnippet || '').split(/\s+/).filter(Boolean).length;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
      <div className={`relative ${(slice.channel || '').toLowerCase().match(/reel|short|story|tiktok/) ? 'aspect-[9/16] max-h-[450px]' : 'aspect-video'} bg-slate-100 flex items-center justify-center overflow-hidden`}>
        {slice.imageUrl ? (
          <img src={slice.imageUrl} className="w-full h-full object-cover animate-in fade-in duration-700" alt={slice.altText || slice.channel || 'Content asset'} />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 px-8 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{LOADING_MESSAGES[loadingStep]}</p>
              <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${((loadingStep + 1) / LOADING_MESSAGES.length) * 100}%` }}></div>
              </div>
            </div>
          </div>
        )}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-sm z-10 ${getChannelStyle(slice.channel)}`}>
          {slice.channel || 'Channel'}
        </div>
      </div>
      
      <div className="p-5 flex-grow space-y-4">
        <div role="tablist" className="flex items-center space-x-3 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('content')} className={`text-[9px] font-bold uppercase whitespace-nowrap px-1 ${activeTab === 'content' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400'}`}>Content</button>
          <button onClick={() => setActiveTab('seo')} className={`text-[9px] font-bold uppercase whitespace-nowrap px-1 ${activeTab === 'seo' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>SEO</button>
          <button onClick={() => setActiveTab('aeo')} className={`text-[9px] font-bold uppercase whitespace-nowrap px-1 ${activeTab === 'aeo' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400'}`}>AEO</button>
          <button onClick={() => setActiveTab('accuracy')} className={`text-[9px] font-bold uppercase whitespace-nowrap px-1 ${activeTab === 'accuracy' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>Accuracy</button>
        </div>

        {activeTab === 'content' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hook</h4>
                <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] text-orange-600 font-bold hover:underline">AI Edit</button>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-tight">{slice.hook || 'No hook provided.'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
              <p className="text-[11px] text-slate-700 leading-relaxed italic">{slice.body || 'No body content provided.'}</p>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-3 animate-in fade-in duration-300">
             <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase">Intent: {slice.searchIntent || 'N/A'}</span>
                  <span className="text-[9px] font-bold text-indigo-900">Focus: {slice.primaryKeyword || 'N/A'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(slice.secondaryKeywords || []).map((kw, i) => (
                    <span key={i} className="text-[8px] bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">{kw}</span>
                  ))}
                </div>
                <p className="text-[10px] text-indigo-800 font-medium pt-1 border-t border-indigo-200/50">{slice.seoTitle || 'SEO Title missing'}</p>
             </div>
          </div>
        )}

        {activeTab === 'aeo' && (
          <div className="space-y-3 animate-in fade-in duration-300">
             <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-rose-600 uppercase block">Direct Answer Snippet</span>
                  <span className="text-[9px] font-bold text-rose-400 bg-white px-1.5 py-0.5 rounded border border-rose-100">{snippetWordCount} Words</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-sm text-[11px] text-slate-900 leading-relaxed font-medium">
                  {slice.directAnswerSnippet || 'AEO snippet generation failed.'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col bg-white/60 p-2 rounded border border-rose-100/50">
                    <span className="text-[8px] font-bold text-rose-400 uppercase">Voice Readiness</span>
                    <span className="text-[10px] font-bold text-rose-900">{slice.aeoMetrics?.voiceReadiness ?? 0}%</span>
                  </div>
                  <div className="flex flex-col bg-white/60 p-2 rounded border border-rose-100/50">
                    <span className="text-[8px] font-bold text-rose-400 uppercase">Structure</span>
                    <span className="text-[10px] font-bold text-rose-900">{slice.aeoMetrics?.snippetStructure || 'Standard'}</span>
                  </div>
                  <div className="flex flex-col bg-white/60 p-2 rounded border border-rose-100/50">
                    <span className="text-[8px] font-bold text-rose-400 uppercase">Conversational</span>
                    <span className="text-[10px] font-bold text-rose-900">{slice.geoMetrics?.conversationalScore ?? 0}/100</span>
                  </div>
                  <div className="flex flex-col bg-white/60 p-2 rounded border border-rose-100/50">
                    <span className="text-[8px] font-bold text-rose-400 uppercase">Density</span>
                    <span className="text-[10px] font-bold text-rose-900">{slice.geoMetrics?.informationDensity || 'Normal'}</span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'accuracy' && (
          <div className="space-y-3 animate-in fade-in duration-300">
             <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Grounding Report</span>
                  <span className="text-[10px] font-black text-emerald-800">{slice.consistencyScore ?? 0}% CONSISTENCY</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Original Source Context:</span>
                  <p className="text-[10px] font-medium text-emerald-900 leading-relaxed italic bg-white/50 p-2 rounded border border-emerald-100">
                    "{slice.sourceGrounding || 'Not provided'}"
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-emerald-800 uppercase">
                  <div className="bg-white/60 p-2 rounded">AODA: {slice.accessibilityAudit?.score ?? 0}%</div>
                  <div className="bg-white/60 p-2 rounded">GEO Potential: {slice.geoMetrics?.citationPotential ?? 0}%</div>
                </div>
             </div>
          </div>
        )}

        {isEditing && (
          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 space-y-2">
            <textarea value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} placeholder="Modify content..." className="w-full p-2 text-[11px] bg-white border border-orange-200 rounded outline-none focus:ring-2 focus:ring-orange-500" rows={2} />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setIsEditing(false)} className="text-[9px] font-bold text-slate-500 px-2 py-1">Cancel</button>
              <button onClick={handleAIEdit} disabled={isUpdating} className="bg-orange-600 text-white text-[9px] font-bold px-3 py-1 rounded">{isUpdating ? '...' : 'Apply'}</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2">
          <div className="font-semibold text-orange-600 truncate mr-2" aria-label="CTA">{slice.callToAction || 'View details'}</div>
          <button onClick={handleCopy} className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default AssetCard;
