import { GeoGebraConstruction } from '../types';

export interface ChatResponse {
  message: string;
  commands: string[];
  trace?: {
    planner: string[];
    rag: string[];
  };
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

export const generateGeoGebraCommands = async (problemText: string, imageBase64: string | null = null): Promise<GeoGebraConstruction> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        problemText,
        imageBase64,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to generate commands: ${response.status}`);
    }

    const data = await response.json();
    return data as GeoGebraConstruction;

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const generateIncrementalCommands = async (chatMessage: string, currentCommands: string[] = [], history: { role: 'user' | 'model', text: string }[] = []): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message: chatMessage,
        currentCommands,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to generate chat response: ${response.status}`);
    }

    const data = await response.json();
    return data as ChatResponse;

  } catch (error) {
    console.error("API Chat Error:", error);
    throw error;
  }
};