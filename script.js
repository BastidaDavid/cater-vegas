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

const planningCategoryOptions = [
  { id: "hub-guests", label: "Invitados", icon: "☷", note: "6 opciones", badge: "200+", kind: "planning-hub", targetStage: "guests" },
  { id: "hub-location", label: "Lugar", icon: "⌖", note: "15 opciones", badge: "15", kind: "planning-hub", targetStage: "summary" },
  { id: "hub-services", label: "Servicios", icon: "◒", note: "18 opciones", badge: "18", kind: "planning-hub", targetStage: "services" },
  { id: "hub-food", label: "Gastronomía", icon: "◠", note: "24 opciones", badge: "24", kind: "planning-hub", targetStage: "style" },
  { id: "hub-drinks", label: "Bebidas", icon: "◧", note: "12 opciones", badge: "12", kind: "planning-hub", targetStage: "services" },
  { id: "hub-decor", label: "Decoración", icon: "✿", note: "22 opciones", badge: "22", kind: "planning-hub", targetStage: "services" },
  { id: "hub-entertainment", label: "Entretenimiento", icon: "♪", note: "14 opciones", badge: "14", kind: "planning-hub", targetStage: "services" },
  { id: "hub-style", label: "Estilo", icon: "◇", note: "6 opciones", badge: "6", kind: "planning-hub", targetStage: "style" }
];

const stages = [
  {
    id: "event",
    question: "¿Qué estás organizando?",
    helperText: "Explora las opciones y construyamos tu evento perfecto.",
    remainingCount: "200+",
    options: [
      { id: "wedding", label: "Boda", icon: "∞", note: "Elegante", theme: "wedding", value: "wedding", badge: "24" },
      { id: "birthday", label: "Cumpleaños", icon: "✦", note: "Lujo social", theme: "birthday", value: "birthday", badge: "18" },
      { id: "corporate", label: "Corporativo", icon: "□", note: "Ejecutivo", theme: "corporate", value: "corporate", badge: "21" },
      { id: "baby-shower", label: "Baby Shower", icon: "◇", note: "Suave", theme: "baby", value: "baby-shower", badge: "12" },
      { id: "anniversary", label: "Aniversario", icon: "◎", note: "Íntimo", theme: "anniversary", value: "anniversary", badge: "14" },
      { id: "graduation", label: "Graduación", icon: "△", note: "Celebración", theme: "graduation", value: "graduation", badge: "16" },
      { id: "farewell", label: "Despedida", icon: "♪", note: "Fiesta", theme: "party", value: "farewell", badge: "10" },
      { id: "private-party", label: "Fiesta privada", icon: "◆", note: "VIP", theme: "private", value: "private-party", badge: "22" },
      { id: "other", label: "Otro evento", icon: "+", note: "Personal", theme: "default", value: "other", badge: "∞" }
    ]
  },
  {
    id: "guests",
    question: "¿Cuántos invitados esperas?",
    helperText: "El tamaño del evento ajusta logística, cocina, equipo y producción.",
    remainingCount: "156",
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
    remainingCount: "84",
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
    helperText: "Puedes elegir varios. La propuesta se reducirá a una experiencia clara.",
    remainingCount: "32",
    multi: true,
    options: [
      { id: "catering", label: "Catering", icon: "◒", note: "+ menú", price: 0, badge: "Base" },
      { id: "premium-bar", label: "Barra Premium", icon: "◧", note: "+ mixología", price: 1800, badge: "+1" },
      { id: "decor", label: "Decoración", icon: "✦", note: "+ ambiente", price: 2200, badge: "+2" },
      { id: "music", label: "Música y DJ", icon: "♪", note: "+ energía", price: 1600, badge: "+3" },
      { id: "photo", label: "Fotografía", icon: "□", note: "+ memoria", price: 1400, badge: "+4" },
      { id: "coordination", label: "Coordinación", icon: "◎", note: "+ control", price: 2500, badge: "+5" },
      { id: "transport", label: "Transporte", icon: "△", note: "+ movilidad", price: 1200, badge: "+6" },
      { id: "hotel", label: "Hospedaje", icon: "◇", note: "+ concierge", price: 3200, badge: "+7" }
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
  default: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.6)), url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  wedding: "linear-gradient(180deg, rgba(4, 4, 4, 0.04), rgba(2, 2, 2, 0.62)), url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  birthday: "linear-gradient(180deg, rgba(4, 4, 4, 0.04), rgba(2, 2, 2, 0.62)), url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  corporate: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  baby: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  anniversary: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  graduation: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  party: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat",
  private: "linear-gradient(180deg, rgba(4, 4, 4, 0.08), rgba(2, 2, 2, 0.66)), url('https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80') center / cover no-repeat"
};

let currentStageIndex = 0;
let resizeTimer;
let showingPlanningHub = false;
let thinkingTimer;
let remainingCountFrame;
let progressFrame;
let lastOrbTitle = "";
let parallaxFrame;

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
  const eventPremium = guestCount
    ? eventState.eventType === "wedding"
      ? 1800
      : eventState.eventType === "corporate"
        ? 1200
        : 0
    : 0;

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

function setSummaryValue(id, value) {
  const element = getElement(id);
  const nextValue = value || "-";
  if (element.textContent === nextValue) return;

  element.textContent = nextValue;
  const row = element.closest("div");
  if (!row) return;

  row.classList.remove("is-updated");
  window.requestAnimationFrame(() => {
    row.classList.add("is-updated");
    window.setTimeout(() => row.classList.remove("is-updated"), 720);
  });
}

function updateSummary() {
  calculateEstimate();

  const eventOption = selectedOption("event");
  const guestOption = selectedOption("guests");
  const styleOption = selectedOption("style");
  const services = selectedServices();
  const total = eventState.estimatedTotal;

  setSummaryValue("cv-summary-event", eventOption?.label || "-");
  setSummaryValue("cv-summary-guests", guestOption?.label || "-");
  setSummaryValue("cv-summary-style", styleOption?.label || "-");
  setSummaryValue("cv-summary-date", eventState.date || "-");
  setSummaryValue("cv-summary-location", eventState.location || "-");
  setSummaryValue("cv-summary-budget", styleOption?.budget || eventState.budget || "-");
  setSummaryValue("cv-summary-services", services.length ? services.map((service) => service.label).join(", ") : "-");
  getElement("cv-estimated-total").textContent = total ? formatMoney(total) : "$0";
  getElement("cv-orb-estimate").textContent = total ? `Estimado actual: ${formatMoney(total)}` : "Toca para seleccionar";

  syncLegacyFields();
}

function updateOrb() {
  const eventOption = selectedOption("event");
  const stage = currentStage();
  const title = eventOption?.label || "Evento inolvidable";
  const theme = eventOption?.theme || "default";
  const orb = getElement("cv-orb");

  orb.dataset.orbTheme = theme;
  orb.style.setProperty("--cv-orb-scene", orbThemes[theme] || orbThemes.default);
  getElement("cv-orb-label").textContent = stage.id === "proposal" ? "Propuesta Cater Vegas" : "";
  const titleElement = getElement("cv-orb-title");
  const nextTitle = stage.id === "proposal" ? "Lista para reservar" : title;
  titleElement.textContent = nextTitle;

  if (lastOrbTitle && lastOrbTitle !== nextTitle) {
    titleElement.classList.remove("is-updating");
    window.requestAnimationFrame(() => titleElement.classList.add("is-updating"));
  }

  lastOrbTitle = nextTitle;
}

function nodePosition(index, total, options = {}) {
  const field = getElement("cv-orb-field");
  const width = field?.clientWidth || 850;
  const height = field?.clientHeight || 520;
  const eventPositionMap = {
    wedding: { x: 0, y: -0.4 },
    other: { x: -0.28, y: -0.32 },
    birthday: { x: 0.28, y: -0.32 },
    "private-party": { x: -0.43, y: -0.05 },
    corporate: { x: 0.43, y: -0.05 },
    farewell: { x: -0.37, y: 0.2 },
    "baby-shower": { x: 0.37, y: 0.2 },
    graduation: { x: -0.15, y: 0.4 },
    anniversary: { x: 0.15, y: 0.4 }
  };
  const secondaryPositionMaps = {
    1: [
      { x: 0, y: 0.36 }
    ],
    2: [
      { x: -0.18, y: 0.35 },
      { x: 0.18, y: 0.35 }
    ],
    4: [
      { x: 0, y: -0.35 },
      { x: 0.32, y: 0.02 },
      { x: 0, y: 0.35 },
      { x: -0.32, y: 0.02 }
    ],
    5: [
      { x: 0, y: -0.36 },
      { x: 0.32, y: -0.12 },
      { x: 0.2, y: 0.32 },
      { x: -0.2, y: 0.32 },
      { x: -0.32, y: -0.12 }
    ],
    8: [
      { x: 0, y: -0.38 },
      { x: 0.28, y: -0.31 },
      { x: 0.41, y: -0.06 },
      { x: 0.38, y: 0.2 },
      { x: 0.26, y: 0.36 },
      { x: -0.26, y: 0.36 },
      { x: -0.38, y: 0.2 },
      { x: -0.41, y: -0.06 }
    ]
  };

  if (options.stageId === "event" && eventPositionMap[options.optionId]) {
    const position = eventPositionMap[options.optionId];
    return {
      x: Math.round(position.x * width),
      y: Math.round(position.y * height)
    };
  }

  if (options.stageId !== "event" && secondaryPositionMaps[total]?.[index]) {
    const position = secondaryPositionMaps[total][index];
    return {
      x: Math.round(position.x * width),
      y: Math.round(position.y * height)
    };
  }

  const eventAngles = [-104, -56, -10, 34, 76, 116, 158, 202, 246];
  const angleDegrees = options.stageId === "event" && total === eventAngles.length
    ? eventAngles[index]
    : -90 + (360 / total) * index;
  const angle = angleDegrees * (Math.PI / 180);
  const isEventStage = options.stageId === "event";
  const nodeGuard = isEventStage
    ? Math.min(58, Math.max(42, Math.min(width, height) * 0.125))
    : Math.min(74, Math.max(48, Math.min(width, height) * 0.16));
  const compactMultiplier = total <= 4 ? 0.8 : 1;
  const planningX = options.planning ? 0.96 : 1;
  const planningY = options.planning ? 0.86 : 1;
  const radiusX = Math.max(110, ((width / 2) - nodeGuard) * compactMultiplier * planningX * (isEventStage ? 1.04 : 1));
  const radiusY = Math.max(92, ((height / 2) - nodeGuard) * compactMultiplier * planningY * (isEventStage ? 1.07 : 1));

  return {
    x: Math.round(Math.cos(angle) * radiusX),
    y: Math.round(Math.sin(angle) * radiusY)
  };
}

function isOptionSelected(stage, option) {
  if (option.kind === "planning-hub") return option.targetStage === stage.id;
  if (stage.id === "event") return eventState.eventType === option.id;
  if (stage.id === "guests") return eventState.guests === option.id;
  if (stage.id === "style") return eventState.style === option.id;
  if (stage.id === "services") return eventState.services.includes(option.id);
  return false;
}

function shouldShowPlanningHub(stage) {
  return stage.id === "guests" && eventState.eventType && !eventState.guests && showingPlanningHub;
}

function visibleOptions(stage) {
  return shouldShowPlanningHub(stage) ? planningCategoryOptions : stage.options;
}

function showThinkingStatus(message = "Ajustando opciones...") {
  const status = getElement("cv-thinking-status");
  status.textContent = message;
  status.setAttribute("aria-hidden", "false");
  status.classList.add("is-visible");

  window.clearTimeout(thinkingTimer);
  thinkingTimer = window.setTimeout(() => {
    status.classList.remove("is-visible");
    status.setAttribute("aria-hidden", "true");
  }, 850);
}

function triggerNodeFeedback(node) {
  const field = getElement("cv-orb-field");
  const orb = getElement("cv-orb");
  const fieldRect = field.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const ripple = document.createElement("span");
  const rippleX = nodeRect.left + nodeRect.width / 2 - fieldRect.left - fieldRect.width / 2;
  const rippleY = nodeRect.top + nodeRect.height / 2 - fieldRect.top - fieldRect.height / 2;

  node.classList.add("is-clicked");
  ripple.className = "cv-selection-ripple";
  ripple.style.setProperty("--ripple-x", `${Math.round(rippleX)}px`);
  ripple.style.setProperty("--ripple-y", `${Math.round(rippleY)}px`);
  field.appendChild(ripple);

  orb.classList.remove("is-pulsing");
  window.requestAnimationFrame(() => orb.classList.add("is-pulsing"));

  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  window.setTimeout(() => {
    node.classList.remove("is-clicked");
    orb.classList.remove("is-pulsing");
  }, 740);
}

function renderNodes() {
  const stage = currentStage();
  const layer = getElement("cv-node-layer");
  const options = visibleOptions(stage);
  const planningMode = shouldShowPlanningHub(stage);
  layer.innerHTML = "";

  layer.dataset.mode = planningMode ? "planning" : stage.id;

  options.forEach((option, index) => {
    const position = nodePosition(index, options.length, { planning: planningMode, stageId: stage.id, optionId: option.id });
    const node = document.createElement("button");
    node.className = "cv-node";
    node.type = "button";
    node.style.setProperty("--node-x", `${position.x}px`);
    node.style.setProperty("--node-y", `${position.y}px`);
    node.style.setProperty("--node-delay", `${index * 34}ms`);
    node.dataset.optionId = option.id;
    node.dataset.nodeKind = option.kind || stage.id;
    node.disabled = Boolean(option.disabled);
    node.setAttribute("aria-pressed", String(isOptionSelected(stage, option)));
    node.classList.toggle("is-selected", isOptionSelected(stage, option));

    node.innerHTML = `
      ${option.badge || option.id === "pay" ? `<span class="cv-node-badge">${option.id === "pay" ? "TODO" : option.badge}</span>` : ""}
      <span class="cv-node-icon" aria-hidden="true">${option.icon}</span>
      <strong>${option.label}</strong>
      <small>${option.kind === "planning-hub" ? option.note : stage.multi ? "Toca para incluir" : option.note || "Seleccionar"}</small>
    `;

    node.addEventListener("click", () => {
      triggerNodeFeedback(node);
      selectOption(stage.id, option);
    });
    layer.appendChild(node);
  });
}

function parseCountLabel(label) {
  const match = String(label).match(/^(\d+)(.*)$/);
  if (!match) return null;
  return {
    value: Number(match[1]),
    suffix: match[2] || ""
  };
}

function animateRemainingCount(nextLabel) {
  const element = getElement("cv-remaining-count");
  if (!element) return;
  if (element.textContent === nextLabel) return;

  const target = parseCountLabel(nextLabel);
  const current = parseCountLabel(element.textContent) || target;

  if (!target || !current) {
    element.textContent = nextLabel;
    return;
  }

  window.cancelAnimationFrame(remainingCountFrame);
  const started = performance.now();
  const duration = 560;
  const startValue = current.value;
  const delta = target.value - startValue;

  element.classList.add("is-counting");

  function tick(now) {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(startValue + delta * eased)}${target.suffix}`;

    if (progress < 1) {
      remainingCountFrame = window.requestAnimationFrame(tick);
      return;
    }

    element.textContent = nextLabel;
    window.setTimeout(() => element.classList.remove("is-counting"), 180);
  }

  remainingCountFrame = window.requestAnimationFrame(tick);
}

function updateStageText() {
  const stage = currentStage();
  getElement("cv-stage-question").textContent = stage.question;
  getElement("cv-stage-helper").textContent = stage.helperText;
  animateRemainingCount(shouldShowPlanningHub(stage) ? "200+" : stage.remainingCount);
  getElement("cv-back-button").disabled = currentStageIndex === 0;
  getElement("cv-services-continue").hidden = stage.id !== "services";
  getElement("cv-summary-action").hidden = !["summary", "proposal"].includes(stage.id);
  getElement("cv-summary-action").textContent = stage.id === "proposal" ? "Reservar ahora" : "Ver propuesta";
}

function animateProgressValue(progress) {
  const element = getElement("cv-progress-value");
  const current = parseInt(element.textContent, 10) || 0;
  if (current === progress) return;

  window.cancelAnimationFrame(progressFrame);
  const started = performance.now();
  const duration = 520;
  const delta = progress - current;

  function tick(now) {
    const ratio = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = `${Math.round(current + delta * eased)}%`;

    if (ratio < 1) {
      progressFrame = window.requestAnimationFrame(tick);
      return;
    }

    element.textContent = `${progress}%`;
  }

  progressFrame = window.requestAnimationFrame(tick);
}

function updateTimeline() {
  document.querySelectorAll("[data-stage-target]").forEach((button) => {
    const index = stageOrder.indexOf(button.dataset.stageTarget);
    button.classList.toggle("is-active", index === currentStageIndex);
    button.classList.toggle("is-complete", index > -1 && index < currentStageIndex);
  });

  const progress = Math.round((currentStageIndex / (stageOrder.length - 1)) * 100);
  animateProgressValue(progress);
  getElement("cv-progress-fill").style.width = `${progress}%`;
  document.querySelector(".cv-timeline").style.setProperty("--timeline-progress", `${progress}%`);
  document.querySelector(".cv-timeline").style.setProperty("--timeline-progress-track", `${Math.min(86, progress * 0.86)}%`);
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
  if (stageId === "event") showingPlanningHub = false;
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

  showThinkingStatus(option.kind === "planning-hub" ? "Calculando combinaciones ideales..." : "Ajustando opciones...");

  if (option.kind === "planning-hub") {
    showingPlanningHub = false;
    if (option.targetStage === stageId) {
      renderStage();
      return;
    }

    goToStage(option.targetStage);
    return;
  }

  if (stageId === "event") {
    eventState.eventType = option.id;
    showingPlanningHub = true;
    renderStage();
    setTimeout(goToNextStage, 260);
    return;
  }

  if (stageId === "guests") {
    eventState.guests = option.id;
    showingPlanningHub = false;
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
  showingPlanningHub = false;
  renderStage();
}

function initParallax() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 901px)");

  if (reduceMotion.matches) return;

  window.addEventListener("pointermove", (event) => {
    if (!desktop.matches) return;

    window.cancelAnimationFrame(parallaxFrame);
    parallaxFrame = window.requestAnimationFrame(() => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 18;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 14;
      document.body.style.setProperty("--cv-parallax-x", `${x.toFixed(2)}px`);
      document.body.style.setProperty("--cv-parallax-y", `${y.toFixed(2)}px`);
    });
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    document.body.style.setProperty("--cv-parallax-x", "0px");
    document.body.style.setProperty("--cv-parallax-y", "0px");
  });
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
      showingPlanningHub = true;
      showThinkingStatus("Ajustando opciones...");
      goToStage("guests");
    });
  });

  document.querySelectorAll("[data-inspiration-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.inspirationScroll === "next" ? 1 : -1;
      getElement("cv-inspiration-track").scrollBy({
        left: direction * 260,
        behavior: "smooth"
      });
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

  initParallax();
  renderStage();
}

initGalaxy();
