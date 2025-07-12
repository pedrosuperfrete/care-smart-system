import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contém o ID do profissional
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Trocar o código de autorização por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-oauth',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }

    const { refresh_token } = tokenData;
    
    if (!refresh_token) {
      throw new Error('No refresh token received');
    }

    // Salvar o refresh token no perfil do profissional
    const { error } = await supabase
      .from('profissionais')
      .update({ google_refresh_token: refresh_token })
      .eq('id', state);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    // Redirecionar de volta para a agenda
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': 'https://id-preview--832d2c30-543e-46dc-9014-19b224208f46.lovable.app/agenda?connected=true',
      },
    });

  } catch (error) {
    console.error('Erro no OAuth do Google:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});