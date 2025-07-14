import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const customerId = subscription.customer as string;
          
          // Buscar profissional pelo customer_id
          const { data: profissional, error } = await supabaseClient
            .from('profissionais')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!error && profissional) {
            await supabaseClient
              .from('profissionais')
              .update({
                assinatura_ativa: true,
                stripe_subscription_id: subscription.id,
                data_vencimento_assinatura: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', profissional.id);
            
            console.log("Assinatura ativada para profissional:", profissional.id);
          }
        }
        break;
      }

      case "invoice.payment_failed":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Buscar profissional pelo customer_id
        const { data: profissional, error } = await supabaseClient
          .from('profissionais')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && profissional) {
          await supabaseClient
            .from('profissionais')
            .update({
              assinatura_ativa: false,
              stripe_subscription_id: null,
              data_vencimento_assinatura: null,
            })
            .eq('id', profissional.id);
          
          console.log("Assinatura desativada para profissional:", profissional.id);
        }
        break;
      }

      default:
        console.log("Evento não tratado:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});