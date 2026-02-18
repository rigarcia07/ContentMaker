
export interface ContentBrief {
  industry: string;
  companyName: string;
  companyWebsite: string;
  objective: string;
  targetAudience: string;
  coreContent: string;
  selectedChannels: string[];
}

export interface SEOKeyword {
  term: string;
  intent: 'Informational' | 'Transactional' | 'Navigational' | 'Commercial';
}

export interface BrandAnalysis {
  tone: string;
  toneSentiment: string;
  voice: string;
  voiceSentiment: string;
  suggestedColors: string[];
  personality: string;
  brandKeywords: string[];
  seoKeywords: SEOKeyword[];
}

export interface ContentSlice {
  id: string;
  channel: string;
  format: string;
  hook: string;
  body: string;
  callToAction: string;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  imagePrompt: string;
  imageUrl?: string;
  // SEO Specific Fields
  seoTitle?: string;
  seoDescription?: string;
  primaryKeyword?: string;
  altText?: string;
}

export interface ContentPlan {
  strategyName: string;
  executiveSummary: string;
  brandAnalysis: BrandAnalysis;
  slices: ContentSlice[];
}
