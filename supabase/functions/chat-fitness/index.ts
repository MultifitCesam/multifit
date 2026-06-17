// Streaming fitness chatbot via Lovable AI Gateway
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 50;
const MAX_CONTENT_LEN = 2000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AuthN: require a valid Supabase user JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, profile } = await req.json();

    // --- Input validation ---
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sanitized: { role: string; content: string }[] = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") {
        return new Response(JSON.stringify({ error: "Invalid message shape" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const role = String((m as any).role ?? "");
      const content = (m as any).content;
      if (!ALLOWED_ROLES.has(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof content !== "string" || content.length === 0) {
        return new Response(JSON.stringify({ error: "Message content must be a non-empty string" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (content.length > MAX_CONTENT_LEN) {
        return new Response(JSON.stringify({ error: `Message too long (max ${MAX_CONTENT_LEN} chars)` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sanitized.push({ role, content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const profileContext = profile
      ? `Perfil do usuário: ${profile.name || "Atleta"}, ${profile.age} anos, ${profile.weight}kg, ${profile.height}cm, nível ${profile.level}, objetivo ${profile.goal}, biotipo ${profile.body_type}, dorme ${profile.sleep_hours}h (${profile.sleep_quality}), treina ${profile.weekly_frequency}x/semana de ${profile.training_time}.${profile.allergies ? ` Alergias: ${profile.allergies}.` : ""}${profile.dietary_restrictions ? ` Restrições: ${profile.dietary_restrictions}.` : ""}`
      : "Usuário ainda não configurou o perfil.";

    const systemPrompt = `Você é o MultiFit Coach, um personal trainer e nutricionista virtual amigável e motivador. Responda em português brasileiro de forma clara, prática e direta.

${profileContext}

Diretrizes:
- Tire dúvidas sobre exercícios, nutrição, suplementação, sono e recuperação.
- Explique como executar exercícios corretamente e sugira alternativas.
- Adapte recomendações ao perfil do usuário sempre que possível.
- Use markdown (negritos, listas) para deixar respostas escaneáveis.
- Seja motivador, mas honesto. Nunca recomende medicamentos.
- Se a pergunta envolver lesão grave ou questão médica, oriente procurar profissional de saúde.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...sanitized,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-fitness error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
