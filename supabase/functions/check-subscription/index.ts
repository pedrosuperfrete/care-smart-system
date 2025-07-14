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
    
    if (!user) throw new Error("Usuário não autenticado");

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

    let assinaturaAtiva = false;
    let dataVencimento = null;

    if (profissional.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profissional.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        assinaturaAtiva = true;
        dataVencimento = new Date(subscription.current_period_end * 1000).toISOString();

        // Atualizar dados no banco
        await supabaseClient
          .from('profissionais')
          .update({
            assinatura_ativa: true,
            stripe_subscription_id: subscription.id,
            data_vencimento_assinatura: dataVencimento,
          })
          .eq('id', profissional.id);
      }
    }

    // Se não tem assinatura ativa, atualizar no banco
    if (!assinaturaAtiva) {
      await supabaseClient
        .from('profissionais')
        .update({
          assinatura_ativa: false,
          stripe_subscription_id: null,
          data_vencimento_assinatura: null,
        })
        .eq('id', profissional.id);
    }

    return new Response(JSON.stringify({
      assinatura_ativa: assinaturaAtiva,
      data_vencimento: dataVencimento,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});