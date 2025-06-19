
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
  Deno.env.get('Stripe') ?? '',
  { apiVersion: '2023-10-16' }
)

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        const userId = session.metadata?.user_id

        if (userId && session.mode === 'subscription') {
          await supabaseClient
            .from('users')
            .update({
              plano: 'pro',
              subscription_id: session.subscription,
              subscription_status: 'active'
            })
            .eq('id', userId)
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        
        if (customer && !customer.deleted && customer.metadata?.user_id) {
          const status = subscription.status === 'active' ? 'active' : 'inactive'
          const plano = status === 'active' ? 'pro' : 'free'

          await supabaseClient
            .from('users')
            .update({
              plano,
              subscription_status: status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', customer.metadata.user_id)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer as string)
        
        if (deletedCustomer && !deletedCustomer.deleted && deletedCustomer.metadata?.user_id) {
          await supabaseClient
            .from('users')
            .update({
              plano: 'free',
              subscription_status: 'canceled',
              subscription_id: null
            })
            .eq('id', deletedCustomer.metadata.user_id)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        const paymentCustomer = await stripe.customers.retrieve(paymentIntent.customer as string)
        
        if (paymentCustomer && !paymentCustomer.deleted && paymentCustomer.metadata?.user_id) {
          await supabaseClient
            .from('payment_history')
            .insert({
              user_id: paymentCustomer.metadata.user_id,
              stripe_payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              status: 'paid',
              payment_method: paymentIntent.payment_method_types?.[0] || 'card'
            })
        }
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 500 })
  }
})
