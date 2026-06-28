const stepIds = ["calendar", "industries", "catering", "start", "about", "contact"];

function showStep(stepId) {
  const activeStep = stepIds.includes(stepId) ? stepId : "calendar";

  stepIds.forEach((id) => {
    document.getElementById(id)?.classList.toggle("is-hidden-step", id !== activeStep);
  });

  document.querySelector(".site-footer")?.classList.toggle("is-hidden-step", activeStep !== "contact");

  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeStep}`;
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (window.location.hash !== `#${activeStep}`) {
    window.history.replaceState(null, "", `#${activeStep}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function markIndustryPanel(link) {
  const panel = link.closest(".industry-panel");
  if (!panel) return false;

  document.querySelectorAll(".industry-panel").forEach((item) => item.classList.remove("is-selected"));
  panel.classList.add("is-selected");
  return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    const targetId = href.slice(1);
    const isIndustrySelection = markIndustryPanel(link);

    if (stepIds.includes(targetId)) {
      event.preventDefault();
      window.setTimeout(() => showStep(targetId), isIndustrySelection ? 180 : 0);
      return;
    }

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".industry-panel").forEach((panel) => {
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;

    panel.querySelector('a[href^="#"]')?.click();
  });
});

const pathCopy = {
  Catering: "We will begin with menu direction, guest count, service flow and staffing needs, then connect the rest of the event around it.",
  "F&B": "We will begin with beverage service, food operations, venue requirements and daily service rhythm, then connect the rest of the event around it.",
  Entertainment: "We will begin with talent, music, production timing and guest energy, then connect food, service and hospitality around the show flow.",
  Hospedaje: "We will begin with hotel blocks, arrivals, transportation notes and VIP hospitality, then connect the event plan around guest movement."
};

function setStartPath(path) {
  const selectedPath = document.getElementById("selected-path");
  const selectedCopy = document.getElementById("selected-path-copy");

  if (!selectedPath || !selectedCopy || !pathCopy[path]) return;

  selectedPath.textContent = path;
  selectedCopy.textContent = pathCopy[path];

  document.querySelectorAll("[data-path]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.path === path);
  });
}

document.querySelectorAll("[data-start-option]").forEach((link) => {
  link.addEventListener("click", () => setStartPath(link.dataset.startOption));
});

document.querySelectorAll("[data-path]").forEach((button) => {
  button.addEventListener("click", () => setStartPath(button.dataset.path));
});

document.querySelectorAll(".calendar-grid button:not(.muted)").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".calendar-grid button").forEach((day) => day.classList.remove("is-selected"));
    button.classList.add("is-selected");
    window.setTimeout(() => showStep("industries"), 260);
  });
});

showStep(window.location.hash.slice(1));
