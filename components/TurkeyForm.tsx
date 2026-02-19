
import React, { useState, useRef } from 'react';
import { ContentBrief, FilePart } from '../types';
import { recommendChannels } from '../services/geminiService';

interface TurkeyFormProps {
  onSubmit: (brief: ContentBrief) => void;
  isLoading: boolean;
}

const CHANNELS = [
  { id: 'linkedin_post', label: 'LinkedIn Post', group: 'Professional' },
  { id: 'linkedin_article', label: 'LinkedIn Article', group: 'Professional' },
  { id: 'linkedin_ad', label: 'LinkedIn Ad', group: 'Professional' },
  { id: 'twitter', label: 'Twitter / X', group: 'Professional' },
  { id: 'newsletter', label: 'Email Newsletter', group: 'Professional' },
  { id: 'blog', label: 'Professional Blog', group: 'Professional' },
  { id: 'instagram_post', label: 'Instagram Post', group: 'Social' },
  { id: 'instagram_reel', label: 'Instagram Reel', group: 'Social' },
  { id: 'instagram_ad', label: 'Instagram Ad', group: 'Social' },
  { id: 'tiktok_video', label: 'TikTok Video', group: 'Social' },
  { id: 'pinterest_pin', label: 'Pinterest Pin', group: 'Social' },
  { id: 'facebook_post', label: 'Facebook Post', group: 'Social' },
  { id: 'facebook_ad', label: 'Facebook Ad', group: 'Social' },
  { id: 'youtube_video', label: 'YouTube Video', group: 'Video' },
  { id: 'youtube_short', label: 'YouTube Short', group: 'Video' },
  { id: 'youtube_ad', label: 'YouTube Ad', group: 'Video' },
];

const GROUPS = ['Professional', 'Social', 'Video'];

const ACCEPTED_TYPES = ".pdf,.txt,.png,.jpg,.jpeg,.mp4";

const TurkeyForm: React.FC<TurkeyFormProps> = ({ onSubmit, isLoading }) => {
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState<'audience' | 'content' | null>(null);
  
  const [formData, setFormData] = useState<ContentBrief>({
    industry: '',
    companyName: '',
    companyWebsite: '',
    objective: '',
    targetAudience: '',
    coreContent: '',
    selectedChannels: [],
    targetAudienceFiles: [],
    coreContentFiles: []
  });

  const audienceInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processFiles = async (files: FileList | null, type: 'audience' | 'content') => {
    if (!files) return;

    const fileParts: FilePart[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      fileParts.push({
        data: base64.split(',')[1],
        mimeType: file.type,
        fileName: file.name
      });
    }

    setFormData(prev => ({
      ...prev,
      [type === 'audience' ? 'targetAudienceFiles' : 'coreContentFiles']: [
        ...(prev[type === 'audience' ? 'targetAudienceFiles' : 'coreContentFiles'] || []),
        ...fileParts
      ]
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (type: 'audience' | 'content', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type === 'audience' ? 'targetAudienceFiles' : 'coreContentFiles']: 
        prev[type === 'audience' ? 'targetAudienceFiles' : 'coreContentFiles']?.filter((_, i) => i !== index)
    }));
  };

  const toggleChannel = (channelId: string) => {
    setFormData(prev => {
      const selected = prev.selectedChannels.includes(channelId)
        ? prev.selectedChannels.filter(id => id !== channelId)
        : [...prev.selectedChannels, channelId];
      return { ...prev, selectedChannels: selected };
    });
  };

  const handleSmartRecommend = async () => {
    if (!formData.industry || !formData.objective || !formData.targetAudience) {
      alert("Please fill in Industry, Objective, and Audience text first to get smart suggestions.");
      return;
    }

    setIsRecommending(true);
    setRecommended([]); // Clear old ones
    try {
      const recs = await recommendChannels({
        industry: formData.industry,
        objective: formData.objective,
        targetAudience: formData.targetAudience
      });
      
      if (recs && recs.length > 0) {
        setRecommended(recs);
        setFormData(prev => ({
          ...prev,
          selectedChannels: Array.from(new Set([...prev.selectedChannels, ...recs]))
        }));
      } else {
        alert("The AI could not determine specific channel recommendations. Please select manually.");
      }
    } catch (err) {
      console.error("Recommendation failed", err);
      alert("Failed to get smart suggestions. Please check your connection or try again.");
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedChannels.length === 0) {
      alert("Please select at least one channel.");
      return;
    }
    onSubmit(formData);
  };

  const handleDragOver = (e: React.DragEvent, type: 'audience' | 'content') => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'audience' | 'content') => {
    e.preventDefault();
    setDragOver(null);
    processFiles(e.dataTransfer.files, type);
  };

  const renderFileList = (type: 'audience' | 'content') => {
    const list = type === 'audience' ? formData.targetAudienceFiles : formData.coreContentFiles;
    if (!list || list.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3 px-1" role="list" aria-label="Attached files">
        {list.map((f, i) => (
          <div key={i} role="listitem" className="flex items-center space-x-2 bg-white text-[10px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200">
            <span className="truncate max-w-[120px]">{f.fileName}</span>
            <button 
              type="button" 
              onClick={() => removeFile(type, i)} 
              className="text-slate-400 hover:text-red-500 transition-colors focus:ring-2 focus:ring-red-500 rounded outline-none"
              aria-label={`Remove file ${f.fileName}`}
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      aria-busy={isLoading}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
          <input
            id="companyName"
            required
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g. Acme SaaS"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
          />
        </div>
        <div>
          <label htmlFor="companyWebsite" className="block text-sm font-semibold text-slate-700 mb-2">Company Website</label>
          <input
            id="companyWebsite"
            required
            type="url"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            placeholder="https://acme.com"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="industry" className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
          <input
            id="industry"
            required
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="e.g. Fintech"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
          />
        </div>
        <div>
          <label htmlFor="objective" className="block text-sm font-semibold text-slate-700 mb-2">Campaign Objective</label>
          <input
            id="objective"
            required
            type="text"
            name="objective"
            value={formData.objective}
            onChange={handleChange}
            placeholder="e.g. Drive free trials"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div 
        className={`transition-all duration-200 rounded-xl p-1 ${dragOver === 'audience' ? 'bg-orange-50 ring-2 ring-orange-500 ring-dashed' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'audience')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'audience')}
      >
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="targetAudience" className="block text-sm font-semibold text-slate-700">Target Audience(s)</label>
          <button 
            type="button" 
            onClick={() => audienceInputRef.current?.click()}
            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center bg-orange-50 px-2 py-1 rounded focus:ring-2 focus:ring-orange-500 outline-none"
          >
            Upload Context
          </button>
          <input 
            id="audienceFiles"
            type="file" 
            ref={audienceInputRef} 
            onChange={(e) => processFiles(e.target.files, 'audience')} 
            className="hidden" 
            multiple 
            accept={ACCEPTED_TYPES}
          />
        </div>
        <input
          id="targetAudience"
          required
          type="text"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          placeholder="e.g. CTOs at mid-sized firms"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm"
        />
        {renderFileList('audience')}
      </div>

      <div 
        className={`transition-all duration-200 rounded-xl p-1 ${dragOver === 'content' ? 'bg-orange-50 ring-2 ring-orange-500 ring-dashed' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'content')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'content')}
      >
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="coreContent" className="block text-sm font-semibold text-slate-700">Cornerstone Content</label>
          <button 
            type="button" 
            onClick={() => contentInputRef.current?.click()}
            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center bg-orange-50 px-2 py-1 rounded focus:ring-2 focus:ring-orange-500 outline-none"
          >
            Upload Assets
          </button>
          <input 
            id="coreContentFiles"
            type="file" 
            ref={contentInputRef} 
            onChange={(e) => processFiles(e.target.files, 'content')} 
            className="hidden" 
            multiple 
            accept={ACCEPTED_TYPES}
          />
        </div>
        <textarea
          id="coreContent"
          required
          name="coreContent"
          value={formData.coreContent}
          onChange={handleChange}
          rows={5}
          placeholder="Paste your long-form content or drag and drop files here..."
          className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 transition-all outline-none resize-none text-sm custom-scrollbar ${dragOver === 'content' ? 'placeholder-orange-400' : ''}`}
        ></textarea>
        {renderFileList('content')}
      </div>

      <fieldset className="space-y-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-slate-700">Target Channels</legend>
          <button
            type="button"
            onClick={handleSmartRecommend}
            disabled={isRecommending}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center space-x-2 focus:ring-2 focus:ring-orange-500 outline-none ${
              isRecommending ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 active:scale-95'
            }`}
          >
            {isRecommending ? (
              <>
                <div className="w-2.5 h-2.5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Context...</span>
              </>
            ) : (
              <span>✨ Smart Suggest</span>
            )}
          </button>
        </div>

        {GROUPS.map(group => (
          <div key={group} className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{group}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHANNELS.filter(ch => ch.group === group).map(ch => {
                const isSelected = formData.selectedChannels.includes(ch.id);
                const isRec = recommended.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    aria-pressed={isSelected}
                    className={`relative px-3 py-2 rounded-lg text-[10px] font-bold border transition-all focus:ring-2 outline-none ${
                      isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md focus:ring-orange-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 focus:ring-orange-500'
                    } ${isRec && !isSelected ? 'ring-2 ring-orange-300' : ''}`}
                  >
                    {isRec && !isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                      </span>
                    )}
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <button
        disabled={isLoading}
        type="submit"
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] focus:ring-4 focus:ring-orange-300 outline-none ${
          isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing Pipeline...</span>
          </div>
        ) : (
          'Craft GEO-Optimized Pipeline'
        )}
      </button>
    </form>
  );
};

export default TurkeyForm;
