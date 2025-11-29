// Elementos del DOM
const titulo = document.getElementById('tituloEstadistica');
const contenido = document.getElementById('contenidoEstadisticas');
const canvas = document.getElementById('graficoVacas');

async function getAuthHeadersLocal(){
  const token = localStorage.getItem('token') || '';
  const datosUsuario = localStorage.getItem('datosUsuarioAgroSystem') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(datosUsuario ? { 'Id-Usuario': datosUsuario } : {})
  };
}

async function cargarEstadisticas(){
  // Intentar obtener desde backend
  try{
    const res = await fetch('http://100.30.25.253:7000/estadisticas/animales', { headers: await getAuthHeadersLocal() });
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
    titulo.textContent = 'No hay vacas registradas';
    contenido.innerHTML = '';
    if(canvas && canvas.getContext){
      const ctx = canvas.getContext('2d');
      if(window.Chart && ctx) new Chart(ctx, { type: 'doughnut', data: { labels: ['Ninguno'], datasets:[{ data:[1], backgroundColor:['#eee'] }] }, options:{ responsive:true }});
    }
    return;
  }

  titulo.textContent = 'Estadísticas generales de animales';
  contenido.innerHTML = `
    <p>Total de Animales: ${totalVacas}</p>
    <p><i class="fas fa-mars"></i> Macho: ${machos}</p>
    <p><i class="fas fa-venus"></i> Hembra: ${hembras}</p>
  `;

  // Crear gráfico comecular si Canvas y Chart están disponibles
  if(canvas && canvas.getContext && window.Chart){
    try{
      const ctx = canvas.getContext('2d');
      // Limpiar canvas si ya tiene instancia previa (si usas Chart.js 3+, recrear)
      if(window._animalChart){ try{ window._animalChart.destroy(); }catch(e){} }
      window._animalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Macho', 'Hembra'],
          datasets: [{
            label: 'Cantidad',
            data: [machos, hembras],
            backgroundColor: ['#36A2EB', '#FF6384'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Distribución por sexo de animales' }
          }
        }
      });
    }catch(e){ console.error('Error renderizando gráfico', e); }
  }
}

// Ejecutar carga
cargarEstadisticas();
