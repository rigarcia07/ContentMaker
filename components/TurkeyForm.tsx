
import React, { useState } from 'react';
import { ContentBrief } from '../types';

interface TurkeyFormProps {
  onSubmit: (brief: ContentBrief) => void;
  isLoading: boolean;
}

const TurkeyForm: React.FC<TurkeyFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ContentBrief>({
    industry: '',
    companyName: '',
    companyWebsite: '',
    objective: '',
    targetAudience: '',
    coreContent: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <label className="block text-sm font-semibold text-slate-700 mb-2">The "Big Turkey" (Core Content)</label>
        <textarea
          required
          name="coreContent"
          value={formData.coreContent}
          onChange={handleChange}
          rows={6}
          placeholder="Paste your cornerstone content here..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none"
        ></textarea>
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
            <span>Researching & Slicing...</span>
          </div>
        ) : (
          "Start Slicing Content"
        )}
      </button>
    </form>
  );
};

export default TurkeyForm;
