import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { flowId, apiKey, model, initialVariables = {} } = await req.json();
    
    if (!flowId || !apiKey || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: flowId, apiKey, and model are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the flow and verify ownership
    const { data: flow, error: flowError } = await supabase
      .from('prompt_flows')
      .select('*')
      .eq('id', flowId)
      .single();
    
    if (flowError || !flow) {
      return new Response(
        JSON.stringify({ error: 'Flow not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (flow.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to execute this flow' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the flow steps with their prompts
    const { data: steps, error: stepsError } = await supabase
      .from('flow_steps')
      .select(`
        *,
        prompt:prompts(id, title, content)
      `)
      .eq('flow_id', flowId)
      .order('order_index');
    
    if (stepsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flow steps' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!steps || steps.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Flow has no steps' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Execute each step in sequence
    const results = [];
    let variables = { ...initialVariables };
    
    for (const step of steps) {
      // Get the prompt content
      let promptContent = step.prompt?.content || '';
      
      // Replace variables in the prompt content
      for (const [key, value] of Object.entries(variables)) {
        promptContent = promptContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      
      // Execute the prompt using the specified API
      let response;
      let result;
      
      try {
        if (model.includes('gpt')) {
          // OpenAI API
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: promptContent }],
              temperature: 0.7
            })
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with OpenAI');
          }
          
          result = data.choices[0]?.message?.content || '';
        } 
        else if (model.includes('claude')) {
          // Anthropic Claude API
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: promptContent }],
              max_tokens: 1000
            })
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with Claude');
          }
          
          result = data.content[0]?.text || '';
        }
        else if (model.includes('gemini')) {
          // Google Gemini API
          response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptContent }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
              }
            })
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to execute prompt with Gemini');
          }
          
          result = data.candidates[0]?.content?.parts[0]?.text || '';
        }
        else {
          throw new Error(`Unsupported model: ${model}`);
        }
      } catch (apiError) {
        return new Response(
          JSON.stringify({ 
            error: `Error executing step ${step.order_index + 1}: ${apiError.message}`,
            step: step.step_title
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Add result to results array
      results.push({
        step_id: step.id,
        step_title: step.step_title,
        order_index: step.order_index,
        prompt: promptContent,
        result
      });
      
      // Store result as a variable for the next step
      variables[`step_${step.order_index + 1}_output`] = result;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        flow_id: flowId,
        flow_name: flow.name,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in run-prompt-flow function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});