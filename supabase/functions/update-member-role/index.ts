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
    let project_id, member_user_id, new_role
    try {
      const body = await req.json()
      project_id = body.project_id
      member_user_id = body.member_user_id
      new_role = body.new_role
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    if (!project_id || !member_user_id || !new_role) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID, member user ID, and new role are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!['admin', 'editor', 'viewer'].includes(new_role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid role specified'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if user has permission to update member roles
    const { data: project, error: projectError } = await supabaseClient
      .from('flow_projects')
      .select('user_id')
      .eq('id', project_id)
      .single()

    if (projectError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    let canUpdate = false
    if (project.user_id === user.id) {
      canUpdate = true // Project owner can always update roles
    } else {
      // Check if user is an admin member
      const { data: memberData, error: memberError } = await supabaseClient
        .from('project_members')
        .select('role')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (!memberError && memberData?.role === 'admin') {
        canUpdate = true
      }
    }

    if (!canUpdate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied: You do not have permission to update member roles'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Prevent changing the project owner's role
    if (member_user_id === project.user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot change the role of the project owner'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Update the member's role
    const { error: updateError } = await supabaseClient
      .from('project_members')
      .update({ role: new_role })
      .eq('project_id', project_id)
      .eq('user_id', member_user_id)
      .eq('status', 'accepted')

    if (updateError) {
      console.error('Database error:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update member role: ' + updateError.message
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
        message: 'Member role updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in update-member-role function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})