import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if required environment variables are available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error: Missing required environment variables'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the client was created successfully
    if (!supabaseClient) {
      console.error('Failed to create Supabase client')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error: Failed to initialize database client'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

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

    // Get all pending invitations for the user
    const { data: invitations, error: invitationsError } = await supabaseClient
      .from('project_members')
      .select(`
        id,
        project_id,
        role,
        status,
        created_at,
        invited_by_user_id,
        flow_projects (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Database error:', invitationsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch invitations: ' + invitationsError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Get inviter details from users table
    const inviterIds = invitations?.map(inv => inv.invited_by_user_id).filter(Boolean) || []
    let inviters = []
    
    if (inviterIds.length > 0) {
      const { data: inviterData, error: inviterError } = await supabaseClient
        .from('users')
        .select('id, display_name, email')
        .in('id', inviterIds)

      if (!inviterError) {
        inviters = inviterData || []
      }
    }

    // Format the response
    const formattedInvitations = (invitations || []).map(invitation => {
      const inviter = inviters.find(inv => inv.id === invitation.invited_by_user_id)
      
      return {
        id: invitation.id,
        project_id: invitation.project_id,
        project_name: invitation.flow_projects?.name || 'Unknown Project',
        project_description: invitation.flow_projects?.description || null,
        role: invitation.role,
        status: invitation.status,
        invited_by: inviter?.display_name || inviter?.email || 'Unknown',
        invited_at: invitation.created_at
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        invitations: formattedInvitations,
        total_count: formattedInvitations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in get-user-invitations function:', error)
    
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