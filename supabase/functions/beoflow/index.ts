import { createClient } from "@supabase/supabase-js";

type CaterPlan = {
  budget?: string | null;
  budgetLabel?: string | null;
  eventType?: string | null;
  menuStyle?: string | null;
  services?: string[];
  [key: string]: unknown;
};

type BeoflowResult = {
  reply: string;
  updates: {
    budget: string | null;
    budgetLabel: string | null;
    eventType: string | null;
    menuStyle: string | null;
    services: string[];
  };
  suggestions: string[];
  source?: "openai" | "local";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function localBeoflow(message: string, currentPlan: CaterPlan): BeoflowResult {
  const text = message.toLowerCase();
  const services = [...(currentPlan.services || [])];
  const updates: BeoflowResult["updates"] = {
    budget: null,
    budgetLabel: null,
    eventType: null,
    menuStyle: null,
    services,
  };
  const suggestions: string[] = [];

  if (text.includes("boda")) updates.eventType = "Boda";
  if (text.includes("corporativo") || text.includes("empresa")) {
    updates.eventType = "Corporativo";
  }
  if (text.includes("vip") || text.includes("lujo") || text.includes("luxury")) {
    updates.eventType = "VIP";
  }

  const addService = (service: string) => {
    if (!updates.services.includes(service)) updates.services.push(service);
  };

  if (text.includes("transporte") || text.includes("chofer") || text.includes("shuttle")) {
    addService("Transporte");
  }
  if (text.includes("hotel") || text.includes("hospedaje") || text.includes("habitaciones")) {
    addService("Hospedaje");
  }
  if (text.includes("staff") || text.includes("meseros")) addService("Staff");
  if (text.includes("decoración") || text.includes("decoracion")) addService("Decoración");

  if (!updates.eventType && updates.services.length === (currentPlan.services || []).length) {
    suggestions.push("Describe el tipo de evento, servicios o presupuesto para ajustar el plan.");
  }

  return {
    reply: suggestions.length
      ? "Guardé tu idea para BEOFlow."
      : "BEOFlow ajustó el plan con lo que escribiste.",
    updates,
    suggestions,
    source: "local",
  };
}

function extractOutputText(data: Record<string, any>) {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
    }
  }

  return "";
}

async function callOpenAI(message: string, currentPlan: CaterPlan): Promise<BeoflowResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    return localBeoflow(message, currentPlan);
  }

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are BEOFlow, an event planning brain for Cater Vegas. Return only compact JSON with reply, updates, and suggestions. updates must include budget, budgetLabel, eventType, menuStyle, and services. Never invent final prices.",
        },
        {
          role: "user",
          content: JSON.stringify({ message, currentPlan }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "beoflow_plan_update",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              reply: { type: "string" },
              updates: {
                type: "object",
                additionalProperties: false,
                properties: {
                  budget: { type: ["string", "null"] },
                  budgetLabel: { type: ["string", "null"] },
                  eventType: { type: ["string", "null"] },
                  menuStyle: { type: ["string", "null"] },
                  services: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["budget", "budgetLabel", "eventType", "menuStyle", "services"],
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["reply", "updates", "suggestions"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  return { ...JSON.parse(outputText), source: "openai" };
}

function mergedPlan(currentPlan: CaterPlan, updates: BeoflowResult["updates"]) {
  return {
    ...currentPlan,
    ...(updates.budget ? { budget: updates.budget } : {}),
    ...(updates.budgetLabel ? { budgetLabel: updates.budgetLabel } : {}),
    ...(updates.eventType ? { eventType: updates.eventType } : {}),
    ...(updates.menuStyle ? { menuStyle: updates.menuStyle } : {}),
    services: Array.isArray(updates.services) ? updates.services : currentPlan.services || [],
  };
}

async function persistBeoflowRun(
  request: Request,
  eventId: number | null,
  message: string,
  currentPlan: CaterPlan,
  result: BeoflowResult,
) {
  if (!eventId) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) return;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) return;

  const { data: accessibleEvent, error: accessError } = await userClient
    .from("cater_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (accessError || !accessibleEvent) return;

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const nextPlan = mergedPlan(currentPlan, result.updates);

  await serviceClient.from("cater_beoflow_messages").insert([
    {
      event_id: eventId,
      user_id: user.id,
      sender: "user",
      content: message,
      metadata: { currentPlan },
    },
    {
      event_id: eventId,
      user_id: user.id,
      sender: "assistant",
      content: result.reply,
      metadata: {
        updates: result.updates,
        suggestions: result.suggestions,
        source: result.source,
      },
    },
  ]);

  const { data: latestVersion } = await serviceClient
    .from("cater_plan_versions")
    .select("version_number")
    .eq("event_id", eventId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (latestVersion?.version_number || 0) + 1;

  await serviceClient.from("cater_plan_versions").insert({
    event_id: eventId,
    version_number: versionNumber,
    plan: nextPlan,
    source: "beoflow",
    created_by: user.id,
  });

  await serviceClient
    .from("cater_events")
    .update({
      budget: nextPlan.budget || null,
      budget_label: nextPlan.budgetLabel || null,
      event_type: nextPlan.eventType || null,
      menu_style: nextPlan.menuStyle || null,
      services: nextPlan.services || [],
      plan: nextPlan,
    })
    .eq("id", eventId);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  try {
    const body = await request.json();
    const message = String(body.message || "").trim();
    const currentPlan = (body.currentPlan || {}) as CaterPlan;
    const eventId = body.eventId ? Number(body.eventId) : null;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const result = await callOpenAI(message, currentPlan);
    await persistBeoflowRun(request, eventId, message, currentPlan, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "BEOFlow request failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
});
