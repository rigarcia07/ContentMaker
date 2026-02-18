
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentPlan, ContentSlice } from "../types";

export const recommendChannels = async (brief: Partial<ContentBrief>): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const prompt = `
    Based on the following marketing context, identify the top 4 most effective channels for content distribution.
    
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}

    Available Channel IDs:
    - linkedin_post, linkedin_article, linkedin_ad, twitter, newsletter, blog, instagram_post, instagram_reel, instagram_ad, facebook_post, facebook_ad, youtube_video, youtube_short, youtube_ad, tiktok_video, pinterest_pin

    Return ONLY a JSON array of the recommended Channel IDs.
  `;

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
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateTurkeySlices = async (brief: ContentBrief): Promise<ContentPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `
    Act as a world-class content strategist and SEO expert. 
    
    STEP 1: RESEARCH & ANALYSIS
    Use the company website ${brief.companyWebsite} and company name ${brief.companyName} to:
    1. Identify their brand identity, tone of voice, personality, and colors.
    2. Perform a SENTIMENT ANALYSIS on Tone and Voice.
    3. Extract primary BRAND KEYWORDS.
    4. DEVELOP AN SEO STRATEGY: Identify 5-8 SEO Keywords with high relevance, including their SEARCH INTENT.
    Use Google Search to find trending topics and competitor positioning in the ${brief.industry} industry.
    
    STEP 2: CONTENT PIPELINE (Turkey Slicing Method)
    Repurpose the provided Core Content into a multi-channel pipeline.
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}
    Core Content: ${brief.coreContent}
    Target Channels: ${brief.selectedChannels.join(", ")}

    Guidelines:
    - For EVERY slice, provide an SEO Title, SEO Meta Description, and a Primary Keyword.
    - Ensure the 'body' is optimized for the primary keyword naturally.
    - Provide 'altText' for the images to be generated.
    - YouTube/Video formats must include a script-like structure in the 'body'.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep reasoning
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategyName: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          brandAnalysis: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              toneSentiment: { type: Type.STRING },
              voice: { type: Type.STRING },
              voiceSentiment: { type: Type.STRING },
              personality: { type: Type.STRING },
              brandKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedColors: { type: Type.ARRAY, items: { type: Type.STRING } },
              seoKeywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    intent: { type: Type.STRING, enum: ['Informational', 'Transactional', 'Navigational', 'Commercial'] }
                  },
                  required: ['term', 'intent']
                }
              }
            },
            required: ['tone', 'toneSentiment', 'voice', 'voiceSentiment', 'personality', 'brandKeywords', 'suggestedColors', 'seoKeywords']
          },
          slices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                channel: { type: Type.STRING },
                format: { type: Type.STRING },
                hook: { type: Type.STRING },
                body: { type: Type.STRING },
                callToAction: { type: Type.STRING },
                estimatedEffort: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                imagePrompt: { type: Type.STRING },
                seoTitle: { type: Type.STRING },
                seoDescription: { type: Type.STRING },
                primaryKeyword: { type: Type.STRING },
                altText: { type: Type.STRING }
              },
              required: ['id', 'channel', 'format', 'hook', 'body', 'callToAction', 'estimatedEffort', 'imagePrompt', 'seoTitle', 'seoDescription', 'primaryKeyword', 'altText']
            }
          }
        },
        required: ['strategyName', 'executiveSummary', 'brandAnalysis', 'slices']
      }
    }
  });

  const plan = JSON.parse(response.text || '{}');
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    (plan as any).groundingSources = response.candidates[0].groundingMetadata.groundingChunks;
  }
  return plan;
};

export const editSliceContent = async (slice: ContentSlice, brandAnalysis: any, instruction: string): Promise<Partial<ContentSlice>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const prompt = `
    Act as an expert editor. Modify the following content slice based on the user's instruction.
    Maintain the brand personality: ${brandAnalysis.personality}.
    
    Current Content:
    Hook: ${slice.hook}
    Body: ${slice.body}
    CTA: ${slice.callToAction}
    
    User Instruction: "${instruction}"
    
    Return the updated content as a JSON object with keys: hook, body, callToAction.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          body: { type: Type.STRING },
          callToAction: { type: Type.STRING }
        },
        required: ['hook', 'body', 'callToAction']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return slice;
  }
};

export const generateImageForSlice = async (imagePrompt: string, brandAnalysis: any, channel: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const lowerChannel = channel.toLowerCase();
  const isVertical = lowerChannel.includes('reel') || lowerChannel.includes('short') || lowerChannel.includes('story') || lowerChannel.includes('tiktok') || lowerChannel.includes('pin');
  
  const fullPrompt = `Style: Professional and high-end, following brand personality: ${brandAnalysis.personality}. Colors: ${brandAnalysis.suggestedColors.join(', ')}. Context: ${imagePrompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: fullPrompt,
    config: {
      imageConfig: {
        aspectRatio: isVertical ? "9:16" : "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
};
