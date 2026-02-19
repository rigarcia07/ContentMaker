
// @google/genai used in services/geminiService.ts
import React, { useState, useRef } from 'react';
import Header from './components/Header';
import TurkeyForm from './components/TurkeyForm';
import AssetCard from './components/AssetCard';
import { ContentBrief, ContentPlan, ContentSlice } from './types';
import { generateTurkeySlices, generateImageForSlice } from './services/geminiService';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface ErrorDetail {
  title: string;
  message: string;
  solutions: string[];
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [error, setError] = useState<ErrorDetail | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
        } catch (imgErr: any) {
          console.error("Image failed", slice.id, imgErr);
        }
      });

      setTimeout(() => {
        resultsRef.current?.focus();
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      
    } catch (err: any) {
      console.error(err);
      setError({
        title: "Strategy Failure",
        message: err?.message || "Unexpected engine error.",
        solutions: ["Refresh and retry", "Simplify context"]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentPlan) return;
    setIsExporting(true);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 25;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);

      const addFooter = (doc: any, pageNum: number, totalPages: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150);
        const footerText = `Contenize Strategy Engine • Page ${pageNum} of ${totalPages}`;
        doc.text(footerText, pageWidth / 2, 285, { align: 'center' });
      };

      // --- PAGE 1: Brand Strategy ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(234, 88, 12); // Orange-600
      doc.text("Contenize Strategy", margin, y);
      y += 12;

      doc.setFontSize(18);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(contentPlan.strategyName, margin, y);
      y += 15;

      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Brand Analysis Details
      const brand = contentPlan.brandAnalysis;
      const details = [
        { label: "Tone:", value: brand.tone },
        { label: "Voice:", value: brand.voice },
        { label: "Personality:", value: brand.personality },
        { label: "SEO Keywords:", value: brand.seoKeywords?.map(k => `${k.term} (${k.intent})`).join(", ") || "N/A" },
        { label: "Palette:", value: brand.suggestedColors.join(", ") }
      ];

      details.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(item.label, margin, y);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59); // Slate-800
        const textLines = doc.splitTextToSize(item.value, contentWidth - 45);
        doc.text(textLines, margin + 45, y);
        y += (textLines.length * 5) + 6;
      });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text("Executive Summary", margin, y);
      y += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      const summaryLines = doc.splitTextToSize(contentPlan.executiveSummary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += (summaryLines.length * 6) + 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Optimized Content Pipeline", margin, y);
      y += 15;

      // --- CONTENT SLICES ---
      contentPlan.slices.forEach((slice, index) => {
        // Start a new page if near the bottom or for better separation
        if (y > 230) {
          doc.addPage();
          y = 25;
        }

        // Slice Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(234, 88, 12);
        const sliceTitle = `${index + 1}. ${slice.channel} - ${slice.seoTitle || slice.id}`;
        doc.text(sliceTitle, margin, y);
        y += 12;

        // Slice Image
        if (slice.imageUrl) {
          try {
            const imgProps = doc.getImageProperties(slice.imageUrl);
            const imgWidth = 110; // Fixed width for presentation
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            
            // Check if image fits
            if (y + imgHeight > 270) {
              doc.addPage();
              y = 25;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(13);
              doc.setTextColor(234, 88, 12);
              doc.text(`(Cont.) ${index + 1}. ${slice.channel}`, margin, y);
              y += 12;
            }
            
            doc.addImage(slice.imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 12;
          } catch (e) {
            console.error("Error adding image to PDF", e);
          }
        }

        // SEO FOCUS Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("SEO FOCUS:", margin, y);
        doc.setTextColor(234, 88, 12);
        doc.text((slice.primaryKeyword || "N/A").toUpperCase(), margin + 35, y);
        y += 10;

        // HOOK Section
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text("HOOK:", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        const hookLines = doc.splitTextToSize(slice.hook, contentWidth);
        doc.text(hookLines, margin, y);
        y += (hookLines.length * 5) + 12;

        // BODY CONTENT Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("BODY CONTENT:", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        const bodyLines = doc.splitTextToSize(slice.body, contentWidth);
        doc.text(bodyLines, margin, y);
        y += (bodyLines.length * 6) + 10;

        // Visual Separator
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;
      });

      // Add page numbers to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
      }

      doc.save(`${contentPlan.strategyName.replace(/\s+/g, '_')}_Strategy.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateSlice = (updatedSlice: ContentSlice) => {
    setContentPlan(prev => {
      if (!prev) return null;
      const newSlices = prev.slices.map(s => s.id === updatedSlice.id ? updatedSlice : s);
      return { ...prev, slices: newSlices };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-orange-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
      <Header />
      <main id="main-content" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Contenize AI</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The first multi-channel engine optimized for the <strong>SEO, GEO, and AEO</strong> trifecta. Dominate traditional search, AI discovery, and direct answer engines with one cornerstone asset.
              </p>
            </section>
            <section><TurkeyForm onSubmit={handleGenerate} isLoading={isLoading} /></section>
            {error && <div className="bg-white border-l-4 border-red-500 p-5 rounded-xl shadow-sm text-xs">{error.title}: {error.message}</div>}
          </div>
          <div className="lg:col-span-8 space-y-8">
            {contentPlan ? (
              <div id="results-section" ref={resultsRef} tabIndex={-1} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold text-slate-800">Pipeline & Accuracy Hub</h3>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleDownloadPDF} 
                      disabled={isExporting}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors"
                    >
                      {isExporting ? 'Generating PDF...' : 'Download Full Strategy (PDF)'}
                    </button>
                    <button onClick={() => setContentPlan(null)} className="text-xs font-bold text-slate-500 hover:text-orange-600 px-2 py-1">New Project</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 m-4"><span className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-full">SOURCE-GROUNDED</span></div>
                    <h4 className="text-2xl font-bold text-slate-900">{contentPlan.strategyName}</h4>
                    <p className="text-xs text-indigo-700 font-medium leading-relaxed bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 italic">
                      "{contentPlan.executiveSummary}"
                    </p>
                  </div>
                  
                  <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Implementation Guide</h5>
                    <ul className="space-y-3 my-4">
                      {contentPlan.implementationSteps.map((step, i) => (
                        <li key={i} className="flex items-start space-x-3 text-[10px] text-white font-medium">
                          <span className="flex-shrink-0 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center font-black text-[8px]">{i + 1}</span>
                          <span className="leading-tight opacity-90">{step}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[8px] font-bold text-orange-500 uppercase">Pro Tip</span>
                      <p className="text-[9px] text-slate-400 mt-1">Embed AEO snippets in Schema markup for Featured Snippet dominance.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentPlan.slices.map((slice) => (
                    <AssetCard key={slice.id} slice={slice} brandAnalysis={contentPlan.brandAnalysis} onUpdate={handleUpdateSlice} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 px-12">
                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">AEO/GEO Accuracy Engine</h3>
                  <p className="text-slate-500 text-sm">Upload your cornerstone assets to generate a definitive direct-answer pipeline grounded in truth.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Contenize &bull; Accuracy &bull; AEO &bull; GEO &bull; SEO</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
