import {
  DEFAULT_WORKSPACE_ID,
  getEffectiveWorkspaceRole,
  getWorkspaceContext,
  isPendingWorkspaceAccess,
  isSupabaseConfigured,
  requireSupabase,
} from "../lib/supabaseClient.js";

const sessionStatus = document.querySelector("#sessionStatus");
const eventsList = document.querySelector("#eventsList");
const signoutButton = document.querySelector("#signoutButton");

let supabase = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadClientEvents() {
  const { data, error } = await supabase
    .from("cater_events")
    .select("id,title,event_type,status,event_date,budget_label,updated_at")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    eventsList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    eventsList.innerHTML = "<p>No hay eventos visibles para tu cuenta todavía.</p>";
    return;
  }

  eventsList.innerHTML = data
    .map(
      (event) => `
        <article class="portal-row">
          <strong>${escapeHtml(event.title || `Evento #${event.id}`)}</strong>
          <span>#${event.id} · ${escapeHtml(event.event_type || "Sin tipo")} · ${escapeHtml(event.status || "draft")}</span>
        </article>
      `
    )
    .join("");
}

async function bootClient() {
  if (!isSupabaseConfigured) {
    sessionStatus.textContent = "Configura Supabase para usar el portal.";
    return;
  }

  supabase = requireSupabase();
  const { user, profile, membership } = await getWorkspaceContext();

  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  if (membership?.status === "disabled" || isPendingWorkspaceAccess(profile, membership)) {
    window.location.href = "../pending.html";
    return;
  }

  const role = getEffectiveWorkspaceRole(profile, membership);
  if (["owner", "admin", "super_admin", "platform_admin", "organizer"].includes(role)) {
    window.location.href = "../admin/";
    return;
  }

  sessionStatus.textContent = `${user.email} · Cliente`;
  await loadClientEvents();
}

signoutButton.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.href = "../login.html";
});

bootClient().catch((error) => {
  sessionStatus.textContent = error.message;
});
