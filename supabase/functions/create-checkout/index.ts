import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("Usuário não autenticado");

    // Buscar dados do profissional
    const { data: profissional, error: profError } = await supabaseClient
      .from('profissionais')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profError || !profissional) {
      throw new Error("Profissional não encontrado");
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
        },
      });
      customerId = customer.id;

      // Atualizar profissional com customer_id
      await supabaseClient
        .from('profissionais')
        .update({ stripe_customer_id: customerId })
        .eq('id', profissional.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: Deno.env.get("STRIPE_PRICE_ID"),
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/app/pagamento-sucesso`,
      cancel_url: `${req.headers.get("origin")}/app/configuracoes?tab=assinatura&canceled=true`,
      metadata: {
        profissional_id: profissional.id,
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