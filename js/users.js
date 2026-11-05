const form = document.getElementById("user-form");
const status = document.getElementById("user-status");
const search = document.getElementById("user-search");
async function request(path = "", method = "GET", body) {
  const response = await fetch(`/api/users/${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Permintaan gagal");
  return data;
}
async function load() {
  try {
    const data = await request(`?q=${encodeURIComponent(search.value)}`);
    document.getElementById("user-stats").textContent = `Total: ${data.stats.total} | Aktif: ${data.stats.active} | Admin aktif: ${data.stats.admins}`;
    const list = document.getElementById("user-list");
    list.replaceChildren();
    for (const user of data.users) {
      const row = document.createElement("tr");
      for (const value of [user.username, user.full_name, user.role, user.is_active ? "Aktif" : "Nonaktif"]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      const actions = document.createElement("td");
      for (const [label, action] of [
        ["Edit / Reset password", async () => { for (const key of ["id", "username", "full_name", "role"]) form.elements[key].value = user[key]; form.elements.password.value = ""; }],
        [user.is_active ? "Nonaktifkan" : "Aktifkan", () => request(user.id, "PATCH", { is_active: !user.is_active })],
        ["Hapus", () => confirm(`Hapus ${user.username}?`) ? request(user.id, "DELETE") : Promise.resolve()],
      ]) {
        const button = document.createElement("button");
        button.textContent = label;
        button.onclick = async () => { try { await action(); await load(); } catch (error) { status.textContent = error.message; } };
        actions.append(button);
      }
      row.append(actions);
      list.append(row);
    }
  } catch (error) { status.textContent = error.message; }
}
form.onsubmit = async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  delete data.id;
  if (!data.password && id) delete data.password;
  try {
    await request(id, id ? "PATCH" : "POST", data);
    form.reset();
    status.textContent = "Pengguna berhasil disimpan";
    await load();
  } catch (error) { status.textContent = error.message; }
};
search.oninput = load;
load();
