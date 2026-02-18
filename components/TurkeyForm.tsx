
import React, { useState } from 'react';
import { ContentBrief } from '../types';
import { recommendChannels } from '../services/geminiService';

// Added missing interface for component props
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

const TurkeyForm: React.FC<TurkeyFormProps> = ({ onSubmit, isLoading }) => {
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [formData, setFormData] = useState<ContentBrief>({
    industry: '',
    companyName: '',
    companyWebsite: '',
    objective: '',
    targetAudience: '',
    coreContent: '',
    selectedChannels: ['linkedin_post', 'linkedin_article', 'twitter', 'instagram_post']
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      alert("Please fill in Industry, Objective, and Audience first.");
      return;
    }

    setIsRecommending(true);
    try {
      const recs = await recommendChannels({
        industry: formData.industry,
        objective: formData.objective,
        targetAudience: formData.targetAudience
      });
      setRecommended(recs);
      setFormData(prev => ({
        ...prev,
        selectedChannels: Array.from(new Set([...prev.selectedChannels, ...recs]))
      }));
    } catch (err) {
      console.error("Recommendation failed", err);
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

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
          <input
            required
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g. Acme SaaS"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Company Website</label>
          <input
            required
            type="url"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            placeholder="https://acme.com"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
          <input
            required
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="e.g. Fintech"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Objective</label>
          <input
            required
            type="text"
            name="objective"
            value={formData.objective}
            onChange={handleChange}
            placeholder="e.g. Drive free trials"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
        <input
          required
          type="text"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          placeholder="e.g. CTOs at mid-sized firms"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Cornerstone Content</label>
        <textarea
          required
          name="coreContent"
          value={formData.coreContent}
          onChange={handleChange}
          rows={5}
          placeholder="Paste your long-form cornerstone content here..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none text-sm"
        ></textarea>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-700">Target Channels</label>
          <button
            type="button"
            onClick={handleSmartRecommend}
            disabled={isRecommending}
            className={`text-[10px] font-bold px-2 py-1 rounded border transition-all flex items-center space-x-1 ${
              isRecommending ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
            }`}
          >
            {isRecommending ? (
              <>
                <svg className="animate-spin h-3 w-3 text-orange-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Audience...</span>
              </>
            ) : (
              <>
                <span>✨ Smart Suggest</span>
              </>
            )}
          </button>
        </div>

        {GROUPS.map(group => (
          <div key={group} className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{group} Channels</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHANNELS.filter(ch => ch.group === group).map(ch => {
                const isRec = recommended.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`relative px-3 py-2 rounded-lg text-[10px] font-bold border transition-all overflow-hidden ${
                      formData.selectedChannels.includes(ch.id)
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                    } ${isRec && !formData.selectedChannels.includes(ch.id) ? 'ring-2 ring-orange-200 border-orange-300' : ''}`}
                  >
                    {isRec && (
                       <div className="absolute top-0 right-0">
                         <div className="bg-amber-400 text-white text-[7px] px-1 py-0.5 rounded-bl-md font-black uppercase">Top Pick</div>
                       </div>
                    )}
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={isLoading}
        type="submit"
        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
          isLoading 
          ? 'bg-slate-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating Content...</span>
          </div>
        ) : (
          "Craft Content Pipeline"
        )}
      </button>
    </form>
  );
};

export default TurkeyForm;
