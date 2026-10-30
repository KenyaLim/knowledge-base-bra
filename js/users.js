const byId = (id) => document.getElementById(id);
let users = [];
let editing = null;
let page = 1;
let total = 0;
let summary = {};
let requestNumber = 0;
const labels = { active: "Aktif", inactive: "Nonaktif", deleting: "Penghapusan tertunda", admin: "Admin", user: "Pengguna" };
async function api(path = "", method = "GET", body) {
  const response = await fetch(`/api/users${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error(response.status === 403 ? "Akses hanya untuk admin aktif yang telah dimigrasikan." : "Operasi gagal. Muat ulang atau hubungi administrator.");
  return response.json();
}
function render() {
  byId("summary").replaceChildren();
  for (const [label, count] of [["Total Pengguna", summary.total], ["Aktif", summary.active], ["Admin", summary.admin], ["Nonaktif", summary.inactive]]) {
    const card = document.createElement("article");
    card.textContent = label;
    const value = document.createElement("strong"); value.textContent = count; card.append(value); byId("summary").append(card);
  }
  byId("users").replaceChildren();
  byId("page-info").textContent = `Halaman ${page} / ${Math.max(1, Math.ceil(total / 50))} · ${total} hasil`;
  byId("previous").disabled = page <= 1;
  byId("next").disabled = page * 50 >= total;
  for (const user of users) {
    const row = document.createElement("tr");
    const identity = document.createElement("td"); identity.textContent = `${user.name || "—"} / ${user.email}`; row.append(identity);
    for (const key of ["role", "status"]) { const cell = document.createElement("td"); const badge = document.createElement("span"); badge.className = `user-badge ${user[key]}`; badge.textContent = labels[user[key]]; cell.append(badge); row.append(cell); }
    const actions = document.createElement("td");
    for (const [label, action] of [["Edit", () => openEditor(user)], ["Reset Sandi", () => mutate(user, "reset")], [user.status === "active" ? "Nonaktifkan" : "Aktifkan", () => mutate(user, "status")], ["Hapus", () => mutate(user, "delete")]]) {
      const button = document.createElement("button"); button.textContent = label; button.addEventListener("click", action); actions.append(button);
    }
    row.append(actions); byId("users").append(row);
  }
}
async function load() {
  const current = ++requestNumber;
  try {
    const params = new URLSearchParams({ page, limit: "50", search: byId("search").value, role: byId("role-filter").value, status: byId("status-filter").value });
    const data = await api(`?${params}`);
    if (current !== requestNumber) return;
    users = data.users; total = data.total; summary = data.summary; render();
  } catch (error) { if (current === requestNumber) byId("notice").textContent = error.message; }
}
function openEditor(user) {
  editing = user;
  const form = byId("user-form"); form.reset();
  form.email.value = user?.email || ""; form.email.disabled = Boolean(user);
  form.displayName.value = user?.name || ""; form.role.value = user?.role || "user";
  byId("dialog-title").textContent = user ? "Edit Pengguna" : "Tambah Pengguna";
  for (const id of ["name-field", "role-field"]) byId(id).hidden = !user;
  byId("invite-note").hidden = Boolean(user);
  byId("editor").showModal();
}
async function mutate(user, action) {
  if (!confirm(`${action === "delete" ? "Hapus permanen" : action === "reset" ? "Kirim email reset kata sandi untuk" : "Ubah status"} ${user.email}?`)) return;
  try {
    if (action === "delete") await api(`/${user.id}`, "DELETE");
    else if (action === "reset") await api(`/${user.id}/reset`, "POST");
    else await api(`/${user.id}`, "PATCH", { name: user.name, role: user.role, status: user.status === "active" ? "inactive" : "active" });
    byId("notice").textContent = "Permintaan berhasil."; await load();
  } catch (error) { byId("notice").textContent = error.message; }
}
byId("user-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true;
  try {
    if (editing) {
      await api(`/${editing.id}`, "PATCH", { name: form.displayName.value, role: form.role.value, status: editing.status });
      if (form.email.value !== editing.email) throw new Error("Perubahan email dinonaktifkan sampai alur konfirmasi pemilik email tersedia.");
    }
    else await api("/invite", "POST", { email: form.email.value });
    byId("editor").close(); byId("notice").textContent = editing ? "Pengguna diperbarui." : "Undangan dikirim."; await load();
  } catch (error) { byId("editor").close(); byId("notice").textContent = error.message; }
  button.disabled = false;
});
byId("add").addEventListener("click", () => openEditor(null));
byId("cancel").addEventListener("click", () => byId("editor").close());
for (const id of ["search", "role-filter", "status-filter"]) byId(id).addEventListener("input", () => { page = 1; load(); });
byId("previous").addEventListener("click", () => { if (page > 1) { page -= 1; load(); } });
byId("next").addEventListener("click", () => { if (page * 50 < total) { page += 1; load(); } });
load();
