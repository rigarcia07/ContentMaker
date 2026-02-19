
export interface FilePart {
  data: string; // base64
  mimeType: string;
  fileName: string;
}

export interface ContentBrief {
  industry: string;
  companyName: string;
  companyWebsite: string;
  objective: string;
  targetAudience: string;
  targetAudienceFiles?: FilePart[];
  coreContent: string;
  coreContentFiles?: FilePart[];
  selectedChannels: string[];
}

export interface AccessibilityAudit {
  score: number; // 0-100
  passedChecks: string[];
  readabilityLevel: string;
  altTextQuality: 'Excellent' | 'Good' | 'Fair';
  colorContrastStatus: string; // e.g. "WCAG AA Pass"
  keyboardNavScore: number; // 0-100
}

export interface GEOMetrics {
  citationPotential: number; // 0-100
  informationDensity: 'Low' | 'Medium' | 'High';
  authoritySignal: string;
  conversationalScore: number;
}

export interface AEOMetrics {
  directAnswerPotential: number; // 0-100
  voiceReadiness: number; // 0-100
  concisenessScore: number; // 0-100
  snippetStructure: 'Definition' | 'List' | 'Table' | 'Instructional';
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
  generativeSearchStrategy: string;
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
  secondaryKeywords?: string[];
  searchIntent?: 'Informational' | 'Transactional' | 'Navigational' | 'Commercial';
  altText?: string;
  // GEO Specific Fields
  geoMetrics: GEOMetrics;
  // AEO Specific Fields
  aeoMetrics: AEOMetrics;
  directAnswerSnippet: string; // 40-60 word definitive answer
  // Accuracy & Quality
  consistencyScore: number; // 0-100 (Alignment with source)
  sourceGrounding: string; // Brief quote from source this slice is based on
  // Accessibility Audit
  accessibilityAudit: AccessibilityAudit;
}

export interface ContentPlan {
  strategyName: string;
  executiveSummary: string;
  brandAnalysis: BrandAnalysis;
  slices: ContentSlice[];
  implementationSteps: string[];
}
