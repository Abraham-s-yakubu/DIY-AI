export interface Solution {
  risk: 'Low' | 'Medium' | 'High';
  safetyWarning?: string;
  diagnosis?: string;
  tools?: string[];
  instructions?: string[];
  difficulty?: string;
  estimatedTime?: string;
  potentialPitfalls?: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
}

export interface PartIdentification {
  partName: string;
  modelNumber?: string;
  description: string;
  purchaseLocations: string[];
  installationVideo?: string;
}

export interface VerificationResult {
  isCorrect: boolean;
  feedback: string;
}