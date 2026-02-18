
import React, { useState } from 'react';
import Header from './components/Header';
import TurkeyForm from './components/TurkeyForm';
import AssetCard from './components/AssetCard';
import { ContentBrief, ContentPlan } from './types';
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
      setError("Failed to generate brand-aligned pipeline. Please ensure the website URL is valid and the API key is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contentPlan) return;

    // Use the global jsPDF instance from the CDN
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ContentCrafter Strategy Report", margin, y);
    y += 12;

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text(contentPlan.strategyName, margin, y);
    y += 15;

    // Brand Analysis Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Brand DNA Analysis", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const brandInfo = [
      `Tone: ${contentPlan.brandAnalysis.tone}`,
      `Voice: ${contentPlan.brandAnalysis.voice}`,
      `Personality: ${contentPlan.brandAnalysis.personality}`,
      `Palette: ${contentPlan.brandAnalysis.suggestedColors.join(", ")}`
    ];
    
    brandInfo.forEach(line => {
      doc.text(line, margin, y);
      y += 6;
    });
    y += 10;

    // Executive Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(contentPlan.executiveSummary, 170);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 5) + 15;

    // Slices Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Content Pipeline Slices", margin, y);
    y += 10;

    contentPlan.slices.forEach((slice, index) => {
      // Page break check
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12); // Orange color
      doc.text(`${index + 1}. ${slice.channel} (${slice.format})`, margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Hook:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const hookLines = doc.splitTextToSize(slice.hook, 170);
      doc.text(hookLines, margin, y);
      y += (hookLines.length * 5) + 5;

      doc.setFont("helvetica", "bold");
      doc.text("Body Content:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const bodyLines = doc.splitTextToSize(slice.body, 170);
      doc.text(bodyLines, margin, y);
      y += (bodyLines.length * 5) + 5;

      doc.setFont("helvetica", "bold");
      doc.text("CTA:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(slice.callToAction, margin + 15, y);
      y += 15;
    });

    doc.save(`${contentPlan.strategyName.replace(/\s+/g, '_')}_Strategy.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">ContentCrafter</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Repurpose your Cornerstone Content into a full-scale multi-channel pipeline including Instagram Reels, YouTube scripts, and ads.
              </p>
            </div>

            <TurkeyForm onSubmit={handleGenerate} isLoading={isLoading} />
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs font-medium animate-pulse">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            {contentPlan ? (
              <div id="results-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Results Header with Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                  <h3 className="text-xl font-bold text-slate-800">Generated Pipeline</h3>
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

                {/* Brand Identity Header */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.283a2 2 0 01-1.198.043l-2.431-.73a2 2 0 01-1.28-1.907v-4.577a2 2 0 011.105-1.79l2.352-1.177a2 2 0 011.697 0l2.352 1.177A2 2 0 0115.422 8.35v1.306a2 2 0 001.242 1.848l.44.176a2 2 0 011.169 2.531l-.845 2.112a2 2 0 01-1.996 1.304l-1.004-.001a2 2 0 00-1.854 1.144l-.845 2.112z" />
                      </svg>
                   </div>
                  <div className="md:col-span-2 space-y-3 relative z-10">
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">Strategic Pipeline</div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{contentPlan.strategyName}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{contentPlan.executiveSummary}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg font-semibold text-slate-600">Tone: {contentPlan.brandAnalysis.tone}</span>
                      <span className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg font-semibold text-slate-600">Voice: {contentPlan.brandAnalysis.voice}</span>
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-slate-100 pl-6 relative z-10">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brand Palette</h4>
                      <div className="flex items-center space-x-2">
                        {contentPlan.brandAnalysis.suggestedColors.map((color, i) => (
                          <div key={i} className="group relative">
                            <div 
                              className="w-8 h-8 rounded-full border border-slate-200 shadow-inner cursor-help hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Identity</h4>
                      <p className="text-[10px] text-slate-600 font-medium">{contentPlan.brandAnalysis.personality}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentPlan.slices.map((slice) => (
                    <AssetCard key={slice.id} slice={slice} />
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
                  <div className="absolute -top-4 -right-4 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4 max-w-sm">
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Generate Your Omichannel Pipeline</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Select your channels, paste your cornerstone content, and let AI analyze your brand to build a professional, visual content engine.
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
            &copy; {new Date().getFullYear()} ContentCrafter &bull; Omnichannel Content Repurposing Engine
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
