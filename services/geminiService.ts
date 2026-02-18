
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentPlan } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const recommendChannels = async (brief: Partial<ContentBrief>): Promise<string[]> => {
  const ai = getAI();
  const prompt = `
    Based on the following marketing context, identify the top 4 most effective channels for content distribution.
    
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}

    Available Channel IDs:
    - linkedin_post
    - linkedin_article
    - linkedin_ad
    - twitter
    - newsletter
    - blog
    - instagram_post
    - instagram_reel
    - instagram_ad
    - facebook_post
    - facebook_ad
    - youtube_video
    - youtube_short

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
  const ai = getAI();
  const channelsStr = brief.selectedChannels.join(", ");
  
  const prompt = `
    Act as a world-class content strategist and brand analyst. 
    
    STEP 1: RESEARCH
    Use the company website ${brief.companyWebsite} and company name ${brief.companyName} to identify their brand identity, tone of voice, personality, and primary colors. Use Google Search to find recent brand assets or marketing style.
    
    STEP 2: CONTENT PIPELINE
    Using the "Turkey Slicing Method", take the following "Core Content" and slice it into a multi-channel pipeline for these specific channels: ${channelsStr}.
    
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}
    
    Core Content: 
    ${brief.coreContent}

    Guidelines for Specific Channels:
    - LinkedIn Post: Professional thought leadership, punchy, conversational yet authoritative.
    - LinkedIn Article: Long-form, detailed breakdown, expert insight.
    - LinkedIn Ad: Business-oriented, problem-solution focus, high professional friction CTA.
    - Instagram Reels/YouTube Shorts: Provide a high-energy script with visual cues.
    - Instagram/Facebook Ads: Focus on high-conversion copy and clear psychological triggers.
    - Twitter/X: Punchy, hook-heavy threads or single posts.
    - YouTube Long-form: A structured video outline or script segment.
    
    For each slice, create a highly specific 'imagePrompt' for an AI image generator. If the format is vertical (Reels/Shorts), note that in the prompt.
    Ensure the tone matches the brand identity discovered from the website.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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
              voice: { type: Type.STRING },
              personality: { type: Type.STRING },
              suggestedColors: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['tone', 'voice', 'personality', 'suggestedColors']
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
                imagePrompt: { type: Type.STRING }
              },
              required: ['id', 'channel', 'format', 'hook', 'body', 'callToAction', 'estimatedEffort', 'imagePrompt']
            }
          }
        },
        required: ['strategyName', 'executiveSummary', 'brandAnalysis', 'slices']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateImageForSlice = async (imagePrompt: string, brandAnalysis: any, channel: string): Promise<string> => {
  const ai = getAI();
  const isVertical = channel.toLowerCase().includes('reel') || channel.toLowerCase().includes('short') || channel.toLowerCase().includes('story');
  
  const fullPrompt = `Style: Professional and high-end, following brand personality: ${brandAnalysis.personality}. Colors: ${brandAnalysis.suggestedColors.join(', ')}. Context: ${imagePrompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: fullPrompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: isVertical ? "9:16" : "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
};
