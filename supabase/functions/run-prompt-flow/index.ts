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

    return new Response(
      JSON.stringify({
        success: false,
        error: "This endpoint is deprecated. AI API calls are now made directly from the frontend.",
        message: "Please update your application to use the latest version that makes direct API calls."
      }),
      {
        status: 410, // Gone - indicates that the resource is no longer available
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
