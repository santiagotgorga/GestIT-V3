// HU-01 (v3) - BUG-02: valida el destino de ?next= como lo interpreta el navegador.
// Devuelve la ruta interna normalizada, o null si podría salir del sistema.
function destinoSeguro(next) {
  if (typeof next !== "string" || !next.startsWith("/")) return null;
  if (next[1] === "/" || next[1] === "\\") return null;          // "//dominio" o "/\dominio"
  if (/[\u0000-\u001F\u007F]/.test(next)) return null;           // tabulaciones, saltos de línea, etc.
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch (error) {
    return null;
  }
}

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginError.classList.add("hidden");
  loginError.textContent = "";

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo iniciar sesión.");
    }

    // HU-01 (v3) / HU-18: volver a la página pedida antes del login (solo rutas internas)
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = destinoSeguro(next) || "/dashboard";
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove("hidden");
  }
});
