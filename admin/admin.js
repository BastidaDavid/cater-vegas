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
const WORKSPACE_MANAGER_ROLES = new Set(["owner", "admin", "super_admin", "platform_admin"]);
const EVENT_MANAGER_ROLES = new Set(["owner", "admin", "super_admin", "platform_admin", "organizer"]);
const PROVIDER_NOTE_LABELS = {
  services: "Servicios y notas",
  coverage: "Zona de cobertura",
  availability: "Disponibilidad",
  pricing: "Precios base",
  license: "Licencia / seguro",
};

function keepDashboardPinned() {
  if (window.location.hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  window.scrollTo(0, 0);
}

keepDashboardPinned();

const sessionStatus = document.querySelector("#sessionStatus");
const signoutButton = document.querySelector("#signoutButton");
const workspaceSummary = document.querySelector("#workspaceSummary");
const refreshWorkspaceButton = document.querySelector("#refreshWorkspaceButton");
const requestsSection = document.querySelector("#requestsSection");
const requestsStatus = document.querySelector("#requestsStatus");
const refreshRequestsButton = document.querySelector("#refreshRequestsButton");
const userRequestsList = document.querySelector("#userRequestsList");
const pendingRequestsPreview = document.querySelector("#pendingRequestsPreview");
const customersList = document.querySelector("#customersList");
const dashboardEmail = document.querySelector("#dashboardEmail");
const dashboardRole = document.querySelector("#dashboardRole");

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

const collaboratorForm = document.querySelector("#collaboratorForm");
const collaboratorId = document.querySelector("#collaboratorId");
const collaboratorName = document.querySelector("#collaboratorName");
const collaboratorEmail = document.querySelector("#collaboratorEmail");
const collaboratorPhone = document.querySelector("#collaboratorPhone");
const collaboratorRole = document.querySelector("#collaboratorRole");
const collaboratorStatus = document.querySelector("#collaboratorStatus");
const providerCoverage = document.querySelector("#providerCoverage");
const providerAvailability = document.querySelector("#providerAvailability");
const providerBasePricing = document.querySelector("#providerBasePricing");
const providerLicenseInsurance = document.querySelector("#providerLicenseInsurance");
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

const statActiveEvents = document.querySelector("#statActiveEvents");
const statPending = document.querySelector("#statPending");
const statProviders = document.querySelector("#statProviders");
const statUsers = document.querySelector("#statUsers");
const statRevenue = document.querySelector("#statRevenue");
const statCompleted = document.querySelector("#statCompleted");
const analyticsLine = document.querySelector("#analyticsLine");
const analyticsBars = document.querySelector("#analyticsBars");
const categoryDonut = document.querySelector("#categoryDonut");
const categoryLegend = document.querySelector("#categoryLegend");
const requestProgress = document.querySelector("#requestProgress");
const upcomingEventsList = document.querySelector("#upcomingEventsList");
const activityTimeline = document.querySelector("#activityTimeline");

let supabase = null;
let currentUser = null;
let currentProfile = null;
let currentMembership = null;
let currentRole = null;
let currentWorkspace = null;
let selectedEvent = null;
let selectedCollaborator = null;
let authReady = false;
let adminBootPromise = null;
let eventsChannel = null;
let allEvents = [];
let allCollaborators = [];
let allAssignments = [];
let allCustomers = [];
let allRequests = [];

function setSessionStatus(message) {
  sessionStatus.textContent = message;
}

function setEventStatus(message) {
  eventFormStatus.textContent = message;
}

function setCollaboratorStatus(message) {
  collaboratorFormStatus.textContent = message;
}

function eventSaveErrorMessage(error) {
  const message = error?.message || "";
  if (message.toLowerCase().includes("row-level security")) {
    return "No se pudo guardar el evento. Revisa la conexion o las politicas de Supabase.";
  }
  return message || "No se pudo guardar el evento. Revisa la conexion o las politicas de Supabase.";
}

function providerSaveErrorMessage(error) {
  const message = error?.message || "";
  if (message.toLowerCase().includes("row-level security")) {
    return "No se pudo guardar el proveedor. Revisa la conexion o las politicas de Supabase.";
  }
  return message || "No se pudo guardar el proveedor. Revisa la conexion o las politicas de Supabase.";
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

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function currentUserRoles() {
  return [
    currentRole,
    currentMembership?.role,
    currentProfile?.role,
    currentProfile?.platform_role,
    currentProfile?.platformRole,
  ]
    .map(normalizeRole)
    .filter(Boolean);
}

function hasAnyRole(allowedRoles) {
  return currentUserRoles().some((role) => allowedRoles.has(role));
}

function canManageEvents() {
  return hasAnyRole(EVENT_MANAGER_ROLES);
}

function canManageCollaborators() {
  return hasAnyRole(WORKSPACE_MANAGER_ROLES);
}

function canManageRequests() {
  return hasAnyRole(WORKSPACE_MANAGER_ROLES);
}

function profileRoleForMembershipRole(role) {
  const roleMap = {
    owner: "admin",
    admin: "admin",
    super_admin: "admin",
    platform_admin: "admin",
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

function buildEventPayload() {
  const budgetLabel = eventBudget.value;
  const title = eventTitle.value.trim();
  const eventTypeValue = eventType.value;

  return {
    workspace_id: WORKSPACE_ID,
    title,
    event_type: eventTypeValue,
    budget_label: budgetLabel,
    status: "draft",
    event_date: eventDate.value || null,
    guest_count: guestCount.value ? Number(guestCount.value) : null,
    plan: {
      budgetLabel,
      eventType: eventTypeValue,
      menuStyle: null,
      services: [],
    },
  };
}

async function insertEventPayload(basePayload) {
  const payloads = [
    currentUser?.id ? { ...basePayload, created_by: currentUser.id } : null,
    basePayload,
  ].filter(Boolean);

  for (const payload of payloads) {
    const result = await supabase.from("cater_events").insert(payload);
    if (!isMissingSchemaColumnError(result.error)) return result;
  }

  return supabase.from("cater_events").insert(basePayload);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0));
}

function formatShortDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-US", { month: "short", day: "numeric" }).format(date);
}

function eventAmount(event) {
  if (Number.isFinite(Number(event.budget))) return Number(event.budget);
  const label = String(event.budget_label || "");
  if (label.includes("25K")) return 25000;
  if (label.includes("10K") && label.includes("25K")) return 17500;
  if (label.includes("5K") && label.includes("10K")) return 7500;
  if (label.includes("2K") && label.includes("5K")) return 3500;
  return 0;
}

function normalizedStatus(status) {
  return String(status || "draft").toLowerCase();
}

function statusBadge(status) {
  const value = normalizedStatus(status);
  const danger = ["cancelled", "inactive", "disabled", "rejected"].includes(value);
  const pending = ["draft", "pending", "invited", "proposal", "review"].includes(value);
  const className = danger ? " is-danger" : pending ? " is-pending" : "";
  return `<span class="status-badge${className}">${escapeHtml(value)}</span>`;
}

function providerRoleLabel(role) {
  const labels = {
    chef: "Catering / Cocina",
    server: "Servicio",
    driver: "Logistica / Delivery",
    organizer: "Coordinacion",
    staff: "Staff extra",
    viewer: "Viewer",
    admin: "Admin",
    owner: "Owner",
  };
  const value = String(role || "staff").toLowerCase();
  return labels[value] || role || "Proveedor";
}

function userInitials(value) {
  const text = String(value || "CV").trim();
  const pieces = text.includes("@") ? text.split("@")[0].split(/[._-]/) : text.split(/\s+/);
  return pieces
    .filter(Boolean)
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase())
    .join("") || "CV";
}

function monthKey(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return monthKey(new Date());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat("es-US", { month: "short" }).format(date),
    };
  });
}

function renderWorkspaceSummary(stats = {}) {
  if (!currentWorkspace) {
    workspaceSummary.innerHTML = '<div class="empty-state">No se pudo leer el workspace activo.</div>';
    return;
  }

  workspaceSummary.innerHTML = `
    <article class="workspace-stat">
      <strong>${escapeHtml(currentWorkspace.name || "Cater Vegas")}</strong>
      <span class="workspace-meta">
        ${escapeHtml(currentWorkspace.slug || WORKSPACE_ID)} · ${escapeHtml(currentWorkspace.status || "active")}
      </span>
    </article>
    <article class="workspace-stat">
      <strong>${stats.events || 0} eventos · ${stats.collaborators || 0} proveedores · ${stats.customers || 0} clientes</strong>
      <span class="workspace-meta">Workspace ID: ${escapeHtml(WORKSPACE_ID)}</span>
    </article>
  `;
}

function renderMetricCards() {
  const activeEvents = allEvents.filter((event) => !["completed", "done", "cancelled"].includes(normalizedStatus(event.status))).length;
  const pendingEvents = allEvents.filter((event) => ["draft", "pending", "proposal", "review"].includes(normalizedStatus(event.status))).length;
  const completedEvents = allEvents.filter((event) => ["completed", "done"].includes(normalizedStatus(event.status))).length;
  const revenue = allEvents.reduce((sum, event) => sum + eventAmount(event), 0);
  const activeProviders = allCollaborators.filter((collaborator) => normalizedStatus(collaborator.status) !== "inactive").length;
  const users = activeProviders + allCustomers.length;

  statActiveEvents.textContent = String(activeEvents);
  statPending.textContent = String(pendingEvents + allRequests.length);
  statProviders.textContent = String(activeProviders);
  statUsers.textContent = String(users);
  statRevenue.textContent = formatCurrency(revenue);
  statCompleted.textContent = String(completedEvents);
}

function renderLineChart() {
  const months = lastSixMonths();
  const counts = new Map(months.map((month) => [month.key, 0]));
  allEvents.forEach((event) => {
    const key = monthKey(event.event_date || event.created_at || event.updated_at);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });

  const values = months.map((month) => counts.get(month.key) || 0);
  const max = Math.max(1, ...values);
  const width = 640;
  const height = 190;
  const pad = 18;
  const step = (width - pad * 2) / Math.max(1, values.length - 1);
  const points = values.map((value, index) => {
    const x = pad + index * step;
    const y = height - pad - (value / max) * (height - pad * 2);
    return [x, y];
  });
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  analyticsLine.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Eventos por mes">
      ${[0.25, 0.5, 0.75].map((ratio) => `<line class="chart-grid-line" x1="${pad}" x2="${width - pad}" y1="${height * ratio}" y2="${height * ratio}"></line>`).join("")}
      <polygon class="chart-area" points="${area}"></polygon>
      <polyline class="chart-line" points="${line}"></polyline>
      ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#d6b27c"></circle>`).join("")}
    </svg>
    <div class="chart-labels">${months.map((month) => `<span>${escapeHtml(month.label)}</span>`).join("")}</div>
  `;
}

function renderBarChart() {
  const months = lastSixMonths();
  const revenueByMonth = new Map(months.map((month) => [month.key, 0]));
  allEvents.forEach((event) => {
    const key = monthKey(event.event_date || event.created_at || event.updated_at);
    if (revenueByMonth.has(key)) revenueByMonth.set(key, revenueByMonth.get(key) + eventAmount(event));
  });

  const values = months.map((month) => revenueByMonth.get(month.key) || 0);
  const max = Math.max(1, ...values);

  analyticsBars.innerHTML = months
    .map((month, index) => {
      const value = values[index];
      const height = Math.max(8, Math.round((value / max) * 100));
      return `
        <div class="bar-item">
          <span class="bar-track"><span class="bar-fill" style="height:${height}%"></span></span>
          <span class="bar-label">${escapeHtml(month.label)}</span>
          <span class="bar-label">${formatCurrency(value)}</span>
        </div>
      `;
    })
    .join("");
}

function renderCategoryDonut() {
  const categories = new Map();
  allEvents.forEach((event) => {
    const label = event.event_type || "Sin tipo";
    categories.set(label, (categories.get(label) || 0) + 1);
  });

  const entries = [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const value = total ? Math.round(((entries[0]?.[1] || 0) / total) * 100) : 0;
  const colors = ["#d6b27c", "#b9905b", "#d8c6aa", "#8fc7a3"];

  categoryDonut.style.setProperty("--value", `${value}%`);
  categoryLegend.innerHTML = entries.length
    ? entries
        .map(([label, count], index) => `<span style="--legend-color:${colors[index]}">${escapeHtml(label)} · ${count}</span>`)
        .join("")
    : '<div class="empty-state">Sin categorias.</div>';
}

function renderRequestProgress() {
  const pending = allRequests.length;
  const activeUsers = allCollaborators.filter((item) => normalizedStatus(item.status) === "active").length + allCustomers.length;
  const total = pending + activeUsers;
  const resolved = total ? Math.round((activeUsers / total) * 100) : 0;
  requestProgress.style.setProperty("--value", `${resolved}%`);
  requestProgress.querySelector("strong").textContent = `${resolved}%`;
}

function renderAnalytics() {
  renderMetricCards();
  renderLineChart();
  renderBarChart();
  renderCategoryDonut();
  renderRequestProgress();
  renderUpcomingEvents();
  renderActivityTimeline();
}

function renderUpcomingEvents() {
  const rows = [...allEvents]
    .sort((a, b) => new Date(a.event_date || a.updated_at || a.created_at || 0) - new Date(b.event_date || b.updated_at || b.created_at || 0))
    .slice(0, 5);

  if (!rows.length) {
    upcomingEventsList.innerHTML = '<div class="empty-state">No hay eventos visibles todavia.</div>';
    return;
  }

  upcomingEventsList.innerHTML = rows
    .map(
      (event) => `
        <article class="mini-event-row">
          <div>
            <strong>${escapeHtml(event.title || "Evento sin nombre")}</strong>
            <span class="event-meta">${formatShortDate(event.event_date || event.updated_at)} · ${statusBadge(event.status)}</span>
          </div>
          <span class="amount">${formatCurrency(eventAmount(event))}</span>
        </article>
      `
    )
    .join("");
}

function renderActivityTimeline() {
  const items = [
    ...allEvents.slice(0, 3).map((event) => ({
      icon: "📅",
      title: event.title || "Evento creado",
      meta: `${formatShortDate(event.created_at || event.updated_at)} · ${event.status || "draft"}`,
    })),
    ...allCollaborators.slice(0, 2).map((collaborator) => ({
      icon: collaborator.status === "active" ? "✅" : "⚠️",
      title: collaborator.full_name || "Proveedor",
      meta: `${providerRoleLabel(collaborator.role)} · ${collaborator.status || "active"}`,
    })),
    ...allAssignments.slice(0, 2).map((assignment) => ({
      icon: "💰",
      title: `Asignacion #${assignment.id || assignment.event_id}`,
      meta: `${providerRoleLabel(assignment.assignment_role)} · ${assignment.status || "active"}`,
    })),
  ].slice(0, 6);

  if (!items.length) {
    activityTimeline.innerHTML = '<div class="empty-state">Sin actividad reciente.</div>';
    return;
  }

  activityTimeline.innerHTML = items
    .map(
      (item) => `
        <article class="timeline-item">
          <span class="timeline-icon">${item.icon}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span class="event-meta">${escapeHtml(item.meta)}</span>
          </div>
        </article>
      `
    )
    .join("");
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
        `<option value="${collaborator.id}">${escapeHtml(collaborator.full_name)} · ${escapeHtml(providerRoleLabel(collaborator.role))}</option>`
    )
    .join("");

  assignmentCollaborator.innerHTML = collaboratorOptions || '<option value="">Sin proveedores activos</option>';

  if (selectedCollaborator?.id) {
    assignmentCollaborator.value = String(selectedCollaborator.id);
  }
}

function renderEvents(rows = []) {
  if (!rows.length) {
    eventsList.innerHTML = '<div class="empty-state">No hay eventos visibles todavia.</div>';
    renderEventOptions();
    renderAnalytics();
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
              #${event.id}${customerLabel} · ${escapeHtml(event.event_type || "Sin tipo")} · ${statusBadge(event.status)} · ${escapeHtml(event.budget_label || "Sin presupuesto")}
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
  renderAnalytics();
}

function renderCollaborators(rows = []) {
  if (!rows.length) {
    collaboratorsList.innerHTML = '<div class="empty-state">No hay proveedores todavia.</div>';
    renderCollaboratorOptions();
    renderAnalytics();
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
              #${collaborator.id} · ${escapeHtml(providerRoleLabel(collaborator.role))} · ${statusBadge(collaborator.status)}
            </span>
            <span class="collaborator-meta">
              ${escapeHtml(collaborator.email || "Sin email")} · ${escapeHtml(collaborator.phone || "Sin telefono")}
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
  renderAnalytics();
}

function renderAssignments(rows = []) {
  if (!rows.length) {
    assignmentsList.innerHTML = '<div class="empty-state">No hay asignaciones todavia.</div>';
    renderAnalytics();
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
          <strong>${escapeHtml(collaborator?.full_name || `Proveedor #${assignment.collaborator_id}`)}</strong>
          <span class="assignment-meta">
            ${escapeHtml(providerRoleLabel(assignment.assignment_role))} · ${statusBadge(assignment.status)} · ${escapeHtml(event?.title || `Evento #${assignment.event_id}`)}
          </span>
          <span class="assignment-meta">${escapeHtml(assignment.notes || "Sin notas")}</span>
        </article>
      `;
    })
    .join("");

  renderAnalytics();
}

function renderCustomers(rows = []) {
  allCustomers = rows;
  if (!rows.length) {
    customersList.innerHTML = '<div class="empty-state">No hay clientes registrados todavia.</div>';
    renderAnalytics();
    return;
  }

  customersList.innerHTML = rows
    .map(
      (customer) => `
        <article class="customer-row">
          <strong>${escapeHtml(customer.full_name)}</strong>
          <span class="customer-meta">#${customer.id} · ${escapeHtml(customer.email || "Sin email")} · ${escapeHtml(customer.phone || "Sin telefono")}</span>
        </article>
      `
    )
    .join("");

  renderAnalytics();
}

function approvalRoleForRequest(request) {
  const role = request.membership?.role || request.profile?.role || "";
  if (role.includes("client") || role === "viewer") return "viewer";
  if (role.includes("collaborator")) return "collaborator";
  if (role.includes("admin")) return "admin";
  return "organizer";
}

function requestButtonsFor(request) {
  const approvedRole = approvalRoleForRequest(request);
  return `
    <button class="tiny-button" type="button" data-approve-user="${request.userId}" data-approve-role="${approvedRole}">Aprobar</button>
    <button class="tiny-button" type="button" data-disable-user="${request.userId}">Rechazar</button>
  `;
}

function renderPendingRequestsPreview(requests = []) {
  if (!requests.length) {
    pendingRequestsPreview.innerHTML = '<div class="empty-state">Sin solicitudes pendientes.</div>';
    return;
  }

  pendingRequestsPreview.innerHTML = requests
    .slice(0, 4)
    .map((request) => {
      const profile = request.profile || {};
      const membership = request.membership || {};
      const name = profile.full_name || profile.email || request.userId;
      const type = membership.role || profile.role || "pending";

      return `
        <article class="request-row">
          <span class="request-avatar">${escapeHtml(userInitials(name))}</span>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <span class="request-meta">${escapeHtml(type)} · ${statusBadge(membership.status || profile.role || "pending")}</span>
          </div>
          <div class="request-actions">${requestButtonsFor(request)}</div>
        </article>
      `;
    })
    .join("");

  bindRequestButtons(pendingRequestsPreview);
}

function bindRequestButtons(root) {
  root.querySelectorAll("[data-approve-user]").forEach((button) => {
    button.addEventListener("click", () => {
      approveUserRequest(button.dataset.approveUser, button.dataset.approveRole);
    });
  });

  root.querySelectorAll("[data-disable-user]").forEach((button) => {
    button.addEventListener("click", () => {
      disableUserRequest(button.dataset.disableUser);
    });
  });
}

function renderUserRequests(requests = []) {
  allRequests = requests;
  renderPendingRequestsPreview(requests);

  if (!requests.length) {
    userRequestsList.innerHTML = '<div class="empty-state">No hay solicitudes pendientes.</div>';
    renderAnalytics();
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
            ${escapeHtml(profile.email || "Sin email")} · profile ${escapeHtml(profile.role || "sin profile")} · membership ${escapeHtml(membership.role || "sin membership")} / ${statusBadge(status)}
          </span>
          <div class="request-actions">
            ${requestButtonsFor(request)}
          </div>
        </article>
      `;
    })
    .join("");

  bindRequestButtons(userRequestsList);
  renderAnalytics();
}

function providerDetailFields() {
  return [
    [PROVIDER_NOTE_LABELS.coverage, providerCoverage],
    [PROVIDER_NOTE_LABELS.availability, providerAvailability],
    [PROVIDER_NOTE_LABELS.pricing, providerBasePricing],
    [PROVIDER_NOTE_LABELS.license, providerLicenseInsurance],
  ];
}

function buildProviderNotes() {
  const lines = [];
  const services = collaboratorNotes.value.trim();
  if (services) lines.push(`${PROVIDER_NOTE_LABELS.services}: ${services}`);

  providerDetailFields().forEach(([label, field]) => {
    const value = field?.value.trim();
    if (value) lines.push(`${label}: ${value}`);
  });

  return lines.join("\n") || null;
}

function providerDetailPayload() {
  return {
    coverage_area: providerCoverage?.value.trim() || null,
    availability: providerAvailability?.value.trim() || null,
    base_pricing: providerBasePricing?.value.trim() || null,
    license_insurance: providerLicenseInsurance?.value.trim() || null,
  };
}

function isMissingSchemaColumnError(error) {
  return error?.code === "PGRST204" || String(error?.message || "").toLowerCase().includes("schema cache");
}

async function insertProviderPayload(basePayload) {
  const detailPayload = providerDetailPayload();
  const payloads = [
    currentUser?.id ? { ...basePayload, ...detailPayload, created_by: currentUser.id } : null,
    { ...basePayload, ...detailPayload },
    basePayload,
  ].filter(Boolean);

  for (const payload of payloads) {
    const result = await supabase.from("cater_collaborators").insert(payload);
    if (!isMissingSchemaColumnError(result.error)) return result;
  }

  return supabase.from("cater_collaborators").insert(basePayload);
}

async function updateProviderPayload(id, basePayload) {
  const detailPayload = providerDetailPayload();
  const firstResult = await supabase
    .from("cater_collaborators")
    .update({ ...basePayload, ...detailPayload })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", Number(id));

  if (!isMissingSchemaColumnError(firstResult.error)) return firstResult;

  return supabase
    .from("cater_collaborators")
    .update(basePayload)
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", Number(id));
}

function splitProviderNotes(notes = "") {
  const parsed = {
    services: "",
    details: new Map(),
  };

  String(notes || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [label, ...valueParts] = line.split(":");
      const value = valueParts.join(":").trim();
      const normalizedLabel = label.trim();

      if (normalizedLabel === PROVIDER_NOTE_LABELS.services) {
        parsed.services = value;
      } else if (Object.values(PROVIDER_NOTE_LABELS).includes(normalizedLabel)) {
        parsed.details.set(normalizedLabel, value);
      } else {
        parsed.services = parsed.services ? `${parsed.services}\n${line}` : line;
      }
    });

  return parsed;
}

function fillCollaboratorForm(collaborator) {
  const availableRoles = ["chef", "server", "driver", "organizer", "staff"];
  const notes = splitProviderNotes(collaborator.notes);
  collaboratorId.value = collaborator.id;
  collaboratorName.value = collaborator.full_name || "";
  collaboratorEmail.value = collaborator.email || "";
  collaboratorPhone.value = collaborator.phone || "";
  collaboratorRole.value = availableRoles.includes(collaborator.role) ? collaborator.role : "staff";
  collaboratorStatus.value = collaborator.status || "active";
  collaboratorNotes.value = notes.services;
  if (providerCoverage) providerCoverage.value = collaborator.coverage_area || notes.details.get(PROVIDER_NOTE_LABELS.coverage) || "";
  if (providerAvailability) providerAvailability.value = collaborator.availability || notes.details.get(PROVIDER_NOTE_LABELS.availability) || "";
  if (providerBasePricing) providerBasePricing.value = collaborator.base_pricing || notes.details.get(PROVIDER_NOTE_LABELS.pricing) || "";
  if (providerLicenseInsurance) {
    providerLicenseInsurance.value = collaborator.license_insurance || notes.details.get(PROVIDER_NOTE_LABELS.license) || "";
  }
}

function resetCollaboratorForm() {
  collaboratorForm.reset();
  collaboratorId.value = "";
  collaboratorRole.value = "chef";
  collaboratorStatus.value = "active";
  providerDetailFields().forEach(([, field]) => {
    if (field) field.value = "";
  });
  selectedCollaborator = null;
  renderCollaborators(allCollaborators);
}

async function loadWorkspace() {
  if (!supabase) return;

  const [workspaceResult, eventsResult, collaboratorsResult, customersResult] = await Promise.all([
    supabase.from("beoflow_workspaces").select("*").eq("id", WORKSPACE_ID).maybeSingle(),
    supabase.from("cater_events").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
    supabase.from("cater_collaborators").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
    supabase.from("cater_customers").select("id", { count: "exact", head: true }).eq("workspace_id", WORKSPACE_ID),
  ]);

  if (workspaceResult.error) {
    workspaceSummary.innerHTML = `<div class="empty-state">${escapeHtml(workspaceResult.error.message)}</div>`;
    return;
  }

  currentWorkspace = workspaceResult.data;
  renderWorkspaceSummary({
    events: eventsResult.count,
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
    eventsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  allEvents = data || [];
  renderEvents(allEvents);
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
    collaboratorsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
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
    assignmentsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
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
    customersList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  renderCustomers(data || []);
}

async function loadUserRequests() {
  if (!supabase || !canManageRequests()) {
    userRequestsList.innerHTML = "<div class=\"empty-state\">Solo administradores pueden revisar solicitudes.</div>";
    pendingRequestsPreview.innerHTML = "<div class=\"empty-state\">Solo administradores.</div>";
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

  setRequestsStatus("Rechazando usuario...");

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
  setRequestsStatus("Usuario rechazado.");
  await loadUserRequests();
}

function syncAdminPermissionsUi() {
  const displayRole = currentRole || currentUserRoles()[0] || "owner";
  dashboardEmail.textContent = currentUser?.email || "exmarquesado@gmail.com";
  dashboardRole.textContent = displayRole.replace(/^./, (char) => char.toUpperCase());
  setSessionStatus(`${currentUser?.email || "exmarquesado@gmail.com"} · ${currentWorkspace?.name || WORKSPACE_ID} · rol ${displayRole}`);
  eventForm.hidden = !canManageEvents();
  collaboratorForm.hidden = !canManageCollaborators();
  requestsSection.hidden = !canManageRequests();
  assignmentForm.hidden = !canManageEvents();
}

async function ensureAdminReady(setStatus) {
  if (authReady && currentUser) return true;

  setStatus("Verificando permisos...");

  if (adminBootPromise) {
    await Promise.race([
      adminBootPromise,
      new Promise((resolve) => window.setTimeout(resolve, 1800)),
    ]);
  }

  if (authReady && currentUser) return true;

  try {
    supabase = supabase || requireSupabase();
    const { user, profile, membership, workspace } = await getWorkspaceContext();
    currentUser = user;
    currentProfile = profile;
    currentMembership = membership;
    currentWorkspace = workspace;
    currentRole = getEffectiveWorkspaceRole(profile, membership);

    if (!currentUser) {
      window.location.href = "../login.html";
      return false;
    }

    if (currentMembership?.status === "disabled" || isPendingWorkspaceAccess(currentProfile, currentMembership)) {
      window.location.href = "../pending.html";
      return false;
    }

    authReady = true;
    syncAdminPermissionsUi();
    return true;
  } catch (error) {
    setStatus(error?.message || "No se pudieron verificar permisos.");
    return false;
  }
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

  authReady = true;
  syncAdminPermissionsUi();

  await Promise.all([loadWorkspace(), loadEvents(), loadCollaborators(), loadCustomers(), loadUserRequests()]);
  await loadAssignments();

  eventsChannel = subscribeToEvents(
    () => {
      loadEvents().then(loadAssignments);
      loadWorkspace();
    },
    {
      workspaceId: WORKSPACE_ID,
    }
  );
}

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    setEventStatus("Supabase no esta conectado.");
    return;
  }

  if (!authReady) {
    const ready = await ensureAdminReady(setEventStatus);
    if (!ready) return;
  }

  if (!canManageEvents()) {
    setEventStatus("No tienes permisos para administrar eventos.");
    return;
  }

  const payload = buildEventPayload();

  if (!payload.title) {
    setEventStatus("Agrega el nombre del evento.");
    return;
  }

  setEventStatus("Guardando evento...");
  const { error } = await insertEventPayload(payload);

  if (error) {
    setEventStatus(eventSaveErrorMessage(error));
    return;
  }

  eventForm.reset();
  eventBudget.value = "$5K - $10K";
  setEventStatus("Evento guardado.");
  await Promise.all([loadEvents(), loadWorkspace()]);
  await loadAssignments();
});

collaboratorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) {
    setCollaboratorStatus("Supabase no esta conectado.");
    return;
  }

  if (!authReady) {
    const ready = await ensureAdminReady(setCollaboratorStatus);
    if (!ready) return;
  }

  if (!canManageCollaborators()) {
    setCollaboratorStatus("No tienes permisos para administrar proveedores.");
    console.warn("Provider permission denied", {
      currentRole,
      currentProfileRole: currentProfile?.role,
      currentMembershipRole: currentMembership?.role,
      currentMembershipStatus: currentMembership?.status,
    });
    return;
  }

  const payload = {
    workspace_id: WORKSPACE_ID,
    full_name: collaboratorName.value.trim(),
    email: collaboratorEmail.value.trim() || null,
    phone: collaboratorPhone.value.trim() || null,
    role: collaboratorRole.value,
    status: collaboratorStatus.value,
    notes: buildProviderNotes(),
  };

  if (!payload.full_name) {
    setCollaboratorStatus("Agrega el nombre del proveedor.");
    return;
  }

  const isEditing = Boolean(collaboratorId.value);
  setCollaboratorStatus(isEditing ? "Actualizando proveedor..." : "Creando proveedor...");

  let error = null;

  if (isEditing) {
    const result = await updateProviderPayload(collaboratorId.value, payload);
    error = result.error;
  } else {
    const result = await insertProviderPayload(payload);
    error = result.error;
  }

  if (error) {
    setCollaboratorStatus(providerSaveErrorMessage(error));
    return;
  }

  setCollaboratorStatus("Proveedor guardado.");
  resetCollaboratorForm();
  await Promise.all([refreshCollaboratorModule(), loadWorkspace()]);
});

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !canManageEvents()) return;

  const eventId = Number(assignmentEvent.value);
  const collaboratorIdValue = Number(assignmentCollaborator.value);

  if (!eventId || !collaboratorIdValue) {
    setAssignmentStatus("Selecciona evento y proveedor.");
    return;
  }

  setAssignmentStatus("Guardando asignacion...");

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
  setAssignmentStatus("Asignacion guardada.");
  await loadAssignments();
});

adminBeoflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const prompt = adminBeoflowPrompt.value.trim();
  if (!prompt) {
    beoflowResult.textContent = "Escribe una instruccion para BEOFlow.";
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
  await Promise.all([loadEvents(), loadCustomers(), refreshCollaboratorModule(), loadWorkspace()]);
});

async function updateCollaboratorStatus(id, status) {
  if (!supabase) return;

  if (!canManageCollaborators()) {
    setCollaboratorStatus("No tienes permisos para administrar proveedores.");
    return;
  }

  const { error } = await supabase
    .from("cater_collaborators")
    .update({ status })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", Number(id));

  if (error) {
    setCollaboratorStatus(error.message);
    return;
  }

  setCollaboratorStatus(status === "active" ? "Proveedor activado." : "Proveedor desactivado.");
  await refreshCollaboratorModule();
}

refreshWorkspaceButton.addEventListener("click", loadWorkspace);
refreshEventsButton.addEventListener("click", () => {
  loadEvents().then(loadAssignments);
});

refreshRequestsButton.addEventListener("click", () => {
  Promise.all([loadUserRequests(), loadCustomers()]);
});

refreshCollaboratorsButton.addEventListener("click", refreshCollaboratorModule);
resetCollaboratorButton.addEventListener("click", resetCollaboratorForm);

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.scrollTarget);
    if (!target) return;
    target.classList.add("is-pulsing");
    window.setTimeout(() => target.classList.remove("is-pulsing"), 700);
    keepDashboardPinned();
  });
});

document.querySelectorAll(".sidebar-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".sidebar-link").forEach((item) => item.classList.remove("is-active"));
    link.classList.add("is-active");
    keepDashboardPinned();
  });
});

window.addEventListener("hashchange", keepDashboardPinned);

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

renderAnalytics();
adminBootPromise = bootAdmin().catch((error) => {
  setSessionStatus(error.message);
  return false;
});
