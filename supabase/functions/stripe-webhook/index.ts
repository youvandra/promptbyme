import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@13.9.0'

Deno.serve(async (req) => {
  try {
    // Initialize Stripe with the secret key from environment variables
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
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

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400 }
      )
    }

    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook secret' }),
        { status: 500 }
      )
    }

    // Get the raw body
    const body = await req.text()

    // Verify the event
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id || session.client_reference_id

        if (!userId) {
          console.error('No user ID found in session metadata or client_reference_id')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const priceId = subscription.items.data[0].price.id
        
        // Determine the plan based on the price ID
        let plan = 'basic'
        if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) {
          plan = 'pro'
        } else if (priceId === Deno.env.get('STRIPE_PRICE_ENTERPRISE')) {
          plan = 'enterprise'
        }

        // Update user's subscription in the database
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: plan,
            status: 'active',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })

        if (updateError) {
          console.error('Error updating user subscription:', updateError)
        }
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = await getUserIdFromCustomerId(supabaseClient, subscription.customer)
        
        if (!userId) {
          console.error('No user found for customer ID:', subscription.customer)
          break
        }
        
        // Determine the plan based on the price ID
        const priceId = subscription.items.data[0].price.id
        let plan = 'basic'
        if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) {
          plan = 'pro'
        } else if (priceId === Deno.env.get('STRIPE_PRICE_ENTERPRISE')) {
          plan = 'enterprise'
        }
        
        // Update subscription in database
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            plan: plan,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (updateError) {
          console.error('Error updating subscription:', updateError)
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        // Update subscription status in database
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (updateError) {
          console.error('Error updating subscription status:', updateError)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
})

// Helper function to get user ID from Stripe customer ID
async function getUserIdFromCustomerId(supabase, customerId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()
  
  if (error || !data) {
    console.error('Error finding user for customer ID:', error)
    return null
  }
  
  return data.user_id
}