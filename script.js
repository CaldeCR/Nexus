document.addEventListener('DOMContentLoaded', () => {
  const currentYear = new Date().getFullYear();
  const footerText = document.querySelector('.footer-row p:last-child');

  if (footerText) {
    footerText.textContent = `Arquitectura orientada a seguridad, trazabilidad y evolución gradual · ${currentYear}`;
  }
});
