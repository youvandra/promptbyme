import { createClient } from 'npm:@supabase/supabase-js@2'
import * as bcrypt from 'npm:bcryptjs@2.4.3'

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

    // Parse request body
    const { promptId, password } = await req.json()

    if (!promptId || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Prompt ID and password are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get the prompt
    const { data: prompt, error: promptError } = await supabaseClient
      .from('prompts')
      .select('password_hash, is_password_protected')
      .eq('id', promptId)
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

    // Check if prompt is password protected
    if (!prompt.is_password_protected || !prompt.password_hash) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'This prompt is not password protected'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, prompt.password_hash)

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid password'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Password is valid
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password verified successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in verify-prompt-password function:', error)
    
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