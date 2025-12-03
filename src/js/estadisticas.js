// Elementos del DOM
const titulo = document.getElementById('tituloEstadistica');
const contenido = document.getElementById('contenidoEstadisticas');
const canvas = document.getElementById('graficoVacas');
const canvasEnfermedades = document.getElementById('graficoEnfermedades');
const contenidoEnfermedades = document.getElementById('contenidoEnfermedades');

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
    const res = await fetch('http://localhost:7002/estadisticas/animales', { headers: await getAuthHeadersLocal() });
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
    <p><i class="fas fa-horse"></i> <strong>Total de Animales:</strong> ${totalVacas}</p>
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
// ESTADÍSTICAS DE ENFERMEDADES
// ===================================
async function cargarEstadisticasEnfermedades(){
  try{
    console.debug('GET /reportes para estadísticas de enfermedades');
    const res = await fetch('http://localhost:7002/reportes', { headers: await getAuthHeadersLocal() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    
    const reportes = await res.json();
    console.debug('Reportes cargados:', reportes);
    
    // Contar ocurrencias de cada enfermedad
    const enfermedadesCount = {};
    (reportes || []).forEach(r => {
      const diagnostico = r.diagnosticoPresuntivo || r.diagnosticoDefinitivo || 'Sin diagnóstico';
      if(diagnostico && diagnostico !== ''){
        enfermedadesCount[diagnostico] = (enfermedadesCount[diagnostico] || 0) + 1;
      }
    });
    
    console.debug('Enfermedades contabilizadas:', enfermedadesCount);
    
    // Ordenar por cantidad (descendente) y tomar top 10
    const enfermedadesOrdenadas = Object.entries(enfermedadesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    mostrarEstadisticasEnfermedades(enfermedadesOrdenadas);
    
  }catch(err){
    console.error('Error cargando estadísticas de enfermedades:', err);
    if(contenidoEnfermedades){
      contenidoEnfermedades.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de enfermedades disponibles</p>';
    }
  }
}

function mostrarEstadisticasEnfermedades(enfermedades){
  if(!canvasEnfermedades || !contenidoEnfermedades) return;
  
  if(enfermedades.length === 0){
    contenidoEnfermedades.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de enfermedades registradas en los reportes</p>';
    return;
  }
  
  // Preparar datos para el gráfico
  const nombres = enfermedades.map(e => e[0]);
  const cantidades = enfermedades.map(e => e[1]);
  
  // Mostrar información
  let contenidoHTML = '<p><i class="fas fa-virus"></i> <strong>Total de Enfermedades Registradas:</strong> ' + nombres.length + '</p>';
  contenidoHTML += '<p><i class="fas fa-exclamation-triangle"></i> <strong>Enfermedad Más Frecuente:</strong> ' + nombres[0] + ' (' + cantidades[0] + ' casos)</p>';
  contenidoHTML += '<p><i class="fas fa-chart-bar"></i> <strong>Total de Casos:</strong> ' + cantidades.reduce((a, b) => a + b, 0) + '</p>';
  contenidoEnfermedades.innerHTML = contenidoHTML;
  
  // Crear gráfico de barras
  if(canvasEnfermedades.getContext && window.Chart){
    try{
      const ctx = canvasEnfermedades.getContext('2d');
      if(window._enfermedadChart){ try{ window._enfermedadChart.destroy(); }catch(e){} }
      window._enfermedadChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: nombres,
          datasets: [{
            label: 'Cantidad de Casos',
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
    }catch(e){ console.error('Error renderizando gráfico de enfermedades', e); }
  }
}

// ===================================
// EJECUTAR CARGAS
// ===================================
cargarEstadisticas();
cargarEstadisticasEnfermedades();

console.log('✅ Estadísticas cargadas correctamente');
