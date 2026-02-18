
import React, { useState } from 'react';
import Header from './components/Header';
import TurkeyForm from './components/TurkeyForm';
import AssetCard from './components/AssetCard';
import { ContentBrief, ContentPlan, ContentSlice } from './types';
import { generateTurkeySlices, generateImageForSlice } from './services/geminiService';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (brief: ContentBrief) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateTurkeySlices(brief);
      setContentPlan(plan);
      
      plan.slices.forEach(async (slice, index) => {
        try {
          const imageUrl = await generateImageForSlice(slice.imagePrompt, plan.brandAnalysis, slice.channel);
          setContentPlan(prev => {
            if (!prev) return null;
            const newSlices = [...prev.slices];
            newSlices[index] = { ...newSlices[index], imageUrl };
            return { ...prev, slices: newSlices };
          });
        } catch (imgErr) {
          console.error("Image generation failed for slice", slice.id, imgErr);
        }
      });

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      console.error(err);
      setError("Failed to generate brand-aligned pipeline. Strategic reasoning may take up to 60 seconds.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSlice = (updatedSlice: ContentSlice) => {
    setContentPlan(prev => {
      if (!prev) return null;
      const newSlices = prev.slices.map(s => s.id === updatedSlice.id ? updatedSlice : s);
      return { ...prev, slices: newSlices };
    });
  };

  const handleDownloadPDF = async () => {
    if (!contentPlan) return;

    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    const cleanText = (text: string) => {
      if (!text) return "";
      return text.trim();
    };

    const checkPageOverflow = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    const addWrappedText = (text: string, x: number, currentY: number, size: number, weight: "bold" | "normal" = "normal", color: [number, number, number] = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", weight);
      doc.setTextColor(...color);
      
      const lines = doc.splitTextToSize(cleanText(text), contentWidth - (x - margin));
      const lineHeight = size * 0.45;
      
      checkPageOverflow(lines.length * lineHeight);
      doc.text(lines, x, y);
      
      const heightUsed = (lines.length * lineHeight);
      y += heightUsed + 4;
      return y;
    };

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 88, 12);
    doc.text("Contenize Strategy", margin, y);
    y += 12;

    y = addWrappedText(contentPlan.strategyName, margin, y, 18, "bold", [71, 85, 105]);
    y += 6;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    const strategyData = [
      { label: "Tone:", value: `${contentPlan.brandAnalysis.tone} (${contentPlan.brandAnalysis.toneSentiment})` },
      { label: "Voice:", value: `${contentPlan.brandAnalysis.voice} (${contentPlan.brandAnalysis.voiceSentiment})` },
      { label: "Personality:", value: contentPlan.brandAnalysis.personality },
      { label: "SEO Keywords:", value: contentPlan.brandAnalysis.seoKeywords.map(k => `${k.term} (${k.intent})`).join(", ") },
      { label: "Palette:", value: contentPlan.brandAnalysis.suggestedColors.join(", ") }
    ];

    strategyData.forEach(item => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const valLines = doc.splitTextToSize(cleanText(item.value), contentWidth - 35);
      doc.text(valLines, margin + 35, y);
      const blockHeight = Math.max(5, valLines.length * 5);
      y += blockHeight + 2;
      checkPageOverflow(10);
    });

    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Executive Summary", margin, y);
    y += 8;
    y = addWrappedText(contentPlan.executiveSummary, margin, y, 11, "normal", [51, 65, 85]);
    y += 10;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Optimized Content Pipeline", margin, y);
    y += 14;

    for (const [index, slice] of contentPlan.slices.entries()) {
      checkPageOverflow(60);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text(`${index + 1}. ${slice.channel} - ${slice.seoTitle || slice.format}`, margin, y);
      y += 10;

      if (slice.imageUrl) {
        try {
          const lowerC = slice.channel.toLowerCase();
          const isVertical = lowerC.includes('reel') || lowerC.includes('short') || lowerC.includes('story') || lowerC.includes('tiktok') || lowerC.includes('pin');
          let imgWidth = isVertical ? 45 : 90;
          let imgHeight = isVertical ? 80 : 50;
          checkPageOverflow(imgHeight + 10);
          doc.addImage(slice.imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 12;
        } catch (e) { console.error(e); }
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("SEO FOCUS:", margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text(cleanText(slice.primaryKeyword || "General Brand"), margin + 28, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("HOOK:", margin, y);
      y += 6;
      y = addWrappedText(slice.hook, margin, y, 11, "normal", [15, 23, 42]);
      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("BODY CONTENT:", margin, y);
      y += 6;
      y = addWrappedText(slice.body, margin, y, 11, "normal", [15, 23, 42]);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 16;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Contenize Strategy Engine • Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    doc.save(`${contentPlan.strategyName.replace(/\s+/g, '_')}_Content_Pipeline.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Contenize</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Repurpose your Cornerstone Content into a full-scale multi-channel pipeline including SEO-optimized blogs, scripts, and high-impact social posts.
              </p>
            </div>

            <TurkeyForm onSubmit={handleGenerate} isLoading={isLoading} />

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs font-medium animate-pulse">
                {error}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-8">
            {contentPlan ? (
              <div id="results-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-slate-800">Generated Pipeline</h3>
                    <div className="flex items-center px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-tighter rounded animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      Thinking Mode Active
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download PDF Strategy</span>
                    </button>
                    <button 
                      onClick={() => setContentPlan(null)}
                      className="text-xs font-bold text-slate-500 hover:text-orange-600 px-3 py-2 bg-white border border-slate-200 rounded-xl transition-all"
                    >
                      Start New
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                  <div className="md:col-span-2 space-y-4 relative z-10">
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">Strategic Pipeline</div>
                      <div className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">SEO Optimized</div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 leading-tight">{contentPlan.strategyName}</h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{contentPlan.executiveSummary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tone & Voice</h4>
                        <div className="flex flex-wrap gap-2">
                           <span className="text-[10px] px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg font-semibold text-blue-700">{contentPlan.brandAnalysis.tone}</span>
                           <span className="text-[10px] px-2 py-1 bg-purple-50 border border-purple-100 rounded-lg font-semibold text-purple-700">{contentPlan.brandAnalysis.voice}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand Palette</h4>
                        <div className="flex items-center space-x-2">
                          {contentPlan.brandAnalysis.suggestedColors.map((color, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        Search Strategy & Intent
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {contentPlan.brandAnalysis.seoKeywords.map((kw, i) => (
                          <div key={i} className="group relative">
                             <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100 flex items-center">
                               {kw.term}
                               <span className="ml-1.5 px-1 bg-indigo-600 text-white text-[7px] rounded">{kw.intent.charAt(0)}</span>
                             </span>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[8px] p-2 rounded whitespace-nowrap z-50">
                                Intent: {kw.intent}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(contentPlan as any).groundingSources && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Research Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {(contentPlan as any).groundingSources.map((chunk: any, i: number) => (
                            chunk.web && (
                              <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] text-orange-600 hover:underline flex items-center bg-orange-50 px-2 py-1 rounded"
                              >
                                {chunk.web.title || 'Source'}
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 border-l border-slate-100 pl-6 relative z-10 flex flex-col justify-center">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market Identity</h4>
                      <p className="text-[10px] text-slate-600 font-medium leading-relaxed">{contentPlan.brandAnalysis.personality}</p>
                    </div>
                    <div className="pt-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keywords</h4>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">{contentPlan.brandAnalysis.brandKeywords.join(', ')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentPlan.slices.map((slice) => (
                    <AssetCard 
                      key={slice.id} 
                      slice={slice} 
                      brandAnalysis={contentPlan.brandAnalysis}
                      onUpdate={handleUpdateSlice}
                    />
                  ))}
                </div>
                
                <div className="pt-8 text-center">
                   <button 
                    onClick={() => setContentPlan(null)}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                    <span>Back to Inputs</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 px-12 transition-all hover:bg-white/80">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-orange-500 transform rotate-6 border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.198.043l-2.431-.73a2 2 0 01-1.28-1.907v-4.577a2 2 0 011.105-1.79l2.352-1.177a2 2 0 011.697 0l2.352 1.177A2 2 0 0115.422 8.35v1.306a2 2 0 001.242 1.848l.44.176a2 2 0 011.169 2.531l-.845 2.112a2 2 0 01-1.996 1.304l-1.004-.001a2 2 0 00-1.854 1.144l-.845 2.112z" />
                    </svg>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border border-white">DEEP THINKING ON</div>
                </div>
                <div className="space-y-4 max-w-sm">
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Generate Your Omnichannel Pipeline</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Select your channels, paste your cornerstone content, and let AI build a professional, visual, and SEO-optimized content engine.
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
                      <span className="text-xs font-bold">In</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-1">
                      <span className="text-xs font-bold">Ig</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white mb-1">
                      <span className="text-xs font-bold">Tk</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-1">
                      <span className="text-xs font-bold">Yt</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} Contenize &bull; Powered by Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
