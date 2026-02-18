
export interface ContentBrief {
  industry: string;
  companyName: string;
  companyWebsite: string;
  objective: string;
  targetAudience: string;
  coreContent: string;
}

export interface BrandAnalysis {
  tone: string;
  voice: string;
  suggestedColors: string[];
  personality: string;
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
}

export interface ContentPlan {
  strategyName: string;
  executiveSummary: string;
  brandAnalysis: BrandAnalysis;
  slices: ContentSlice[];
}
