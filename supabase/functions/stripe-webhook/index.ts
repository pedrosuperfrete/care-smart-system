
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, data?: any) => {
  console.log(`[WEBHOOK] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )
    logStep('Webhook signature verified', { type: event.type, id: event.id })
  } catch (err) {
    logStep('Webhook signature verification failed', { error: err.message })
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        logStep('Processing checkout.session.completed', { 
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata 
        })
        
        let userId = null
        let customerEmail = null

        // Primeiro, tentar usar user_id dos metadados
        if (session.metadata?.user_id) {
          userId = session.metadata.user_id
          logStep('Found user_id in metadata', { userId })
        }

        // Buscar email do customer
        if (session.customer) {
          try {
            const customer = await stripe.customers.retrieve(session.customer as string)
            if (customer && !customer.deleted) {
              customerEmail = customer.email
              logStep('Retrieved customer email', { email: customerEmail })
            }
          } catch (error) {
            logStep('Error retrieving customer', { error: error.message })
          }
        }

        // Atualizar usuário por ID primeiro, se disponível
        if (userId) {
          const { data: updateResult, error: updateError } = await supabaseClient
            .from('users')
            .update({
              plano: 'pro',
              subscription_id: session.subscription,
              subscription_status: 'active',
              stripe_customer_id: session.customer,
              subscription_end_date: null // Será atualizado quando a subscription for criada
            })
            .eq('id', userId)
            .select()

          if (updateError) {
            logStep('Error updating user by ID', { error: updateError })
          } else {
            logStep('Successfully updated user by ID', { result: updateResult })
            break; // Sucesso, não precisa tentar por email
          }
        }

        // Se não conseguiu por ID, tentar por email
        if (customerEmail) {
          const { data: updateResult, error: updateError } = await supabaseClient
            .from('users')
            .update({
              plano: 'pro',
              subscription_id: session.subscription,
              subscription_status: 'active',
              stripe_customer_id: session.customer,
              subscription_end_date: null
            })
            .eq('email', customerEmail)
            .select()

          if (updateError) {
            logStep('Error updating user by email', { error: updateError })
          } else {
            logStep('Successfully updated user by email', { result: updateResult })
          }
        }

        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object
        logStep('Processing subscription event', { 
          type: event.type,
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          currentPeriodEnd: subscription.current_period_end
        })
        
        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string)
          if (customer && !customer.deleted && customer.email) {
            const status = subscription.status === 'active' ? 'active' : subscription.status
            const plano = status === 'active' ? 'pro' : 'free'
            const subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString()

            logStep('Updating subscription status', {
              email: customer.email,
              plano,
              status,
              endDate: subscriptionEndDate
            })

            const { data: updateResult, error: updateError } = await supabaseClient
              .from('users')
              .update({
                plano,
                subscription_status: status,
                subscription_end_date: subscriptionEndDate,
                subscription_id: subscription.id
              })
              .eq('stripe_customer_id', subscription.customer)
              .select()

            if (updateError) {
              logStep('Error updating subscription', { error: updateError })
            } else {
              logStep('Successfully updated subscription', { result: updateResult })
            }
          }
        } catch (error) {
          logStep('Error processing subscription update', { error: error.message })
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        logStep('Processing subscription deletion', { 
          subscriptionId: deletedSubscription.id,
          customerId: deletedSubscription.customer 
        })
        
        try {
          const { data: updateResult, error: updateError } = await supabaseClient
            .from('users')
            .update({
              plano: 'free',
              subscription_status: 'canceled',
              subscription_id: null,
              subscription_end_date: null
            })
            .eq('stripe_customer_id', deletedSubscription.customer)
            .select()

          if (updateError) {
            logStep('Error canceling subscription', { error: updateError })
          } else {
            logStep('Successfully canceled subscription', { result: updateResult })
          }
        } catch (error) {
          logStep('Error processing subscription deletion', { error: error.message })
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        logStep('Processing payment success', { 
          paymentIntentId: paymentIntent.id,
          customerId: paymentIntent.customer,
          amount: paymentIntent.amount
        })
        
        if (paymentIntent.customer) {
          try {
            const customer = await stripe.customers.retrieve(paymentIntent.customer as string)
            if (customer && !customer.deleted && customer.email) {
              const { data: userData } = await supabaseClient
                .from('users')
                .select('id')
                .eq('email', customer.email)
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
                logStep('Payment history recorded', { userId: userData.id })
              }
            }
          } catch (error) {
            logStep('Error recording payment history', { error: error.message })
          }
        }
        break

      default:
        logStep('Unhandled event type', { type: event.type })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    logStep('Error processing webhook', { error: error.message })
    return new Response(`Webhook Error: ${error.message}`, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
