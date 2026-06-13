import {
  DEFAULT_WORKSPACE_ID,
  getWorkspaceContext,
  isPendingWorkspaceAccess,
  isSupabaseConfigured,
  requireSupabase,
} from "../lib/supabaseClient.js";

const sessionStatus = document.querySelector("#sessionStatus");
const assignmentsList = document.querySelector("#assignmentsList");
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

async function loadAssignments(userEmail) {
  const { data: collaborator } = await supabase
    .from("cater_collaborators")
    .select("id,full_name,role,status")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .ilike("email", userEmail)
    .maybeSingle();

  if (!collaborator) {
    assignmentsList.innerHTML = "<p>No hay perfil de colaborador vinculado a este email todavía.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("cater_event_assignments")
    .select("id,event_id,assignment_role,status,notes,created_at")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .eq("collaborator_id", collaborator.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    assignmentsList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    assignmentsList.innerHTML = "<p>No tienes asignaciones visibles todavía.</p>";
    return;
  }

  assignmentsList.innerHTML = data
    .map(
      (assignment) => `
        <article class="portal-row">
          <strong>Evento #${assignment.event_id}</strong>
          <span>${escapeHtml(assignment.assignment_role)} · ${escapeHtml(assignment.status)} · ${escapeHtml(assignment.notes || "Sin notas")}</span>
        </article>
      `
    )
    .join("");
}

async function bootCollaborator() {
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

  sessionStatus.textContent = `${user.email} · Colaborador`;
  await loadAssignments(user.email);
}

signoutButton.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.href = "../login.html";
});

bootCollaborator().catch((error) => {
  sessionStatus.textContent = error.message;
});
