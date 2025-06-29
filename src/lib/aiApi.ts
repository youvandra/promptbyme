import { supabase } from './supabase';

// Types for API calls
export interface AICallParams {
  provider: 'openai' | 'anthropic' | 'google' | 'llama' | 'groq';
  apiKey: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

// Main function to call AI APIs
export async function callAI(params: AICallParams): Promise<string> {
  const { provider, apiKey, model, prompt, temperature = 0.7, maxTokens = 1000 } = params;
  
  // Validate required parameters
  if (!provider || !apiKey || !prompt) {
    throw new Error('Missing required parameters: provider, apiKey, and prompt are required');
  }
  
  // Call the appropriate provider-specific function
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, prompt, temperature, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, model, prompt, temperature, maxTokens);
    case 'google':
      return callGoogle(apiKey, model, prompt, temperature, maxTokens);
    case 'llama':
      return callLlama(apiKey, model, prompt, temperature, maxTokens);
    case 'groq':
      return callGroq(apiKey, model, prompt, temperature, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// OpenAI API call
async function callOpenAI(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('OpenAI API call failed:', error);
    throw new Error(`OpenAI API call failed: ${error.message}`);
  }
}

// Anthropic API call
async function callAnthropic(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  } catch (error: any) {
    console.error('Anthropic API call failed:', error);
    throw new Error(`Anthropic API call failed: ${error.message}`);
  }
}

// Google Gemini API call
async function callGoogle(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error: any) {
    console.error('Google API call failed:', error);
    throw new Error(`Google API call failed: ${error.message}`);
  }
}

// Llama API call
async function callLlama(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000): Promise<string> {
  try {
    // This is a generic implementation - you'll need to adjust based on your Llama provider
    const response = await fetch('https://api.llama-api.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Llama API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.generation || '';
  } catch (error: any) {
    console.error('Llama API call failed:', error);
    throw new Error(`Llama API call failed: ${error.message}`);
  }
}

// Groq API call
async function callGroq(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000): Promise<string> {
  try {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Groq API key is missing or empty');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }
    
    return data.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Groq API call failed:', error);
    throw new Error(`Groq API call failed: ${error.message}`);
  }
}

// Fallback to Supabase Edge Function if direct API calls fail
export async function callAIViaEdgeFunction(params: Omit<AICallParams, 'apiKey'>): Promise<string> {
  try {
    const { provider, model, prompt, temperature = 0.7, maxTokens = 1000 } = params;
    
    const { data, error } = await supabase.functions.invoke('run-prompt-flow', {
      body: { 
        provider,
        model,
        prompt,
        temperature,
        maxTokens
      }
    });
    
    if (error) throw new Error(error.message);
    if (!data.success) throw new Error(data.error || 'Unknown error');
    
    return data.response;
  } catch (error: any) {
    console.error('Edge Function call failed:', error);
    throw new Error(`Edge Function call failed: ${error.message}`);
  }
}