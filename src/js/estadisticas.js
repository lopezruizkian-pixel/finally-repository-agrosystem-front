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
  // Intentar obtener desde backend primero
  try{
    const res = await fetch('http://192.168.1.17:7002/estadisticas/animales', { headers: await getAuthHeadersLocal() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const totalVacas = data.total || 0;
    const machos = data.machos || 0;
    const hembras = data.hembras || 0;
    console.debug('Backend estadísticas:', { totalVacas, machos, hembras });
    mostrarEstadisticas(totalVacas, machos, hembras);
    return;
  }catch(err){
    console.warn('No se pudo cargar estadísticas desde backend, usar fallback', err);
  }

  // Fallback: calcular desde animales del backend si el endpoint anterior falla
  try{
    const res = await fetch('http://192.168.1.17:7002/animales', { headers: await getAuthHeadersLocal() });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const vacas = await res.json();
    
    const totalVacas = vacas.length;
    
    // Contar machos y hembras correctamente - CORREGIDO
    const machos = vacas.filter(v => {
      const sexo = String(v.sexo || '').trim().toUpperCase();
      return sexo === 'M' || sexo === 'MACHO' || sexo === 'MALE';
    }).length;
    
    const hembras = vacas.filter(v => {
      const sexo = String(v.sexo || '').trim().toUpperCase();
      return sexo === 'H' || sexo === 'HEMBRA' || sexo === 'FEMALE';
    }).length;
    
    console.debug('Animales desde fallback:', { totalVacas, machos, hembras, lista: vacas.map(v => ({ nombre: v.nombreAnimal, sexo: v.sexo })) });
    mostrarEstadisticas(totalVacas, machos, hembras);
    return;
  }catch(err){
    console.warn('No se pudo cargar desde /animales', err);
  }

  // Último fallback: usar localStorage
  const vacas = JSON.parse(localStorage.getItem('vacas')) || [];
  const totalVacas = vacas.length;
  
  const machos = vacas.filter(v => {
    const sexo = String(v.sexo || '').trim().toUpperCase();
    return sexo === 'M' || sexo === 'MACHO' || sexo === 'MALE';
  }).length;
  
  const hembras = vacas.filter(v => {
    const sexo = String(v.sexo || '').trim().toUpperCase();
    return sexo === 'H' || sexo === 'HEMBRA' || sexo === 'FEMALE';
  }).length;
  
  console.debug('Fallback localStorage:', { totalVacas, machos, hembras });
  mostrarEstadisticas(totalVacas, machos, hembras);
}

function mostrarEstadisticas(totalVacas, machos, hembras){
  if(!titulo || !contenido) return;
  
  console.debug('mostrarEstadisticas ejecutado:', { totalVacas, machos, hembras, tiposData: { totalVacas: typeof totalVacas, machos: typeof machos, hembras: typeof hembras } });

  // Asegurar que son números
  const totalNum = Number(totalVacas) || 0;
  const machosNum = Number(machos) || 0;
  const hembrasNum = Number(hembras) || 0;

  console.debug('Números convertidos:', { totalNum, machosNum, hembrasNum });

  if(totalNum === 0){
    if(contenido) contenido.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de animales registrados</p>';
    console.warn('Total de animales es 0');
    return;
  }

  contenido.innerHTML = `
    <p><i class="fas fa-cow"></i> <strong>Total de Animales:</strong> ${totalNum}</p>
    <p><i class="fas fa-mars"></i> <strong>Machos:</strong> ${machosNum}</p>
    <p><i class="fas fa-venus"></i> <strong>Hembras:</strong> ${hembrasNum}</p>
  `;

  console.debug('HTML actualizado con:', { totalNum, machosNum, hembrasNum });

  // Crear gráfico circular si Canvas y Chart están disponibles
  if(canvas && canvas.getContext && window.Chart){
    try{
      const ctx = canvas.getContext('2d');
      
      // Destruir gráfico anterior si existe
      if(window._animalChart){ 
        try{ 
          window._animalChart.destroy();
          console.debug('Gráfico anterior destruido');
        }catch(e){ 
          console.warn('Error destruyendo gráfico anterior:', e);
        } 
      }
      
      // Datos del gráfico - CORREGIDO: pasar como array numérico
      const dataArray = [machosNum, hembrasNum];
      console.debug('Datos finales para Chart.js:', { 
        labels: ['Machos', 'Hembras'], 
        data: dataArray,
        suma: machosNum + hembrasNum
      });
      
      // Si ambos son 0, mostrar mensaje
      if(machosNum === 0 && hembrasNum === 0){
        console.warn('No hay datos para graficar');
        return;
      }
      
      // Crear gráfico de pastel
      window._animalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Machos', 'Hembras'],
          datasets: [{
            label: 'Cantidad de Animales',
            data: [machosNum, hembrasNum],
            backgroundColor: ['#36A2EB', '#FF6384'],
            borderColor: '#fff',
            borderWidth: 2
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
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  // Para gráficos de pastel, usar context.parsed directamente
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return label + ': ' + value + ' animales (' + percentage + '%)';
                }
              }
            }
          }
        }
      });
      
      console.log('✅ Gráfico pastel creado correctamente con datos:', [machosNum, hembrasNum]);
    }catch(e){ 
      console.error('Error renderizando gráfico:', e);
    }
  } else {
    console.warn('Canvas o Chart no disponibles:', { canvas: !!canvas, getContext: canvas ? !!canvas.getContext : false, Chart: !!window.Chart });
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
    
    const text = await res.text();
    console.debug('GET /tratamientos raw response:', text);
    
    // Si la respuesta está vacía, usar array vacío
    let tratamientos = [];
    if(text && text.trim()){ 
      try{ 
        tratamientos = JSON.parse(text); 
      }catch(e){ 
        console.warn('Error parseando JSON de tratamientos:', e); 
        tratamientos = [];
      }
    }
    
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
      contenidoTratamientos.innerHTML = '<p><i class="fas fa-info-circle"></i> <strong>No hay datos</strong> de tratamientos disponibles o error al cargar.</p>';
    }
  }
}

function mostrarEstadisticasTratamientos(tratamientos){
  if(!canvasTratamientos || !contenidoTratamientos) return;
  
  console.debug('mostrarEstadisticasTratamientos:', { count: tratamientos.length });
  
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
      if(window._tratamientoChart){ 
        try{ window._tratamientoChart.destroy(); }catch(e){} 
      }
      
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
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  return context.parsed.x + ' aplicaciones';
                }
              }
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
      
      console.log('✅ Gráfico de barras de tratamientos creado correctamente');
    }catch(e){ 
      console.error('Error renderizando gráfico de tratamientos', e); 
    }
  }
}

// ===================================
// EJECUTAR CARGAS
// ===================================
cargarEstadisticas();
cargarEstadisticasTratamientos();

console.log('✅ Estadísticas cargadas correctamente');
