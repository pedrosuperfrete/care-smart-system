import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de planos para price_ids do Stripe
// TODO: Substituir pelos IDs reais do Stripe
const PLAN_PRICES: Record<string, { monthly: string; yearly: string }> = {
  profissional: {
    monthly: Deno.env.get("STRIPE_PRICE_SOLO_MONTHLY") || Deno.env.get("STRIPE_PRICE_ID") || "",
    yearly: Deno.env.get("STRIPE_PRICE_SOLO_YEARLY") || "",
  },
  profissional_secretaria: {
    monthly: Deno.env.get("STRIPE_PRICE_TEAM_MONTHLY") || "",
    yearly: Deno.env.get("STRIPE_PRICE_TEAM_YEARLY") || "",
  },
  profissional_adicional: {
    monthly: Deno.env.get("STRIPE_PRICE_ADDON_MONTHLY") || "",
    yearly: Deno.env.get("STRIPE_PRICE_ADDON_YEARLY") || "",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ⚠️ SECURITY: Explicit authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const user = data.user;
    if (!user.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse request body para pegar o tipo de plano
    let planType = "profissional"; // Default
    let billingPeriod = "yearly"; // Default para anual (melhor para o usuário)
    
    try {
      const body = await req.json();
      if (body.planType) planType = body.planType;
      if (body.billingPeriod) billingPeriod = body.billingPeriod;
    } catch {
      // Body vazio, usar defaults
    }

    // ⚠️ SECURITY: Verify user is a professional before creating checkout
    const { data: profissional, error: profError } = await supabaseClient
      .from('profissionais')
      .select('id, nome, stripe_customer_id, assinatura_ativa, clinica_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single();

    if (profError || !profissional) {
      return new Response(
        JSON.stringify({ error: "Only professionals can subscribe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se já existe customer
    let customerId = profissional.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profissional.nome,
        metadata: {
          profissional_id: profissional.id,
          user_id: user.id,
          clinica_id: profissional.clinica_id,
        },
      });
      customerId = customer.id;

      // Atualizar profissional com customer_id
      await supabaseClient
        .from('profissionais')
        .update({ stripe_customer_id: customerId })
        .eq('id', profissional.id);
    }

    // Selecionar o price_id correto baseado no plano e período
    const planConfig = PLAN_PRICES[planType] || PLAN_PRICES.profissional;
    const priceId = billingPeriod === "monthly" ? planConfig.monthly : planConfig.yearly;

    // Se não tem price_id configurado, usar o padrão
    const finalPriceId = priceId || Deno.env.get("STRIPE_PRICE_ID");

    if (!finalPriceId) {
      console.error("Nenhum STRIPE_PRICE_ID configurado para o plano:", planType);
      return new Response(
        JSON.stringify({ error: "Price not configured for this plan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Criando checkout: plano=${planType}, período=${billingPeriod}, priceId=${finalPriceId}`);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/app/pagamento-sucesso`,
      cancel_url: `${req.headers.get("origin")}/app/configuracoes?tab=assinatura&canceled=true`,
      metadata: {
        profissional_id: profissional.id,
        clinica_id: profissional.clinica_id,
        plan_type: planType,
        billing_period: billingPeriod,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
