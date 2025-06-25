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
    const { provider, model, prompt, temperature, maxTokens } = await req.json();
    
    // Use the global Groq API key from environment variable
    const apiKey = Deno.env.get('GROQ_API_KEY') || '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';

    // Validate required fields
    if (!provider || !prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: provider and prompt are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let response;

    // Always use Groq API regardless of the provider selected in the UI
    const groqModel = model || "llama3-8b-8192";
    response = await callGroq(apiKey, groqModel, prompt, temperature, maxTokens);

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

    // Enhanced network error detection and guidance
    const isNetworkError = error.message?.includes("Failed to fetch") || 
                          error.message?.includes("Network request failed") ||
                          error.message?.includes("fetch") ||
                          error.name === "TypeError" ||
                          error.message?.includes("getaddrinfo ENOTFOUND") ||
                          error.message?.includes("ECONNREFUSED") ||
                          error.message?.includes("network");

    if (isNetworkError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Outbound network requests are blocked by Supabase Edge Function configuration",
          errorType: "NETWORK_RESTRICTION",
          userMessage: "AI API requests are blocked due to network restrictions. Please configure your Supabase project to allow outbound requests to AI providers.",
          troubleshooting: {
            title: "Required Configuration Steps:",
            steps: [
              "1. Open your Supabase project dashboard",
              "2. Go to 'Edge Functions' → 'Configuration'", 
              "3. Add these domains to 'Outbound Network Allowlist':",
              "   • api.groq.com (required for current setup)",
              "   • api.openai.com (for OpenAI)",
              "   • api.anthropic.com (for Claude)", 
              "   • generativelanguage.googleapis.com (for Gemini)",
              "4. Click 'Save Configuration'",
              "5. Wait 1-2 minutes for changes to take effect",
              "6. Try running your prompt flow again"
            ],
            note: "This is a one-time configuration required for AI integrations. The setup enables secure outbound requests to AI providers."
          }
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle API-specific errors
    if (error.message?.includes("API error")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          errorType: "API_ERROR",
          userMessage: "The AI provider returned an error. Please check your API key and try again."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
        errorType: "UNKNOWN_ERROR"
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
      throw new Error("Network request failed - Outbound requests may be blocked by Supabase Edge Function configuration");
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
      throw new Error("Network request failed - Outbound requests may be blocked by Supabase Edge Function configuration");
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
      throw new Error("Network request failed - Outbound requests may be blocked by Supabase Edge Function configuration");
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
      throw new Error("Network request failed - Outbound requests may be blocked by Supabase Edge Function configuration");
    }
    throw error;
  }
}

// Groq API call with enhanced error handling
async function callGroq(apiKey: string, model: string, prompt: string, temperature = 0.7, maxTokens = 1000) {
  try {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("Groq API key is missing or empty");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "Supabase-Edge-Function/1.0",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
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
        console.warn("Could not parse error response:", parseError);
      }
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from Groq API");
    }
    
    return data.choices[0].message.content || "";
  } catch (error) {
    // Enhanced error detection for network issues
    if (error.name === "TypeError" || 
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("network")) {
      throw new Error("Network request failed - Please check Supabase Edge Function outbound network configuration");
    }
    throw error;
  }
}