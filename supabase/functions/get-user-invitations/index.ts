import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Check if required environment variables are available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
    })
    
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

    // Create Supabase client with error handling
    let supabaseClient
    try {
      supabaseClient = createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      console.log('Supabase client created successfully')
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
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
      console.error('No authorization header provided')
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
    let user
    try {
      console.log('Attempting to verify user token...')
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token)
      
      if (authError || !authUser) {
        console.error('Auth error:', authError)
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
      user = authUser
      console.log('User authenticated successfully:', user.id)
    } catch (authError) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication failed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Check if the project_members table exists
    try {
      const { error: tableCheckError } = await supabaseClient
        .from('project_members')
        .select('id')
        .limit(1)
      
      if (tableCheckError) {
        console.log('project_members table does not exist or is not accessible:', tableCheckError.message)
        // Return empty invitations if table doesn't exist
        return new Response(
          JSON.stringify({
            success: true,
            invitations: [],
            total_count: 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    } catch (tableCheckError) {
      console.log('Error checking project_members table:', tableCheckError)
      // Return empty invitations if table check fails
      return new Response(
        JSON.stringify({
          success: true,
          invitations: [],
          total_count: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get all pending invitations for the user
    console.log('Fetching invitations for user:', user.id)
    try {
      const { data: invitations, error: invitationsError } = await supabaseClient
        .from('project_members')
        .select(`
          id,
          project_id,
          role,
          status,
          created_at,
          invited_by_user_id
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitationsError) {
        console.error('Database error fetching invitations:', invitationsError)
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

      console.log('Invitations fetched:', invitations?.length || 0)

      // Get project details
      const projectIds = (invitations || [])
        .map(inv => inv?.project_id)
        .filter(id => id != null && id !== undefined)
      
      let projects = []
      
      if (projectIds.length > 0) {
        console.log('Fetching project details for:', projectIds.length, 'projects')
        const { data: projectData, error: projectError } = await supabaseClient
          .from('flow_projects')
          .select('id, name, description')
          .in('id', projectIds)

        if (projectError) {
          console.error('Error fetching project details:', projectError)
          // Don't fail the entire request, just log the error
        } else {
          projects = projectData || []
          console.log('Project details fetched:', projects.length)
        }
      }

      // Get inviter details from users table
      const inviterIds = (invitations || [])
        .map(inv => inv?.invited_by_user_id)
        .filter(id => id != null && id !== undefined)
      
      let inviters = []
      
      if (inviterIds.length > 0) {
        console.log('Fetching inviter details for:', inviterIds.length, 'users')
        const { data: inviterData, error: inviterError } = await supabaseClient
          .from('users')
          .select('id, display_name, email')
          .in('id', inviterIds)

        if (inviterError) {
          console.error('Error fetching inviter details:', inviterError)
          // Don't fail the entire request, just log the error
        } else {
          inviters = inviterData || []
          console.log('Inviter details fetched:', inviters.length)
        }
      }

      // Format the response with defensive programming
      const formattedInvitations = (invitations || []).map(invitation => {
        try {
          if (!invitation) {
            console.warn('Null invitation found, skipping')
            return null
          }

          const project = projects.find(p => p?.id === invitation.project_id)
          const inviter = inviters.find(inv => inv?.id === invitation.invited_by_user_id)
          
          return {
            id: invitation.id || '',
            project_id: invitation.project_id || '',
            project_name: project?.name || 'Unknown Project',
            project_description: project?.description || null,
            role: invitation.role || 'viewer',
            status: invitation.status || 'pending',
            invited_by: inviter?.display_name || inviter?.email || 'Unknown',
            invited_at: invitation.created_at || new Date().toISOString()
          }
        } catch (formatError) {
          console.error('Error formatting invitation:', formatError, invitation)
          return null
        }
      }).filter(invitation => invitation !== null) // Remove any null entries

      console.log('Formatted invitations:', formattedInvitations.length)

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
    } catch (queryError) {
      console.error('Error querying database:', queryError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database query error: ' + (queryError?.message || 'Unknown error')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  } catch (error) {
    console.error('Unexpected error in get-user-invitations function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred: ' + (error?.message || 'Unknown error')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})