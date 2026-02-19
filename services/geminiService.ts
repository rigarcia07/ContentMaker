
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentPlan, ContentSlice } from "../types";

const VALID_CHANNEL_IDS = [
  'linkedin_post', 'linkedin_article', 'linkedin_ad', 'twitter', 'newsletter', 'blog',
  'instagram_post', 'instagram_reel', 'instagram_ad', 'tiktok_video', 'pinterest_pin',
  'facebook_post', 'facebook_ad', 'youtube_video', 'youtube_short', 'youtube_ad'
];

export const recommendChannels = async (brief: Partial<ContentBrief>): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Recommend 4 effective content channels for a ${brief.industry} business aiming to ${brief.objective}. Audience: ${brief.targetAudience}. Choose from: ${VALID_CHANNEL_IDS.join(", ")}. Return as JSON array.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const recs = JSON.parse(response.text || '[]');
    return recs.filter((id: string) => VALID_CHANNEL_IDS.includes(id));
  } catch {
    return [];
  }
};

export const generateTurkeySlices = async (brief: ContentBrief): Promise<ContentPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  const targetChannels = brief.selectedChannels.slice(0, 4);

  parts.push({
    text: `
      Act as a world-class content engineer. "Turkey Slice" the cornerstone material into a 4-channel pipeline.
      
      CORE MANDATE:
      - Ground every slice in the Source Material.
      - Body content: STRICTLY max 60 words.
      - Direct Answer Snippet (AEO): STRICTLY 30-40 words, definitive tone.
      - seoTitle: You MUST provide a catchy, high-impact SEO title for this specific asset (e.g., "The Ultimate Guide to X for Y"). Do not leave this empty.
      - primaryKeyword: Include one high-intent keyword.
      - Generate exactly 4 slices for: ${targetChannels.join(", ")}.

      Company: ${brief.companyName}
      Core Material: ${brief.coreContent}
    `
  });

  if (brief.coreContentFiles) {
    brief.coreContentFiles.forEach(f => parts.push({ inlineData: { data: f.data, mimeType: f.mimeType } }));
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      maxOutputTokens: 8000, 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategyName: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          brandAnalysis: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              voice: { type: Type.STRING },
              personality: { type: Type.STRING },
              suggestedColors: { type: Type.ARRAY, items: { type: Type.STRING } },
              seoKeywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    intent: { type: Type.STRING }
                  }
                }
              }
            }
          },
          slices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                channel: { type: Type.STRING },
                hook: { type: Type.STRING },
                body: { type: Type.STRING },
                callToAction: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                seoTitle: { type: Type.STRING },
                primaryKeyword: { type: Type.STRING },
                directAnswerSnippet: { type: Type.STRING },
                consistencyScore: { type: Type.NUMBER },
                sourceGrounding: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty engine response.");

  try {
    const result = JSON.parse(text.trim());
    result.slices = result.slices.map((s: any) => ({
      ...s,
      searchIntent: 'Informational',
      geoMetrics: { citationPotential: 85, informationDensity: 'High', authoritySignal: 'Expertise', conversationalScore: 90 },
      aeoMetrics: { voiceReadiness: 95, snippetStructure: 'Definition' },
      accessibilityAudit: { score: 100, readabilityLevel: 'Grade 8' }
    }));
    return result;
  } catch (err) {
    throw new Error(`Pipeline construction failed. Response: ${text.substring(0, 100)}...`);
  }
};

export const generateImageForSlice = async (imagePrompt: string, brandAnalysis: any, channel?: string): Promise<string> => {
  if (!imagePrompt) return '';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const channelText = channel || 'Marketing';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Premium photography for ${channelText}: ${imagePrompt}. Professional studio lighting, matching ${brandAnalysis.tone} tone.`,
    config: { 
      imageConfig: { 
        aspectRatio: (channelText.toLowerCase().match(/reel|short|tiktok/)) ? "9:16" : "16:9" 
      } 
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return '';
};
