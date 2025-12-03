// Gestionar sidebar contraible en todas las vistas
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Sidebar.js iniciado');
  
  const sidebar = document.getElementById('sidebar');
  
  if (!sidebar) {
    console.warn('⚠️ Elemento sidebar no encontrado');
    return;
  }

  console.log('✅ Sidebar encontrado');

  // Crear botón toggle si no existe
  let btnToggle = document.querySelector('.btn-toggle-sidebar');
  
  if (!btnToggle) {
    btnToggle = document.createElement('button');
    btnToggle.className = 'btn-toggle-sidebar';
    btnToggle.innerHTML = '<i class="fas fa-bars"></i>';
    btnToggle.title = 'Expandir/Contraer menú';
    sidebar.insertBefore(btnToggle, sidebar.firstChild);
    console.log('✅ Botón toggle creado');
  }

  // Toggle al hacer clic en el botón
  btnToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    console.log('🔀 Toggle clicked');
    sidebar.classList.toggle('active');
  });

  // Cerrar sidebar al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!sidebar.contains(e.target) && sidebar.classList.contains('active')) {
      console.log('🖱️ Click fuera del sidebar - cerrando');
      sidebar.classList.remove('active');
    }
  });

  // Agregar eventos a los botones del menú
  const menuBtns = document.querySelectorAll('.menu-btn');
  console.log(`📋 Encontrados ${menuBtns.length} botones de menú`);
  
  menuBtns.forEach((btn, index) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const texto = this.textContent.trim().toLowerCase();
      console.log(`🔗 Click en botón ${index}: "${texto}"`);
      
      // Remover clase activo de todos
      menuBtns.forEach(b => b.classList.remove('activo'));
      // Agregar a este
      this.classList.add('activo');

      // Navegar según el botón
      if (texto.includes('animal')) {
        window.location.href = 'animales.html';
      } else if (texto.includes('medicamento')) {
        window.location.href = 'medicamento.html';
      } else if (texto.includes('tarjeta')) {
        window.location.href = 'tarjeta_salud.html';
      } else if (texto.includes('reporte')) {
        window.location.href = 'reporte_medico.html';
      } else if (texto.includes('tratamiento')) {
        window.location.href = 'tratamiento.html';
      } else if (texto.includes('enfermedad')) {
        window.location.href = 'enfermedad.html';
      }
    });
  });

  console.log('✅ Sidebar script completamente cargado');
});

console.log('✅ Sidebar script cargado correctamente');
