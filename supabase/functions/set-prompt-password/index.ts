import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Simple hash function using Web Crypto API (available in Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication token'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const { promptId, password, action } = await req.json()

    if (!promptId || !action || (action === 'set' && !password)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Prompt ID, action, and password (for set action) are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!['set', 'remove'].includes(action)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Must be "set" or "remove"'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if user owns the prompt
    const { data: prompt, error: promptError } = await supabaseClient
      .from('prompts')
      .select('user_id, access')
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

    if (prompt.user_id !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You do not have permission to modify this prompt'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Check if prompt is public (password protection only applies to public prompts)
    if (prompt.access !== 'public') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Only public prompts can be password protected'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Process the action
    if (action === 'set') {
      // Hash the password using Web Crypto API
      const passwordHash = await hashPassword(password)

      // Update the prompt with the password hash
      const { error: updateError } = await supabaseClient
        .from('prompts')
        .update({
          password_hash: passwordHash,
          is_password_protected: true
        })
        .eq('id', promptId)

      if (updateError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to set password: ' + updateError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Password set successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'remove') {
      // Remove the password protection
      const { error: updateError } = await supabaseClient
        .from('prompts')
        .update({
          password_hash: null,
          is_password_protected: false
        })
        .eq('id', promptId)

      if (updateError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to remove password: ' + updateError.message
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Password protection removed successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // This should never happen due to the action validation above
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  } catch (error) {
    console.error('Error in set-prompt-password function:', error)
    
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