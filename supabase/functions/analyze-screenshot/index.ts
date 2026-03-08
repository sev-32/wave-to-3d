import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior graphics engineer and water simulation expert analyzing screenshots and code from a WebGPU/WebGL hybrid water simulation.

Your job is to:
1. Analyze what you see in the screenshot (wave patterns, particle behavior, lighting, reflections, artifacts)
2. Identify physics issues (non-radial waves, missing particles, incorrect caustics, aliasing)
3. Compare against reference expectations for realistic water
4. Give specific, actionable code recommendations with file paths and function names

When given reference docs, cross-reference the implementation against the spec.

Format your response as:
## Observation
What you see in the image.

## Issues Found
Numbered list of problems.

## Recommendations
Specific code changes with file paths. Be precise — name shaders, uniforms, functions.

## Quality Score
Rate 1-10 for: Wave Realism, Particle Quality, Lighting/Caustics, Overall Impact.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageUrl, imageBase64, prompt, referenceContext, conversationHistory, mode } = await req.json();

    // Build messages
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add reference context if provided
    if (referenceContext) {
      messages.push({
        role: "user",
        content: `Here is reference documentation for the water simulation:\n\n${referenceContext}`,
      });
      messages.push({
        role: "assistant",
        content: "I've reviewed the reference documentation. I'll use it to evaluate the simulation screenshots.",
      });
    }

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Build the analysis request with image
    const userContent: any[] = [];
    
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    } else if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${imageBase64}` },
      });
    }

    const userPrompt = prompt || "Analyze this water simulation screenshot. Identify any issues and provide specific recommendations to improve realism.";
    userContent.push({ type: "text", text: userPrompt });

    messages.push({ role: "user", content: userContent });

    // Use Gemini 3.1 Pro for deep analysis, Flash for quick reports
    const model = mode === "deep" 
      ? "google/gemini-3.1-pro-preview" 
      : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Top up in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: `AI gateway error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-screenshot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
