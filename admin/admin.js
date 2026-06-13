import {
  getCurrentProfile,
  isSupabaseConfigured,
  requireSupabase,
  subscribeToEvents,
} from "../lib/supabaseClient.js";

const sessionStatus = document.querySelector("#sessionStatus");
const signoutButton = document.querySelector("#signoutButton");
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

let supabase = null;
let currentUser = null;
let currentProfile = null;
let selectedEvent = null;
let eventsChannel = null;

function setSessionStatus(message) {
  sessionStatus.textContent = message;
}

function setEventStatus(message) {
  eventFormStatus.textContent = message;
}

function canManageEvents() {
  return ["admin", "staff"].includes(currentProfile?.role);
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

function renderEvents(rows = []) {
  if (!rows.length) {
    eventsList.innerHTML = "<p>No hay eventos visibles todavía.</p>";
    return;
  }

  eventsList.innerHTML = rows
    .map((event) => {
      const services = Array.isArray(event.services) && event.services.length
        ? event.services.join(", ")
        : "Sin servicios";
      const selectedClass = selectedEvent?.id === event.id ? " is-selected" : "";

      return `
        <article class="event-row${selectedClass}">
          <button type="button" data-event-id="${event.id}">
            <strong>${event.title || "Evento sin nombre"}</strong>
            <span class="event-meta">
              #${event.id} · ${event.event_type || "Sin tipo"} · ${event.status || "draft"} · ${event.budget_label || "Sin presupuesto"}
            </span>
            <span class="event-meta">${services}</span>
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
    });
  });
}

async function loadEvents() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("cater_events")
    .select(
      "id,title,event_type,status,budget,budget_label,menu_style,services,plan,event_date,guest_count,updated_at,created_at"
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    eventsList.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  renderEvents(data || []);
}

async function bootAdmin() {
  if (!isSupabaseConfigured) {
    setSessionStatus("Configura Supabase en lib/supabaseClient.js para usar el admin.");
    return;
  }

  supabase = requireSupabase();
  const { user, profile } = await getCurrentProfile();
  currentUser = user;
  currentProfile = profile;

  if (!currentUser) {
    window.location.href = "../login.html";
    return;
  }

  if (!currentProfile) {
    setSessionStatus("Tu usuario no tiene cater_profile. Ejecuta supabase/schema.sql o crea el perfil.");
    return;
  }

  if (!["admin", "staff", "client"].includes(currentProfile.role)) {
    setSessionStatus("Rol no reconocido. Revisa public.cater_profiles.role.");
    return;
  }

  setSessionStatus(`${currentUser.email} · rol ${currentProfile.role}`);
  eventForm.hidden = !canManageEvents();

  await loadEvents();

  eventsChannel = subscribeToEvents(() => {
    loadEvents();
  });
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

  const { error } = await supabase.from("cater_events").insert({
    title: eventTitle.value.trim(),
    event_type: eventType.value,
    budget_label: budgetLabel,
    status: "draft",
    event_date: eventDate.value || null,
    guest_count: guestCount.value ? Number(guestCount.value) : null,
    created_by: currentUser.id,
    plan,
  });

  if (error) {
    setEventStatus(error.message);
    return;
  }

  eventForm.reset();
  setEventStatus("Evento creado.");
  await loadEvents();
});

adminBeoflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;

  const prompt = adminBeoflowPrompt.value.trim();
  if (!selectedEvent || !prompt) {
    beoflowResult.textContent = "Selecciona un evento y escribe una instrucción.";
    return;
  }

  beoflowResult.textContent = "BEOFlow procesando...";

  const { data, error } = await supabase.functions.invoke("beoflow", {
    body: {
      message: prompt,
      eventId: selectedEvent.id,
      currentPlan: eventPlanFromRow(selectedEvent),
    },
  });

  if (error) {
    beoflowResult.textContent = error.message;
    return;
  }

  beoflowResult.textContent = JSON.stringify(data, null, 2);
  await loadEvents();
});

refreshEventsButton.addEventListener("click", loadEvents);

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
