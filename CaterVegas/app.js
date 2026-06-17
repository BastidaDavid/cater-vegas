const services = [
  {
    emoji: "💍",
    name: "Wedding Catering",
    copy: "Elegant menus, cocktail hour, plated dinner, staffing, rentals, and day-of execution.",
    keyword: "wedding catering las vegas",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🏢",
    name: "Corporate Catering",
    copy: "Office meals, executive receptions, launch events, and recurring client account ordering.",
    keyword: "corporate catering las vegas",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎉",
    name: "Private Parties",
    copy: "Chef-driven food for luxury homes, lounges, birthdays, and intimate celebrations.",
    keyword: "private party catering las vegas",
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎂",
    name: "Birthday Celebrations",
    copy: "Buffets, dessert tables, themed food stations, and flexible service for every age group.",
    keyword: "birthday catering las vegas",
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎓",
    name: "Graduation Parties",
    copy: "Family-style menus, drop-off packages, and celebration-ready service for graduates.",
    keyword: "graduation catering las vegas",
    image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "👶",
    name: "Baby Showers",
    copy: "Light bites, brunch boards, dessert displays, and polished service for family gatherings.",
    keyword: "baby shower catering las vegas",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "💒",
    name: "Anniversary Events",
    copy: "Romantic dinners, reception-style service, champagne pairings, and dessert moments.",
    keyword: "anniversary catering las vegas",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎄",
    name: "Holiday Parties",
    copy: "Seasonal corporate parties, family gatherings, buffet service, and peak-season planning.",
    keyword: "holiday party catering las vegas",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎰",
    name: "Casino & Resort Events",
    copy: "Hospitality-ready workflows for casino partners, suites, resort events, and VIP groups.",
    keyword: "casino resort catering las vegas",
    image: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎤",
    name: "Concert & Entertainment Events",
    copy: "Artist hospitality, green room meals, production crew catering, and late-night service.",
    keyword: "concert catering las vegas",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🏟️",
    name: "Sporting Events",
    copy: "Team meals, suite catering, fan hospitality, and high-volume event-day delivery.",
    keyword: "sporting event catering las vegas",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🏛️",
    name: "Convention Catering",
    copy: "Multi-day convention meals, exhibitor hospitality, and route-coordinated delivery.",
    keyword: "convention catering las vegas",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "📈",
    name: "Trade Shows & Expos",
    copy: "Booth hospitality, boxed meals, coffee stations, and exhibitor food programs.",
    keyword: "trade show catering las vegas",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "☕",
    name: "Coffee Break Services",
    copy: "Premium coffee, tea, pastries, fruit, snacks, and fast reset service between sessions.",
    keyword: "coffee break catering las vegas",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🍳",
    name: "Breakfast Catering",
    copy: "Breakfast boards, hot buffets, executive breakfast, and early delivery coordination.",
    keyword: "breakfast catering las vegas",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🥪",
    name: "Box Lunch Catering",
    copy: "Fast, organized boxed lunches for crews, conventions, offices, and production teams.",
    keyword: "box lunch catering las vegas",
    image: "https://images.unsplash.com/photo-1628191010210-a59de33e5941?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🍽️",
    name: "Full-Service Catering",
    copy: "Staffed service, setup, rentals, stations, buffet, plated dining, and event captains.",
    keyword: "full service catering las vegas",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🚚",
    name: "Drop-Off Catering",
    copy: "Prepared menu packages delivered on time with clean labeling and setup guidance.",
    keyword: "drop off catering las vegas",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "👨‍🍳",
    name: "Private Chef Experiences",
    copy: "In-home chef menus, tasting dinners, wine pairings, and personalized hospitality.",
    keyword: "private chef las vegas",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🏨",
    name: "Hotel Catering Support",
    copy: "Overflow kitchen support, suite service, partner events, and guest-facing hospitality.",
    keyword: "hotel catering support las vegas",
    image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=900&q=80"
  },
  {
    emoji: "🎬",
    name: "Film & Production Catering",
    copy: "Crew meals, mobile production support, early call times, and all-day food planning.",
    keyword: "film production catering las vegas",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80"
  }
];

const serviceEs = {
  "Wedding Catering": ["Catering para Bodas", "Menús elegantes, hora de cóctel, cena servida, personal, rentas y ejecución del evento.", "catering para bodas las vegas"],
  "Corporate Catering": ["Catering Corporativo", "Comidas de oficina, recepciones ejecutivas, lanzamientos y pedidos recurrentes para empresas.", "catering corporativo las vegas"],
  "Private Parties": ["Fiestas Privadas", "Comida de chef para casas de lujo, lounges, cumpleaños y celebraciones íntimas.", "catering para fiestas privadas las vegas"],
  "Birthday Celebrations": ["Celebraciones de Cumpleaños", "Buffets, mesas de postres, estaciones temáticas y servicio flexible para todas las edades.", "catering para cumpleaños las vegas"],
  "Graduation Parties": ["Fiestas de Graduación", "Menús familiares, paquetes drop-off y servicio listo para celebrar graduaciones.", "catering para graduaciones las vegas"],
  "Baby Showers": ["Baby Showers", "Bocados ligeros, brunch, postres y servicio pulido para reuniones familiares.", "catering para baby shower las vegas"],
  "Anniversary Events": ["Aniversarios", "Cenas románticas, servicio tipo recepción, champagne y momentos de postre.", "catering para aniversarios las vegas"],
  "Holiday Parties": ["Fiestas Navideñas", "Fiestas corporativas de temporada, reuniones familiares, buffet y planeación para alta demanda.", "catering para fiestas navideñas las vegas"],
  "Casino & Resort Events": ["Eventos de Casino y Resort", "Flujos listos para casinos, suites, eventos de resort y grupos VIP.", "catering para casinos y resorts las vegas"],
  "Concert & Entertainment Events": ["Conciertos y Entretenimiento", "Hospitalidad para artistas, green rooms, catering para producción y servicio nocturno.", "catering para conciertos las vegas"],
  "Sporting Events": ["Eventos Deportivos", "Comidas para equipos, suites, hospitalidad para fans y entregas de alto volumen.", "catering para eventos deportivos las vegas"],
  "Convention Catering": ["Catering para Convenciones", "Comidas multi-día, hospitalidad para expositores y entregas coordinadas por ruta.", "catering para convenciones las vegas"],
  "Trade Shows & Expos": ["Ferias y Expos", "Hospitalidad de stand, box lunches, estaciones de café y programas para expositores.", "catering para expos las vegas"],
  "Coffee Break Services": ["Coffee Breaks", "Café premium, té, pastelería, fruta, snacks y servicio rápido entre sesiones.", "servicio de coffee break las vegas"],
  "Breakfast Catering": ["Catering de Desayuno", "Tablas de desayuno, buffets calientes, desayuno ejecutivo y entregas tempranas.", "catering de desayuno las vegas"],
  "Box Lunch Catering": ["Box Lunch Catering", "Almuerzos individuales, rápidos y organizados para equipos, convenciones y oficinas.", "box lunch catering las vegas"],
  "Full-Service Catering": ["Catering Full-Service", "Servicio con personal, montaje, rentas, estaciones, buffet, cenas servidas y capitanes.", "full service catering las vegas"],
  "Drop-Off Catering": ["Drop-Off Catering", "Paquetes preparados y entregados a tiempo con etiquetas claras y guía de montaje.", "drop off catering las vegas"],
  "Private Chef Experiences": ["Experiencias de Chef Privado", "Menús en casa, cenas de degustación, maridajes y hospitalidad personalizada.", "chef privado las vegas"],
  "Hotel Catering Support": ["Soporte de Catering para Hoteles", "Apoyo de cocina, servicio en suites, eventos de partners y hospitalidad para huéspedes.", "soporte de catering hotelero las vegas"],
  "Film & Production Catering": ["Catering para Filmación y Producción", "Comidas para crew, soporte móvil, llamados tempranos y planeación de todo el día.", "catering para producciones las vegas"]
};

const menus = [
  {
    name: "Executive Breakfast Board",
    category: "breakfast",
    copy: "Smoked salmon, seasonal fruit, pastries, cage-free eggs, and chef coffee service.",
    price: 34,
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Convention Power Lunch",
    category: "reception",
    copy: "Market salads, grilled proteins, composed sides, and boxed executive dessert.",
    price: 42,
    image: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Vegas Cocktail Reception",
    category: "reception",
    copy: "Passed hors d'oeuvres, grazing station, champagne service, and late-night bites.",
    price: 58,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Wedding Plated Dinner",
    category: "dinner",
    copy: "Three-course plated dinner with tasting workflow, staffing model, and rental forecast.",
    price: 92,
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Hotel Suite VIP Service",
    category: "dinner",
    copy: "Premium tray pass, wine-paired small plates, suite setup, and dedicated captain.",
    price: 124,
    image: "https://images.unsplash.com/photo-1565895405227-31cffbe0cf86?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Dessert Salon",
    category: "dessert",
    copy: "Mini pastries, chocolate display, seasonal fruit, and branded corporate dessert bites.",
    price: 26,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80"
  }
];

const menuEs = {
  "Executive Breakfast Board": ["Tabla Ejecutiva de Desayuno", "Salmón ahumado, fruta de temporada, pastelería, huevos y servicio de café."],
  "Convention Power Lunch": ["Power Lunch para Convenciones", "Ensaladas de mercado, proteínas grilladas, guarniciones y postre ejecutivo."],
  "Vegas Cocktail Reception": ["Recepción Cocktail Vegas", "Hors d'oeuvres, estación de grazing, champagne y bocados nocturnos."],
  "Wedding Plated Dinner": ["Cena Servida para Bodas", "Cena de tres tiempos con degustación, modelo de personal y forecast de rentas."],
  "Hotel Suite VIP Service": ["Servicio VIP para Suite de Hotel", "Platos pequeños premium, maridaje, montaje en suite y capitán dedicado."],
  "Dessert Salon": ["Salón de Postres", "Mini pasteles, chocolate, fruta de temporada y postres corporativos personalizados."]
};

const eventTypes = {
  corporate: { label: "Corporate Catering", base: 64, margin: 32 },
  wedding: { label: "Wedding Catering", base: 92, margin: 36 },
  convention: { label: "Convention Catering", base: 58, margin: 29 },
  private: { label: "Private Event", base: 76, margin: 34 },
  hotel: { label: "Hotel Catering", base: 108, margin: 38 },
  holiday: { label: "Holiday Catering", base: 70, margin: 31 }
};

const eventTypeLabels = {
  en: {
    corporate: "Corporate Catering",
    wedding: "Wedding Catering",
    convention: "Convention Catering",
    private: "Private Event",
    hotel: "Hotel Catering",
    holiday: "Holiday Catering"
  },
  es: {
    corporate: "Catering Corporativo",
    wedding: "Catering para Bodas",
    convention: "Catering para Convenciones",
    private: "Evento Privado",
    hotel: "Catering para Hoteles",
    holiday: "Catering para Fiestas"
  }
};

const serviceLevelLabels = {
  en: { delivery: "Delivery catering", full: "Full-service catering", vip: "VIP hotel service" },
  es: { delivery: "Catering con entrega", full: "Catering full-service", vip: "Servicio VIP de hotel" }
};

const addonLabels = {
  en: { standard: "Standard setup", bar: "Bar + dessert table", rental: "Equipment rental" },
  es: { standard: "Montaje estándar", bar: "Barra + mesa de postres", rental: "Renta de equipo" }
};

const uiTranslations = {
  en: {
    navServices: "Services", navMenus: "Menus", navQuote: "Quote", navOperations: "Operations",
    requestQuote: "Request quote", heroTitle: "Catering for events in Las Vegas, easy to quote and book.",
    heroCopy: "Cater Vegas helps you find the ideal catering service for your event. Explore options, review menus, and request a quote quickly and easily.",
    heroPrimary: "Calculate an instant quote",
    metricServices: "catering services", metricResponse: "lead response target",
    servicesCarouselLabel: "Our Catering Services", servicesCarouselTitle: "Slide through every event Cater Vegas can serve.", carouselHint: "Swipe, drag, or use the arrows",
    authorityTitle: "Catering options for every Las Vegas event.",
    menusTitle: "Dynamic menu browsing with production-aware items.", filterAll: "All", filterBreakfast: "Breakfast", filterReception: "Reception", filterDinner: "Dinner", filterDessert: "Dessert",
    quoteTitle: "Instant quote calculator connected to event intake.", quoteCopy: "Guests, event type, timing, and service model generate a live estimate, deposit amount, and inquiry priority.",
    labelGuests: "Guests", labelEventType: "Event type", labelDate: "Date", labelTime: "Time", labelService: "Service", labelAddons: "Add-ons", createInquiry: "Create inquiry",
    estimatedTotal: "Estimated total", depositDueLabel: "Deposit due", estimatedMargin: "Estimated margin",
    portalTitle: "Customer portal, ordering, reviews, and event details.", portalCopy: "Move from menu ideas to quote, ordering, deposits, and event updates in one branded experience.",
    customerPortalTitle: "Customer account portal", customerPortalCopy: "Customers can review proposals, approve menus, sign contracts, pay deposits, and track event status from one branded account.",
    proposalReady: "Proposal ready", contractPending: "Contract pending signature", depositSent: "Deposit invoice sent",
    onlineOrderingTitle: "Online ordering", onlineOrderingCopy: "Repeat corporate clients can reorder approved menus with delivery windows, guest counts, and invoice terms.",
    reviewsTitle: "Reviews", reviewsCopy: "Testimonials help clients compare event styles, service quality, and catering experiences.",
    blogTitle: "Blog engine", blogCopy: "Guides for convention catering, hotel events, wedding menus, and Las Vegas holiday planning.",
    operationsTitle: "Back-office command center for catering operations.", operationsCopy: "Sales, proposals, contracts, payments, staffing, delivery, equipment, production, kitchen prep, and analytics in one place.",
    tabEvents: "Events", tabKitchen: "Kitchen", tabAnalytics: "Analytics", juneOperations: "June operations", viewDay: "Day", viewWeek: "Week", viewMonth: "Month",
    bookedEvents: "Booked events", openProposals: "Open proposals", depositsDue: "Deposits due", routesToday: "Routes today", lead: "Lead", event: "Event", value: "Value", status: "Status",
    productionSheets: "Production sheets", ingredientForecast: "Ingredient forecast", prepSchedule: "Prep schedule", revenue: "Revenue", foodCost: "Food cost", laborCost: "Labor cost", leadConversion: "Lead conversion", salesTrend: "Sales trend",
    footerCopy: "Premium catering services for Las Vegas events, menus, quotes, and celebrations.", backTop: "Back to top"
  },
  es: {
    navServices: "Servicios", navMenus: "Menús", navQuote: "Cotización", navOperations: "Operaciones",
    requestQuote: "Solicitar cotización", heroTitle: "Catering para eventos en Las Vegas, fácil de cotizar y reservar.",
    heroCopy: "Cater Vegas te ayuda a encontrar el servicio de catering ideal para tu evento. Explora opciones, revisa menús y solicita una cotización de forma rápida y sencilla.",
    heroPrimary: "Calcular cotización",
    metricServices: "servicios de catering", metricResponse: "respuesta a leads",
    servicesCarouselLabel: "Nuestros Servicios de Catering", servicesCarouselTitle: "Desliza cada evento que Cater Vegas puede atender.", carouselHint: "Desliza, arrastra o usa las flechas",
    authorityTitle: "Opciones de catering para cada evento en Las Vegas.",
    menusTitle: "Menús dinámicos conectados a producción.", filterAll: "Todos", filterBreakfast: "Desayuno", filterReception: "Recepción", filterDinner: "Cena", filterDessert: "Postres",
    quoteTitle: "Cotizador instantáneo conectado al intake del evento.", quoteCopy: "Invitados, tipo de evento, horario y modelo de servicio generan estimado, depósito y prioridad de solicitud.",
    labelGuests: "Invitados", labelEventType: "Tipo de evento", labelDate: "Fecha", labelTime: "Hora", labelService: "Servicio", labelAddons: "Extras", createInquiry: "Crear solicitud",
    estimatedTotal: "Total estimado", depositDueLabel: "Depósito", estimatedMargin: "Margen estimado",
    portalTitle: "Portal de cliente, pedidos, reseñas y detalles del evento.", portalCopy: "Pasa de ideas de menú a cotización, pedidos, depósitos y actualizaciones del evento en una experiencia de marca.",
    customerPortalTitle: "Portal de cuenta del cliente", customerPortalCopy: "Clientes pueden revisar propuestas, aprobar menús, firmar contratos, pagar depósitos y seguir el estado del evento.",
    proposalReady: "Propuesta lista", contractPending: "Contrato pendiente de firma", depositSent: "Factura de depósito enviada",
    onlineOrderingTitle: "Pedidos online", onlineOrderingCopy: "Clientes corporativos pueden repetir menús aprobados con ventanas de entrega, invitados y términos de factura.",
    reviewsTitle: "Reseñas", reviewsCopy: "Los testimonios ayudan a comparar estilos de evento, calidad de servicio y experiencias de catering.",
    blogTitle: "Blog", blogCopy: "Guías para catering de convenciones, hoteles, bodas y fiestas en Las Vegas.",
    operationsTitle: "Centro operativo para catering.", operationsCopy: "Ventas, propuestas, contratos, pagos, staff, entregas, equipo, producción, cocina y analíticas en un solo lugar.",
    tabEvents: "Eventos", tabKitchen: "Cocina", tabAnalytics: "Analíticas", juneOperations: "Operaciones de junio", viewDay: "Día", viewWeek: "Semana", viewMonth: "Mes",
    bookedEvents: "Eventos reservados", openProposals: "Propuestas abiertas", depositsDue: "Depósitos pendientes", routesToday: "Rutas hoy", lead: "Lead", event: "Evento", value: "Valor", status: "Estado",
    productionSheets: "Hojas de producción", ingredientForecast: "Forecast de ingredientes", prepSchedule: "Agenda de prep", revenue: "Ingresos", foodCost: "Costo de comida", laborCost: "Costo laboral", leadConversion: "Conversión de leads", salesTrend: "Tendencia de ventas",
    footerCopy: "Servicios premium de catering para eventos, menús, cotizaciones y celebraciones en Las Vegas.", backTop: "Volver arriba"
  }
};

let currentLanguage = localStorage.getItem("cater-vegas-language") || "en";


const serviceMultipliers = {
  delivery: 1,
  full: 1.32,
  vip: 1.58
};

const addonMultipliers = {
  standard: 1,
  bar: 1.18,
  rental: 1.14
};

const calendarEvents = [
  ["Mon", ["MGM executive lunch", "Summerlin private tasting"]],
  ["Tue", ["Convention Center booth meals"]],
  ["Wed", ["Hotel suite VIP dinner", "Holiday menu tasting"]],
  ["Thu", ["Wedding final walkthrough", "Corporate breakfast route"]],
  ["Fri", ["Caesars reception", "Downtown cocktail party"]],
  ["Sat", ["Red Rock wedding", "Private estate dinner"]],
  ["Sun", ["Prep reset", "Inventory count"]]
];

const leads = [
  { name: "DesertTech Summit", event: "Convention", value: "$18,400", status: "Proposal" },
  { name: "Romero Wedding", event: "Wedding", value: "$24,900", status: "Contract" },
  { name: "Vista Hotel", event: "Hotel", value: "$31,200", status: "Negotiation" },
  { name: "North Strip Holiday", event: "Holiday", value: "$12,700", status: "Qualified" }
];

const pipelineStages = [
  { name: "New leads", items: ["Hotel ballroom inquiry", "Convention coffee service"] },
  { name: "Qualified", items: ["Private chef dinner", "Holiday corporate party"] },
  { name: "Proposal", items: ["DesertTech Summit", "Executive lunch program"] },
  { name: "Contract", items: ["Romero Wedding", "Casino VIP reception"] }
];

const production = [
  "Scale short rib recipe to 180 portions",
  "Create vegan entree batch for 42 guests",
  "Generate pastry production sheet",
  "Assign sauce prep to AM kitchen team"
];

const forecast = [
  "Prime beef: 92 lb",
  "Baby greens: 38 lb",
  "Champagne vinegar: 5 gal",
  "Disposable premium trays: 220"
];

const prep = [
  "08:00 receive produce",
  "10:30 batch sauces",
  "13:00 assemble cold stations",
  "15:45 load route 3",
  "17:15 captain venue walkthrough"
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const t = (key) => uiTranslations[currentLanguage][key] || uiTranslations.en[key] || key;

function localizedService(service) {
  const translated = serviceEs[service.name];
  if (currentLanguage !== "es" || !translated) return service;
  return { ...service, name: translated[0], copy: translated[1] };
}

function localizedMenu(item) {
  const translated = menuEs[item.name];
  if (currentLanguage !== "es" || !translated) return item;
  return { ...item, name: translated[0], copy: translated[1] };
}

function updateSelectLabels(selectId, labels) {
  const select = document.getElementById(selectId);
  [...select.options].forEach((option) => {
    option.textContent = labels[option.value] || option.textContent;
  });
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.querySelector("[data-language-toggle]").textContent = currentLanguage === "en" ? "ES" : "EN";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  updateSelectLabels("eventType", eventTypeLabels[currentLanguage]);
  updateSelectLabels("serviceLevel", serviceLevelLabels[currentLanguage]);
  updateSelectLabels("addonPackage", addonLabels[currentLanguage]);
  renderServices();
  renderHeroServices();
  renderMenus(document.querySelector("[data-menu-filter].active")?.dataset.menuFilter || "all");
  setDashboardTab(document.querySelector("[data-dashboard-tab].active")?.dataset.dashboardTab || "events");
  calculateQuote();
  updateServiceCounter();
}

function renderServices() {
  const grid = document.getElementById("serviceGrid");
  grid.innerHTML = services.map(localizedService).map((service) => `
    <article class="service-card">
      <div>
        <h3><span aria-hidden="true">${service.emoji}</span> ${service.name}</h3>
        <p>${service.copy}</p>
      </div>
    </article>
  `).join("");
}

function renderHeroServices() {
  const track = document.getElementById("heroServiceTrack");
  track.innerHTML = services.map(localizedService).map((service) => `
    <article class="hero-service-card">
      <img src="${service.image}" alt="${service.name} catering service">
      <div class="hero-service-content">
        <span class="service-emoji" aria-hidden="true">${service.emoji}</span>
        <h3>${service.name}</h3>
        <p>${service.copy}</p>
      </div>
    </article>
  `).join("");
  track.onscroll = () => window.requestAnimationFrame(updateServiceCounter);
}

function renderMenus(category = "all") {
  const grid = document.getElementById("menuGrid");
  const filtered = category === "all" ? menus : menus.filter((item) => item.category === category);
  grid.innerHTML = filtered.map(localizedMenu).map((item) => `
    <article class="menu-card">
      <img src="${item.image}" alt="${item.name}">
      <div class="menu-card-content">
        <h3>${item.name}</h3>
        <p>${item.copy}</p>
        <div class="menu-meta">
          <span>$${item.price}/guest</span>
          <small>${currentLanguage === "es" ? {
            breakfast: "desayuno",
            reception: "recepción",
            dinner: "cena",
            dessert: "postres"
          }[item.category] : item.category}</small>
        </div>
      </div>
    </article>
  `).join("");
}

function calculateQuote() {
  const guests = Number(document.getElementById("guestCount").value || 0);
  const eventType = document.getElementById("eventType").value;
  const serviceLevel = document.getElementById("serviceLevel").value;
  const addonPackage = document.getElementById("addonPackage").value;
  const event = eventTypes[eventType];
  const subtotal = guests * event.base * serviceMultipliers[serviceLevel] * addonMultipliers[addonPackage];
  const rushFactor = guests > 350 ? 1.08 : 1;
  const total = Math.max(0, subtotal * rushFactor);
  const deposit = total * 0.3;

  document.getElementById("quoteTotal").textContent = formatMoney(total);
  document.getElementById("depositDue").textContent = formatMoney(deposit);
  document.getElementById("profitMargin").textContent = `${event.margin}%`;
  const heroEstimate = document.getElementById("heroEstimate");
  if (heroEstimate) {
    heroEstimate.textContent = formatMoney(total);
  }
}

function renderDashboard() {
  document.getElementById("calendarBoard").innerHTML = calendarEvents.map(([day, items]) => `
    <div class="calendar-day">
      <b>${day}</b>
      ${items.map((item) => `<span class="event-pill">${item}</span>`).join("")}
    </div>
  `).join("");

  document.getElementById("pipeline").innerHTML = pipelineStages.map((stage) => `
    <section class="pipeline-column">
      <h4>${stage.name}</h4>
      ${stage.items.map((item) => `<div class="lead-card">${item}</div>`).join("")}
    </section>
  `).join("");

  document.getElementById("crmRows").innerHTML = leads.map((lead) => `
    <tr>
      <td>${lead.name}</td>
      <td>${lead.event}</td>
      <td>${lead.value}</td>
      <td>${lead.status}</td>
    </tr>
  `).join("");

  document.getElementById("productionList").innerHTML = production.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("forecastList").innerHTML = forecast.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("prepList").innerHTML = prep.map((item) => `<li>${item}</li>`).join("");
}

function setDashboardTab(tabName) {
  const titles = {
    en: {
      events: "Event calendar",
      crm: "Lead pipeline and CRM",
      kitchen: "Kitchen production system",
      analytics: "Admin analytics"
    },
    es: {
      events: "Calendario de eventos",
      crm: "CRM y pipeline de leads",
      kitchen: "Sistema de producción de cocina",
      analytics: "Analíticas de administración"
    }
  };

  document.querySelectorAll("[data-dashboard-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.dashboardTab === tabName);
  });
  document.querySelectorAll("[data-dashboard-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.dashboardPanel === tabName);
  });
  document.getElementById("dashboardTitle").textContent = titles[currentLanguage][tabName];
}

function updateServiceCounter() {
  const track = document.getElementById("heroServiceTrack");
  const counter = document.getElementById("serviceCounter");
  const cards = [...document.querySelectorAll(".hero-service-card")];
  if (!track || !counter || !cards.length) return;

  const trackLeft = track.getBoundingClientRect().left;
  const currentIndex = cards.reduce((closestIndex, card, index) => {
    const currentDistance = Math.abs(card.getBoundingClientRect().left - trackLeft);
    const closestDistance = Math.abs(cards[closestIndex].getBoundingClientRect().left - trackLeft);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);

  counter.textContent = `${currentIndex + 1} / ${cards.length}`;
}

function goToServiceSlide(direction) {
  const track = document.getElementById("heroServiceTrack");
  const cards = [...document.querySelectorAll(".hero-service-card")];
  if (!track || !cards.length) return;

  const trackLeft = track.getBoundingClientRect().left;
  const currentIndex = cards.reduce((closestIndex, card, index) => {
    const currentDistance = Math.abs(card.getBoundingClientRect().left - trackLeft);
    const closestDistance = Math.abs(cards[closestIndex].getBoundingClientRect().left - trackLeft);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);
  const nextIndex = (currentIndex + direction + cards.length) % cards.length;
  track.scrollTo({ left: cards[nextIndex].offsetLeft, behavior: "smooth" });
  document.getElementById("serviceCounter").textContent = `${nextIndex + 1} / ${cards.length}`;
  window.setTimeout(updateServiceCounter, 360);
}

function initInteractions() {
  const navToggle = document.querySelector("[data-nav-toggle]");
  navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  document.querySelectorAll("[data-nav] a").forEach((link) => {
    link.addEventListener("click", () => document.body.classList.remove("nav-open"));
  });

  document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    localStorage.setItem("cater-vegas-theme", nextTheme);
  });

  document.querySelector("[data-language-toggle]").addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "es" : "en";
    localStorage.setItem("cater-vegas-language", currentLanguage);
    applyLanguage();
  });

  document.querySelectorAll("[data-menu-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-menu-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderMenus(button.dataset.menuFilter);
    });
  });

  document.querySelectorAll("[data-dashboard-tab]").forEach((button) => {
    button.addEventListener("click", () => setDashboardTab(button.dataset.dashboardTab));
  });

  const serviceTrack = document.getElementById("heroServiceTrack");
  document.querySelector("[data-service-prev]").addEventListener("click", () => {
    goToServiceSlide(-1);
  });
  document.querySelector("[data-service-next]").addEventListener("click", () => {
    goToServiceSlide(1);
  });
  serviceTrack.onscroll = () => window.requestAnimationFrame(updateServiceCounter);

  ["guestCount", "eventType", "eventDate", "eventTime", "serviceLevel", "addonPackage"].forEach((id) => {
    document.getElementById(id).addEventListener("input", calculateQuote);
  });

  document.getElementById("quoteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button");
    const originalText = button.textContent;
    button.textContent = currentLanguage === "es" ? "Solicitud creada" : "Inquiry created";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1600);
  });
}

function setDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  document.getElementById("eventDate").value = date.toISOString().split("T")[0];
}

function boot() {
  const savedTheme = localStorage.getItem("cater-vegas-theme");
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
  }

  renderServices();
  renderHeroServices();
  renderMenus();
  renderDashboard();
  setDefaultDate();
  initInteractions();
  applyLanguage();
}

boot();
