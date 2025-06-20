
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, data?: any) => {
  console.log(`[CREATE-CHECKOUT] ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep('Starting checkout session creation')

    // Autenticar usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user

    if (!user?.email) {
      throw new Error('User not authenticated')
    }

    logStep('User authenticated', { userId: user.id, email: user.email })

    const { priceId } = await req.json()
    
    if (!priceId) {
      throw new Error('Price ID is required')
    }

    logStep('Price ID received', { priceId })

    const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
      Deno.env.get('Stripe') ?? '',
      { apiVersion: '2023-10-16' }
    )

    // Verificar se usuário já tem stripe_customer_id no Supabase
    const { data: userData } = await supabaseClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = userData?.stripe_customer_id

    if (customerId) {
      logStep('Found existing customer ID in database', { customerId })
      // Verificar se o customer ainda existe no Stripe
      try {
        await stripe.customers.retrieve(customerId)
        logStep('Customer verified in Stripe')
      } catch (error) {
        logStep('Customer not found in Stripe, will create new one')
        customerId = null
      }
    }

    if (!customerId) {
      // Verificar se já existe customer no Stripe com este email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        logStep('Found existing customer in Stripe', { customerId })
        
        // Atualizar o Supabase com o customer_id encontrado
        await supabaseClient
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      } else {
        // Criar novo customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        })
        customerId = customer.id
        logStep('Created new customer', { customerId })

        // Salvar o customer_id no Supabase
        await supabaseClient
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }
    }

    const origin = req.headers.get('origin') || 'https://preview--care-smart-system.lovable.app'

    logStep('Creating checkout session', { 
      customerId, 
      priceId, 
      origin,
      userId: user.id 
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/configuracoes?canceled=true`,
      metadata: {
        user_id: user.id,
        user_email: user.email
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email
        }
      }
    })

    logStep('Checkout session created successfully', { 
      sessionId: session.id,
      url: session.url 
    })

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    logStep('Error creating checkout session', { error: error.message })
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
