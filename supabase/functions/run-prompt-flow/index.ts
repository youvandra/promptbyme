import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { provider, apiKey, model, prompt, temperature, maxTokens } = await req.json();

    // Validate required fields
    if (!provider || !apiKey || !prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: provider, apiKey, and prompt are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let response;

    // Call the appropriate API based on provider
    switch (provider) {
      case "openai":
        response = await callOpenAI(apiKey, model || "gpt-3.5-turbo", prompt, temperature, maxTokens);
        break;
      case "anthropic":
        response = await callAnthropic(apiKey, model || "claude-3-haiku-20240307", prompt, temperature, maxTokens);
        break;
      case "google":
        response = await callGemini(apiKey, model || "gemini-pro", prompt, temperature, maxTokens);
        break;
      case "llama":
        response = await callLlama(apiKey, model || "llama-3-8b-instruct", prompt, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        response,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in run-prompt-flow function:", error);

    // Check if it's a network error and provide helpful guidance
    if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Network request failed. This may be due to Supabase Edge Function network restrictions. Please ensure outbound network requests are enabled for the following domains in your Supabase project settings: api.openai.com, api.anthropic.com, generativelanguage.googleapis.com, api.llama-api.com",
          errorType: "NETWORK_ERROR",
          troubleshooting: {
            step1: "Go to your Supabase project dashboard",
            step2: "Navigate to Edge Functions > Configuration",
            step3: "Add the required API domains to the outbound network allowlist",
            step4: "Redeploy the Edge Function if necessary"
          }
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// OpenAI API call with enhanced error handling
async function callOpenAI(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Failed to fetch - Network request blocked. Please check Supabase Edge Function network settings.");
    }
    throw error;
  }
}

// Anthropic API call with enhanced error handling
async function callAnthropic(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Failed to fetch - Network request blocked. Please check Supabase Edge Function network settings.");
    }
    throw error;
  }
}

// Google Gemini API call with enhanced error handling
async function callGemini(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    return data.candidates[0]?.content?.parts[0]?.text || "";
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Failed to fetch - Network request blocked. Please check Supabase Edge Function network settings.");
    }
    throw error;
  }
}

// Llama API call with enhanced error handling
async function callLlama(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000) {
  try {
    // The exact endpoint will depend on where you're accessing Llama (Meta, Replicate, etc.)
    // This is a generic implementation that works with most Llama API providers
    const llamaEndpoint = "https://api.llama-api.com/v1/chat/completions"; // Replace with actual endpoint
    
    const response = await fetch(llamaEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Llama API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.generation || "";
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Failed to fetch - Network request blocked. Please check Supabase Edge Function network settings.");
    }
    throw error;
  }
}