// Archivo: navegacion.js
document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll(".menu-btn");

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      const texto = btn.textContent.trim().toLowerCase();

      switch (true) {
        case texto.includes("animal"):
          window.location.href = "animales.html";
          break;

        case texto.includes("medicamento"):
          window.location.href = "medicamento.html";
          break;

        case texto.includes("tarjeta"):
          window.location.href = "tarjeta_salud.html";
          break;

        case texto.includes("reporte"):
          window.location.href = "reporte_medico.html";
          break;

        case texto.includes("tratamiento"):
          window.location.href = "tratamiento.html";
          break;

        case texto.includes("enfermedad"):
          window.location.href = "enfermedad.html";
          break;

        default:
          console.warn("Botón no configurado:", texto);
      }
    });
  });
  
});
function irHome() {
  window.location.href = 'home.html';
}
