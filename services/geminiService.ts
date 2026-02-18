
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentPlan } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateTurkeySlices = async (brief: ContentBrief): Promise<ContentPlan> => {
  const ai = getAI();
  const prompt = `
    Act as a world-class content strategist and brand analyst. 
    
    STEP 1: RESEARCH
    Use the company website ${brief.companyWebsite} and company name ${brief.companyName} to identify their brand identity, tone of voice, personality, and primary colors.
    
    STEP 2: CONTENT PIPELINE
    Using the "Turkey Slicing Method", take the following "Core Content" and slice it into a multi-channel pipeline.
    
    Industry: ${brief.industry}
    Objective: ${brief.objective}
    Target Audience: ${brief.targetAudience}
    
    Core Content: 
    ${brief.coreContent}

    Guidelines:
    1. Identify slices for: LinkedIn, Twitter (X), Professional Blog, and Email Newsletter.
    2. For each slice, create a highly specific 'imagePrompt' that would be used by an AI image generator to create a visual that fits the brand's aesthetic and the specific channel format.
    3. Ensure the tone matches the brand identity discovered from the website.
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

export const generateImageForSlice = async (imagePrompt: string, brandAnalysis: any): Promise<string> => {
  const ai = getAI();
  const fullPrompt = `Style: Professional and modern, following these brand traits: ${brandAnalysis.personality}. Tone: ${brandAnalysis.tone}. Visual Content: ${imagePrompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: fullPrompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
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
