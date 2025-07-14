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

// Helper para log de eventos
const logEvent = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Função para verificar assinatura Stripe de forma assíncrona (compatível com Deno)
async function verifyStripeSignature(body: string, signature: string, secret: string) {
  const elements = signature.split(",");
  let timestamp = 0;
  let v1 = "";

  for (const element of elements) {
    const [key, value] = element.split("=");
    if (key === "t") {
      timestamp = parseInt(value, 10);
    } else if (key === "v1") {
      v1 = value;
    }
  }

  if (!timestamp || !v1) {
    throw new Error("Invalid signature format");
  }

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature_bytes = await crypto.subtle.sign("HMAC", cryptoKey, payloadData);
  const signature_hex = Array.from(new Uint8Array(signature_bytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature_hex !== v1) {
    throw new Error("Invalid signature");
  }

  // Verificar timestamp (não mais que 5 minutos de diferença)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error("Timestamp too old");
  }

  return JSON.parse(body);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logEvent("Webhook recebido", { method: req.method });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logEvent("ERRO: Assinatura Stripe ausente");
      throw new Error("No stripe signature found");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logEvent("ERRO: STRIPE_WEBHOOK_SECRET não configurado");
      throw new Error("Webhook secret not configured");
    }

    logEvent("Validando evento Stripe");
    
    // Verificação manual da assinatura para compatibilidade com Deno
    const event = await verifyStripeSignature(body, signature, webhookSecret);
    
    logEvent("Evento validado", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logEvent("Processando checkout.session.completed", { sessionId: session.id });
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        if (customerId && subscriptionId) {
          // Buscar profissional pelo customer_id
          const { data: profissional, error } = await supabaseClient
            .from('profissionais')
            .select('id, nome')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!error && profissional) {
            await supabaseClient
              .from('profissionais')
              .update({
                stripe_subscription_id: subscriptionId,
                assinatura_ativa: true,
                stripe_status: 'active',
                data_vencimento_assinatura: new Date().toISOString(), // Será atualizada no próximo invoice
              })
              .eq('id', profissional.id);
            
            logEvent("Checkout completado - assinatura ativada", { 
              profissionalId: profissional.id, 
              nome: profissional.nome,
              subscriptionId 
            });
          } else {
            logEvent("ERRO: Profissional não encontrado para customer_id", { customerId });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logEvent("Processando invoice.payment_succeeded", { invoiceId: invoice.id });
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const customerId = subscription.customer as string;
          
          // Buscar profissional pelo customer_id
          const { data: profissional, error } = await supabaseClient
            .from('profissionais')
            .select('id, nome')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!error && profissional) {
            await supabaseClient
              .from('profissionais')
              .update({
                assinatura_ativa: true,
                stripe_status: 'active',
                stripe_subscription_id: subscription.id,
                data_vencimento_assinatura: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('id', profissional.id);
            
            logEvent("Pagamento de fatura bem-sucedido - assinatura reafirmada", { 
              profissionalId: profissional.id,
              nome: profissional.nome,
              subscriptionId: subscription.id 
            });
          } else {
            logEvent("ERRO: Profissional não encontrado para customer_id", { customerId });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logEvent("Processando customer.subscription.updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status 
        });
        
        const customerId = subscription.customer as string;
        
        // Buscar profissional pelo customer_id
        const { data: profissional, error } = await supabaseClient
          .from('profissionais')
          .select('id, nome')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && profissional) {
          const isActive = subscription.status === 'active';
          
          await supabaseClient
            .from('profissionais')
            .update({
              stripe_status: subscription.status,
              assinatura_ativa: isActive,
              stripe_subscription_id: subscription.id,
              data_vencimento_assinatura: isActive ? 
                new Date(subscription.current_period_end * 1000).toISOString() : 
                null,
            })
            .eq('id', profissional.id);
          
          logEvent("Assinatura atualizada", { 
            profissionalId: profissional.id,
            nome: profissional.nome,
            status: subscription.status,
            ativa: isActive 
          });
        } else {
          logEvent("ERRO: Profissional não encontrado para customer_id", { customerId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logEvent("Processando customer.subscription.deleted", { subscriptionId: subscription.id });
        
        const customerId = subscription.customer as string;
        
        // Buscar profissional pelo customer_id
        const { data: profissional, error } = await supabaseClient
          .from('profissionais')
          .select('id, nome')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!error && profissional) {
          await supabaseClient
            .from('profissionais')
            .update({
              assinatura_ativa: false,
              stripe_status: 'canceled',
              stripe_subscription_id: null,
              data_vencimento_assinatura: null,
            })
            .eq('id', profissional.id);
          
          logEvent("Assinatura cancelada", { 
            profissionalId: profissional.id,
            nome: profissional.nome
          });
        } else {
          logEvent("ERRO: Profissional não encontrado para customer_id", { customerId });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logEvent("Processando invoice.payment_failed", { invoiceId: invoice.id });
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          const customerId = subscription.customer as string;
          
          // Buscar profissional pelo customer_id
          const { data: profissional, error } = await supabaseClient
            .from('profissionais')
            .select('id, nome')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!error && profissional) {
            await supabaseClient
              .from('profissionais')
              .update({
                assinatura_ativa: false,
                stripe_status: 'incomplete',
                data_vencimento_assinatura: null,
              })
              .eq('id', profissional.id);
            
            logEvent("Pagamento de fatura falhou - assinatura desativada", { 
              profissionalId: profissional.id,
              nome: profissional.nome
            });
          } else {
            logEvent("ERRO: Profissional não encontrado para customer_id", { customerId });
          }
        }
        break;
      }

      default:
        logEvent("Evento não tratado", { type: event.type });
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