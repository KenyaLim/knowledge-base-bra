const params = new URLSearchParams(location.hash.slice(1));
const token_hash = params.get("token_hash");
const type = params.get("type");
history.replaceState(null, "", location.pathname);
document.getElementById("password-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = document.getElementById("result");
  if (form.password.value !== form.confirm.value) { result.textContent = "Konfirmasi tidak sama."; return; }
  form.querySelector("button").disabled = true;
  try {
    const response = await fetch("/api/password-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token_hash, type, password: form.password.value }) });
    result.textContent = response.ok ? "Kata sandi tersimpan. Silakan login." : "Tautan tidak valid atau kedaluwarsa. Minta email baru.";
    form.reset();
  } catch { result.textContent = "Permintaan gagal. Minta email baru jika tautan sudah digunakan."; }
  form.querySelector("button").disabled = false;
});
