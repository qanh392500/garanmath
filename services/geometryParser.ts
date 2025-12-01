import { GeoGebraConstruction } from '../types';

export interface ChatResponse {
  message: string;
  commands: string[];
}

const API_BASE_URL = 'http://localhost:3001/api';

const getAuthHeader = (token?: string | null) => {
  const finalToken = token || localStorage.getItem('token');
  console.log("DEBUG: Token used for request:", finalToken ? finalToken.substring(0, 10) + "..." : "null");
  return finalToken ? { 'Authorization': `Bearer ${finalToken}` } : {};
};

export const generateGeoGebraCommands = async (problemText: string, imageBase64: string | null = null, token?: string | null): Promise<GeoGebraConstruction> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
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

export const generateIncrementalCommands = async (chatMessage: string, currentCommands: string[] = [], history: { role: 'user' | 'model', text: string }[] = [], token?: string | null): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
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