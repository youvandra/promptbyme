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
    let project_id, member_user_id
    try {
      const body = await req.json()
      project_id = body.project_id
      member_user_id = body.member_user_id
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
    
    if (!project_id || !member_user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID and member user ID are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if user has permission to remove members
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

    let canRemove = false
    if (project.user_id === user.id) {
      canRemove = true // Project owner can always remove members
    } else if (member_user_id === user.id) {
      canRemove = true // Users can remove themselves
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
        canRemove = true
      }
    }

    if (!canRemove) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied: You do not have permission to remove this member'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Prevent removing the project owner
    if (member_user_id === project.user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot remove the project owner'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Remove the member
    const { error: removeError } = await supabaseClient
      .from('project_members')
      .delete()
      .eq('project_id', project_id)
      .eq('user_id', member_user_id)

    if (removeError) {
      console.error('Database error:', removeError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to remove member: ' + removeError.message
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
        message: 'Member removed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in remove-project-member function:', error)
    
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