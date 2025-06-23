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

    // Get project_id from either query params (GET) or request body (POST)
    let project_id
    
    try {
      if (req.method === 'GET') {
        const url = new URL(req.url)
        project_id = url.searchParams.get('project_id')
      } else if (req.method === 'POST') {
        const body = await req.json()
        project_id = body.project_id
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
    
    if (!project_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project ID is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if user has access to this project
    const { data: project, error: projectError } = await supabaseClient
      .from('flow_projects')
      .select('user_id')
      .eq('id', project_id)
      .single()

    if (projectError) {
      console.error('Project fetch error:', projectError)
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

    // Check user's role in the project
    let userRole = null
    if (project.user_id === user.id) {
      userRole = 'admin' // Project owner is always admin
    } else {
      const { data: memberData, error: memberError } = await supabaseClient
        .from('project_members')
        .select('role')
        .eq('project_id', project_id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (!memberError && memberData) {
        userRole = memberData.role
      }
    }

    if (!userRole) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied: You are not a member of this project'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Get all project members
    const { data: members, error: membersError } = await supabaseClient
      .from('project_members')
      .select(`
        id,
        user_id,
        role,
        status,
        created_at,
        updated_at
      `)
      .eq('project_id', project_id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Database error:', membersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch project members: ' + membersError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Get user details for all members
    const memberUserIds = (members || []).map(m => m.user_id)
    
    // Add project owner if not in members
    if (!memberUserIds.includes(project.user_id)) {
      memberUserIds.push(project.user_id)
    }

    const { data: usersData, error: usersError } = await supabaseClient
      .from('users')
      .select('id, email, display_name, avatar_url')
      .in('id', memberUserIds)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch user details: ' + usersError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const usersMap = new Map((usersData || []).map(u => [u.id, u]))

    // Add project owner as admin if not already in members
    let allMembers = members || []
    const ownerInMembers = allMembers.some(m => m.user_id === project.user_id)

    if (!ownerInMembers) {
      allMembers.unshift({
        id: 'owner',
        user_id: project.user_id,
        role: 'admin',
        status: 'accepted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    // Format the response
    const formattedMembers = allMembers.map(member => {
      const userData = usersMap.get(member.user_id)
      
      return {
        id: member.id,
        user_id: member.user_id,
        email: userData?.email || 'Unknown',
        display_name: userData?.display_name || userData?.email || 'Unknown User',
        avatar_url: userData?.avatar_url || null,
        role: member.role,
        status: member.status,
        invited_by: '', // We can add this later if needed
        joined_at: member.created_at,
        updated_at: member.updated_at,
        last_active: null, // We can add this later if needed
        is_current_user: member.user_id === user.id
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        members: formattedMembers,
        user_role: userRole,
        total_count: formattedMembers.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Unexpected error in get-project-members function:', error)
    
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