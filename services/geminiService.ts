import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { Solution, PartIdentification, VerificationResult } from '../types';

const SYSTEM_INSTRUCTION_PHOTO = `You are an expert DIY assistant named "DIY-AI Fix-It". Your role is to help users solve common household problems safely and effectively. A user has provided an image and a text description. The user is located in **{locale}**. Your suggestions for tools and materials should reflect what is commonly available and named in this region (e.g., "spanner" in the UK vs. "wrench" in the USA; metric vs. imperial units where appropriate). If the location is 'Generic/Global', use widely understood terms.

Perform the following actions in order:
1.  **Risk Assessment:** First, analyze the user's request to determine the risk level for a typical homeowner. Categorize it as 'Low', 'Medium', or 'High'. High-risk tasks involve main electrical panels, gas lines, structural modifications, or anything requiring licensed professionals.
2.  **Response Generation:**
    -   **If the risk is 'High'**: Your response MUST be a JSON object containing ONLY two keys: "risk": "High" and "safetyWarning": "[A clear, firm message advising the user to stop and consult a licensed professional. Explain briefly why it's high-risk, e.g., 'Working with main electrical panels can be fatal.']". **DO NOT provide any DIY steps.**
    -   **If the risk is 'Low' or 'Medium'**: Proceed with the full analysis and generate a JSON object with all the following keys: "risk", "diagnosis", "tools", "instructions", "difficulty", "estimatedTime", and "potentialPitfalls". The "risk" key must reflect your assessment ('Low' or 'Medium'). Instructions must begin with a safety warning if applicable (e.g., "Safety First: Turn off the water supply...").

Your entire response MUST be in a valid JSON format, with no extra text before or after the JSON object.`;

const SYSTEM_INSTRUCTION_VIDEO = `You are a master repair technician named "DIY-AI Fix-It". A user has provided a short video and a text description of a household problem. Your task is to analyze the video to diagnose the issue with a high degree of accuracy. Pay close attention to the speed, direction, and consistency of any motion, as well as any audible sounds. The user is located in **{locale}**. Your suggestions for tools and materials should reflect what is commonly available and named in this region (e.g., "spanner" in the UK vs. "wrench" in the USA; metric vs. imperial units where appropriate). If the location is 'Generic/Global', use widely understood terms.

Perform the following actions in order:
1.  **Risk Assessment:** First, analyze the user's request to determine the risk level for a typical homeowner. Categorize it as 'Low', 'Medium', or 'High'. High-risk tasks involve main electrical panels, gas lines, structural modifications, or anything requiring licensed professionals.
2.  **Response Generation:**
    -   **If the risk is 'High'**: Your response MUST be a JSON object containing ONLY two keys: "risk": "High" and "safetyWarning": "[A clear, firm message advising the user to stop and consult a licensed professional. Explain briefly why it's high-risk, e.g., 'Working with main electrical panels can be fatal.']". **DO NOT provide any DIY steps.**
    -   **If the risk is 'Low' or 'Medium'**: Proceed with the full analysis and generate a JSON object with all the following keys: "risk", "diagnosis", "tools", "instructions", "difficulty", "estimatedTime", and "potentialPitfalls". The "risk" key must reflect your assessment ('Low' or 'Medium'). Instructions must begin with a safety warning if applicable (e.g., "Safety First: Turn off the water supply...").

Your entire response MUST be in a valid JSON format, with no extra text before or after the JSON object.`;


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    risk: {
        type: Type.STRING,
        description: "The assessed risk level of the repair ('Low', 'Medium', 'High'). This is mandatory."
    },
    safetyWarning: {
        type: Type.STRING,
        description: "A warning message for high-risk jobs. This should only be present if risk is 'High'."
    },
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
    difficulty: {
        type: Type.STRING,
        description: "The estimated difficulty of the repair (e.g., Beginner, Intermediate, Advanced)."
    },
    estimatedTime: {
        type: Type.STRING,
        description: "The estimated time to complete the repair (e.g., '15-30 minutes')."
    },
    potentialPitfalls: {
        type: Type.ARRAY,
        items: {
            type: Type.STRING
        },
        description: "A list of common mistakes or pitfalls to avoid."
    },
  },
  required: ["risk"],
};

const MOCK_SOLUTION: Solution = {
  risk: "Low",
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
  difficulty: "Beginner",
  estimatedTime: "30-45 minutes",
  potentialPitfalls: [
    "Forgetting to turn off the water supply.",
    "Using the wrong size replacement O-rings.",
    "Scratching the faucet finish with tools."
  ],
};


export const getFixItSolution = async (
  fileBase64: string,
  mimeType: string,
  problemDescription: string,
  locale: string,
): Promise<Solution> => {
  if (!process.env.API_KEY) {
    console.warn("⚠️ API_KEY not found. Using mock data for demo purposes. Please set your API_KEY as an environment variable for real results.");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SOLUTION), 2000));
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const filePart = {
      inlineData: {
        data: fileBase64,
        mimeType,
      },
    };

    const textPart = {
      text: problemDescription,
    };

    const systemInstructionTemplate = mimeType.startsWith('video/') 
        ? SYSTEM_INSTRUCTION_VIDEO
        : SYSTEM_INSTRUCTION_PHOTO;
        
    const systemInstruction = systemInstructionTemplate.replace('{locale}', locale);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [filePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
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

export const startChatSession = (initialContext: string): Chat | null => {
    if (!process.env.API_KEY) {
        console.warn("⚠️ API_KEY not found, chat is disabled.");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful DIY assistant. The user has already received an initial diagnosis and a set of instructions for their problem. Your role now is to answer follow-up questions clearly and concisely.

**Formatting Rules:**
- Do not use markdown like asterisks (*) for bolding or italics.
- For lists, use a hyphen (-) at the beginning of each line.

Here is the context of the original problem and the solution you provided:
${initialContext}

Now, continue the conversation and help the user with any further questions they have about this specific repair. Be friendly and encouraging. If they ask about a new problem, politely ask them to start a new "Fix-It" session.`,
        },
    });
    return chat;
};

// --- Part Finder ---

const PART_FINDER_INSTRUCTION = `You are an expert hardware and parts identifier. Your task is to analyze an image of a household or mechanical part and identify it with high precision. Use your visual recognition and OCR capabilities to extract any text, numbers, or logos from the part.

Based on the image, perform the following actions:
1.  **Identify the Part:** Clearly state the name of the part (e.g., "Moen 1225 single-handle faucet cartridge").
2.  **Find Model Number:** If visible or identifiable, provide the exact model number or part number. If not available, state that.
3.  **Describe the Part:** Briefly describe its function and common use.
4.  **Suggest Purchase Locations:** List common places to buy this part (e.g., "Home Depot", "Lowe's", "Amazon", "Local plumbing supply store").
5.  **Find Installation Guide:** Provide a URL to a helpful installation video or guide if you can find a relevant one (e.g., a YouTube link).

Your entire response MUST be in a valid JSON format.`;

const partFinderSchema = {
    type: Type.OBJECT,
    properties: {
        partName: { type: Type.STRING, description: "The specific name of the part, including make if possible." },
        modelNumber: { type: Type.STRING, description: "The model or part number. Can be an empty string if not found." },
        description: { type: Type.STRING, description: "A brief description of the part's function." },
        purchaseLocations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of stores or online sites where the part can be purchased." },
        installationVideo: { type: Type.STRING, description: "A URL to a relevant installation video or guide. Can be an empty string if not found." },
    },
    required: ["partName", "modelNumber", "description", "purchaseLocations", "installationVideo"],
};

const MOCK_PART: PartIdentification = {
    partName: "Moen 1225 Single-Handle Faucet Cartridge",
    modelNumber: "1225 / 1225B",
    description: "A common replacement cartridge for Moen single-handle faucets, used to control water flow and temperature. Fixes most leaks and drips from the spout.",
    purchaseLocations: ["Home Depot", "Lowe's", "Amazon", "Local plumbing supply stores"],
    installationVideo: "https://www.youtube.com/watch?v=kC9_W_x_5_c",
};

export const identifyPart = async (
  imageBase64: string,
  mimeType: string
): Promise<PartIdentification> => {
    if (!process.env.API_KEY) {
        console.warn("⚠️ API_KEY not found. Using mock data for Part Finder.");
        return new Promise(resolve => setTimeout(() => resolve(MOCK_PART), 2000));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const imagePart = { inlineData: { data: imageBase64, mimeType } };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart] },
            config: {
                systemInstruction: PART_FINDER_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: partFinderSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API for part identification:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                throw new Error("Your API key is not valid. Please check it in your environment variables.");
            }
            throw new Error(`Failed to identify part: ${error.message}`);
        }
        throw new Error("An unknown error occurred while identifying the part.");
    }
};


// --- Step Verification ---
const STEP_VERIFICATION_INSTRUCTION = `You are a DIY supervisor. Your goal is to check if a user has correctly completed a repair step.

You will be given:
1.  The specific instruction the user was supposed to follow.
2.  An image of the object **BEFORE** the step was performed.
3.  An image of the object **AFTER** the user claims to have performed the step.

Your task is to visually compare the "before" and "after" images in the context of the instruction. Then, determine if the step was completed correctly.

Your response MUST be a valid JSON object with two keys:
1.  "isCorrect" (boolean): \`true\` if the step is done correctly, \`false\` otherwise.
2.  "feedback" (string): A short, clear, and encouraging message for the user.
    - If correct, confirm it (e.g., "Excellent. The nut is now properly seated. You can proceed to the next step.").
    - If incorrect, explain what seems to be wrong and suggest a correction (e.g., "It looks like it's still a bit loose. Based on the thread pattern, try tightening it another quarter turn.").`;

const verificationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN, description: "True if the step was done correctly, false otherwise." },
        feedback: { type: Type.STRING, description: "A helpful message for the user explaining the result." },
    },
    required: ["isCorrect", "feedback"],
};

const MOCK_VERIFICATION: VerificationResult = {
    isCorrect: true,
    feedback: "Looks great! You've successfully completed the step. Ready for the next one.",
};

export const verifyStep = async (
    beforeImageBase64: string,
    afterImageBase64: string,
    beforeMimeType: string,
    afterMimeType: string,
    instruction: string
): Promise<VerificationResult> => {
    if (!process.env.API_KEY) {
        console.warn("⚠️ API_KEY not found. Using mock data for Step Verification.");
        return new Promise(resolve => setTimeout(() => resolve(MOCK_VERIFICATION), 2000));
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const contents = {
            parts: [
                { text: `The user was given this instruction: "${instruction}"` },
                { text: "Here is the image BEFORE the step:" },
                { inlineData: { data: beforeImageBase64, mimeType: beforeMimeType } },
                { text: "Here is the image AFTER the user performed the step:" },
                { inlineData: { data: afterImageBase64, mimeType: afterMimeType } },
            ],
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: STEP_VERIFICATION_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: verificationSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error calling Gemini API for step verification:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                throw new Error("Your API key is not valid. Please check it in your environment variables.");
            }
            throw new Error(`Failed to verify step: ${error.message}`);
        }
        throw new Error("An unknown error occurred while verifying the step.");
    }
};