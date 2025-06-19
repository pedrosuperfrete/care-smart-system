
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    console.log('Creating checkout session for user:', user.id, user.email)

    const { priceId } = await req.json()
    
    if (!priceId) {
      throw new Error('Price ID is required')
    }

    const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
      Deno.env.get('Stripe') ?? '',
      { apiVersion: '2023-10-16' }
    )

    // Verificar se já existe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    let customerId
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      console.log('Found existing customer:', customerId)
    } else {
      // Criar novo customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      })
      customerId = customer.id
      console.log('Created new customer:', customerId)
    }

    const origin = req.headers.get('origin') || 'https://preview--care-smart-system.lovable.app'

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
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/configuracoes?canceled=true`,
      metadata: {
        user_id: user.id
      }
    })

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
