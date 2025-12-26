import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { encode as base64Encode, decode as base64Decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Use a secret key for signing - derived from the service role key
const getSigningKey = async (): Promise<CryptoKey> => {
  const keyData = new TextEncoder().encode(supabaseKey.slice(0, 32));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

// Create a signed state parameter
const createSignedState = async (professionalId: string, userId: string): Promise<string> => {
  const timestamp = Date.now();
  const payload = `${professionalId}:${userId}:${timestamp}`;
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );
  const signatureBase64 = base64Encode(new Uint8Array(signature));
  // Combine payload and signature, URL-safe encoding
  return btoa(JSON.stringify({ payload, signature: signatureBase64 }));
};

// Verify and extract data from signed state
const verifySignedState = async (state: string): Promise<{ professionalId: string; userId: string; timestamp: number } | null> => {
  try {
    const decoded = JSON.parse(atob(state));
    const { payload, signature: signatureBase64 } = decoded;
    
    const key = await getSigningKey();
    const signatureBytes = base64Decode(signatureBase64);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(payload)
    );
    
    if (!isValid) {
      console.error('State signature verification failed');
      return null;
    }
    
    const [professionalId, userId, timestampStr] = payload.split(':');
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if state is expired (30 minutes max)
    const thirtyMinutesMs = 30 * 60 * 1000;
    if (Date.now() - timestamp > thirtyMinutesMs) {
      console.error('State has expired');
      return null;
    }
    
    return { professionalId, userId, timestamp };
  } catch (error) {
    console.error('Error verifying state:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle request to generate signed state (called before OAuth redirect)
    if (action === 'generate-state') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const body = await req.json();
      const { professionalId } = body;

      if (!professionalId) {
        return new Response(
          JSON.stringify({ error: 'Professional ID required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verify the user owns this professional record
      const { data: profissional, error: profError } = await supabase
        .from('profissionais')
        .select('id, user_id')
        .eq('id', professionalId)
        .single();

      if (profError || !profissional) {
        console.error('Professional not found:', profError);
        return new Response(
          JSON.stringify({ error: 'Professional not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (profissional.user_id !== user.id) {
        console.error('User does not own this professional record');
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not own this professional record' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Generate signed state
      const signedState = await createSignedState(professionalId, user.id);
      
      return new Response(
        JSON.stringify({ state: signedState }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle OAuth callback from Google
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Verify the signed state
    const stateData = await verifySignedState(state);
    if (!stateData) {
      console.error('Invalid or expired state parameter');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://id-preview--832d2c30-543e-46dc-9014-19b224208f46.lovable.app/agenda?error=invalid_state',
        },
      });
    }

    const { professionalId, userId } = stateData;

    // Double-check ownership before updating
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('id, user_id')
      .eq('id', professionalId)
      .single();

    if (profError || !profissional || profissional.user_id !== userId) {
      console.error('Professional ownership verification failed');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://id-preview--832d2c30-543e-46dc-9014-19b224208f46.lovable.app/agenda?error=forbidden',
        },
      });
    }

    // Exchange authorization code for tokens
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

    // Save the refresh token with additional ownership check
    const { error } = await supabase
      .from('profissionais')
      .update({ google_refresh_token: refresh_token })
      .eq('id', professionalId)
      .eq('user_id', userId); // Additional safety check

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`Successfully connected Google Calendar for professional ${professionalId}`);

    // Redirect back to the agenda
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': 'https://id-preview--832d2c30-543e-46dc-9014-19b224208f46.lovable.app/agenda?connected=true',
      },
    });

  } catch (error) {
    console.error('Error in Google OAuth:', error);
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
