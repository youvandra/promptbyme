import { createClient } from 'npm:@supabase/supabase-js@2'
import * as crypto from 'node:crypto'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.warn('RevenueCat webhook secret is not configured')
    }

    // Get the request body as text for signature verification
    const bodyText = await req.text()
    let body
    
    try {
      // Parse the body as JSON
      body = JSON.parse(bodyText)
    } catch (error) {
      console.error('Error parsing webhook body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('X-RevenueCat-Signature')
      
      if (!signature) {
        console.error('Missing RevenueCat signature header')
        return new Response(
          JSON.stringify({ error: 'Missing signature header' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Verify the signature
      const hmac = crypto.createHmac('sha256', webhookSecret)
      hmac.update(bodyText)
      const calculatedSignature = hmac.digest('hex')
      
      if (calculatedSignature !== signature) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    console.log('Received RevenueCat webhook:', body)

    // Extract event data
    const eventType = body.event?.type
    const userId = body.event?.app_user_id // This should be your user's ID
    const productId = body.event?.product_id
    const purchaseDate = body.event?.purchase_date
    const expirationDate = body.event?.expiration_date
    const environment = body.event?.environment // SANDBOX or PRODUCTION

    // Skip processing for sandbox events in production if needed
    if (Deno.env.get('ENVIRONMENT') === 'production' && environment === 'SANDBOX') {
      console.log('Skipping sandbox event in production')
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Process the event based on its type
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // Handle new subscription or renewal
        if (userId) {
          // Update user's subscription status in your database
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan: productId || 'pro', // Map product_id to your plan names
              status: 'active',
              current_period_end: expirationDate ? new Date(expirationDate) : null,
              updated_at: new Date()
            })

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break

      case 'CANCELLATION':
      case 'EXPIRATION':
        // Handle subscription cancellation or expiration
        if (userId) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              status: 'canceled',
              updated_at: new Date()
            })

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break

      case 'BILLING_ISSUE':
        // Handle billing issues
        if (userId) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              status: 'past_due',
              updated_at: new Date()
            })

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break

      case 'SUBSCRIBER_ALIAS':
        // Handle subscriber alias (e.g., anonymous ID to identified user)
        console.log('Subscriber alias event:', body)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    // Always return a 200 response to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})