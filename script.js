import {
  DEFAULT_WORKSPACE_ID,
  isSupabaseConfigured,
  requireSupabase,
  subscribeToEvents,
} from "./lib/supabaseClient.js?v=save-debug-20260618";

const WORKSPACE_ID = DEFAULT_WORKSPACE_ID;
const supabase = isSupabaseConfigured ? requireSupabase() : null;
const hero = document.querySelector(".hero");
const panels = document.querySelectorAll("[data-panel]");
const generateButton = document.querySelector("#generateButton");
const budgetCards = [...document.querySelectorAll(".budget-card")];
const budgetInsight = document.querySelector("#budgetInsight");
const budgetContinue = document.querySelector("#budgetContinue");
const eventCards = [...document.querySelectorAll(".event-card")];
const eventDescription = document.querySelector("#eventDescription");
const eventInsight = document.querySelector("#eventInsight");
const eventContinue = document.querySelector("#eventContinue");
const carouselButtons = document.querySelectorAll("[data-carousel]");
const summaryBudget = document.querySelector("#summaryBudget");
const summaryEvent = document.querySelector("#summaryEvent");
const summaryMenu = document.querySelector("#summaryMenu");
const summaryServices = document.querySelector("#summaryServices");
const editButtons = document.querySelectorAll("[data-edit-step]");
const progressSteps = document.querySelectorAll("[data-progress-step]");
const planSummary = document.querySelector(".plan-summary");
const beoflowPromptForm = document.querySelector("#beoflowPromptForm");
const beoflowPrompt = document.querySelector("#beoflowPrompt");
const beoflowStatus = document.querySelector("#beoflowStatus");

const caterPlan = {
  budget: "5k-10k",
  budgetLabel: "$5K - $10K",
  eventType: "Boda",
  menuStyle: null,
  services: [],
};

const budgets = [
  {
    value: "2k-5k",
    label: "$2K - $5K",
    insight: "BEOFlow priorizará proveedores esenciales y una logística compacta.",
    eventInsight: "Con este rango conviene crear un evento íntimo, eficiente y bien producido.",
  },
  {
    value: "5k-10k",
    label: "$5K - $10K",
    insight: "BEOFlow priorizará catering premium y proveedores flexibles para eventos medianos.",
    eventInsight: "Con este presupuesto podemos balancear experiencia, catering y servicios clave.",
  },
  {
    value: "10k-25k",
    label: "$10K - $25K",
    insight: "BEOFlow abrirá opciones completas con transporte, staff y hospedaje sugerido.",
    eventInsight: "Este rango permite diseñar una experiencia completa con logística más robusta.",
  },
  {
    value: "25k-plus",
    label: "$25K+",
    insight: "BEOFlow buscará proveedores luxury, concierge y coordinación integral.",
    eventInsight: "Con este presupuesto podemos pensar en una experiencia VIP de alto nivel.",
  },
];

const events = [
  {
    name: "Boda",
    description: "Bodas privadas, cenas elegantes y experiencias completas.",
  },
  {
    name: "Corporativo",
    description: "Reuniones ejecutivas, lanzamientos y eventos empresariales.",
  },
  {
    name: "VIP",
    description: "Experiencias exclusivas con catering, transporte y hospedaje.",
  },
];

let selectedEvent = 0;
let selectedBudget = 1;
let loadingTimer;
let dragState = null;
let eventsRealtimeChannel = null;

function showPanel(name) {
  hero.dataset.screen = name;

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });

  progressSteps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.progressStep === name);
  });
}

function updateSummary() {
  summaryBudget.textContent = caterPlan.budgetLabel || "Pendiente";
  summaryEvent.textContent = caterPlan.eventType || "Pendiente";
  summaryMenu.textContent = caterPlan.menuStyle || "Pendiente";
  summaryServices.textContent = caterPlan.services.length
    ? caterPlan.services.join(", ")
    : "Pendiente";
}

function addService(service) {
  if (!caterPlan.services.includes(service)) {
    caterPlan.services.push(service);
  }
}

function applyBeoflowPrompt(prompt) {
  const text = prompt.toLowerCase();
  let changed = false;

  if (text.includes("boda")) {
    updateEvent(events.findIndex((event) => event.name === "Boda"));
    changed = true;
  }

  if (text.includes("corporativo") || text.includes("empresa")) {
    updateEvent(events.findIndex((event) => event.name === "Corporativo"));
    changed = true;
  }

  if (text.includes("vip") || text.includes("lujo") || text.includes("luxury")) {
    updateEvent(events.findIndex((event) => event.name === "VIP"));
    changed = true;
  }

  if (text.includes("transporte") || text.includes("chofer") || text.includes("shuttle")) {
    addService("Transporte");
    changed = true;
  }

  if (text.includes("hotel") || text.includes("hospedaje") || text.includes("habitaciones")) {
    addService("Hospedaje");
    changed = true;
  }

  if (text.includes("staff") || text.includes("meseros")) {
    addService("Staff");
    changed = true;
  }

  if (text.includes("decoración") || text.includes("decoracion")) {
    addService("Decoración");
    changed = true;
  }

  updateSummary();
  return {
    reply: changed ? "BEOFlow ajustó el plan con lo que escribiste." : "Idea guardada para BEOFlow.",
    updates: { ...caterPlan },
    source: "local",
  };
}

function mergeBeoflowUpdates(updates = {}) {
  if (updates.budget) caterPlan.budget = updates.budget;
  if (updates.budgetLabel) caterPlan.budgetLabel = updates.budgetLabel;
  if (updates.eventType) {
    const eventIndex = events.findIndex((event) => event.name === updates.eventType);
    if (eventIndex >= 0) updateEvent(eventIndex);
    else caterPlan.eventType = updates.eventType;
  }
  if (updates.menuStyle) caterPlan.menuStyle = updates.menuStyle;
  if (Array.isArray(updates.services)) {
    caterPlan.services = [...new Set(updates.services.filter(Boolean))];
  }

  updateSummary();
}

async function sendToBeoflowAI(prompt) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke("beoflow", {
    body: {
      message: prompt,
      currentPlan: { ...caterPlan },
      workspaceId: WORKSPACE_ID,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

function syncPlanFromRealtime(payload) {
  const nextEvent = payload.new;
  if (!nextEvent || !nextEvent.plan) return;

  mergeBeoflowUpdates({
    budget: nextEvent.budget,
    budgetLabel: nextEvent.budget_label,
    eventType: nextEvent.event_type,
    menuStyle: nextEvent.menu_style,
    services: nextEvent.services,
    ...nextEvent.plan,
  });

  if (beoflowStatus) {
    beoflowStatus.textContent = "Plan sincronizado desde Supabase.";
  }
}

function initEventsRealtime() {
  if (!supabase) return;

  try {
    eventsRealtimeChannel = subscribeToEvents(syncPlanFromRealtime, {
      channelName: "cater-vegas-home-events",
      workspaceId: WORKSPACE_ID,
    });
  } catch (error) {
    console.warn("Supabase Realtime unavailable", error);
  }
}

function movePlanSummary(clientX, clientY) {
  if (!dragState) return;

  const nextLeft = clientX - dragState.offsetX;
  const nextTop = clientY - dragState.offsetY;
  const maxLeft = window.innerWidth - dragState.width - 12;
  const maxTop = window.innerHeight - dragState.height - 12;
  const left = Math.min(Math.max(12, nextLeft), maxLeft);
  const top = Math.min(Math.max(12, nextTop), maxTop);

  planSummary.style.left = `${left}px`;
  planSummary.style.top = `${top}px`;
  planSummary.style.right = "auto";
  planSummary.style.bottom = "auto";
  planSummary.style.transform = "none";
}

function updateEvent(index) {
  selectedEvent = (index + events.length) % events.length;
  const selected = events[selectedEvent];
  caterPlan.eventType = selected.name;

  eventCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.event === selected.name);
  });

  eventDescription.textContent = selected.description;
  updateSummary();
}

function updateBudget(index) {
  selectedBudget = (index + budgets.length) % budgets.length;
  const selected = budgets[selectedBudget];
  caterPlan.budget = selected.value;
  caterPlan.budgetLabel = selected.label;

  budgetCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.budget === selected.value);
  });

  budgetInsight.textContent = selected.insight;
  eventInsight.textContent = selected.eventInsight;
  updateSummary();
}

generateButton.addEventListener("click", () => {
  window.clearTimeout(loadingTimer);
  showPanel("loading");

  loadingTimer = window.setTimeout(() => {
    showPanel("budget");
  }, 1800);
});

budgetCards.forEach((card, index) => {
  card.addEventListener("click", () => updateBudget(index));
});

budgetContinue.addEventListener("click", () => {
  showPanel("event");
});

eventCards.forEach((card, index) => {
  card.addEventListener("click", () => updateEvent(index));
});

carouselButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.carousel === "next" ? 1 : -1;
    updateEvent(selectedEvent + direction);
  });
});

editButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.editStep);
  });
});

planSummary.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, textarea, input, label")) return;

  const rect = planSummary.getBoundingClientRect();
  dragState = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
  };

  planSummary.classList.add("is-dragging");
  planSummary.setPointerCapture(event.pointerId);
  movePlanSummary(event.clientX, event.clientY);
});

planSummary.addEventListener("pointermove", (event) => {
  movePlanSummary(event.clientX, event.clientY);
});

planSummary.addEventListener("pointerup", (event) => {
  dragState = null;
  planSummary.classList.remove("is-dragging");
  planSummary.releasePointerCapture(event.pointerId);
});

planSummary.addEventListener("pointercancel", () => {
  dragState = null;
  planSummary.classList.remove("is-dragging");
});

beoflowPromptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = beoflowPrompt.value.trim();

  if (!prompt) {
    beoflowStatus.textContent = "Escribe una idea primero.";
    return;
  }

  beoflowStatus.textContent = "BEOFlow ajustando...";

  sendToBeoflowAI(prompt)
    .then((result) => {
      mergeBeoflowUpdates(result.updates);
      beoflowStatus.textContent = result.reply || "Plan actualizado.";
    })
    .catch(() => {
      const result = applyBeoflowPrompt(prompt);
      beoflowStatus.textContent = result.reply;
    });
});

eventContinue.addEventListener("click", () => {
  console.log("Cater plan", caterPlan);
});

window.addEventListener("beforeunload", () => {
  if (eventsRealtimeChannel && supabase) {
    supabase.removeChannel(eventsRealtimeChannel);
  }
});

updateBudget(selectedBudget);
updateEvent(selectedEvent);
updateSummary();
initEventsRealtime();
