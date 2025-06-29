import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No authorization header provided'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '')
    let userId: string | null = null

    // Check if the token is a valid API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('user_id')
      .eq('key', token)
      .eq('key_type', 'pbm_api_key')
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API key'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    userId = apiKeyData.user_id

    // Parse request body
    const { 
      prompt_id, 
      variables = {}, 
      api_key, 
      provider = 'groq', 
      model = 'llama3-8b-8192', 
      temperature = 0.7, 
      max_tokens = 1000 
    } = await req.json()
    
    if (!prompt_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Prompt ID is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!api_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI provider API key is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch the prompt
    const { data: prompt, error: promptError } = await supabaseClient
      .from('prompts')
      .select('*')
      .eq('id', prompt_id)
      .single()

    if (promptError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Prompt not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Check if user has access to the prompt
    if (prompt.access !== 'public' && prompt.user_id !== userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied: This prompt is private'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Replace variables in the prompt content
    let processedContent = prompt.content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      processedContent = processedContent.replace(regex, value)
    }

    // Check if there are any unfilled variables
    const remainingVariables = processedContent.match(/\{\{([^}]+)\}\}/g)
    if (remainingVariables) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing variables: ' + remainingVariables.join(', '),
          missingVariables: remainingVariables.map(v => v.replace(/[{}]/g, ''))
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Call the AI API based on the provider
    let aiResponse
    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          aiResponse = await callOpenAI(api_key, model, processedContent, temperature, max_tokens)
          break
        case 'anthropic':
          aiResponse = await callAnthropic(api_key, model, processedContent, temperature, max_tokens)
          break
        case 'google':
          aiResponse = await callGoogle(api_key, model, processedContent, temperature, max_tokens)
          break
        case 'llama':
          aiResponse = await callLlama(api_key, model, processedContent, temperature, max_tokens)
          break
        case 'groq':
          aiResponse = await callGroq(api_key, model, processedContent, temperature, max_tokens)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `AI API error: ${error.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Increment the prompt view count
    try {
      await supabaseClient
        .from('prompts')
        .update({ views: (prompt.views || 0) + 1 })
        .eq('id', prompt_id)
    } catch (error) {
      console.error('Failed to increment view count:', error)
      // Don't fail the request if view count update fails
    }

    // Return the AI response
    return new Response(
      JSON.stringify({
        success: true,
        output: aiResponse,
        prompt: {
          id: prompt.id,
          title: prompt.title,
          processed_content: processedContent
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in run-prompt-api function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error && error.message) || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

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