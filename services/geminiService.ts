
import { GoogleGenAI, Type } from "@google/genai";
import type { Solution } from '../types';

const SYSTEM_INSTRUCTION = `You are an expert DIY assistant named "DIY-AI Fix-It". Your role is to help users solve common household problems safely and effectively. A user has provided an image and a text description.

Based on the visual information and the user's text, perform the following actions:
1.  **Diagnose the Problem:** In one or two clear, simple sentences, explain what you believe the issue is.
2.  **List Tools Needed:** Provide a bulleted list of the necessary tools. If no tools are needed, state that clearly.
3.  **Provide Step-by-Step Instructions:** Give a numbered list of instructions. The instructions must be clear, concise, and easy for a beginner to follow. **Crucially, begin with a safety warning if applicable (e.g., "Safety First: Turn off the water supply..." or "Safety First: Unplug the appliance...").**

Your entire response MUST be in a valid JSON format, with no extra text before or after the JSON object. The JSON object should have three keys: "diagnosis", "tools" (an array of strings), and "instructions" (an array of strings).`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    diagnosis: {
      type: Type.STRING,
      description: "A clear, simple diagnosis of the problem in one or two sentences.",
    },
    tools: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of necessary tools. If none, this can be an empty array or state that no tools are needed."
    },
    instructions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Clear, step-by-step instructions for the fix, starting with a safety warning if applicable."
    },
  },
  required: ["diagnosis", "tools", "instructions"],
};

const MOCK_SOLUTION: Solution = {
  diagnosis: "This is a sample diagnosis for a leaky faucet. The O-ring is likely worn out and needs replacement.",
  tools: ["Adjustable wrench", "Phillips head screwdriver", "Replacement O-ring kit", "Rag"],
  instructions: [
    "Safety First: Turn off the water supply valves under the sink before starting.",
    "Use the adjustable wrench to loosen the faucet handle's base.",
    "Lift the handle off to expose the faucet body.",
    "Unscrew the cap with your wrench.",
    "Carefully pull out the faucet cartridge or ball valve.",
    "Locate and replace the old O-rings with new ones from your kit.",
    "Reassemble the faucet in reverse order.",
    "Turn the water supply back on slowly and check for leaks.",
  ],
};


export const getFixItSolution = async (
  imageBase64: string,
  mimeType: string,
  problemDescription: string
): Promise<Solution> => {
  if (!process.env.API_KEY) {
    console.warn("⚠️ API_KEY not found. Using mock data for demo purposes. Please set your API_KEY as an environment variable for real results.");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SOLUTION), 2000));
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const textPart = {
      text: problemDescription,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    const solution: Solution = JSON.parse(jsonText);
    return solution;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
             throw new Error("Your API key is not valid. Please check it in your environment variables.");
        }
        throw new Error(`Failed to get solution: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching the solution.");
  }
};
