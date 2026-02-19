
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentPlan, ContentSlice } from "../types";

const VALID_CHANNEL_IDS = [
  'linkedin_post', 'linkedin_article', 'linkedin_ad', 'twitter', 'newsletter', 'blog',
  'instagram_post', 'instagram_reel', 'instagram_ad', 'tiktok_video', 'pinterest_pin',
  'facebook_post', 'facebook_ad', 'youtube_video', 'youtube_short', 'youtube_ad'
];

export const recommendChannels = async (brief: Partial<ContentBrief>): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Based on the following business context, recommend the top 4 most effective content channels from the provided list.
    
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}
    
    ONLY choose from these valid IDs: ${VALID_CHANNEL_IDS.join(", ")}.
    Return the result as a JSON array of strings.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
          description: "A channel ID from the valid list."
        }
      }
    }
  });

  try {
    const recs = JSON.parse(response.text || '[]');
    return recs.filter((id: string) => VALID_CHANNEL_IDS.includes(id));
  } catch (err) {
    console.error("Parsing recommendation failed", err);
    return [];
  }
};

export const generateTurkeySlices = async (brief: ContentBrief): Promise<ContentPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  parts.push({
    text: `
      Act as a world-class content engineer. Your goal is to "Turkey Slice" one cornerstone asset into a multi-channel pipeline.
      
      ACCURACY & GROUNDING MANDATE:
      - Every slice MUST be strictly grounded in the provided Source Material.
      - 'sourceGrounding' MUST be a SHORT excerpt (max 150 characters) to prove accuracy.
      - Provide a 'consistencyScore' (0-100) reflecting how faithfully the slice represents the source.
      
      PILLAR 1: AEO (ANSWER ENGINE OPTIMIZATION)
      - Definitively answer user questions in 40-60 words.
      
      PILLAR 2: GEO (GENERATIVE ENGINE OPTIMIZATION)
      - Use information-dense headers and authority signals.
      
      CONSTRAINTS:
      - You MUST generate EXACTLY ONE slice for EACH of these channels: ${brief.selectedChannels.slice(0, 5).join(", ")}.
      - Do NOT skip any requested channels. If 'newsletter' is selected, you MUST provide a newsletter slice.
      - Keep body content concise (max 120 words per slice).
      - Ensure the final output is a perfectly valid and COMPLETE JSON object.

      Company: ${brief.companyName}
      Industry: ${brief.industry}
      Core Material: ${brief.coreContent}
    `
  });

  if (brief.coreContentFiles) {
    brief.coreContentFiles.forEach(f => parts.push({ inlineData: { data: f.data, mimeType: f.mimeType } }));
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 80000, 
      thinkingConfig: { thinkingBudget: 25000 },
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
              },
              generativeSearchStrategy: { type: Type.STRING }
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
                secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                searchIntent: { type: Type.STRING },
                directAnswerSnippet: { type: Type.STRING },
                consistencyScore: { type: Type.NUMBER },
                sourceGrounding: { type: Type.STRING },
                geoMetrics: {
                  type: Type.OBJECT,
                  properties: {
                    citationPotential: { type: Type.NUMBER },
                    authoritySignal: { type: Type.STRING },
                    conversationalScore: { type: Type.NUMBER },
                    informationDensity: { type: Type.STRING }
                  }
                },
                aeoMetrics: {
                  type: Type.OBJECT,
                  properties: {
                    directAnswerPotential: { type: Type.NUMBER },
                    voiceReadiness: { type: Type.NUMBER },
                    snippetStructure: { type: Type.STRING, enum: ['Definition', 'List', 'Table', 'Instructional'] }
                  }
                },
                accessibilityAudit: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    readabilityLevel: { type: Type.STRING },
                    colorContrastStatus: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("The engine failed to return a plan. Please try again with a shorter cornerstone asset.");
  }

  try {
    const sanitizedText = text.trim();
    return JSON.parse(sanitizedText);
  } catch (err: any) {
    console.error("Failed JSON Content:", text);
    if (!text.trim().endsWith('}')) {
       throw new Error("Strategy length limit reached. Please provide a shorter cornerstone asset or fewer channels.");
    }
    throw new Error(`Pipeline construction failed: ${err.message}`);
  }
};

export const editSliceContent = async (slice: ContentSlice, instruction: string): Promise<Partial<ContentSlice>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Edit this content while preserving SEO/AEO optimization. Instruction: ${instruction}. Current Body: ${slice.body}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const generateImageForSlice = async (imagePrompt: string, brandAnalysis: any, channel?: string): Promise<string> => {
  if (!imagePrompt) return '';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const channelText = channel || 'Social Media';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Professional imagery for ${channelText}: ${imagePrompt}`,
    config: { 
      imageConfig: { 
        aspectRatio: (channelText.toLowerCase().includes('reel') || channelText.toLowerCase().includes('short') || channelText.toLowerCase().includes('tiktok')) ? "9:16" : "16:9" 
      } 
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return '';
};
