import {
  DEFAULT_WORKSPACE_ID,
  getEffectiveWorkspaceRole,
  getWorkspaceContext,
  isPendingWorkspaceAccess,
  isSupabaseConfigured,
  requireSupabase,
  subscribeToEvents,
} from "../lib/supabaseClient.js";

const WORKSPACE_ID = DEFAULT_WORKSPACE_ID;
const PENDING_PROFILE_ROLES = [
  "workspace_pending",
  "organizer_pending",
  "collaborator_pending",
  "client_pending",
];

const sessionStatus = document.querySelector("#sessionStatus");
const signoutButton = document.querySelector("#signoutButton");
const workspaceSummary = document.querySelector("#workspaceSummary");
const refreshWorkspaceButton = document.querySelector("#refreshWorkspaceButton");
const requestsSection = document.querySelector("#requestsSection");
const requestsStatus = document.querySelector("#requestsStatus");
const refreshRequestsButton = document.querySelector("#refreshRequestsButton");
const userRequestsList = document.querySelector("#userRequestsList");
const customersList = document.querySelector("#customersList");
const dashboardEmail = document.querySelector("#dashboardEmail");
const dashboardRole = document.querySelector("#dashboardRole");
const statActiveEvents = document.querySelector("#statActiveEvents");
const statPending = document.querySelector("#statPending");
const statProviders = document.querySelector("#statProviders");
const statRevenue = document.querySelector("#statRevenue");

const eventForm = document.querySelector("#eventForm");
const eventTitle = document.querySelector("#eventTitle");
const eventType = document.querySelector("#eventType");
const eventBudget = document.querySelector("#eventBudget");
const eventDate = document.querySelector("#eventDate");
const guestCount = document.querySelector("#guestCount");
const eventFormStatus = document.querySelector("#eventFormStatus");
const eventsList = document.querySelector("#eventsList");
const refreshEventsButton = document.querySelector("#refreshEventsButton");
const selectedEventLabel = document.querySelector("#selectedEventLabel");
const adminBeoflowForm = document.querySelector("#adminBeoflowForm");
const adminBeoflowPrompt = document.querySelector("#adminBeoflowPrompt");
const beoflowResult = document.querySelector("#beoflowResult");

const providersSection = document.querySelector("#providersSection");
const providerForm = document.querySelector("#providerForm");
const providerId = document.querySelector("#providerId");
const providerName = document.querySelector("#providerName");
const providerType = document.querySelector("#providerType");
const providerContactName = document.querySelector("#providerContactName");
const providerEmail = document.querySelector("#providerEmail");
const providerPhone = document.querySelector("#providerPhone");
const providerWebsite = document.querySelector("#providerWebsite");
const providerCity = document.querySelector("#providerCity");
const providerState = document.querySelector("#providerState");
const providerStatus = document.querySelector("#providerStatus");
const providerNotes = document.querySelector("#providerNotes");
const providerFormStatus = document.querySelector("#providerFormStatus");
const resetProviderButton = document.querySelector("#resetProviderButton");
const refreshProvidersButton = document.querySelector("#refreshProvidersButton");
const providersList = document.querySelector("#providersList");

const collaboratorForm = document.querySelector("#collaboratorForm");
const collaboratorId = document.querySelector("#collaboratorId");
const collaboratorName = document.querySelector("#collaboratorName");
const collaboratorEmail = document.querySelector("#collaboratorEmail");
const collaboratorPhone = document.querySelector("#collaboratorPhone");
const collaboratorRole = document.querySelector("#collaboratorRole");
const collaboratorStatus = document.querySelector("#collaboratorStatus");
const collaboratorNotes = document.querySelector("#collaboratorNotes");
const collaboratorFormStatus = document.querySelector("#collaboratorFormStatus");
const resetCollaboratorButton = document.querySelector("#resetCollaboratorButton");
const refreshCollaboratorsButton = document.querySelector("#refreshCollaboratorsButton");
const collaboratorsList = document.querySelector("#collaboratorsList");

const assignmentForm = document.querySelector("#assignmentForm");
const assignmentEvent = document.querySelector("#assignmentEvent");
const assignmentCollaborator = document.querySelector("#assignmentCollaborator");
const assignmentRole = document.querySelector("#assignmentRole");
const assignmentSelectStatus = document.querySelector("#assignmentStatus");
const assignmentNotes = document.querySelector("#assignmentNotes");
const assignmentStatusText = document.querySelector("#assignmentStatusText");
const assignmentsList = document.querySelector("#assignmentsList");

let supabase = null;
let currentUser = null;
let currentProfile = null;
let currentMembership = null;
let currentRole = null;
let currentWorkspace = null;
let selectedEvent = null;
let selectedProvider = null;
let selectedCollaborator = null;
let eventsChannel = null;
let allEvents = [];
let allProviders = [];
let allCollaborators = [];
let allAssignments = [];

function setSessionStatus(message) {
  sessionStatus.textContent = message;
}

function setEventStatus(message) {
  eventFormStatus.textContent = message;
}

function setProviderStatus(message) {
  providerFormStatus.textContent = message;
}

function setCollaboratorStatus(message) {
  collaboratorFormStatus.textContent = message;
}

function setAssignmentStatus(message) {
  assignmentStatusText.textContent = message;
}

function setRequestsStatus(message) {
  requestsStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setOptionalText(element, value) {
  if (element) element.textContent = value;
}

function canManageEvents() {
  return ["owner", "admin", "organizer"].includes(currentRole);
}

function canManageProviders() {
  return ["owner", "admin", "organizer"].includes(currentRole);
}

function canManageCollaborators() {
  return ["owner", "admin"].includes(currentRole);
}

function canManageRequests() {
  return ["owner", "admin"].includes(currentRole);
}

function profileRoleForMembershipRole(role) {
  const roleMap = {
    owner: "admin",
    admin: "admin",
    organizer: "organizer",
    collaborator: "collaborator",
    viewer: "client",
  };

  return roleMap[role] || "client";
}

function eventPlanFromRow(row) {
  return {
    budgetLabel: row.budget_label,
    eventType: row.event_type,
    menuStyle: row.menu_style,
    services: row.services || [],
    ...(row.plan || {}),
  };
}

function renderWorkspaceSummary(stats = {}) {
  setOptionalText(statActiveEvents, String(stats.events || 0));
  setOptionalText(statProviders, String(stats.providers || 0));
  setOptionalText(statRevenue, "Synced");

  if (!currentWorkspace) {
    workspaceSummary.innerHTML = "<p>No se pudo leer el workspace activo.</p>";
    return;
  }

  workspaceSummary.innerHTML = `
    <article class="workspace-stat">
      <strong>${escapeHtml(currentWorkspace.name)}</strong>
      <span class="workspace-meta">
        ${escapeHtml(currentWorkspace.slug)} · ${escapeHtml(currentWorkspace.industry || "sin industria")} · ${escapeHtml(currentWorkspace.status)}
      </span>
    </article>
    <article class="workspace-stat">
      <strong>${stats.events || 0} eventos · ${stats.providers || 0} proveedores · ${stats.collaborators || 0} colaboradores · ${stats.customers || 0} clientes</strong>
      <span class="workspace-meta">Workspace ID: ${escapeHtml(WORKSPACE_ID)}</span>
    </article>
  `;
}

function renderEventOptions() {
  const eventOptions = allEvents
    .map((event) => `<option value="${event.id}">${escapeHtml(event.title || `Evento #${event.id}`)}</option>`)
    .join("");

  assignmentEvent.innerHTML = eventOptions || '<option value="">Sin eventos</option>';

  if (selectedEvent?.id) {
    assignmentEvent.value = String(selectedEvent.id);
  }
}

function renderCollaboratorOptions() {
  const collaboratorOptions = allCollaborators
    .filter((collaborator) => collaborator.status !== "inactive")
    .map(
      (collaborator) =>
        `<option value="${collaborator.id}">${escapeHtml(collaborator.full_name)} · ${escapeHtml(collaborator.role)}</option>`
    )
    .join("");

  assignmentCollaborator.innerHTML = collaboratorOptions || '<option value="">Sin colaboradores activos</option>';

  if (selectedCollaborator?.id) {
    assignmentCollaborator.value = String(selectedCollaborator.id);
  }
}

function renderEvents(rows = []) {
  setOptionalText(statActiveEvents, String(rows.length));

  if (!rows.length) {
    eventsList.innerHTML = "<p>No hay eventos visibles todavía.</p>";
    renderEventOptions();
    return;
  }

  eventsList.innerHTML = rows
    .map((event) => {
      const services = Array.isArray(event.services) && event.services.length
        ? event.services.join(", ")
        : "Sin servicios";
      const selectedClass = selectedEvent?.id === event.id ? " is-selected" : "";
      const customerLabel = event.customer_id ? ` · customer #${event.customer_id}` : "";

      return `
        <article class="event-row${selectedClass}">
          <button type="button" data-event-id="${event.id}">
            <strong>${escapeHtml(event.title || "Evento sin nombre")}</strong>
            <span class="event-meta">
              #${event.id}${customerLabel} · ${escapeHtml(event.event_type || "Sin tipo")} · ${escapeHtml(event.status || "draft")} · ${escapeHtml(event.budget_label || "Sin presupuesto")}
            </span>
            <span class="event-meta">${escapeHtml(services)}</span>
          </button>
        </article>
      `;
    })
    .join("");

  eventsList.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedEvent = rows.find((event) => String(event.id) === button.dataset.eventId);
      selectedEventLabel.textContent = selectedEvent
        ? `Evento seleccionado: ${selectedEvent.title || `#${selectedEvent.id}`}`
        : "Selecciona un evento para enviar instrucciones.";
      renderEvents(rows);
      renderEventOptions();
    });
  });

  renderEventOptions();
}

function renderProviders(rows = []) {
  setOptionalText(statProviders, String(rows.length));

  if (!rows.length) {
    providersList.innerHTML = "<p>No hay proveedores todavía.</p>";
    return;
  }

  providersList.innerHTML = rows
    .map((provider) => {
      const selectedClass = selectedProvider?.id === provider.id ? " is-selected" : "";
      const location = [provider.city, provider.state].filter(Boolean).join(", ") || "Sin ubicación";
      const contact = [provider.contact_name, provider.email, provider.phone].filter(Boolean).join(" · ") || "Sin contacto";
      const nextStatus = provider.status === "archived" ? "active" : "archived";
      const toggleLabel = provider.status === "archived" ? "Reactivar" : "Archivar";

      return `
        <article class="provider-row${selectedClass}">
          <button type="button" data-provider-select="${provider.id}">
            <strong>${escapeHtml(provider.provider_name || "Proveedor sin nombre")}</strong>
            <span class="provider-meta">
              #${provider.id} · ${escapeHtml(provider.provider_type || "vendor")} · ${escapeHtml(provider.status || "active")}
            </span>
            <span class="provider-meta">${escapeHtml(contact)}</span>
            <span class="provider-meta">${escapeHtml(location)}</span>
          </button>
          <div class="provider-actions">
            <button class="tiny-button" type="button" data-provider-edit="${provider.id}">Editar</button>
            <button class="tiny-button" type="button" data-provider-status="${provider.id}" data-next-status="${nextStatus}">
              ${toggleLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  providersList.querySelectorAll("[data-provider-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedProvider = rows.find((provider) => String(provider.id) === button.dataset.providerSelect);
      renderProviders(rows);
    });
  });

  providersList.querySelectorAll("[data-provider-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const provider = rows.find((item) => String(item.id) === button.dataset.providerEdit);
      if (!provider) return;
      selectedProvider = provider;
      fillProviderForm(provider);
      renderProviders(rows);
    });
  });

  providersList.querySelectorAll("[data-provider-status]").forEach((button) => {
    button.addEventListener("click", () => {
      updateProviderStatus(button.dataset.providerStatus, button.dataset.nextStatus);
    });
  });
}

function renderCollaborators(rows = []) {
  if (!rows.length) {
    collaboratorsList.innerHTML = "<p>No hay colaboradores todavía.</p>";
    renderCollaboratorOptions();
    return;
  }

  collaboratorsList.innerHTML = rows
    .map((collaborator) => {
      const selectedClass = selectedCollaborator?.id === collaborator.id ? " is-selected" : "";
      const toggleLabel = collaborator.status === "inactive" ? "Activar" : "Desactivar";
      const nextStatus = collaborator.status === "inactive" ? "active" : "inactive";

      return `
        <article class="collaborator-row${selectedClass}">
          <button type="button" data-collaborator-select="${collaborator.id}">
            <strong>${escapeHtml(collaborator.full_name)}</strong>
            <span class="collaborator-meta">
              #${collaborator.id} · ${escapeHtml(collaborator.role)} · ${escapeHtml(collaborator.status)}
            </span>
            <span class="collaborator-meta">
              ${escapeHtml(collaborator.email || "Sin email")} · ${escapeHtml(collaborator.phone || "Sin teléfono")}
            </span>
          </button>
          <div class="collaborator-actions">
            <button class="tiny-button" type="button" data-collaborator-edit="${collaborator.id}">Editar</button>
            <button class="tiny-button" type="button" data-collaborator-status="${collaborator.id}" data-next-status="${nextStatus}">
              ${toggleLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  collaboratorsList.querySelectorAll("[data-collaborator-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCollaborator = rows.find((collaborator) => String(collaborator.id) === button.dataset.collaboratorSelect);
      renderCollaborators(rows);
      renderCollaboratorOptions();
    });
  });

  collaboratorsList.querySelectorAll("[data-collaborator-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const collaborator = rows.find((item) => String(item.id) === button.dataset.collaboratorEdit);
      if (!collaborator) return;
      selectedCollaborator = collaborator;
      fillCollaboratorForm(collaborator);
      renderCollaborators(rows);
      renderCollaboratorOptions();
    });
  });

  collaboratorsList.querySelectorAll("[data-collaborator-status]").forEach((button) => {
    button.addEventListener("click", () => {
      updateCollaboratorStatus(button.dataset.collaboratorStatus, button.dataset.nextStatus);
    });
  });

  renderCollaboratorOptions();
}

function renderAssignments(rows = []) {
  if (!rows.length) {
    assignmentsList.innerHTML = "<p>No hay asignaciones todavía.</p>";
    return;
  }

  const eventsById = new Map(allEvents.map((event) => [Number(event.id), event]));
  const collaboratorsById = new Map(allCollaborators.map((collaborator) => [Number(collaborator.id), collaborator]));

  assignmentsList.innerHTML = rows
    .map((assignment) => {
      const event = eventsById.get(Number(assignment.event_id));
      const collaborator = collaboratorsById.get(Number(assignment.collaborator_id));

      return `
        <article class="assignment-row">
          <strong>${escapeHtml(collaborator?.full_name || `Colaborador #${assignment.collaborator_id}`)}</strong>
          <span class="assignment-meta">
            ${escapeHtml(assignment.assignment_role)} · ${escapeHtml(assignment.status)} · ${escapeHtml(event?.title || `Evento #${assignment.event_id}`)}
          </span>
          <span class="assignment-meta">${escapeHtml(assignment.notes || "Sin notas")}</span>
        </article>
      `;
    })
    .join("");
}

function renderCustomers(rows = []) {
  if (!rows.length) {
    customersList.innerHTML = "<p>No hay clientes registrados todavía.</p>";
    return;
  }

  customersList.innerHTML = rows
    .map(
      (customer) => `
        <article class="customer-row">
          <strong>${escapeHtml(customer.full_name)}</strong>
          <span class="customer-meta">#${customer.id} · ${escapeHtml(customer.email || "Sin email")} · ${escapeHtml(customer.phone || "Sin teléfono")}</span>
          <span class="customer-meta">${escapeHtml(customer.notes || "Sin notas")}</span>
        </article>
      `
    )
    .join("");
}

function requestButtonsFor(request) {
  const role = request.membership?.role || request.profile?.role || "";
  const buttons = [];

  if (role.includes("client") || role === "viewer") {
    buttons.push(`<button class="tiny-button" type="button" data-approve-user="${request.userId}" data-approve-role="viewer">Aprobar cliente</button>`);
  }

  if (role.includes("collaborator") || role === "collaborator") {
    buttons.push(`<button class="tiny-button" type="button" data-approve-user="${request.userId}" data-approve-role="collaborator">Aprobar colaborador</button>`);
  }

  buttons.push(`<button class="tiny-button" type="button" data-approve-user="${request.userId}" data-approve-role="organizer">Aprobar organizer</button>`);
  buttons.push(`<button class="tiny-button" type="button" data-approve-user="${request.userId}" data-approve-role="admin">Aprobar admin</button>`);
  buttons.push(`<button class="tiny-button" type="button" data-disable-user="${request.userId}">Desactivar</button>`);

  return buttons.join("");
}

function renderUserRequests(requests = []) {
  setOptionalText(statPending, String(requests.length));

  if (!requests.length) {
    userRequestsList.innerHTML = "<p>No hay solicitudes pendientes.</p>";
    return;
  }

  userRequestsList.innerHTML = requests
    .map((request) => {
      const profile = request.profile || {};
      const membership = request.membership || {};
      const status = membership.status || profile.role || "pending";

      return `
        <article class="request-row">
          <strong>${escapeHtml(profile.full_name || profile.email || request.userId)}</strong>
          <span class="request-meta">
            ${escapeHtml(profile.email || "Sin email")} · profile ${escapeHtml(profile.role || "sin profile")} · membership ${escapeHtml(membership.role || "sin membership")} / ${escapeHtml(status)}
          </span>
          <div class="request-actions">
            ${requestButtonsFor(request)}
          </div>
        </article>
      `;
    })
    .join("");

  userRequestsList.querySelectorAll("[data-approve-user]").forEach((button) => {
    button.addEventListener("click", () => {
      approveUserRequest(button.dataset.approveUser, button.dataset.approveRole);
    });
  });

  userRequestsList.querySelectorAll("[data-disable-user]").forEach((button) => {
    button.addEventListener("click", () => {
      disableUserRequest(button.dataset.disableUser);
    });
  });
}

function fillProviderForm(provider) {
  providerId.value = provider.id;
  providerName.value = provider.provider_name || "";
  providerType.value = provider.provider_type || "vendor";
  providerContactName.value = provider.contact_name || "";
  providerEmail.value = provider.email || "";
  providerPhone.value = provider.phone || "";
  providerWebsite.value = provider.website || "";
  providerCity.value = provider.city || "";
  providerState.value = provider.state || "";
  providerStatus.value = provider.status || "active";
  providerNotes.value = provider.notes || "";
}

function resetProviderForm() {
  providerForm.reset();
  providerId.value = "";
  providerType.value = "vendor";
  providerStatus.value = "active";
  selectedProvider = null;
  renderProviders(allProviders);
}

function fillCollaboratorForm(collaborator) {
  collaboratorId.value = collaborator.id;
  collaboratorName.value = collaborator.full_name || "";
  collaboratorEmail.value = collaborator.email || "";
  collaboratorPhone.value = collaborator.phone || "";
  collaboratorRole.value = collaborator.role || "staff";
  collaboratorStatus.value = collaborator.status || "active";
  collaboratorNotes.value = collaborator.notes || "";
}

function resetCollaboratorForm() {
  collaboratorForm.reset();
  collaboratorId.value = "";
  collaboratorRole.value = "organizer";
  collaboratorStatus.value = "active";
  selectedCollaborator = null;
  renderCollaborators(allCollaborators);
}

async function loadWorkspace() {
  if (!supabase) return;

  const [workspaceResult, eventsResult, providersResult, collaboratorsResult, customersResult] = await Promise.all([
    supabase.from("beoflow_workspaces").select("*").eq("id", WORKSPACE_ID).maybeSingle(),
    supabase.from("cater_events").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
    supabase.from("cater_providers").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
    supabase.from("cater_collaborators").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
    supabase.from("cater_customers").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
  ]);

  if (workspaceResult.error) {
    workspaceSummary.innerHTML = `<p>${escapeHtml(workspaceResult.error.message)}</p>`;
    return;
  }

  currentWorkspace = workspaceResult.data;
  renderWorkspaceSummary({
    events: eventsResult.count,
    providers: providersResult.count,
    collaborators: collaboratorsResult.count,
    customers: customersResult.count,
  });
}

async function loadEvents() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_events")
    .select(
      "id,workspace_id,customer_id,title,event_type,status,budget,budget_label,menu_style,services,plan,event_date,guest_count,updated_at,created_at"
    )
    .eq("workspace_id", WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    eventsList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  allEvents = data || [];
  renderEvents(allEvents);
}

async function loadProviders() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_providers")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    providersList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  allProviders = data || [];
  renderProviders(allProviders);
}

async function loadCollaborators() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_collaborators")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    collaboratorsList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  allCollaborators = data || [];
  renderCollaborators(allCollaborators);
}

async function loadAssignments() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_event_assignments")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    assignmentsList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  allAssignments = data || [];
  renderAssignments(allAssignments);
}

async function loadCustomers() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_customers")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    customersList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  renderCustomers(data || []);
}

async function loadUserRequests() {
  if (!supabase || !canManageRequests()) {
    userRequestsList.innerHTML = "<p>Solo owner/admin puede revisar solicitudes.</p>";
    return;
  }

  setRequestsStatus("Cargando solicitudes...");

  const [membershipsResult, profilesResult] = await Promise.all([
    supabase
      .from("beoflow_workspace_members")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .in("status", ["pending", "invited", "disabled"])
      .order("created_at", { ascending: false }),
    supabase
      .from("cater_profiles")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .in("role", PENDING_PROFILE_ROLES)
      .order("created_at", { ascending: false }),
  ]);

  if (membershipsResult.error) {
    setRequestsStatus(membershipsResult.error.message);
    return;
  }

  if (profilesResult.error) {
    setRequestsStatus(profilesResult.error.message);
    return;
  }

  const memberships = membershipsResult.data || [];
  const profiles = profilesResult.data || [];
  const userIds = [...new Set([...memberships.map((item) => item.user_id), ...profiles.map((item) => item.id)])];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  if (userIds.length) {
    const { data: activeProfiles } = await supabase
      .from("cater_profiles")
      .select("*")
      .in("id", userIds);

    (activeProfiles || []).forEach((profile) => profileMap.set(profile.id, profile));
  }

  const membershipMap = new Map(memberships.map((membership) => [membership.user_id, membership]));
  const requests = userIds.map((userId) => ({
    userId,
    profile: profileMap.get(userId),
    membership: membershipMap.get(userId),
  }));

  renderUserRequests(requests);
  setRequestsStatus(requests.length ? `${requests.length} solicitud(es).` : "Sin solicitudes pendientes.");
}

async function refreshCollaboratorModule() {
  await loadCollaborators();
  await loadAssignments();
}

async function refreshProviderModule() {
  await loadProviders();
}

async function approveUserRequest(userId, approvedRole) {
  if (!supabase || !canManageRequests()) return;

  setRequestsStatus("Aprobando usuario...");

  const { error: memberError } = await supabase.from("beoflow_workspace_members").upsert(
    {
      workspace_id: WORKSPACE_ID,
      user_id: userId,
      role: approvedRole,
      status: "active",
    },
    { onConflict: "workspace_id,user_id" }
  );

  if (memberError) {
    setRequestsStatus(memberError.message);
    return;
  }

  const { error: profileError } = await supabase.from("cater_profiles").upsert(
    {
      id: userId,
      workspace_id: WORKSPACE_ID,
      role: profileRoleForMembershipRole(approvedRole),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    setRequestsStatus(profileError.message);
    return;
  }

  setRequestsStatus("Usuario aprobado.");
  await Promise.all([loadUserRequests(), loadWorkspace()]);
}

async function disableUserRequest(userId) {
  if (!supabase || !canManageRequests()) return;

  setRequestsStatus("Desactivando usuario...");

  const { error } = await supabase
    .from("beoflow_workspace_members")
    .upsert(
      {
        workspace_id: WORKSPACE_ID,
        user_id: userId,
        role: "viewer",
        status: "disabled",
      },
      { onConflict: "workspace_id,user_id" }
    );

  if (error) {
    setRequestsStatus(error.message);
    return;
  }

  await supabase.from("cater_profiles").update({ role: "client_pending" }).eq("id", userId);
  setRequestsStatus("Usuario desactivado.");
  await loadUserRequests();
}

async function bootAdmin() {
  if (!isSupabaseConfigured) {
    setSessionStatus("Configura Supabase en lib/supabaseClient.js para usar el admin.");
    return;
  }

  supabase = requireSupabase();
  const { user, profile, membership, workspace } = await getWorkspaceContext();
  currentUser = user;
  currentProfile = profile;
  currentMembership = membership;
  currentWorkspace = workspace;
  currentRole = getEffectiveWorkspaceRole(profile, membership);

  if (!currentUser) {
    window.location.href = "../login.html";
    return;
  }

  if (currentMembership?.status === "disabled" || isPendingWorkspaceAccess(currentProfile, currentMembership)) {
    window.location.href = "../pending.html";
    return;
  }

  if (!canManageEvents()) {
    if (currentRole === "collaborator") window.location.href = "../collaborator/";
    else window.location.href = "../client/";
    return;
  }

  setSessionStatus(`${currentUser.email} · ${currentWorkspace?.name || WORKSPACE_ID} · rol ${currentRole}`);
  setOptionalText(dashboardEmail, currentUser.email || "Usuario activo");
  setOptionalText(dashboardRole, currentRole || "admin");
  eventForm.hidden = !canManageEvents();
  providersSection.hidden = !canManageProviders();
  providerForm.hidden = !canManageProviders();
  collaboratorForm.hidden = !canManageCollaborators();
  requestsSection.hidden = !canManageRequests();
  assignmentForm.hidden = !canManageEvents();

  await Promise.all([loadWorkspace(), loadEvents(), loadProviders(), loadCollaborators(), loadCustomers(), loadUserRequests()]);
  await loadAssignments();

  eventsChannel = subscribeToEvents(
    () => {
      loadEvents().then(loadAssignments);
      loadProviders();
      loadWorkspace();
    },
    {
      workspaceId: WORKSPACE_ID,
    }
  );
}

async function syncEventToBeoflow(eventId) {
  if (!supabase || !eventId) {
    return { status: "skipped", reason: "No event id." };
  }

  try {
    const { data, error } = await supabase.functions.invoke("beoflow", {
      body: {
        action: "sync-event",
        eventId,
        workspaceId: WORKSPACE_ID,
      },
    });

    if (error) {
      return { status: "failed", reason: error.message };
    }

    return data?.beoflowSync || { status: "skipped", reason: "No sync response." };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function syncProviderToBeoflow(providerRecordId) {
  if (!supabase || !providerRecordId) {
    return { status: "skipped", reason: "No provider id." };
  }

  try {
    const { data, error } = await supabase.functions.invoke("beoflow", {
      body: {
        action: "sync-provider",
        providerId: providerRecordId,
        workspaceId: WORKSPACE_ID,
      },
    });

    if (error) {
      return { status: "failed", reason: error.message };
    }

    return data?.beoflowSync || { status: "skipped", reason: "No sync response." };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !canManageEvents()) return;

  setEventStatus("Creando evento...");
  const budgetLabel = eventBudget.value;
  const plan = {
    budgetLabel,
    eventType: eventType.value,
    menuStyle: null,
    services: [],
  };

  const { data: createdEvent, error } = await supabase.from("cater_events").insert({
    workspace_id: WORKSPACE_ID,
    title: eventTitle.value.trim(),
    event_type: eventType.value,
    budget_label: budgetLabel,
    status: "draft",
    event_date: eventDate.value || null,
    guest_count: guestCount.value ? Number(guestCount.value) : null,
    created_by: currentUser.id,
    plan,
  }).select("*").single();

  if (error) {
    setEventStatus(error.message);
    return;
  }

  const syncResult = await syncEventToBeoflow(createdEvent?.id);
  eventForm.reset();
  setEventStatus(
    syncResult.status === "synced"
      ? "Evento creado y sincronizado con BEOFlow."
      : `Evento creado. Sync BEOFlow pendiente${syncResult.reason ? `: ${syncResult.reason}` : "."}`
  );
  await Promise.all([loadEvents(), loadWorkspace()]);
});

providerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !canManageProviders()) return;

  const payload = {
    workspace_id: WORKSPACE_ID,
    provider_name: providerName.value.trim(),
    provider_type: providerType.value,
    contact_name: providerContactName.value.trim() || null,
    email: providerEmail.value.trim() || null,
    phone: providerPhone.value.trim() || null,
    website: providerWebsite.value.trim() || null,
    city: providerCity.value.trim() || null,
    state: providerState.value.trim() || null,
    status: providerStatus.value,
    notes: providerNotes.value.trim() || null,
  };

  if (!payload.provider_name) {
    setProviderStatus("Agrega el nombre del proveedor.");
    return;
  }

  setProviderStatus(providerId.value ? "Actualizando proveedor..." : "Creando proveedor...");

  const query = providerId.value
    ? supabase
        .from("cater_providers")
        .update(payload)
        .eq("workspace_id", WORKSPACE_ID)
        .eq("id", Number(providerId.value))
        .select("id")
        .single()
    : supabase
        .from("cater_providers")
        .insert({ ...payload, created_by: currentUser.id })
        .select("id")
        .single();

  const { data, error } = await query;

  if (error) {
    setProviderStatus(error.message);
    return;
  }

  const syncResult = await syncProviderToBeoflow(data?.id);
  resetProviderForm();
  setProviderStatus(
    syncResult.status === "synced"
      ? "Proveedor guardado y sincronizado con BEOFlow."
      : `Proveedor guardado. Sync BEOFlow pendiente${syncResult.reason ? `: ${syncResult.reason}` : "."}`
  );
  await Promise.all([refreshProviderModule(), loadWorkspace()]);
});

collaboratorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !canManageCollaborators()) return;

  const payload = {
    workspace_id: WORKSPACE_ID,
    full_name: collaboratorName.value.trim(),
    email: collaboratorEmail.value.trim() || null,
    phone: collaboratorPhone.value.trim() || null,
    role: collaboratorRole.value,
    status: collaboratorStatus.value,
    notes: collaboratorNotes.value.trim() || null,
  };

  if (!payload.full_name) {
    setCollaboratorStatus("Agrega el nombre del colaborador.");
    return;
  }

  setCollaboratorStatus(collaboratorId.value ? "Actualizando colaborador..." : "Creando colaborador...");

  const query = collaboratorId.value
    ? supabase
        .from("cater_collaborators")
        .update(payload)
        .eq("workspace_id", WORKSPACE_ID)
        .eq("id", Number(collaboratorId.value))
    : supabase.from("cater_collaborators").insert(payload);

  const { error } = await query;

  if (error) {
    setCollaboratorStatus(error.message);
    return;
  }

  setCollaboratorStatus(collaboratorId.value ? "Colaborador actualizado." : "Colaborador creado.");
  resetCollaboratorForm();
  await Promise.all([refreshCollaboratorModule(), loadWorkspace()]);
});

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !canManageEvents()) return;

  const eventId = Number(assignmentEvent.value);
  const collaboratorIdValue = Number(assignmentCollaborator.value);

  if (!eventId || !collaboratorIdValue) {
    setAssignmentStatus("Selecciona evento y colaborador.");
    return;
  }

  setAssignmentStatus("Guardando asignación...");

  const { error } = await supabase.from("cater_event_assignments").upsert(
    {
      workspace_id: WORKSPACE_ID,
      event_id: eventId,
      collaborator_id: collaboratorIdValue,
      assignment_role: assignmentRole.value,
      status: assignmentSelectStatus.value,
      notes: assignmentNotes.value.trim() || null,
    },
    { onConflict: "event_id,collaborator_id" }
  );

  if (error) {
    setAssignmentStatus(error.message);
    return;
  }

  assignmentNotes.value = "";
  setAssignmentStatus("Asignación guardada.");
  await loadAssignments();
});

adminBeoflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const prompt = adminBeoflowPrompt.value.trim();
  if (!prompt) {
    beoflowResult.textContent = "Escribe una instrucción para BEOFlow.";
    return;
  }

  beoflowResult.textContent = "BEOFlow procesando...";

  const { data, error } = await supabase.functions.invoke("beoflow", {
    body: {
      message: prompt,
      eventId: selectedEvent?.id || null,
      currentPlan: selectedEvent ? eventPlanFromRow(selectedEvent) : {},
      workspaceId: WORKSPACE_ID,
    },
  });

  if (error) {
    beoflowResult.textContent = error.message;
    return;
  }

  beoflowResult.textContent = JSON.stringify(data, null, 2);
  await Promise.all([loadEvents(), refreshProviderModule(), loadCustomers(), refreshCollaboratorModule(), loadWorkspace()]);
});

async function updateProviderStatus(id, status) {
  if (!supabase || !canManageProviders()) return;

  const { error } = await supabase
    .from("cater_providers")
    .update({ status })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", Number(id));

  if (error) {
    setProviderStatus(error.message);
    return;
  }

  const syncResult = await syncProviderToBeoflow(id);
  setProviderStatus(
    syncResult.status === "synced"
      ? `Proveedor ${status === "archived" ? "archivado" : "reactivado"} y sincronizado.`
      : `Proveedor ${status === "archived" ? "archivado" : "reactivado"}. Sync pendiente${syncResult.reason ? `: ${syncResult.reason}` : "."}`
  );
  await refreshProviderModule();
}

async function updateCollaboratorStatus(id, status) {
  if (!supabase || !canManageCollaborators()) return;

  const { error } = await supabase
    .from("cater_collaborators")
    .update({ status })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", Number(id));

  if (error) {
    setCollaboratorStatus(error.message);
    return;
  }

  setCollaboratorStatus(status === "active" ? "Colaborador activado." : "Colaborador desactivado.");
  await refreshCollaboratorModule();
}

refreshWorkspaceButton.addEventListener("click", loadWorkspace);

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.dataset.scrollTarget;
    if (!targetSelector) return;

    document.querySelector(targetSelector)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

refreshEventsButton.addEventListener("click", () => {
  loadEvents().then(loadAssignments);
});

refreshRequestsButton.addEventListener("click", () => {
  Promise.all([loadUserRequests(), loadCustomers()]);
});

refreshCollaboratorsButton.addEventListener("click", refreshCollaboratorModule);
resetCollaboratorButton.addEventListener("click", resetCollaboratorForm);
refreshProvidersButton.addEventListener("click", refreshProviderModule);
resetProviderButton.addEventListener("click", resetProviderForm);

signoutButton.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.href = "../login.html";
});

window.addEventListener("beforeunload", () => {
  if (eventsChannel && supabase) {
    supabase.removeChannel(eventsChannel);
  }
});

bootAdmin().catch((error) => {
  setSessionStatus(error.message);
});
