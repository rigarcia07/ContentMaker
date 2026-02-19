
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
        } catch (imgErr) {
          console.error("Image failed for", slice.channel);
        }
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      
    } catch (err: any) {
      setError({
        title: "Strategy Interrupted",
        message: err?.message || "Internal generation error.",
        solutions: ["Reduce channel count to 3", "Simplify cornerstone text", "Retry"]
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
      const labelX = margin;
      const valueX = 65;

      const colors = {
        orange: [234, 88, 12],
        slate500: [100, 116, 139],
        slate600: [71, 85, 105],
        slate800: [30, 41, 59],
        slate900: [15, 23, 42]
      };

      const checkPage = (heightNeeded: number, title?: string) => {
        if (y + heightNeeded > 275) {
          doc.addPage();
          y = 25;
          if (title) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(...colors.orange);
            doc.text(`(Cont.) ${title}`, margin, y);
            y += 12;
          }
          return true;
        }
        return false;
      };

      // HEADER
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(...colors.orange);
      doc.text("Contenize Strategy", margin, y);
      y += 12;

      doc.setFontSize(16);
      doc.setTextColor(...colors.slate600);
      doc.text(contentPlan.strategyName, margin, y);
      y += 18;

      // BRAND ANALYSIS SECTION
      const brand = contentPlan.brandAnalysis;
      const brandFields = [
        { label: "Tone:", value: brand.tone },
        { label: "Voice:", value: brand.voice },
        { label: "Personality:", value: brand.personality },
        { label: "SEO Keywords:", value: brand.seoKeywords?.map(k => `${k.term} (${k.intent})`).join(", ") || "N/A" },
        { label: "Palette:", value: brand.suggestedColors.join(", ") }
      ];

      brandFields.forEach(field => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.slate500);
        doc.text(field.label, labelX, y);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.slate800);
        const lines = doc.splitTextToSize(field.value, contentWidth - (valueX - labelX));
        doc.text(lines, valueX, y);
        y += (lines.length * 5) + 8;
      });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...colors.slate900);
      doc.text("Executive Summary", margin, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.slate800);
      const summaryLines = doc.splitTextToSize(contentPlan.executiveSummary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += (summaryLines.length * 5) + 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Optimized Content Pipeline", margin, y);
      y += 15;

      // ASSETS
      contentPlan.slices.forEach((slice, index) => {
        const sliceTitle = `${index + 1}. ${slice.channel} - ${slice.seoTitle || slice.id}`;
        checkPage(60);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...colors.orange);
        doc.text(sliceTitle, margin, y);
        y += 12;

        if (slice.imageUrl) {
          try {
            const imgWidth = 100;
            const imgHeight = 56.25; // 16:9
            if (y + imgHeight > 270) {
              doc.addPage(); y = 25;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(13);
              doc.setTextColor(...colors.orange);
              doc.text(`(Cont.) ${sliceTitle}`, margin, y);
              y += 12;
            }
            doc.addImage(slice.imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 12;
          } catch {}
        }

        // SEO FOCUS
        checkPage(15, sliceTitle);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.slate500);
        doc.text("SEO FOCUS:", margin, y);
        doc.setTextColor(...colors.orange);
        doc.text((slice.primaryKeyword || "N/A").toUpperCase(), valueX, y);
        y += 10;

        // HOOK
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.slate500);
        doc.text("HOOK:", margin, y);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.slate900);
        const hookLines = doc.splitTextToSize(slice.hook, contentWidth);
        doc.text(hookLines, margin, y);
        y += (hookLines.length * 5) + 10;

        // BODY
        checkPage(20, sliceTitle);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.slate500);
        doc.text("BODY CONTENT:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.slate800);
        const bodyLines = doc.splitTextToSize(slice.body, contentWidth);
        doc.text(bodyLines, margin, y);
        y += (bodyLines.length * 5) + 10;

        // AEO SNIPPET
        checkPage(25, sliceTitle);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.slate500);
        doc.text("AEO SNIPPET:", margin, y);
        y += 6;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...colors.slate800);
        const aeoLines = doc.splitTextToSize(slice.directAnswerSnippet, contentWidth);
        doc.text(aeoLines, margin, y);
        y += (aeoLines.length * 5) + 18;

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Contenize Strategy Engine • Page ${i} of ${totalPages}`, pageWidth / 2, 287, { align: 'center' });
      }

      doc.save(`Contenize_Engine_Strategy_${contentPlan.strategyName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      alert("PDF export failed.");
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
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Contenize Engine</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Omnichannel pipeline optimized for <strong>SEO, GEO, and AEO</strong>.
            </p>
            <TurkeyForm onSubmit={handleGenerate} isLoading={isLoading} />
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
                <h4 className="font-bold text-red-800 text-sm">{error.title}</h4>
                <p className="text-xs text-red-700 mt-1">{error.message}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-8">
            {contentPlan ? (
              <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold text-slate-800">Campaign Output</h3>
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={isExporting}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center bg-orange-50 px-5 py-2.5 rounded-2xl border border-orange-200 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {isExporting ? 'Generating Strategy...' : 'Download Full Strategy'}
                  </button>
                </div>
                
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-2xl font-bold text-slate-900">{contentPlan.strategyName}</h4>
                  <p className="text-sm text-indigo-700 font-medium italic bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 leading-relaxed">
                    "{contentPlan.executiveSummary}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {contentPlan.slices.map((slice) => (
                    <AssetCard key={slice.id} slice={slice} brandAnalysis={contentPlan.brandAnalysis} onUpdate={handleUpdateSlice} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 px-12">
                <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shadow-inner">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="max-w-xs space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Strategy Hub</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Upload your cornerstone content to begin the omnichannel slicing process.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Contenize Engine &bull; AEO-Optimized Strategy</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
