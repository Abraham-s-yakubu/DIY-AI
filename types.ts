
export interface Solution {
  diagnosis: string;
  tools: string[];
  instructions:string[];
  difficulty: string;
  estimatedTime: string;
  potentialPitfalls: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
}
