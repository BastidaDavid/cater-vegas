const stageOrder = ["event", "guests", "style", "services", "summary", "proposal"];

const eventState = {
  eventType: null,
  guests: null,
  style: null,
  services: [],
  date: null,
  location: null,
  budget: null,
  estimatedTotal: 0
};

const stages = [
  {
    id: "event",
    question: "¿Qué estás organizando?",
    helperText: "Explora las opciones y construyamos tu evento perfecto.",
    remainingCount: "200+",
    options: [
      { id: "wedding", label: "Boda", icon: "∞", note: "Elegante", theme: "wedding", value: "wedding" },
      { id: "birthday", label: "Cumpleaños", icon: "✦", note: "Lujo social", theme: "birthday", value: "birthday" },
      { id: "corporate", label: "Corporativo", icon: "□", note: "Ejecutivo", theme: "corporate", value: "corporate" },
      { id: "baby-shower", label: "Baby Shower", icon: "◇", note: "Suave", theme: "baby", value: "baby-shower" },
      { id: "anniversary", label: "Aniversario", icon: "◎", note: "Íntimo", theme: "anniversary", value: "anniversary" },
      { id: "graduation", label: "Graduación", icon: "△", note: "Celebración", theme: "graduation", value: "graduation" },
      { id: "farewell", label: "Despedida", icon: "♪", note: "Fiesta", theme: "party", value: "farewell" },
      { id: "private-party", label: "Fiesta privada", icon: "◆", note: "VIP", theme: "private", value: "private-party" },
      { id: "other", label: "Otro evento", icon: "+", note: "Personal", theme: "default", value: "other" }
    ]
  },
  {
    id: "guests",
    question: "¿Cuántos invitados esperas?",
    helperText: "El tamaño del evento ajusta logística, cocina, equipo y producción.",
    remainingCount: "150",
    options: [
      { id: "under-50", label: "50 o menos", icon: "●", note: "Íntimo", min: 35, max: 50, value: 50 },
      { id: "51-100", label: "51 - 100", icon: "●", note: "Social", min: 51, max: 100, value: 85 },
      { id: "101-150", label: "101 - 150", icon: "●", note: "Premium", min: 101, max: 150, value: 125 },
      { id: "151-200", label: "151 - 200", icon: "●", note: "Producción", min: 151, max: 200, value: 180 },
      { id: "200-plus", label: "200+", icon: "●", note: "Gran escala", min: 200, max: 300, value: 225 }
    ]
  },
  {
    id: "style",
    question: "¿Qué estilo de experiencia buscas?",
    helperText: "Selecciona el nivel de hospitalidad que debe sentirse en tu evento.",
    remainingCount: "95",
    options: [
      { id: "essential", label: "Esencial", icon: "◇", note: "Cuidado y limpio", multiplier: 0.92, budget: "$2K - $5K" },
      { id: "premium", label: "Premium", icon: "◆", note: "Más solicitado", multiplier: 1.15, budget: "$5K - $10K" },
      { id: "luxury", label: "Luxury", icon: "✦", note: "Alta producción", multiplier: 1.5, budget: "$10K - $25K+" },
      { id: "custom", label: "Personalizado", icon: "+", note: "A medida", multiplier: 1.32, budget: "Por definir" }
    ]
  },
  {
    id: "services",
    question: "¿Qué servicios te gustaría incluir?",
    helperText: "Puedes elegir varios. BEOFlow reducirá la propuesta a una experiencia clara.",
    remainingCount: "45",
    multi: true,
    options: [
      { id: "catering", label: "Catering", icon: "◒", note: "+ menú", price: 0 },
      { id: "premium-bar", label: "Barra Premium", icon: "◧", note: "+ mixología", price: 1800 },
      { id: "decor", label: "Decoración", icon: "✦", note: "+ ambiente", price: 2200 },
      { id: "music", label: "Música y DJ", icon: "♪", note: "+ energía", price: 1600 },
      { id: "photo", label: "Fotografía", icon: "□", note: "+ memoria", price: 1400 },
      { id: "coordination", label: "Coordinación", icon: "◎", note: "+ control", price: 2500 },
      { id: "transport", label: "Transporte", icon: "△", note: "+ movilidad", price: 1200 },
      { id: "hotel", label: "Hospedaje", icon: "◇", note: "+ concierge", price: 3200 }
    ]
  },
  {
    id: "summary",
    question: "Tu resumen está tomando forma.",
    helperText: "Revisa lo seleccionado y avanza a una propuesta visual con depósito sugerido.",
    remainingCount: "12",
    options: [
      { id: "view-proposal", label: "Ver propuesta", icon: "→", note: "Siguiente paso" }
    ]
  },
  {
    id: "proposal",
    question: "Tu propuesta está lista.",
    helperText: "Este es un estimado local. El pago real se conectará cuando exista integración aprobada.",
    remainingCount: "1 propuesta",
    options: [
      { id: "reserve", label: "Reservar ahora", icon: "✓", note: "Solicitar fecha" },
      { id: "pay", label: "Realizar pago", icon: "$", note: "Próximamente", disabled: true }
    ]
  }
];

const orbThemes = {
  default: "radial-gradient(circle at 48% 28%, #f7dfaa, #76552f 38%, #15100d 100%)",
  wedding: "radial-gradient(circle at 46% 30%, #fff1d0, #c6a16b 34%, #342114 64%, #090705 100%)",
  birthday: "radial-gradient(circle at 48% 26%, #ffd27a, #a04724 42%, #150806 100%)",
  corporate: "radial-gradient(circle at 52% 28%, #8dc6ff, #1c4f88 42%, #07101c 100%)",
  baby: "radial-gradient(circle at 48% 28%, #ffe1ec, #b9849a 45%, #1d1113 100%)",
  anniversary: "radial-gradient(circle at 48% 28%, #f5d08c, #7a3726 44%, #100706 100%)",
  graduation: "radial-gradient(circle at 48% 24%, #eeeeee, #454854 46%, #08080b 100%)",
  party: "radial-gradient(circle at 45% 24%, #f5c067, #6d1c5a 42%, #0b0610 100%)",
  private: "radial-gradient(circle at 48% 25%, #f1c86d, #2d4b6e 46%, #050608 100%)"
};

let currentStageIndex = 0;
let resizeTimer;

function getElement(id) {
  return document.getElementById(id);
}

function currentStage() {
  return stages[currentStageIndex];
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function selectedOption(stageId) {
  const stage = stages.find((item) => item.id === stageId);
  if (!stage) return null;

  if (stageId === "event") return stage.options.find((option) => option.id === eventState.eventType);
  if (stageId === "guests") return stage.options.find((option) => option.id === eventState.guests);
  if (stageId === "style") return stage.options.find((option) => option.id === eventState.style);
  return null;
}

function selectedServices() {
  const serviceStage = stages.find((stage) => stage.id === "services");
  return serviceStage.options.filter((option) => eventState.services.includes(option.id));
}

function calculateEstimate() {
  const guests = selectedOption("guests");
  const style = selectedOption("style");
  const guestCount = guests?.value || 0;
  const base = guestCount ? guestCount * 78 : 0;
  const styleMultiplier = style?.multiplier || 1;
  const servicesTotal = selectedServices().reduce((sum, service) => sum + service.price, 0);
  const eventPremium = eventState.eventType === "wedding" ? 1800 : eventState.eventType === "corporate" ? 1200 : 0;

  eventState.estimatedTotal = Math.round((base * styleMultiplier) + servicesTotal + eventPremium);
  return eventState.estimatedTotal;
}

function syncLegacyFields() {
  const eventOption = selectedOption("event");
  const guestOption = selectedOption("guests");
  const styleOption = selectedOption("style");
  const services = selectedServices();
  const primaryService = services[0];

  getElement("eventType").value = eventOption?.value || "";
  getElement("guestCount").value = guestOption?.value || 0;
  getElement("menuStyle").value = styleOption?.id || "";
  getElement("budgetTier").value = styleOption?.id || "";
  getElement("serviceLevel").value = primaryService?.id === "catering" ? "delivery" : services.length ? "full" : "";
  getElement("addonPackage").value = services.some((service) => service.id === "premium-bar")
    ? "bar"
    : services.length > 3
      ? "production"
      : services.length
        ? "standard"
        : "";

  getElement("planBudget").textContent = styleOption?.budget || "Pendiente";
  getElement("planEvent").textContent = eventOption ? `${eventOption.label}${guestOption ? ` · ${guestOption.label}` : ""}` : "Pendiente";
  getElement("planMenu").textContent = styleOption?.label || "Pendiente";
  getElement("planServices").textContent = services.length ? services.map((service) => service.label).join(", ") : "Pendiente";
  getElement("menuRecommendation").textContent = styleOption?.label || "Pendiente";
  getElement("quoteTotal").textContent = formatMoney(eventState.estimatedTotal);
  getElement("depositDue").textContent = formatMoney(eventState.estimatedTotal * 0.3);
  getElement("profitMargin").textContent = "Estimado local";
  getElement("beoflowForecast").textContent = "Estimado local sin integraciones externas ni pago real.";
}

function updateSummary() {
  calculateEstimate();

  const eventOption = selectedOption("event");
  const guestOption = selectedOption("guests");
  const styleOption = selectedOption("style");
  const services = selectedServices();
  const total = eventState.estimatedTotal;

  getElement("cv-summary-event").textContent = eventOption?.label || "Pendiente";
  getElement("cv-summary-guests").textContent = guestOption?.label || "Pendiente";
  getElement("cv-summary-style").textContent = styleOption?.label || "Pendiente";
  getElement("cv-summary-date").textContent = eventState.date || "Por definir";
  getElement("cv-summary-location").textContent = eventState.location || "Por definir";
  getElement("cv-summary-budget").textContent = styleOption?.budget || eventState.budget || "Por definir";
  getElement("cv-summary-services").textContent = services.length ? services.map((service) => service.label).join(", ") : "Pendiente";
  getElement("cv-estimated-total").textContent = total ? formatMoney(total) : "$0";
  getElement("cv-orb-estimate").textContent = total ? `Estimado actual: ${formatMoney(total)}` : "Estimado actual: pendiente";

  syncLegacyFields();
}

function updateOrb() {
  const eventOption = selectedOption("event");
  const stage = currentStage();
  const title = eventOption?.label || "Evento inolvidable";
  const theme = eventOption?.theme || "default";

  getElement("cv-orb").style.setProperty("--cv-orb-scene", orbThemes[theme] || orbThemes.default);
  getElement("cv-orb-label").textContent = stage.id === "proposal" ? "Propuesta Cater Vegas" : "BEOFlow";
  getElement("cv-orb-title").textContent = stage.id === "proposal" ? "Lista para reservar" : title;
}

function nodePosition(index, total) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
  const field = getElement("cv-orb-field");
  const width = field?.clientWidth || 850;
  const height = field?.clientHeight || 520;
  const nodeGuard = Math.min(74, Math.max(48, Math.min(width, height) * 0.16));
  const compactMultiplier = total <= 4 ? 0.8 : 1;
  const radiusX = Math.max(110, ((width / 2) - nodeGuard) * compactMultiplier);
  const radiusY = Math.max(92, ((height / 2) - nodeGuard) * compactMultiplier);

  return {
    x: Math.round(Math.cos(angle) * radiusX),
    y: Math.round(Math.sin(angle) * radiusY)
  };
}

function isOptionSelected(stage, option) {
  if (stage.id === "event") return eventState.eventType === option.id;
  if (stage.id === "guests") return eventState.guests === option.id;
  if (stage.id === "style") return eventState.style === option.id;
  if (stage.id === "services") return eventState.services.includes(option.id);
  return false;
}

function renderNodes() {
  const stage = currentStage();
  const layer = getElement("cv-node-layer");
  layer.innerHTML = "";

  stage.options.forEach((option, index) => {
    const position = nodePosition(index, stage.options.length);
    const node = document.createElement("button");
    node.className = "cv-node";
    node.type = "button";
    node.style.setProperty("--node-x", `${position.x}px`);
    node.style.setProperty("--node-y", `${position.y}px`);
    node.dataset.optionId = option.id;
    node.disabled = Boolean(option.disabled);
    node.classList.toggle("is-selected", isOptionSelected(stage, option));

    node.innerHTML = `
      ${option.badge || option.id === "pay" ? `<span class="cv-node-badge">${option.id === "pay" ? "TODO" : option.badge}</span>` : ""}
      <span class="cv-node-icon" aria-hidden="true">${option.icon}</span>
      <strong>${option.label}</strong>
      <small>${stage.multi ? "Toca para incluir" : option.note || "Seleccionar"}</small>
    `;

    node.addEventListener("click", () => selectOption(stage.id, option));
    layer.appendChild(node);
  });
}

function updateStageText() {
  const stage = currentStage();
  getElement("cv-stage-question").textContent = stage.question;
  getElement("cv-stage-helper").textContent = stage.helperText;
  getElement("cv-remaining-count").textContent = stage.remainingCount;
  getElement("cv-back-button").disabled = currentStageIndex === 0;
  getElement("cv-services-continue").hidden = stage.id !== "services";
  getElement("cv-summary-action").hidden = !["summary", "proposal"].includes(stage.id);
  getElement("cv-summary-action").textContent = stage.id === "proposal" ? "Reservar ahora" : "Ver propuesta";
}

function updateTimeline() {
  document.querySelectorAll("[data-stage-target]").forEach((button) => {
    const index = stageOrder.indexOf(button.dataset.stageTarget);
    button.classList.toggle("is-active", index === currentStageIndex);
    button.classList.toggle("is-complete", index > -1 && index < currentStageIndex);
  });
}

function renderStage() {
  updateStageText();
  updateTimeline();
  updateOrb();
  renderNodes();
  updateSummary();
}

function goToStage(stageId) {
  const index = stageOrder.indexOf(stageId);
  if (index < 0) return;
  currentStageIndex = index;
  renderStage();
}

function goToNextStage() {
  currentStageIndex = Math.min(stages.length - 1, currentStageIndex + 1);
  renderStage();
}

function goBack() {
  currentStageIndex = Math.max(0, currentStageIndex - 1);
  renderStage();
}

function selectOption(stageId, option) {
  if (option.disabled) return;

  if (stageId === "event") {
    eventState.eventType = option.id;
    renderStage();
    setTimeout(goToNextStage, 260);
    return;
  }

  if (stageId === "guests") {
    eventState.guests = option.id;
    renderStage();
    setTimeout(goToNextStage, 260);
    return;
  }

  if (stageId === "style") {
    eventState.style = option.id;
    eventState.budget = option.budget;
    renderStage();
    setTimeout(goToNextStage, 260);
    return;
  }

  if (stageId === "services") {
    if (eventState.services.includes(option.id)) {
      eventState.services = eventState.services.filter((serviceId) => serviceId !== option.id);
    } else {
      eventState.services = [...eventState.services, option.id];
    }
    renderStage();
    return;
  }

  if (stageId === "summary") {
    goToStage("proposal");
  }
}

function resetFlow() {
  eventState.eventType = null;
  eventState.guests = null;
  eventState.style = null;
  eventState.services = [];
  eventState.date = null;
  eventState.location = null;
  eventState.budget = null;
  eventState.estimatedTotal = 0;
  currentStageIndex = 0;
  renderStage();
}

function initGalaxy() {
  getElement("cv-back-button").addEventListener("click", goBack);
  getElement("cv-reset-button").addEventListener("click", resetFlow);
  getElement("cv-services-continue").addEventListener("click", goToNextStage);
  getElement("cv-summary-action").addEventListener("click", () => {
    if (currentStage().id === "summary") {
      goToStage("proposal");
      return;
    }
    getElement("quoteForm").requestSubmit();
  });
  getElement("cv-summary-detail").addEventListener("click", () => goToStage("summary"));

  document.querySelectorAll("[data-stage-target]").forEach((button) => {
    button.addEventListener("click", () => goToStage(button.dataset.stageTarget));
  });

  document.querySelectorAll("[data-inspiration]").forEach((button) => {
    button.addEventListener("click", () => {
      eventState.eventType = button.dataset.inspiration;
      goToStage("guests");
    });
  });

  getElement("quoteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const action = getElement("cv-summary-action");
    const original = action.textContent;
    action.textContent = "Solicitud lista";
    setTimeout(() => {
      action.textContent = original;
    }, 1600);
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(renderStage, 120);
  });

  renderStage();
}

initGalaxy();
