
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')!;
  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('Processing event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        if (session.mode === 'subscription') {
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          const userId = session.metadata?.user_id;

          console.log('Processing subscription:', { customerId, subscriptionId, userId });

          if (userId) {
            // Buscar detalhes da subscription
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
            
            const { error } = await supabaseClient
              .from('users')
              .update({
                stripe_customer_id: customerId,
                subscription_id: subscriptionId,
                subscription_status: subscription.status,
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                plano: 'pro'
              })
              .eq('id', userId);

            if (error) {
              console.error('Error updating user subscription:', error);
            } else {
              console.log('User subscription updated successfully for user:', userId);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);

        const { data: userData } = await supabaseClient
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (userData) {
          const { error } = await supabaseClient
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              plano: subscription.status === 'active' ? 'pro' : 'free'
            })
            .eq('id', userData.id);

          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription updated successfully for user:', userData.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        const { data: userData } = await supabaseClient
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (userData) {
          const { error } = await supabaseClient
            .from('users')
            .update({
              subscription_status: 'canceled',
              plano: 'free'
            })
            .eq('id', userData.id);

          if (error) {
            console.error('Error updating canceled subscription:', error);
          } else {
            console.log('Subscription canceled successfully for user:', userData.id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }

  return new Response('Webhook received', { status: 200 });
});
