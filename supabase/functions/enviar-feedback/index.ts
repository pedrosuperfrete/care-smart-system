import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  tipo: 'bug' | 'ideia' | 'duvida';
  mensagem: string;
  userName: string;
  userEmail: string;
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, mensagem, userName, userEmail, userType }: FeedbackRequest = await req.json();

    // Validação básica
    if (!tipo || !mensagem) {
      return new Response(
        JSON.stringify({ error: "Tipo e mensagem são obrigatórios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mapeamento de tipos para labels
    const tipoLabels = {
      bug: '🐛 Bug Reportado',
      ideia: '💡 Sugestão de Ideia',
      duvida: '❓ Dúvida'
    };

    const tipoLabel = tipoLabels[tipo] || tipo;

    // Enviar email para a equipe Donee
    const emailResponse = await resend.emails.send({
      from: "Donee Sistema <onboarding@resend.dev>",
      to: ["donnee@donee.com.br"],
      subject: `[${tipoLabel}] Feedback do Sistema - ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .label {
                font-weight: bold;
                color: #4b5563;
                margin-top: 20px;
                margin-bottom: 5px;
              }
              .value {
                background: white;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #e5e7eb;
              }
              .message-box {
                background: white;
                padding: 20px;
                border-radius: 5px;
                border: 1px solid #e5e7eb;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .footer {
                background: #374151;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 10px 10px;
                font-size: 14px;
              }
              .badge {
                display: inline-block;
                padding: 8px 16px;
                background: white;
                color: #667eea;
                border-radius: 20px;
                font-weight: bold;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📬 Novo Feedback Recebido</h1>
              <div class="badge">${tipoLabel}</div>
            </div>
            
            <div class="content">
              <div class="label">👤 Usuário:</div>
              <div class="value">${userName}</div>
              
              <div class="label">📧 Email:</div>
              <div class="value">${userEmail}</div>
              
              <div class="label">👔 Tipo de Usuário:</div>
              <div class="value">${userType}</div>
              
              <div class="label">💬 Mensagem:</div>
              <div class="message-box">${mensagem}</div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Sistema Donee - Gestão de Clínicas</p>
              <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 12px;">
                Este é um email automático. Responda diretamente ao usuário: ${userEmail}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Feedback email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Feedback enviado com sucesso" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar feedback:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro ao enviar feedback",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
