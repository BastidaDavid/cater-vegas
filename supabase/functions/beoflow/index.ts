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
  collaboratorAction?: CollaboratorActionResult | null;
  customerAction?: CustomerActionResult | null;
  eventAction?: EventActionResult | null;
};

type CollaboratorCommand = {
  fullName: string;
  email: string | null;
  role: CollaboratorRole;
  eventHint: string | null;
};

type CollaboratorActionResult = {
  collaboratorId: number;
  collaboratorName: string;
  role: CollaboratorRole;
  eventId: number | null;
  eventTitle: string | null;
  assigned: boolean;
  message: string;
};

type CustomerCommand = {
  fullName: string;
  email: string | null;
  phone: string | null;
};

type CustomerActionResult = {
  customerId: number;
  customerName: string;
  created: boolean;
  message: string;
};

type EventForCustomerCommand = {
  customerName: string;
  email: string | null;
  eventTitle: string | null;
};

type EventActionResult = {
  eventId: number;
  eventTitle: string;
  customerId: number;
  customerName: string;
  message: string;
};

type CollaboratorRole =
  | "owner"
  | "admin"
  | "organizer"
  | "chef"
  | "driver"
  | "server"
  | "staff"
  | "viewer";

const DEFAULT_WORKSPACE_ID = "cater-vegas";

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
            "You are BEOFlow, an event planning brain for a workspace inside BEOFlow Platform. Return only compact JSON with reply, updates, and suggestions. updates must include budget, budgetLabel, eventType, menuStyle, and services. Never invent final prices.",
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanName(value: string) {
  return value
    .replace(/\b(con|with)\s+email\s+\S+/gi, "")
    .replace(/\b(email|correo)\s+\S+/gi, "")
    .replace(/[.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roleFromAlias(value: string): CollaboratorRole | null {
  const normalized = normalizeText(value);
  const roleMap: Record<string, CollaboratorRole> = {
    dueno: "owner",
    owner: "owner",
    admin: "admin",
    administrador: "admin",
    organizador: "organizer",
    organizadora: "organizer",
    organizer: "organizer",
    planner: "organizer",
    coordinador: "organizer",
    coordinadora: "organizer",
    chef: "chef",
    cocinero: "chef",
    cocinera: "chef",
    driver: "driver",
    chofer: "driver",
    conductor: "driver",
    conductora: "driver",
    server: "server",
    mesero: "server",
    mesera: "server",
    staff: "staff",
    equipo: "staff",
    viewer: "viewer",
    observador: "viewer",
    observadora: "viewer",
    lector: "viewer",
  };

  return roleMap[normalized] || null;
}

function parseCollaboratorCommand(message: string): CollaboratorCommand | null {
  const roleAliases =
    "dueño|dueno|owner|admin|administrador|organizador|organizadora|organizer|planner|coordinador|coordinadora|chef|cocinero|cocinera|driver|chofer|conductor|conductora|server|mesero|mesera|staff|equipo|viewer|observador|observadora|lector";

  const patterns = [
    new RegExp(
      `(?:agrega|añade|anade|invita|asigna)\\s+a\\s+(.+?)\\s+como\\s+(${roleAliases})(?:\\s+(?:al|a el|para el|para la|en el|en la)\\s+(?:evento\\s+)?(.+))?$`,
      "i",
    ),
    new RegExp(
      `(?:add|invite|assign)\\s+(.+?)\\s+as\\s+(${roleAliases})(?:\\s+(?:to|for|in)\\s+(?:event\\s+)?(.+))?$`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
    const role = roleFromAlias(match[2]);
    const fullName = cleanName(match[1]);

    if (!role || !fullName) return null;

    return {
      fullName,
      email,
      role,
      eventHint: match[3] ? match[3].replace(/[.,;:]+$/g, "").trim() : null,
    };
  }

  return null;
}

function parseCustomerCommand(message: string): CustomerCommand | null {
  const normalized = normalizeText(message);

  if (normalized.includes("evento para") || normalized.includes("event for")) {
    return null;
  }

  const patterns = [
    /(?:crea|crear|agrega|agregar|añade|anade)\s+(?:cliente|customer)\s+(.+?)(?:\s+(?:con|with)\s+(?:email|correo)\s+(\S+))?$/i,
    /(?:cliente|customer)\s+(.+?)(?:\s+(?:con|with)\s+(?:email|correo)\s+(\S+))?$/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const email = match[2] || message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
    const phone = message.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0]?.trim() || null;
    const fullName = cleanName(match[1]);

    if (!fullName) return null;
    return { fullName, email, phone };
  }

  return null;
}

function parseEventForCustomerCommand(message: string): EventForCustomerCommand | null {
  const patterns = [
    /(?:crea|crear|agenda|programa)\s+(?:un\s+|el\s+)?evento\s+(?:para|de)\s+(.+?)(?:\s+(?:con|with)\s+(?:email|correo)\s+(\S+))?$/i,
    /(?:create|schedule)\s+(?:an?\s+)?event\s+for\s+(.+?)(?:\s+with\s+email\s+(\S+))?$/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (!match) continue;

    const email = match[2] || message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
    const customerName = cleanName(match[1]);

    if (!customerName) return null;
    return {
      customerName,
      email,
      eventTitle: `Evento para ${customerName}`,
    };
  }

  return null;
}

function profileRoleToWorkspaceRole(role: string | null) {
  const roleMap: Record<string, string> = {
    admin: "admin",
    staff: "organizer",
    organizer: "organizer",
    collaborator: "collaborator",
    client: "viewer",
  };

  return role ? roleMap[role] || null : null;
}

async function getCurrentWorkspaceRole(
  userClient: ReturnType<typeof createClient>,
  userId: string,
  workspaceId: string,
) {
  const { data: membership } = await userClient
    .from("beoflow_workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.status === "active" && membership.role) {
    return membership.role;
  }

  const { data: profile } = await userClient
    .from("cater_profiles")
    .select("role,workspace_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.workspace_id === workspaceId) {
    return profileRoleToWorkspaceRole(profile.role);
  }

  return null;
}

async function findAccessibleEvent(
  userClient: ReturnType<typeof createClient>,
  eventId: number | null,
  eventHint: string | null,
  workspaceId: string,
) {
  if (eventId) {
    const { data } = await userClient
      .from("cater_events")
      .select("id,title")
      .eq("workspace_id", workspaceId)
      .eq("id", eventId)
      .maybeSingle();

    return data || null;
  }

  if (!eventHint) return null;

  const { data: directMatch } = await userClient
    .from("cater_events")
    .select("id,title")
    .eq("workspace_id", workspaceId)
    .ilike("title", `%${eventHint}%`)
    .limit(1)
    .maybeSingle();

  if (directMatch) return directMatch;

  const { data: candidates } = await userClient
    .from("cater_events")
    .select("id,title")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const normalizedHint = normalizeText(eventHint);
  return (
    candidates?.find((event: { title: string }) =>
      normalizeText(event.title || "").includes(normalizedHint),
    ) || null
  );
}

async function upsertCollaboratorFromCommand(
  serviceClient: ReturnType<typeof createClient>,
  command: CollaboratorCommand,
  workspaceId: string,
) {
  const baseQuery = serviceClient
    .from("cater_collaborators")
    .select("id,full_name,email,role,status")
    .eq("workspace_id", workspaceId);

  const { data: existing } = command.email
    ? await baseQuery.eq("email", command.email).maybeSingle()
    : await baseQuery.ilike("full_name", command.fullName).limit(1).maybeSingle();

  const payload = {
    workspace_id: workspaceId,
    full_name: command.fullName,
    email: command.email,
    role: command.role,
    status: "active",
  };

  if (existing?.id) {
    const { data, error } = await serviceClient
      .from("cater_collaborators")
      .update(payload)
      .eq("workspace_id", workspaceId)
      .eq("id", existing.id)
      .select("id,full_name,email,role,status")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await serviceClient
    .from("cater_collaborators")
    .insert(payload)
    .select("id,full_name,email,role,status")
    .single();

  if (error) throw error;
  return data;
}

async function handleCollaboratorCommand(params: {
  command: CollaboratorCommand | null;
  userClient: ReturnType<typeof createClient>;
  serviceClient: ReturnType<typeof createClient>;
  userId: string;
  eventId: number | null;
  workspaceId: string;
}): Promise<CollaboratorActionResult | null> {
  if (!params.command) return null;

  const role = await getCurrentWorkspaceRole(params.userClient, params.userId, params.workspaceId);
  if (!["owner", "admin"].includes(role || "")) {
    return {
      collaboratorId: 0,
      collaboratorName: params.command.fullName,
      role: params.command.role,
      eventId: null,
      eventTitle: null,
      assigned: false,
      message: "Solo owner/admin del workspace puede crear o actualizar colaboradores.",
    };
  }

  const targetEvent = await findAccessibleEvent(
    params.userClient,
    params.eventId,
    params.command.eventHint,
    params.workspaceId,
  );
  const collaborator = await upsertCollaboratorFromCommand(
    params.serviceClient,
    params.command,
    params.workspaceId,
  );

  let assigned = false;

  if (targetEvent?.id) {
    const { error } = await params.serviceClient.from("cater_event_assignments").upsert(
      {
        workspace_id: params.workspaceId,
        event_id: targetEvent.id,
        collaborator_id: collaborator.id,
        assignment_role: params.command.role,
        status: "active",
        notes: "Asignado por BEOFlow.",
      },
      { onConflict: "event_id,collaborator_id" },
    );

    if (error) throw error;
    assigned = true;
  }

  return {
    collaboratorId: collaborator.id,
    collaboratorName: collaborator.full_name,
    role: params.command.role,
    eventId: targetEvent?.id || null,
    eventTitle: targetEvent?.title || null,
    assigned,
    message: assigned
      ? `${collaborator.full_name} quedó como ${params.command.role} en ${targetEvent.title}.`
      : `${collaborator.full_name} quedó guardado como ${params.command.role}.`,
  };
}

async function upsertCustomerFromCommand(
  serviceClient: ReturnType<typeof createClient>,
  command: CustomerCommand,
  workspaceId: string,
) {
  const baseQuery = serviceClient
    .from("cater_customers")
    .select("id,full_name,email,phone,notes")
    .eq("workspace_id", workspaceId);

  const { data: existing } = command.email
    ? await baseQuery.ilike("email", command.email).maybeSingle()
    : await baseQuery.ilike("full_name", command.fullName).limit(1).maybeSingle();

  const payload = {
    workspace_id: workspaceId,
    full_name: command.fullName,
    email: command.email,
    phone: command.phone,
  };

  if (existing?.id) {
    const { data, error } = await serviceClient
      .from("cater_customers")
      .update(payload)
      .eq("workspace_id", workspaceId)
      .eq("id", existing.id)
      .select("id,full_name,email,phone")
      .single();

    if (error) throw error;
    return { customer: data, created: false };
  }

  const { data, error } = await serviceClient
    .from("cater_customers")
    .insert(payload)
    .select("id,full_name,email,phone")
    .single();

  if (error) throw error;
  return { customer: data, created: true };
}

async function handleCustomerCommand(params: {
  command: CustomerCommand | null;
  userClient: ReturnType<typeof createClient>;
  serviceClient: ReturnType<typeof createClient>;
  userId: string;
  workspaceId: string;
}): Promise<CustomerActionResult | null> {
  if (!params.command) return null;

  const role = await getCurrentWorkspaceRole(params.userClient, params.userId, params.workspaceId);
  if (!["owner", "admin", "organizer"].includes(role || "")) {
    return {
      customerId: 0,
      customerName: params.command.fullName,
      created: false,
      message: "Solo owner/admin/organizer del workspace puede crear clientes.",
    };
  }

  const { customer, created } = await upsertCustomerFromCommand(
    params.serviceClient,
    params.command,
    params.workspaceId,
  );

  return {
    customerId: customer.id,
    customerName: customer.full_name,
    created,
    message: created
      ? `${customer.full_name} quedó creado como customer.`
      : `${customer.full_name} quedó actualizado como customer.`,
  };
}

async function handleEventForCustomerCommand(params: {
  command: EventForCustomerCommand | null;
  userClient: ReturnType<typeof createClient>;
  serviceClient: ReturnType<typeof createClient>;
  userId: string;
  workspaceId: string;
}): Promise<EventActionResult | null> {
  if (!params.command) return null;

  const role = await getCurrentWorkspaceRole(params.userClient, params.userId, params.workspaceId);
  if (!["owner", "admin", "organizer"].includes(role || "")) {
    return {
      eventId: 0,
      eventTitle: params.command.eventTitle || `Evento para ${params.command.customerName}`,
      customerId: 0,
      customerName: params.command.customerName,
      message: "Solo owner/admin/organizer del workspace puede crear eventos.",
    };
  }

  const { customer } = await upsertCustomerFromCommand(
    params.serviceClient,
    {
      fullName: params.command.customerName,
      email: params.command.email,
      phone: null,
    },
    params.workspaceId,
  );

  const eventTitle = params.command.eventTitle || `Evento para ${customer.full_name}`;
  const { data: event, error } = await params.serviceClient
    .from("cater_events")
    .insert({
      workspace_id: params.workspaceId,
      customer_id: customer.id,
      title: eventTitle,
      status: "draft",
      created_by: params.userId,
      plan: {
        customerName: customer.full_name,
      },
    })
    .select("id,title,customer_id")
    .single();

  if (error) throw error;

  return {
    eventId: event.id,
    eventTitle: event.title,
    customerId: customer.id,
    customerName: customer.full_name,
    message: `${event.title} quedó creado para ${customer.full_name}.`,
  };
}

async function persistBeoflowRun(
  request: Request,
  eventId: number | null,
  message: string,
  currentPlan: CaterPlan,
  result: BeoflowResult,
  workspaceId: string,
) {
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

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  let targetEventId = eventId;

  const eventCommand = parseEventForCustomerCommand(message);
  const eventAction = await handleEventForCustomerCommand({
    command: eventCommand,
    userClient,
    serviceClient,
    userId: user.id,
    workspaceId,
  });

  if (eventAction) {
    result.eventAction = eventAction;
    result.reply = `${result.reply} ${eventAction.message}`;
    if (eventAction.eventId > 0) targetEventId = eventAction.eventId;
  }

  const customerCommand = eventCommand ? null : parseCustomerCommand(message);
  const customerAction = await handleCustomerCommand({
    command: customerCommand,
    userClient,
    serviceClient,
    userId: user.id,
    workspaceId,
  });

  if (customerAction) {
    result.customerAction = customerAction;
    result.reply = `${result.reply} ${customerAction.message}`;
  }

  const collaboratorCommand = parseCollaboratorCommand(message);
  const collaboratorAction = await handleCollaboratorCommand({
    command: collaboratorCommand,
    userClient,
    serviceClient,
    userId: user.id,
    eventId,
    workspaceId,
  });

  if (collaboratorAction) {
    result.collaboratorAction = collaboratorAction;
    result.reply = `${result.reply} ${collaboratorAction.message}`;
  }

  if (!targetEventId) return;

  const { data: accessibleEvent, error: accessError } = await userClient
    .from("cater_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", targetEventId)
    .maybeSingle();

  if (accessError || !accessibleEvent) return;

  const nextPlan = mergedPlan(currentPlan, result.updates);

  await serviceClient.from("cater_beoflow_messages").insert([
    {
      workspace_id: workspaceId,
      event_id: targetEventId,
      user_id: user.id,
      sender: "user",
      content: message,
      metadata: { currentPlan },
    },
    {
      workspace_id: workspaceId,
      event_id: targetEventId,
      user_id: user.id,
      sender: "assistant",
      content: result.reply,
      metadata: {
        updates: result.updates,
        suggestions: result.suggestions,
        source: result.source,
        collaboratorAction,
        customerAction,
        eventAction,
      },
    },
  ]);

  const { data: latestVersion } = await serviceClient
    .from("cater_plan_versions")
    .select("version_number")
    .eq("workspace_id", workspaceId)
    .eq("event_id", targetEventId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (latestVersion?.version_number || 0) + 1;

  await serviceClient.from("cater_plan_versions").insert({
    workspace_id: workspaceId,
    event_id: targetEventId,
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
    .eq("workspace_id", workspaceId)
    .eq("id", targetEventId);
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
    const workspaceId = String(body.workspaceId || body.workspace_id || DEFAULT_WORKSPACE_ID);

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const result = await callOpenAI(message, currentPlan);
    await persistBeoflowRun(request, eventId, message, currentPlan, result, workspaceId);

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
