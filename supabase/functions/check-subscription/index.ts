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

    // Buscar dados do usuário primeiro
    const { data: userProfile, error: userError } = await supabaseClient
      .from('users')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single();

    if (userError || !userProfile) {
      console.log("Erro ao buscar perfil do usuário:", userError);
      throw new Error("Perfil do usuário não encontrado");
    }

    console.log("Usuário encontrado:", { id: user.id, tipo: userProfile.tipo_usuario });

    let profissional = null;

    if (userProfile.tipo_usuario === 'profissional') {
      // Buscar dados do profissional diretamente
      const { data: prof, error: profError } = await supabaseClient
        .from('profissionais')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profError) {
        console.log("Erro ao buscar profissional:", profError);
        throw new Error("Erro ao buscar profissional: " + profError.message);
      }
      profissional = prof;
    } else if (userProfile.tipo_usuario === 'recepcionista') {
      console.log("Usuário é recepcionista, buscando clínicas...");
      
      // Para recepcionistas, buscar o profissional da clínica
      const { data: clinicasUsuario, error: clinicasError } = await supabaseClient.rpc('get_user_clinicas');
      
      if (clinicasError) {
        console.log("Erro ao buscar clínicas do usuário:", clinicasError);
        return new Response(JSON.stringify({
          assinatura_ativa: false,
          data_vencimento: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      console.log("Clínicas encontradas para recepcionista:", clinicasUsuario);
      
      if (clinicasUsuario && clinicasUsuario.length > 0) {
        // Buscar todos os profissionais ativos da clínica
        const { data: profissionais, error: profError } = await supabaseClient
          .from('profissionais')
          .select('*')
          .eq('clinica_id', clinicasUsuario[0].clinica_id)
          .eq('ativo', true);

        console.log("Busca de profissionais - Erro:", profError);
        console.log("Profissionais encontrados:", profissionais);

        if (profError) {
          console.log("Erro ao buscar profissionais da clínica:", profError);
          return new Response(JSON.stringify({
            assinatura_ativa: false,
            data_vencimento: null,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        // Pegar o primeiro profissional ativo (assumindo que há um principal)
        if (profissionais && profissionais.length > 0) {
          profissional = profissionais[0];
          console.log("Profissional selecionado para recepcionista:", { 
            id: profissional.id, 
            nome: profissional.nome,
            assinatura_ativa: profissional.assinatura_ativa 
          });
        } else {
          console.log("Nenhum profissional ativo encontrado na clínica");
          return new Response(JSON.stringify({
            assinatura_ativa: false,
            data_vencimento: null,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } else {
        console.log("Nenhuma clínica encontrada para o recepcionista");
        return new Response(JSON.stringify({
          assinatura_ativa: false,
          data_vencimento: null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (!profissional) {
      console.log("Profissional não encontrado após todas as buscas");
      return new Response(JSON.stringify({
        assinatura_ativa: false,
        data_vencimento: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("Profissional encontrado:", { id: profissional.id, assinatura_ativa: profissional.assinatura_ativa });

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