
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

  console.log('Processing webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        console.log('Checkout session completed:', session.id)
        
        // Buscar customer do Stripe para obter o email
        const customer = await stripe.customers.retrieve(session.customer as string)
        
        if (customer && !customer.deleted && customer.email) {
          console.log('Updating user plan for email:', customer.email)
          
          const { data: updateResult, error: updateError } = await supabaseClient
            .from('users')
            .update({
              plano: 'pro',
              subscription_id: session.subscription,
              subscription_status: 'active',
              stripe_customer_id: session.customer
            })
            .eq('email', customer.email)

          if (updateError) {
            console.error('Error updating user:', updateError)
          } else {
            console.log('User updated successfully:', updateResult)
          }
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id, 'status:', subscription.status)
        
        const subscriptionCustomer = await stripe.customers.retrieve(subscription.customer as string)
        
        if (subscriptionCustomer && !subscriptionCustomer.deleted && subscriptionCustomer.email) {
          const status = subscription.status === 'active' ? 'active' : 'inactive'
          const plano = status === 'active' ? 'pro' : 'free'

          console.log('Updating subscription for email:', subscriptionCustomer.email, 'new plan:', plano)

          await supabaseClient
            .from('users')
            .update({
              plano,
              subscription_status: status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('email', subscriptionCustomer.email)
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        console.log('Subscription deleted:', deletedSubscription.id)
        
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer as string)
        
        if (deletedCustomer && !deletedCustomer.deleted && deletedCustomer.email) {
          console.log('Canceling subscription for email:', deletedCustomer.email)
          
          await supabaseClient
            .from('users')
            .update({
              plano: 'free',
              subscription_status: 'canceled',
              subscription_id: null
            })
            .eq('email', deletedCustomer.email)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment succeeded:', paymentIntent.id)
        
        const paymentCustomer = await stripe.customers.retrieve(paymentIntent.customer as string)
        
        if (paymentCustomer && !paymentCustomer.deleted && paymentCustomer.email) {
          // Buscar user_id pelo email
          const { data: userData } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', paymentCustomer.email)
            .single()

          if (userData) {
            await supabaseClient
              .from('payment_history')
              .insert({
                user_id: userData.id,
                stripe_payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                status: 'paid',
                payment_method: paymentIntent.payment_method_types?.[0] || 'card'
              })
          }
        }
        break

      default:
        console.log('Unhandled event type:', event.type)
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
