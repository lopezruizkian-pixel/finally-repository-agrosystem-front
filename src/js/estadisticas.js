// Elementos del DOM
const titulo = document.getElementById('tituloEstadistica');
const contenido = document.getElementById('contenidoEstadisticas');
const canvas = document.getElementById('graficoVacas');
const canvasTratamientos = document.getElementById('graficoTratamientos');
const contenidoTratamientos = document.getElementById('contenidoTratamientos');

async function getAuthHeadersLocal(){
  const token = localStorage.getItem('token') || '';
  const datosUsuario = localStorage.getItem('datosUsuarioAgroSystem') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(datosUsuario ? { 'Id-Usuario': datosUsuario } : {})
  };
}

// ===================================
// ESTADÍSTICAS DE ANIMALES
// ===================================
async function cargarEstadisticas(){
  // Intentar obtener desde backend
  try{
    const res = await fetch('http://192.168.1.17:7002/estadisticas/animales', { headers: await getAuthHeadersLocal() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const totalVacas = data.total || 0;
    const machos = data.machos || 0;
    const hembras = data.hembras || 0;
    mostrarEstadisticas(totalVacas, machos, hembras);
    return;
  }catch(err){
    console.warn('No se pudo cargar estadísticas desde backend, usar fallback localStorage', err);
  }

  // Fallback: calcular desde localStorage si backend falla
  const vacas = JSON.parse(localStorage.getItem('vacas')) || [];
  const totalVacas = vacas.length;
  const machos = vacas.filter(v => String(v.sexo).toLowerCase() === 'macho').length;
  const hembras = vacas.filter(v => String(v.sexo).toLowerCase() === 'hembra').length;
  mostrarEstadisticas(totalVacas, machos, hembras);
}

function mostrarEstadisticas(totalVacas, machos, hembras){
  if(!titulo || !contenido) return;
  
  if(totalVacas === 0){
    if(contenido) contenido.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de animales registrados</p>';
    return;
  }

  contenido.innerHTML = `
    <p><i class="fas fa-cow"></i> <strong>Total de Animales:</strong> ${totalVacas}</p>
    <p><i class="fas fa-mars"></i> <strong>Machos:</strong> ${machos}</p>
    <p><i class="fas fa-venus"></i> <strong>Hembras:</strong> ${hembras}</p>
  `;

  // Crear gráfico circular si Canvas y Chart están disponibles
  if(canvas && canvas.getContext && window.Chart){
    try{
      const ctx = canvas.getContext('2d');
      if(window._animalChart){ try{ window._animalChart.destroy(); }catch(e){} }
      window._animalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Macho', 'Hembra'],
          datasets: [{
            label: 'Cantidad',
            data: [machos, hembras],
            backgroundColor: ['#36A2EB', '#FF6384'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { 
              position: 'bottom', 
              labels: { 
                padding: 15, 
                font: { size: 12 },
                usePointStyle: true
              } 
            },
            tooltip: { 
              backgroundColor: 'rgba(0,0,0,0.7)', 
              padding: 12, 
              cornerRadius: 8 
            }
          }
        }
      });
    }catch(e){ console.error('Error renderizando gráfico de animales', e); }
  }
}

// ===================================
// ESTADÍSTICAS DE TRATAMIENTOS MÁS APLICADOS
// ===================================
async function cargarEstadisticasTratamientos(){
  try{
    console.debug('GET /tratamientos para estadísticas');
    const res = await fetch('http://192.168.1.17:7002/tratamientos', { headers: await getAuthHeadersLocal() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    
    const tratamientos = await res.json();
    console.debug('Tratamientos cargados:', tratamientos);
    
    // Contar ocurrencias de cada tratamiento por nombre
    const tratamientosCount = {};
    (tratamientos || []).forEach(t => {
      const nombreTratamiento = t.nombreTratamiento || t.nombre || 'Sin nombre';
      if(nombreTratamiento && nombreTratamiento !== ''){
        tratamientosCount[nombreTratamiento] = (tratamientosCount[nombreTratamiento] || 0) + 1;
      }
    });
    
    console.debug('Tratamientos contabilizados:', tratamientosCount);
    
    // Ordenar por cantidad (descendente) y tomar top 10
    const tratamientosOrdenados = Object.entries(tratamientosCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    mostrarEstadisticasTratamientos(tratamientosOrdenados);
    
  }catch(err){
    console.error('Error cargando estadísticas de tratamientos:', err);
    if(contenidoTratamientos){
      contenidoTratamientos.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de tratamientos disponibles</p>';
    }
  }
}

function mostrarEstadisticasTratamientos(tratamientos){
  if(!canvasTratamientos || !contenidoTratamientos) return;
  
  if(tratamientos.length === 0){
    contenidoTratamientos.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de tratamientos registrados</p>';
    return;
  }
  
  // Preparar datos para el gráfico
  const nombres = tratamientos.map(t => t[0]);
  const cantidades = tratamientos.map(t => t[1]);
  
  // Mostrar información
  let contenidoHTML = '<p><i class="fas fa-syringe"></i> <strong>Total de Tratamientos Registrados:</strong> ' + nombres.length + '</p>';
  contenidoHTML += '<p><i class="fas fa-star"></i> <strong>Tratamiento Más Aplicado:</strong> ' + nombres[0] + ' (' + cantidades[0] + ' aplicaciones)</p>';
  contenidoHTML += '<p><i class="fas fa-chart-bar"></i> <strong>Total de Aplicaciones:</strong> ' + cantidades.reduce((a, b) => a + b, 0) + '</p>';
  contenidoTratamientos.innerHTML = contenidoHTML;
  
  // Crear gráfico de barras
  if(canvasTratamientos.getContext && window.Chart){
    try{
      const ctx = canvasTratamientos.getContext('2d');
      if(window._tratamientoChart){ try{ window._tratamientoChart.destroy(); }catch(e){} }
      window._tratamientoChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: nombres,
          datasets: [{
            label: 'Cantidad de Aplicaciones',
            data: cantidades,
            backgroundColor: 'rgba(114, 158, 100, 0.7)',
            borderColor: 'rgba(114, 158, 100, 1)',
            borderWidth: 2,
            borderRadius: 5,
            hoverBackgroundColor: 'rgba(114, 158, 100, 0.9)'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { 
              display: true, 
              position: 'top', 
              labels: { 
                padding: 15, 
                font: { size: 12 } 
              } 
            },
            tooltip: { 
              backgroundColor: 'rgba(0,0,0,0.7)', 
              padding: 12, 
              cornerRadius: 8 
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y: {
              grid: { display: false }
            }
          }
        }
      });
    }catch(e){ console.error('Error renderizando gráfico de tratamientos', e); }
  }
}

// ===================================
// EJECUTAR CARGAS
// ===================================
cargarEstadisticas();
cargarEstadisticasTratamientos();

console.log('✅ Estadísticas cargadas correctamente');
