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
    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing required environment variables:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceRoleKey
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error: Missing required environment variables'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let project_id, invited_user_email, role
    try {
      const body = await req.json()
      project_id = body.project_id
      invited_user_email = body.invited_user_email
      role = body.role
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!project_id || !invited_user_email || !role) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID, email, and role are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid role specified'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has permission to invite members
    const { data: project, error: projectError } = await supabaseClient
      .from('flow_projects')
      .select('user_id')
      .eq('id', project_id)
      .maybeSingle()

    if (projectError) {
      console.error('Project query error:', projectError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found: ' + projectError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let canInvite = false
    if (project.user_id === user.id) {
      canInvite = true // Project owner can always invite
    } else {
      // Check if user is an admin member
      const { data: memberData, error: memberError } = await supabaseClient
        .from('project_members')
        .select('role')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!memberError && memberData?.role === 'admin') {
        canInvite = true
      }
    }

    if (!canInvite) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied: You do not have permission to invite members'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find the user to invite by email
    const { data: invitedUser, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', invited_user_email)
      .maybeSingle()

    if (userError || !invitedUser) {
      console.error('User lookup error:', userError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found with the provided email address' + (userError ? ': ' + userError.message : '')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is already a member or has a pending invitation
    const { data: existingMember, error: existingError } = await supabaseClient
      .from('project_members')
      .select('id, status')
      .eq('project_id', project_id)
      .eq('user_id', invitedUser.id)
      .maybeSingle()

    if (!existingError && existingMember) {
      if (existingMember.status === 'accepted') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User is already a member of this project'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (existingMember.status === 'pending') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User already has a pending invitation to this project'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('project_members')
      .insert([{
        project_id,
        user_id: invitedUser.id,
        role,
        status: 'pending',
        invited_by_user_id: user.id
      }])
      .select()
      .single()

    if (inviteError) {
      console.error('Database error:', inviteError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create invitation: ' + inviteError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitation_id: invitation.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in invite-project-member function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})