
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
      // Step 1: Research and Slice
      const plan = await generateTurkeySlices(brief);
      setContentPlan(plan);
      
      // Step 2: Parallel Image Generation (Background)
      const slicesWithImages = [...plan.slices];
      
      // We don't await all images before showing the plan, but we start generating them
      const imagePromises = plan.slices.map(async (slice, index) => {
        try {
          const imageUrl = await generateImageForSlice(slice.imagePrompt, plan.brandAnalysis);
          // Update the specific slice in state
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

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (err) {
      console.error(err);
      setError("Failed to generate brand-aligned pipeline. Please check inputs and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Brand-Aligned <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Turkey Slicer</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We'll crawl your website to extract your brand DNA—tone, voice, and colors—before slicing your core content into a cohesive multi-channel strategy.
              </p>
            </div>

            <TurkeyForm onSubmit={handleGenerate} isLoading={isLoading} />
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            {contentPlan ? (
              <div id="results-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Brand Identity Header */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase">Brand Analysis Result</div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{contentPlan.strategyName}</h3>
                    <p className="text-xs text-slate-500">{contentPlan.executiveSummary}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[10px] px-2 py-1 bg-slate-100 rounded-full font-semibold">Tone: {contentPlan.brandAnalysis.tone}</span>
                      <span className="text-[10px] px-2 py-1 bg-slate-100 rounded-full font-semibold">Voice: {contentPlan.brandAnalysis.voice}</span>
                    </div>
                  </div>
                  <div className="space-y-3 border-l border-slate-100 pl-6">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase">Brand Palette</h4>
                    <div className="flex items-center space-x-2">
                      {contentPlan.brandAnalysis.suggestedColors.map((color, i) => (
                        <div key={i} className="group relative">
                          <div 
                            className="w-8 h-8 rounded-full border border-slate-200 shadow-inner cursor-help"
                            style={{ backgroundColor: color }}
                          />
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {color}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Personality: {contentPlan.brandAnalysis.personality}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contentPlan.slices.map((slice) => (
                    <AssetCard key={slice.id} slice={slice} />
                  ))}
                </div>
                
                <div className="text-center">
                   <button 
                    onClick={() => setContentPlan(null)}
                    className="text-xs font-bold text-slate-400 hover:text-orange-600 underline"
                  >
                    Reset & start new campaign
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 px-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-orange-500 transform -rotate-12 border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.143-5.714L5 13l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Analyze Your Brand Voice</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm">
                    Enter your website URL. We'll identify your unique brand DNA and use it to slice your cornerstone content into professional assets.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
            &copy; {new Date().getFullYear()} Turkey Slicer Content Pipeline Engine
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
